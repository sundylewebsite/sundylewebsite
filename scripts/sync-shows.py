#!/usr/bin/env python3
"""
SUN.DYLE — pull shows out of a public calendar (ICS) into data/shows.generated.js

Works with any calendar that publishes an ICS feed: Google Calendar
(calendar.google.com/.../public/basic.ics), Apple/iCloud published calendars
(webcal:// → https://), Outlook, Bandsintown exports, anything.

Python standard library only — no pip install, so it runs the same on your Mac
and in GitHub Actions.

    scripts/sync-shows.py                 # reads data/calendar.js
    scripts/sync-shows.py --dry-run       # print, don't write
    scripts/sync-shows.py --ics-file x.ics
    scripts/sync-shows.py --print-config

Config lives in data/calendar.js and is shared with the website.
"""

import argparse
import json
import os
import re
import sys
import urllib.request
from datetime import date, datetime, timedelta, timezone

try:
    from zoneinfo import ZoneInfo
except ImportError:                     # Python < 3.9
    ZoneInfo = None

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

WEEKDAYS = {"MO": 0, "TU": 1, "WE": 2, "TH": 3, "FR": 4, "SA": 5, "SU": 6}
DEFAULT_HORIZON_DAYS = 550             # how far ahead to expand recurring gigs
MAX_PAST = 12


# --------------------------------------------------------------------- utils
def log(*a):
    print(*a, file=sys.stderr)


def as_dt(x, tz=None):
    """Coerce a date or datetime to a comparable datetime."""
    if isinstance(x, datetime):
        return x
    return datetime(x.year, x.month, x.day, tzinfo=tz)


def as_date(x):
    return x.date() if isinstance(x, datetime) else x


def load_config(path):
    """Read data/calendar.js (or a .json file). Both readers share one file."""
    with open(path, encoding="utf-8") as fh:
        raw = fh.read()
    raw = re.sub(r"^\s*//.*$", "", raw, flags=re.M)            # // comments
    raw = re.sub(r"/\*.*?\*/", "", raw, flags=re.S)            # /* block comments */
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1:
        raise SystemExit("! no calendar config found in %s" % path)
    body = raw[start:end + 1]
    body = re.sub(r",(\s*[}\]])", r"\1", body)                 # tolerate trailing commas
    return json.loads(body)


