# Event Importer

This local web application imports events from FOSDEMs official XML schedule, generates summaries of the events with Gemini, and stores the summarised events in MongoDB.

It imports the three latest events by start-time from the FOSDEM 2026 schedule, and converts HTML descriptions into plain text.

The Event Importer uses the FOSDEM 2026 schedule from 31/01/2026 - 01/02/2026


## Setup

1.
pnpm install --frozen-lockfile

2.
Create the .env file int eh project root:
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/event-scraper-standalone
GEMINI_API_KEY= *(Use your Gemini API key, I used a trial version)*
GEMINI_MODEL=gemini-2.5-flash

3.
pnpm typecheck
pnpm build
pnpm start

4.
*MongoDB must be running*
Open the server and press 'import from FOSDEM'