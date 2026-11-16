/* ==========================================================================
   SUN.DYLE — where the Live dates come from
   Read by the website (as window.CALENDAR) AND by scripts/sync-shows.py,
   so this one file is the only place to configure the calendar.

   This is Ben's iCloud calendar "sundyle site", published read-only.
   Add a gig to that calendar, and it lands on the website.
   ========================================================================== */

window.CALENDAR = {
  "mode": "ics",

  /* The published iCloud calendar's address is NOT in this file any more — it
     was readable by anyone who opened this page, and it unlocks the whole
     calendar, notes included. It is passed in instead:
       * GitHub Action — the repo secret SUN_DYLE_ICS_URL
       * on this Mac   — export SUN_DYLE_ICS_URL='webcal://…' before syncing,
                         or pass --ics-url webcal://… to sync-shows.py
     The page itself never needs it: it reads data/shows.generated.js. */
  "icsUrl": "",

  "timezone": "America/Indiana/Indianapolis",
  "defaultCity": "",

  "stripPrefix": "SUN.DYLE",

  "titleContains": "",
  "skipTitleContains": ["[hold]", "[private]", "[tentative]", "[draft]", "rehearsal"],
  "skipCancelled": true,

  "noteFromDescription": true,
  "publicNotePrefix": "Public:",

  "requireLocation": false,

  "horizonDays": 550,
  "pastLookbackDays": 400,

  "googleApiKey": "",
  "googleCalendarId": "",

  "showSyncStamp": true
};
