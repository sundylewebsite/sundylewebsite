/* ==========================================================================
   SUN.DYLE — where the Live dates come from
   Read by the website (as window.CALENDAR) AND by scripts/sync-shows.py,
   so this one file is the only place to configure the calendar.

   mode:
     "ics"    paste your public calendar link into icsUrl below, then let
              scripts/sync-shows.py (or the GitHub Action) refresh the dates.
              Works with Google, Apple/iCloud, Outlook — anything with an ICS.
     "google" live on every page load from the Google Calendar API. Needs
              googleApiKey + googleCalendarId (see README).
     "manual" ignore calendars, use data/shows.js exactly as written.

   Keep this file valid JSON inside the braces: no trailing commas, no
   comments inside the object. Both readers are forgiving of // comments,
   but not of a dangling comma.
   ========================================================================== */

window.CALENDAR = {
  "mode": "ics",

  "icsUrl": "PASTE-YOUR-PUBLIC-ICS-LINK-HERE",
  "timezone": "America/Indiana/Indianapolis",
  "defaultCity": "Fort Wayne, IN",

  "stripPrefix": "SUN.DYLE",
  "titleContains": "SUN.DYLE",
  "skipCancelled": true,
  "noteFromDescription": true,
  "requireLocation": false,

  "horizonDays": 550,
  "pastLookbackDays": 400,
  "keepPastCount": 12,

  "googleApiKey": "",
  "googleCalendarId": "",

  "showSyncStamp": true
};
