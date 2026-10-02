# SUN.DYLE — sundyle.net

The band's website. Static HTML/CSS/JS, no build step, no dependencies, hosted
on GitHub Pages. Everything is edited by hand and pushed.

```
sundyle-site/
├── index.html                     the whole site (one scrolling page)
├── styles.css                     all styling — colours live in :root at the top
├── script.js                      nav, scroll effects, lightbox, data rendering
├── data/
│   ├── site.js                    links, releases, videos, press  ← edit this one
│   ├── calendar.js                where the Live dates come from  ← or this one
│   ├── shows.js                   hand-written dates (always win)
│   └── shows.generated.js         written by the sync script — don't edit
├── assets/
│   ├── albums/                    album art (already filled in)
│   ├── fonts/HMCamino.ttf         the band's display face
│   ├── logo.png                   ← drop your logo here (nav + contact card)
│   ├── favicon.png, apple-touch-icon.png
│   └── photos/
│       ├── hero.jpg               full-width hero background
│       ├── band.jpg               the photo next to the About text
│       └── gallery/               photo-01.jpg, photo-02.jpg, … the photo grid
├── scripts/
│   ├── serve.py                   local preview server (no-cache)
│   ├── sync-shows.py              calendar → data/shows.generated.js
│   └── prepare-photos.sh          resize + rename photos for the web
├── .github/workflows/sync-shows.yml   daily calendar refresh
├── CNAME                          tells GitHub Pages the custom domain
└── 404.html, robots.txt, sitemap.xml
```

## Preview it locally

```bash
cd ~/hermes/sundyle-site
scripts/serve.py                     # http://localhost:8091
```

Also reachable from any device on the home network at
`http://<this-mac>.local:8091/`. Use this rather than `python3 -m http.server`:
it sends `Cache-Control: no-store`, so a plain refresh always shows the file you
just saved instead of last week's `data/shows.js`.

## Where the show dates come from

**Already wired up:** `data/calendar.js` points at the published iCloud calendar
*"sundyle site"*. Add a gig there and it lands on the website — no code, no
editing this repo.

Four things to know when you write a gig in that calendar:

- **How a date is laid out** — the event's *title* is the main line, and its
  *Location* is the address line underneath (venue, then street, then city).
  Put the full address in Location
  (`Monticello-Union Township Public Library` ⏎ `321 W Broadway St, Monticello, IN 47960`)
  and each part is picked out for you. The time sits with the date on the left.
  Any part the title already says is dropped, so the venue is never printed twice.
  With no Location, whatever follows the `@` in the title becomes the venue.
  Setting `stripPrefix: ""` would keep "SUN.DYLE" in the main line.
- **Notes are private by default.** Nothing from an event's notes is published,
  because that field fills up with fees, deposit status and "PA needed". Only a
  line you start with `Public:` reaches the site —
  `Public: Doors at 7 — all ages`.
- **Keeping one off the site** — put `[hold]`, `[private]`, `[tentative]`,
  `[draft]` or the word `rehearsal` anywhere in the title and the sync skips it.
  So does anything with "cancel" in the title.
- **Tickets** — put the ticket link in the event's *URL* field and the row grows
  a Tickets button.

`data/calendar.js` has one setting that decides everything:

| mode | what the Live section shows | you maintain |
|---|---|---|
| `"ics"` | the dates in `data/shows.generated.js`, refreshed from your calendar | the calendar, and a daily refresh |
| `"google"` | your calendar, live on every page load | the calendar (+ a Google API key) |
| `"manual"` | only `data/shows.js` | `data/shows.js` by hand |

**Either way, `data/shows.js` always wins.** A hand-written entry replaces the
calendar's entry for the same date + venue, so you can add a ticket link, a
support act or a note to a calendar event without touching the calendar:

```js
// data/shows.js — "title" is the main line, "venue"/"street"/"city" the line under it
window.SHOWS = {
  upcoming: [
    { date: "2026-11-14", title: "SUN.DYLE @ The Clyde Theatre", time: "7:30 PM",
      venue: "The Clyde Theatre", street: "1808 Bluffton Rd", city: "Fort Wayne, IN",
      tickets: "https://...", note: "Doors 6:30 — VIP soundcheck upgrade" }
  ],
  past: []
};
```

`date` must be `YYYY-MM-DD`. Past dates drop into the "Past shows" list by
themselves once they happen, so nothing needs deleting.

### Option A — sync from any calendar (recommended)

