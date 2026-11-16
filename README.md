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
│   ├── calendar.js                how the Live dates are read
│   ├── shows.js                   hand-written dates (always win)
│   └── shows.generated.js         written by the sync script — don't edit
├── assets/
│   ├── albums/                    album art
│   ├── fonts/HMCamino.ttf         the band's display face
│   ├── logo.png                   nav + contact card
│   ├── favicon.png, apple-touch-icon.png
│   └── photos/
│       ├── hero.jpg               full-width hero background
│       ├── band.jpg               the photo next to the About text
│       └── gallery/               photo-01.jpg, photo-02.jpg, … the photo grid
├── scripts/
│   ├── serve.py                   local preview server (no-cache)
│   ├── sync-shows.py              calendar → data/shows.generated.js
│   ├── prepare-photos.sh          resize, rename and clean photos for the web
│   └── strip-metadata.py          remove camera/author metadata from images
├── .github/workflows/sync-shows.yml   daily calendar refresh
├── CNAME                          tells GitHub Pages the custom domain
└── 404.html, robots.txt, sitemap.xml
```

## Preview it locally

```bash
cd ~/hermes/sundyle-site
scripts/serve.py                     # http://localhost:8095
```

Reachable from any device on the home network at `http://<this-mac>.local:8095/`.
Use this rather than `python3 -m http.server`: it sends `Cache-Control: no-store`,
so a plain refresh always shows the file you just saved instead of last week's
`data/site.js`. Any other port: `scripts/serve.py 8080`.

## Publishing a change

```bash
git add -A
git commit -m "Update the site"
git push
```

GitHub Pages rebuilds from `main` in about a minute. `CNAME` (holding
`sundyle.net`) and `.nojekyll` must stay in the repo. One setting to leave alone:
**Settings → Actions → General → Workflow permissions → Read and write**, or the
daily calendar job cannot commit its result.

## Where the show dates come from

`data/calendar.js` (mode `"ics"`) reads the published iCloud calendar *"sundyle
site"* through `scripts/sync-shows.py`, and the result is
`data/shows.generated.js`. Add a gig to the calendar and it lands on the
website — no code, no editing this repo.

`.github/workflows/sync-shows.yml` runs the sync every morning, on any push that
touches the script or the config, and from the Actions tab → *Sync show dates* →
*Run workflow*. It commits `shows.generated.js` when the dates change and
rebuilds the site. GitHub's scheduler can run 15–60 minutes late; it's a daily
job, not a stopwatch.

**The calendar address is a GitHub secret, not a file.** It used to sit in
`data/calendar.js`, where anyone could read it and pull the whole calendar,
notes included. It now lives in the repository secret `SUN_DYLE_ICS_URL`
(Settings → Secrets and variables → Actions). For a manual sync on this Mac,
export it first:

```bash
export SUN_DYLE_ICS_URL='webcal://<your published calendar address>'
python3 scripts/sync-shows.py --dry-run   # look
python3 scripts/sync-shows.py             # write data/shows.generated.js
```

The address itself is still in this repo's earlier commits — see *Nothing
personal ships* for what that means and how to retire it.

Four things to know when you write a gig in that calendar:

- **How a date is laid out** — the event's *title* is the main line, and its
  *Location* is the address line underneath (venue, then street, then city).
  Put the full address in Location
  (`Monticello-Union Township Public Library` ⏎ `321 W Broadway St, Monticello, IN 47960`)
  and each part is picked out for you. The time sits with the date on the left.
  Any part the title already says is dropped, so the venue is never printed twice.
  With no Location, whatever follows the `@` in the title becomes the venue.
  `stripPrefix: "SUN.DYLE"` keeps the band name off the main line.
- **Notes are private by default.** Nothing from an event's notes is published,
  because that field fills up with fees, deposit status and "PA needed". Only a
  line you start with `Public:` reaches the site — `Public: Doors at 7 — all ages`.
- **Keeping one off the site** — put `[hold]`, `[private]`, `[tentative]`,
  `[draft]` or the word `rehearsal` anywhere in the title and the sync skips it.
  So does anything with "cancel" in the title.
- **Tickets** — put the ticket link in the event's *URL* field and the row grows
  a Tickets button.

**`data/shows.js` always wins.** A hand-written entry replaces the calendar's
entry for the same date + venue, so you can add a ticket link, a support act or a
note without touching the calendar:

```js
// data/shows.js — "title" is the main line, "venue"/"street"/"city" the line under it
window.SHOWS = {
  upcoming: [
    { date: "2026-11-14", title: "SUN.DYLE @ The Clyde Theatre", time: "7:30 PM",
      venue: "The Clyde Theatre", street: "1808 Bluffton Rd", city: "Fort Wayne, IN",
      tickets: "https://...", note: "Doors 6:30 — VIP soundcheck upgrade" }
  ]
};
```