def unfold(text):
    """ICS folds long lines with CRLF + a space. Unfold, then split."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return re.sub(r"\n[ \t]", "", text).split("\n")


def parse_dt(value, params):
    """Return (datetime|date, is_all_day). Keeps wall-clock time for TZID values."""
    value = value.strip()
    all_day = params.get("VALUE") == "DATE" or re.fullmatch(r"\d{8}", value) is not None
    if all_day:
        return datetime.strptime(value[:8], "%Y%m%d").date(), True
    m = re.fullmatch(r"(\d{8})T(\d{6})(Z?)", value)
    if not m:
        return None, all_day
    d, t, z = m.groups()
    dt = datetime.strptime(d + t, "%Y%m%d%H%M%S")
    if z:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt, False


def parse_prop(line):
    """NAME;PARAM=VAL:value  ->  (NAME, {PARAM: VAL}, value)"""
    if ":" not in line:
        return None, {}, ""
    head, value = line.split(":", 1)
    bits = head.split(";")
    name = bits[0].upper()
    params = {}
    for b in bits[1:]:
        if "=" in b:
            k, v = b.split("=", 1)
            params[k.upper()] = v.strip('"')
    return name, params, value


def parse_rrule(value):
    out = {}
    for part in value.split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            out[k.upper()] = v.upper()
    return out


def ics_unescape(s):
    return (s.replace("\\n", "\n").replace("\\N", "\n").replace("\\,", ",")
             .replace("\\;", ";").replace("\\\\", "\\")).strip()


def first_line(s, limit=140):
    for line in s.split("\n"):
        line = line.strip()
        if line:
            return line[:limit]
    return ""


def first_url(s):
    m = re.search(r"https?://[^\s\)\]\>,]+", s or "")
    return m.group(0) if m else ""


# ------------------------------------------------------------- recurrence
def expand_rrule(start, rrule, exdates, horizon, tz):
    """Yield start plus the recurrence occurrences inside the horizon."""
    occurrences = [start]
    if not rrule:
        return occurrences

    freq = rrule.get("FREQ", "")
    if freq not in ("DAILY", "WEEKLY", "MONTHLY", "YEARLY"):
        return occurrences                      # unsupported → single occurrence

    interval = int(rrule.get("INTERVAL", 1) or 1)
    count = rrule.get("COUNT")
    count = int(count) if count else None
    until = None
    if rrule.get("UNTIL"):
        until, is_date = parse_dt(rrule["UNTIL"], {})
        if isinstance(until, datetime) and tz and until.tzinfo is None:
            until = until.replace(tzinfo=tz)
        if isinstance(until, date) and not isinstance(until, datetime):
            until = datetime(until.year, until.month, until.day, tzinfo=tz)
    byday = [WEEKDAYS[d[-2:]] for d in rrule.get("BYDAY", "").split(",")
             if d[-2:] in WEEKDAYS]
    bymonthday = [int(x) for x in rrule.get("BYMONTHDAY", "").split(",") if x.lstrip("-").isdigit()]

    exset = {as_date(d) for d in exdates}
    cur = start

    def push(cand):
        if as_date(cand) in exset:
            return True
        occurrences.append(cand)
        return True

    if freq == "WEEKLY" and byday:
        # every `interval` weeks, on each listed weekday, starting on/after DTSTART
        week_start = start - timedelta(days=start.weekday())        # Monday
        week = 0
        while week < 400:
            for wd in sorted(byday):
                cand = week_start + timedelta(weeks=week * interval, days=wd)
                if cand <= start:           # DTSTART is already seeded; don't double-count it
                    continue
                if count and len(occurrences) >= count:
                    return occurrences
                if until and as_dt(cand) > until:
                    return occurrences
                if as_dt(cand) > horizon:
                    return occurrences
                push(cand)
            week += 1
            if len(occurrences) >= 2 and as_dt(occurrences[-1]) > horizon:
                return occurrences
        return occurrences

    guard = 0
    while True:
        guard += 1
        if guard > 4000:
            break
        if freq == "DAILY":
            cur = cur + timedelta(days=interval)
        elif freq == "WEEKLY":
            cur = cur + timedelta(weeks=interval)
        elif freq == "MONTHLY":
            months = cur.month - 1 + interval
            y = cur.year + months // 12
            mo = months % 12 + 1
            day = min(cur.day, 28)
            if bymonthday:
                day = min(bymonthday[0], 28)
            cur = cur.replace(year=y, month=mo, day=day)
        else:                                   # YEARLY
            cur = cur.replace(year=cur.year + interval)

        if count and len(occurrences) >= count:
            break
        if until and as_dt(cur) > until:
            break
        if as_dt(cur) > horizon:
            break
        push(cur)
    return occurrences


# ------------------------------------------------------------ ics → events
def events_from_ics(text, cfg, now):
    """Parse VEVENTs, expand recurrences, return raw event dicts in the future."""
    tz = None
    if ZoneInfo and cfg.get("timezone"):
        try:
            tz = ZoneInfo(cfg["timezone"])
        except Exception:
            log("! unknown timezone %r — times left as written" % cfg["timezone"])

    horizon = now + timedelta(days=int(cfg.get("horizonDays", DEFAULT_HORIZON_DAYS)))
    lookback = now - timedelta(days=int(cfg.get("pastLookbackDays", 400)))
    blocks, cur = [], None
    for line in unfold(text):
        if line.strip() == "BEGIN:VEVENT":
            cur = []
        elif line.strip() == "END:VEVENT" and cur is not None:
            blocks.append(cur); cur = None
        elif cur is not None:
            cur.append(line)

    out = []
    for block in blocks:
        ev = {"exdates": set()}
        for line in block:
            name, params, value = parse_prop(line)
            if name is None:
                continue
            if name == "DTSTART":
                ev["start"], ev["all_day"] = parse_dt(value, params)
                ev["tzid"] = params.get("TZID")
            elif name == "RRULE":
                ev["rrule"] = parse_rrule(value)
            elif name == "EXDATE":
                for chunk in value.split(","):
                    d, _ = parse_dt(chunk, params)
                    if d:
                        ev["exdate"] = True
                        ev["exdates"].add(d.date() if isinstance(d, datetime) else d)
            elif name == "SUMMARY":
                ev["summary"] = ics_unescape(value)
            elif name == "LOCATION":
                ev["location"] = ics_unescape(value)
            elif name == "DESCRIPTION":
                ev["description"] = ics_unescape(value)
            elif name == "URL":
                ev["url"] = value.strip()
            elif name == "UID":
                ev["uid"] = value.strip()

        start = ev.get("start")
        if not start:
            continue
        if isinstance(start, datetime) and start.tzinfo is None and tz:
            start = start.replace(tzinfo=tz)

        occurrences = expand_rrule(start, ev.get("rrule"), ev["exdates"], horizon, tz)
        for occ in occurrences[:400]:
            when = occ if isinstance(occ, datetime) else datetime(occ.year, occ.month, occ.day, 20, 0)
            if tz and when.tzinfo is None:
                when = when.replace(tzinfo=tz)
            if isinstance(occ, datetime) and occ.tzinfo is not None and tz:
                occ = occ.astimezone(tz)
                when = occ
            day = occ.date() if isinstance(occ, datetime) else occ
            if day < lookback.date():
                continue
            e = dict(ev)
            e["_when"] = when
            e["_day"] = day
            e["_all_day"] = ev.get("all_day", False) or not isinstance(occ, datetime)
            out.append(e)
    return out


# ------------------------------------------------------------- filtering
def keep(ev, cfg):
    title = (ev.get("summary") or "")
    lower = title.lower()
    if cfg.get("titleContains") and cfg["titleContains"].lower() not in lower:
        return False
    for word in (cfg.get("skipTitleContains") or []):
        if word and word.lower() in lower:
            return False
    if cfg.get("requireLocation") and not (ev.get("location") or "").strip():
        return False
    if cfg.get("skipCancelled") and "cancel" in lower:
        return False
    return True


def public_note(desc, cfg):
    """Publish description text only if the band marked it public.

    A gig calendar is full of things that must not reach a public website — fees,
    deposit status, "PA needed", contact phone numbers. So the default is to
    publish nothing from the description, and to pick up only lines that start
    with `publicNotePrefix` (e.g. "Public: Doors at 7, all ages")."""
    if not desc or cfg.get("noteFromDescription") is False:
        return ""
    prefix = (cfg.get("publicNotePrefix") or "").strip()
    if prefix:
        for line in desc.split("\n"):
            line = line.strip()
            if line.lower().startswith(prefix.lower()):
                return line[len(prefix):].strip()[:200]
        return ""
    first = first_line(desc)                    # no prefix configured → first line, on purpose
    return "" if re.fullmatch(r"https?://\S+", first or "") else first


def format_time(ev, cfg):
    if ev.get("_all_day"):
        return ""
    try:
        tzname = cfg.get("timezone")
        dt = ev["_when"]
        if ZoneInfo and tzname and dt.tzinfo:
            dt = dt.astimezone(ZoneInfo(tzname))
        return dt.strftime("%-I:%M %p") if hasattr(dt, "strftime") else ""
    except Exception:
        return ""


def split_location(loc, cfg):
    """Read the Location field. Returns {"venue", "street", "city"}.

    iOS/macOS write it as two lines, the address comma-separated:
        Monticello-Union Township Public Library
        321 W Broadway St, Monticello, IN  47960, United States
    Google writes one line. A street address is recognised by its leading house
    number and kept as its own field, never mistaken for a city."""
    def result(v="", s="", c=""):
        return {"venue": v, "street": s, "city": c or cfg.get("defaultCity", "")}

    if not loc:
        return result()
    parts = [p.strip() for p in re.split(r"[\n,]+", loc) if p.strip()]
    if not parts:
        return result()

    venue, street, city = parts[0], "", ""

    def is_street(s):
        return bool(re.match(r"^\d+\s+\S", s or ""))

    for i, p in enumerate(parts[1:], start=1):
        if not street and is_street(p):
            street = p
            continue
        m = re.match(r"^([A-Z]{2})\s+\d{5}(?:-\d{4})?$", p)
        if m:
            prev = parts[i - 1]
            if not city and prev.lower() != venue.lower() and not is_street(prev):
                city = "%s, %s" % (prev, m.group(1))
            continue
        m2 = re.match(r"^(.+?)[,\s]\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?$", p)
        if m2 and not city and not is_street(m2.group(1)):
            city = "%s, %s" % (m2.group(1).strip(), m2.group(2))

    if not city and len(parts) > 1 and re.match(r"^[A-Z]{2}$", parts[-1]):
        prev = parts[-2]
        if prev.lower() != venue.lower() and not is_street(prev):
            city = "%s, %s" % (prev, parts[-1])

    return result(venue, street, city)


def to_show(ev, cfg):
    """One calendar event -> the shape the website renders.

    `title` is the event name and becomes the main line; `venue`/`city` come from
    the event's Location field and become the sub heading underneath it."""
    summary = ev.get("summary") or ""
    prefix = (cfg.get("stripPrefix") or "").strip()
    base = summary
    if prefix and base.lower().startswith(prefix.lower()):
        base = base[len(prefix):]
    elif prefix:
        base = re.sub(re.escape(prefix), "", base, flags=re.I)
    base = base.strip()

    loc = split_location(ev.get("location"), cfg)
    venue, street, city = loc["venue"], loc["street"], loc["city"]
    title = base
    if not venue:                       # no Location field -> read the venue out of the title
        m = re.split(r"\s*@\s*|\s+[–—]\s+|\s+at\s+", base, maxsplit=1, flags=re.I)
        if len(m) == 2 and m[1].strip():
            head, tail = m[0].strip(), m[1].strip()
            inner = split_location(tail, cfg)
            venue = inner["venue"] or tail
            street = street or inner["street"]
            city = city or inner["city"]
            title = head or tail

    title = re.sub(r"^[\s\-–—@:|·]+", "", title)
    title = re.sub(r"^(?:at|@|with|w/|feat\.?|ft\.?|presented by)\s+", "", title, flags=re.I).strip()

    note = public_note(ev.get("description"), cfg)
    if note and venue and note.lower() in venue.lower():
        note = ""

    tickets = (ev.get("url") or "").strip() or first_url(ev.get("description") or "")

    return {
        "date": ev["_day"].isoformat(),
        "time": format_time(ev, cfg),
        "title": title or venue or "TBA",
        "venue": venue,
        "street": street,
        "city": city,
        "tickets": tickets,
        "note": note,
        "uid": ev.get("uid", ""),
    }