Works with Google, Apple/iCloud, Outlook, Bandsintown — anything that publishes
an ICS feed. No API keys, no third party in the page, no runtime dependency: the
site stays a static file, and the dates are refreshed before they're published.
The iCloud calendar *"sundyle site"* is already set up this way; steps 1–2 are
recorded here so you know where the URL lives and how to point it somewhere else.

1. **Get the calendar's ICS link** (its "secret"/public address):
   - **Google Calendar** — Settings → click the calendar in the left list →
     *Integrate calendar* → copy **"Secret address in iCal format"**
     (`https://calendar.google.com/calendar/ical/…/basic.ics`). A genuinely
     public calendar works too.
   - **Apple Calendar / iCloud** — Calendar app → right-click the calendar →
     *Share Calendar* → tick *Public Calendar* → copy the link. It starts with
     `webcal://`; paste it as-is, the script rewrites it to `https://`.
   - **Outlook.com** — Settings → Calendar → *Shared calendars* → *Publish a
     calendar* → copy the ICS link.
2. **Paste it** into `data/calendar.js`:
   ```js
   "icsUrl": "https://calendar.google.com/calendar/ical/…/basic.ics",
   ```
3. **Check the rest of that file** — `titleContains: "SUN.DYLE"` filters out
   rehearsals and non-band events; `stripPrefix: "SUN.DYLE"` strips the band name
   off event titles; `defaultCity` fills in the city when a venue has no address.
   Set `titleContains: ""` to take every event in the calendar.
4. **Pull it down** and look before you commit:
   ```bash
   python3 scripts/sync-shows.py            # writes data/shows.generated.js
   python3 scripts/sync-shows.py --dry-run  # just prints what it found
   ```
   Recurring events are expanded (weekly residencies, COUNT/UNTIL, EXDATEs),
   all-day events come through with no time, cancelled events are skipped, and
   ticket links are picked up from the event's URL or its description.
