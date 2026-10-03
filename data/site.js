/* ==========================================================================
   SUN.DYLE — site data
   This is the only file you need to touch for links, releases and videos.
   It is a plain JS object: keep the quotes and commas, save, refresh.
   ========================================================================== */

window.SITE = {

  /* ---------------------------------------------------------------- band --- */
  band: {
    name: "SUN.DYLE",
    hometown: "Fort Wayne, Indiana",
    tagline: "Jazz fusion, neo-soul & R&B",
    bookingEmail: "sun.dyle.mgmt@gmail.com",
    copyrightYear: 2026
  },

  /* --------------------------------------------------------------- links --- */
  links: {
    bandcamp:   "https://sundyle.bandcamp.com",
    album:      "https://sundyle.bandcamp.com/album/typhoon",
    appleMusic: "https://music.apple.com/us/artist/sun-dyle/1714256367",
    youtube:    "https://www.youtube.com/@SUNDYLE",
    instagram:  "https://www.instagram.com/sun.dyle/",
    facebook:   "https://www.facebook.com/people/SUNDYLE/61551081711289/",
    tiktok:     "https://www.tiktok.com/@sun.dyle"
  },

  /* The Bandcamp embedded player needs the numeric album id.
     It is the number in the player URL on Bandcamp's share tab. */
  bandcampAlbumId: "255466265",

  /* ----------------------------------------------------------- releases ---
     Newest first. "type" is free text: Album, EP, Single, Live...
     "tracks" is optional (omit for singles). "art" points at
     assets/albums/<file>. Set "featured: true" on one release only. */
  releases: [
    { title: "Typhoon",             type: "Album",  year: 2026, date: "October 2, 2026",  tracks: 12, art: "assets/albums/typhoon.jpg",            url: "https://sundyle.bandcamp.com/album/typhoon",            featured: true },
    { title: "Freefall",            type: "Single", year: 2024, date: "November 1, 2024",                art: "assets/albums/freefall.jpg",            url: "https://sundyle.bandcamp.com/track/freefall" },
    { title: "Mirror",              type: "Album",  year: 2024, date: "April 20, 2024",   tracks: 8,  art: "assets/albums/mirror.jpg",               url: "https://sundyle.bandcamp.com/album/mirror" },
    { title: "Empress/Crown (Live)",type: "Live",   year: 2024, date: "March 24, 2024",                art: "assets/albums/empress-crown-live.jpg",  url: "https://sundyle.bandcamp.com/track/empress-crown-live" },
    { title: "Breezy (Live)",       type: "Live",   year: 2024, date: "March 4, 2024",                 art: "assets/albums/breezy-live.jpg",         url: "https://sundyle.bandcamp.com/track/breezy-live" },
    { title: "Faintest Idea",       type: "EP",     year: 2023, date: "November 6, 2023", tracks: 4,  art: "assets/albums/faintest-idea.jpg",       url: "https://sundyle.bandcamp.com/album/faintest-idea" }
  ],

  /* ------------------------------------------------------------- videos ---
     "id" is the YouTube video id (the part after watch?v=). */
  videos: [
    { id: "3hqaq-oNt44", title: "SUN.DYLE \u2014 \u201CStones\u201D NPR Tiny Desk Contest", kind: "NPR Tiny Desk Contest 2025" },
    { id: "-OKp5ptWOxM", title: "SUN.DYLE Live from the Foxhole \u2014 Colors",      kind: "Live Session" },
    { id: "9mMnba2pSTQ", title: "SUN.DYLE Live from the Foxhole \u2014 Insomnia & Rest", kind: "Live Session" },
    { id: "sTMcR4LbMig", title: "SUN.DYLE \u2014 Breezy (Live at 2Toms)",           kind: "Live" },
    { id: "FtcW3nm9pF8", title: "SUN.DYLE \u2014 Luna (Live at 2Toms)",             kind: "Live" },
    { id: "cXKrxcca0a0", title: "SUN.DYLE Live at the Brass Rail",                  kind: "Full Set" }
  ],

  /* -------------------------------------------------------------- press --- */
  press: [
    { outlet: "WBOI",    headline: "SUN.DYLE closes out Live and Local at The Landing", url: "https://www.wboi.org/local-music/2025-10-03/sun-dyle-closes-out-live-and-local-at-the-landing-with-a-dreamy-mix-of-jazz-neo-soul-and-r-b" },
    { outlet: "Whatzup", headline: "Sun.Dyle push city\u2019s neo-soul scene forward",   url: "https://whatzup.com/sun-dyle-push-citys-neo-soul-scene-forward/" },
    { outlet: "Whatzup", headline: "Sun.Dyle: \u2018Mirror\u2019",                       url: "https://whatzup.com/sun-dyle-mirror/" }
  ]
};