`date` must be `YYYY-MM-DD`. Only dates today or later appear, and a show drops
off on its own once it passes — nothing needs deleting.

Modes in `data/calendar.js`: `"ics"` (what runs now), `"manual"` (only
`data/shows.js`), or `"google"` (live from the Google Calendar API on every page
load, which needs a public calendar plus `googleApiKey` / `googleCalendarId`
filled in).

## Photos

Photos are picked up by filename, so there is no list to keep in sync.

**The photo grid.** Files in `assets/photos/gallery/` named `photo-01.jpg`,
`photo-02.jpg`, and so on. The page loads them in order and stops after four
missing numbers in a row, so gaps never break it. Up to 60.

**Hero and About photos.** Replace `assets/photos/hero.jpg` (wide, 2400×1350 is
ideal) and `assets/photos/band.jpg` (1600×1200 is ideal). Keep the filenames.

**Straight off a phone/camera.** Use the helper, which converts HEIC, resizes,
strips colour profiles and camera metadata, and numbers the files for you:

```bash
scripts/prepare-photos.sh ~/Desktop/band-shoot          # → gallery, next free numbers
scripts/prepare-photos.sh ~/Desktop/wide.jpg --as hero  # → assets/photos/hero.jpg
scripts/prepare-photos.sh ~/Desktop/portrait.jpg --as band
```

It never overwrites: gallery shots continue after the highest existing number,
and it won't re-process files already in the gallery.

**Portraits in the lineup.** The tiles show initials. To use headshots, drop files
in `assets/photos/members/` and follow the comment in `index.html`.

## Adding a release, a video or a press link

All three are arrays in `data/site.js`.

```js
// a release — "tracks" is optional; "featured: true" on one gives it the "New"
// badge and puts its art in the hero
{ title: "New Thing", type: "Single", year: 2026, date: "December 1, 2026",
  art: "assets/albums/new-thing.jpg", url: "https://sundyle.bandcamp.com/..." }

// a video — "id" is the part after youtube.com/watch?v=
{ id: "3hqaq-oNt44", title: "SUN.DYLE — “Stones”", kind: "NPR Tiny Desk Contest" }

// a press mention — "date" is the day it was published, YYYY-MM-DD
{ outlet: "Whatzup", date: "2026-10-28", headline: "Sun.Dyle: ‘Typhoon’",
  url: "https://whatzup.com/sun-dyle-typhoon/" }
```

The press list prints the date as "Oct 28, 2026" and sorts itself newest-first, so
a new link can go anywhere in the array.

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

## Nothing personal ships

This repo is public and so is everything under `assets/`, so two things are swept
deliberately.

**Photo metadata.** A camera writes EXIF and XMP into every file: body and lens
serial numbers, the photographer's account name, capture times, sometimes GPS.
None of it is needed to show a picture, and all of it is readable by anyone who
downloads the image. `scripts/prepare-photos.sh` strips it on every photo it
processes, and you can clean a whole tree at any time — losslessly, pixels
untouched:

```bash
scripts/strip-metadata.py --check     # report what is in there, change nothing
scripts/strip-metadata.py             # strip every image under assets/
scripts/strip-metadata.py assets/photos/hero.jpg
```

It deletes the metadata segments and leaves the compressed image data alone, then
decodes the result and refuses to keep it unless the pixels are identical. Run it
on any image added by hand before committing.

**The calendar address.** Moved to the `SUN_DYLE_ICS_URL` secret, described above.
Be clear about what that does: it keeps the address out of the served site and
out of new commits, but it is still readable in the repo's earlier commits, and a
published iCloud link cannot be revoked in place. To retire it for real:
unpublish the calendar in iCloud (Calendar app → right-click the calendar →
*Share Calendar* → untick *Public Calendar*), publish it again for a fresh
address, and update the secret. Nothing else about the site changes.

Getting an ICS address again, for reference: **iCloud/Apple** — Calendar app →
right-click the calendar → *Share Calendar* → tick *Public Calendar* → copy the
link (it starts `webcal://`; the script accepts it as-is). **Google** — Settings →
the calendar → *Integrate calendar* → *Secret address in iCal format*.
**Outlook.com** — Settings → Calendar → *Shared calendars* → *Publish a
calendar*.

What is deliberately public, and fine: the booking address
`sun.dyle.mgmt@gmail.com`, the members' names and roles, and the social accounts
linked from `data/site.js`.
