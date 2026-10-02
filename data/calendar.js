/* ==========================================================================
   SUN.DYLE — where the Live dates come from
   Read by the website (as window.CALENDAR) AND by scripts/sync-shows.py,
   so this one file is the only place to configure the calendar.

   This is Ben's iCloud calendar "sundyle site", published read-only.
   Add a gig to that calendar, and it lands on the website.
   ========================================================================== */

window.CALENDAR = {
  "mode": "ics",

  "icsUrl": "webcal://p157-caldav.icloud.com/published/2/MTM5NDEyOTUyMDEzOTQxMqjomdo3_gYCcvIEcdb5xyWaGnKotrQ3-f47gkvXZnEE8v4_GbZYQLUGoniOPEJ6WalRccTL0QiKHJyDBtNDjPA",
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
  "keepPastCount": 12,

  "googleApiKey": "",
  "googleCalendarId": "",

  "showSyncStamp": true
};