def dedupe(shows):
    seen, out = set(), []
    for s in shows:
        key = (s["date"], s["venue"].lower(), s["time"])
        if key in seen:
            continue
        seen.add(key)
        out.append(s)
    return out


# -------------------------------------------------------------------- main
def write_if_changed(path, payload):
    """Write payload unless the only difference is the "generated" stamp.

    The stamp moves on every run, so a plain write dirties the file even when
    the schedule is identical — and in CI that means a one-line commit and a
    Pages rebuild every single day, forever. Compare with the stamp neutralised
    and leave the file (and its honest "last changed" date) alone if the dates
    themselves are unchanged.
    """
    def dates_only(text):
        return "\n".join(l for l in text.splitlines() if '"generated"' not in l)

    try:
        with open(path, encoding="utf-8") as fh:
            existing = fh.read()
    except OSError:
        existing = None
    if existing is not None and dates_only(existing) == dates_only(payload):
        return False
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(payload)
    return True


def main():
    ap = argparse.ArgumentParser(description="Sync a public ICS calendar into data/shows.generated.js")
    ap.add_argument("--config", default=os.path.join(ROOT, "data", "calendar.js"))
    ap.add_argument("--out", default=os.path.join(ROOT, "data", "shows.generated.js"))
    ap.add_argument("--ics-file", help="read a local .ics instead of fetching the URL")
    ap.add_argument("--ics-url", help="override the URL from the config")
    ap.add_argument("--dry-run", action="store_true", help="print the result, write nothing")
    ap.add_argument("--print-config", action="store_true")
    ap.add_argument("--now", help="pretend it is this date (YYYY-MM-DD), for testing")
    args = ap.parse_args()

    cfg = load_config(args.config)
    if args.print_config:
        print(json.dumps(cfg, indent=2)); return 0

    url = (args.ics_url or os.environ.get("SUN_DYLE_ICS_URL", "").strip()
           or cfg.get("icsUrl", ""))
    if args.ics_file:
        with open(args.ics_file, encoding="utf-8") as fh:
            text = fh.read()
        source = "file://" + args.ics_file
    else:
        if not url or "PASTE" in url.upper():
            log("! no calendar URL in %s — add one under \"icsUrl\"" % args.config)
            log("! (shows stay as they are in data/shows.js)")
            return 0
        fetch = url.replace("webcal://", "https://", 1)
        req = urllib.request.Request(fetch, headers={
            "User-Agent": "sundyle-site/1.0 (+https://sundyle.net)",
            "Accept": "text/calendar, text/plain, */*",
        })
        with urllib.request.urlopen(req, timeout=45) as resp:
            text = resp.read().decode("utf-8", "replace")
        source = fetch

    if "BEGIN:VCALENDAR" not in text:
        log("! that did not look like an ICS calendar (no BEGIN:VCALENDAR)")
        return 1

    now = datetime.now(timezone.utc)
    if args.now:
        d = datetime.strptime(args.now, "%Y-%m-%d")
        now = d.replace(tzinfo=timezone.utc)
    tz = None
    if ZoneInfo and cfg.get("timezone"):
        try:
            tz = ZoneInfo(cfg["timezone"])
        except Exception:
            pass
    local_now = now.astimezone(tz) if tz else now

    raw = [e for e in events_from_ics(text, cfg, local_now) if keep(e, cfg)]
    shows = dedupe([to_show(e, cfg) for e in raw])
    shows.sort(key=lambda s: (s["date"], s["time"]))

    today = local_now.date().isoformat()
    upcoming = [s for s in shows if s["date"] >= today]
    past = sorted([s for s in shows if s["date"] < today], key=lambda s: s["date"], reverse=True)
    past = past[: int(cfg.get("keepPastCount", MAX_PAST))]

    result = {
        "generated": local_now.isoformat(timespec="seconds"),
        "source": source,
        "upcoming": upcoming,
        "past": past,
    }
    payload = ("/* Written by scripts/sync-shows.py from data/calendar.js — do not edit.\n"
               "   A .js file rather than .json on purpose: a plain <script> tag loads\n"
               "   from file:// as well as http://, so the page works opened straight off\n"
               "   disk with no server and no fetch(). */\n"
               "window.SHOWS_FROM_CALENDAR = "
               + json.dumps(result, indent=2, ensure_ascii=False) + ";\n")
    if args.dry_run:
        print(payload)
    elif write_if_changed(args.out, payload):
        log("✓ %d upcoming, %d past  →  %s" % (len(upcoming), len(past), args.out))
    else:
        log("= %d upcoming, %d past — dates unchanged, left alone"
            % (len(upcoming), len(past)))
    if not upcoming and not past:
        log("! the calendar parsed but matched no events — check titleContains / the URL")
    return 0


if __name__ == "__main__":
    sys.exit(main())