5. **Keep it fresh.** `.github/workflows/sync-shows.yml` already does it: a
   GitHub Action runs daily, and on any push that touches the calendar config,
   and commits `data/shows.generated.js` when the dates change. To refresh
   sooner: Actions tab → *Sync show dates* → *Run workflow*. (GitHub's scheduler
   can run 15–60 minutes late; it's a daily job, not a stopwatch.)

**About the calendar URL.** The published link above is a read-only token — it
can only read this one calendar, and only you can unpublish it. It sits in
`data/calendar.js`, which is a public file on a public site, so treat it like a
"share" link rather than a password. If you'd rather it not be in the repo at
all, set it as an environment variable instead and it takes priority:

```bash
export SUN_DYLE_ICS_URL='webcal://p157-caldav.icloud.com/published/2/…'
```

GitHub Actions can hold the same value as a repository secret (Settings →
Secrets and variables → Actions), read into `env:` on the sync step.

Prefer to do it on this Mac instead of GitHub? Same one-liner:

```bash
crontab -e
17 9 * * * cd ~/hermes/sundyle-site && python3 scripts/sync-shows.py && git commit -am "sync shows" && git push
```

### Option B — live from the Google Calendar API

New dates appear within a minute of being added, with no refresh job and no
commit. Costs one API key and one line of config.

1. Make the band calendar public (Settings → *Access permissions* → *Make
   available to public*). The calendar ID is the `…@group.calendar.google.com`
   address on the *Integrate calendar* panel.
2. console.cloud.google.com → new project → **APIs & Services** → *Library* →
   enable **Google Calendar API**.
3. **Credentials** → *Create credentials* → **API key**. Copy it.
4. Edit the key → *Application restrictions* → **Websites** → add
   `https://sundyle.net/*` and `http://localhost:8091/*`. (Left unrestricted,
   anyone can burn your quota; the key is visible in the page either way, which
   is what the referrer restriction is for.)
5. In `data/calendar.js`: `"mode": "google"`, then fill in `googleApiKey` and
   `googleCalendarId`.
6. Reload the page. If the key or calendar is wrong the site quietly falls back
   to `data/shows.js` and tells visitors the calendar couldn't be reached.

## Adding your logo

One file, shown in two places — to the left of "SUN.DYLE" in the navigation bar,
and at the top of the contact card:

```
assets/logo.png
```

Replace it and both update. A PNG with a transparent background works best. A
square mark and a wide wordmark both work — the shapes adapt (32px tall in the
nav, 64px in the card) and `object-fit` keeps them undistorted. If your logo is
an SVG, either export a 512px PNG or point both `<img>` tags in `index.html` at
the `.svg` and drop the `width`/`height` attributes on them.

The file currently in there is a generated placeholder — a sun mark in the
site's amber, standing in for the real thing.

## Adding photos

Photos are dropped into `assets/photos/`. The site picks them up by filename, so
there is no list to keep in sync.

**The photo grid.** Put files in `assets/photos/gallery/` named `photo-01.jpg`,
`photo-02.jpg`, and so on. The page loads them in order and stops after four
missing numbers in a row, so gaps never break it. Up to 60.

**Hero and About photos.** Replace `assets/photos/hero.jpg` (wide, 2400×1350 is
ideal) and `assets/photos/band.jpg` (1600×1200 is ideal). Keep the filenames.

**Straight off a phone/camera.** Use the helper, which converts HEIC, resizes,
strips colour profiles and numbers the files for you:

```bash
scripts/prepare-photos.sh ~/Desktop/band-shoot          # → gallery, next free numbers
scripts/prepare-photos.sh ~/Desktop/wide.jpg --as hero  # → assets/photos/hero.jpg
scripts/prepare-photos.sh ~/Desktop/portrait.jpg --as band
```

It never overwrites: gallery shots continue after the highest existing number,
and it won't re-process files already in the gallery.

**Portraits in the lineup.** The lineup tiles show initials. To use headshots,
drop files in `assets/photos/members/` and follow the comment in `index.html`.

## Adding a release or video

`data/site.js`:

```js
{ title: "New Thing", type: "Single", year: 2026, date: "December 1, 2026",
  art: "assets/albums/new-thing.jpg", url: "https://sundyle.bandcamp.com/..." }
```

`tracks` is optional. Set `featured: true` on one release to give it the "New"
badge and put its art in the hero. Videos take the YouTube id from the video's
URL (`youtube.com/watch?v=` **this part**).

## Light & dark mode

The site follows the system setting — no toggle to click, nothing stored. Every
colour is a token at the top of `styles.css`, and the whole theme is that token
block defined twice:

```
:root                                  the light theme
@media (prefers-color-scheme: dark)    the dark theme
```

Change a value in one block and only that theme moves. A few tokens exist purely
to keep the two honest:

| token | why |
|---|---|
| `--deep`, `--deep-ink` | surfaces that stay dark in both themes (hero, footer, video cards, lightbox) — kept apart from `--ink` so inverting the text can't turn the footer white |
| `--btn-bg`, `--btn-ink` | the one button that inverts: dark fill on light, light fill on dark, so it's always the strongest thing on the page |
| `--nav-bg`, `--ghost-bg`, `--hairline` | the translucent bits that have to flip with the background |
| `--amber-2` | amber when used as *text* — darker than the paper in light mode, lighter than it in dark |

Two things live outside the stylesheet: the Bandcamp player is styled by URL, so
`script.js` passes it `bgcol`/`linkcol` per theme (and re-loads it if the system
theme changes while the page is open), and `theme-color` in `index.html` is
declared once per theme so the browser chrome matches on a phone.

## Changing colours or type

`styles.css`, top of the file. The palette comes straight off the *Typhoon*
cover: paper `#fbfaf7`, ink `#14110f`, amber `#e0621f`, sun `#f0a81e`, teal
`#2e8b84`, violet `#8a6ba8`. Headings use HMCamino; body text is the system
font so it stays crisp and loads instantly.

## Deploying to GitHub Pages

This folder is already a git repo. Push it to the repo that serves
`sundyle.net` (or a new repo), then in **Settings → Pages** set the source to
the branch root. `CNAME` (containing `sundyle.net`) and `.nojekyll` are already
in place — keep both. If you use the calendar sync, also check
**Settings → Actions → General → Workflow permissions** is set to *Read and
write*, or the daily job can't commit.

```bash
git add -A
git commit -m "Update the site"
git push
```

## Before launch — please check

- **Lineup** (`index.html`, the `grid--people` block) — five players now: Luke
  Delgado removed. The rest still trace back to the January 2024 Whatzup
  article, so give them a last look.
- **Calendar** — wired to the iCloud calendar *"sundyle site"*. It currently
  holds one gig (Oct 3, Monticello Library), which is what the Live section
  shows. iCloud can take a few minutes to update the published feed after you
  edit the calendar; run `python3 scripts/sync-shows.py` to pull changes in.
- **Logo** — `assets/logo.png` is a generated sun placeholder (nav + contact
  card). Drop the real one in.
- **Hero / About / gallery photos** — the hero and About photos are now real;
  the 12 gallery tiles are still generated placeholders that say which file to
  replace.
- **Contact email** — `sun.dyle.mgmt@gmail.com` is used throughout.
