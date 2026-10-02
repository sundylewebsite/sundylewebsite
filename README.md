# SUN.DYLE — sundyle.net

The band's website. Static HTML/CSS/JS, no build step, no dependencies, hosted
on GitHub Pages. Everything is edited by hand and pushed.

```
sundyle-site/
├── index.html                 the whole site (one scrolling page)
├── styles.css                 all styling — colours live in :root at the top
├── script.js                  nav, scroll effects, lightbox, data rendering
├── data/
│   ├── site.js                links, releases, videos, press  ← edit this one
│   └── shows.js               upcoming + past shows
├── assets/
│   ├── albums/                album art (already filled in)
│   ├── fonts/HMCamino.ttf     the band's display face
│   ├── favicon.png, apple-touch-icon.png
│   └── photos/
│       ├── hero.jpg           full-width hero background
│       ├── band.jpg           the photo next to the About text
│       └── gallery/           photo-01.jpg, photo-02.jpg, … the photo grid
├── scripts/prepare-photos.sh  resize + rename photos for the web
├── CNAME                      tells GitHub Pages the custom domain
└── 404.html, robots.txt, sitemap.xml
```

## Preview it locally

```bash
cd ~/hermes/sundyle-site
python3 -m http.server 8091 --bind 0.0.0.0
```

Then open http://localhost:8091 — or from any device on the home network,
http://<this-mac>.local:8091

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

It never overwrites: gallery shots continue after the highest existing number.

**Portraits in the lineup.** The lineup tiles show initials. To use headshots,
drop files in `assets/photos/members/` and follow the comment in `index.html`.

## Adding a show

Open `data/shows.js`, copy an example line, un-comment it:

```js
{ date: "2026-11-14", time: "8:00 PM", venue: "The Clyde Theatre", city: "Fort Wayne, IN",
  tickets: "https://...", note: "All ages" },
```

`date` must be `YYYY-MM-DD`. Upcoming dates sort soonest-first and flip into the
"Past shows" list by themselves once the date passes — leave them in place.
With no upcoming dates the Live section shows a friendly "check Instagram"
state.

## Adding a release or video

Also `data/site.js`:

```js
{ title: "New Thing", type: "Single", year: 2026, date: "December 1, 2026",
  art: "assets/albums/new-thing.jpg", url: "https://sundyle.bandcamp.com/..." }
```

`tracks` is optional. Set `featured: true` on one release to give it the "New"
badge and put its art in the hero. Videos take the YouTube id from the video's
URL (`youtube.com/watch?v=` **this part**).

## Changing colours or type

`styles.css`, top of the file. The palette comes straight off the *Typhoon*
cover: paper `#fbfaf7`, ink `#14110f`, amber `#e0621f`, sun `#f0a81e`, teal
`#2e8b84`, violet `#8a6ba8`. Headings use HMCamino; body text is the system
font so it stays crisp and loads instantly.

## Deploying to GitHub Pages

This folder is already a git repo. Push it to the repo that serves
`sundyle.net` (or a new repo), then in **Settings → Pages** set the source to
the branch root. `CNAME` (containing `sundyle.net`) and `.nojekyll` are already
in place — keep both.

```bash
git add -A
git commit -m "New site"
git push
```

If you'd rather keep the old site live while this one is checked over, push this
to a repo named `<username>.github.io` under a different branch, or as its own
repo and preview it at `https://<username>.github.io/<repo>/` before moving the
domain over. The custom domain only follows the repo that has Pages enabled.

## Before launch — please check

- **Lineup** (`index.html`, the `grid--people` block). The six names come from
  the January 2024 Whatzup article; confirm who is in the band now.
- **Shows** — `data/shows.js` ships empty on purpose. No dates are invented.
- **Hero / About / gallery photos** — currently generated placeholders that say
  which file to replace. Replace them before the domain goes live.
- **Contact email** — `sun.dyle.mgmt@gmail.com` is used throughout.
