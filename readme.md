# Event Importer

This local web application imports events from FOSDEMs official XML schedule, generates summaries of the events with Gemini, and stores the summarised events in MongoDB.

It imports the three latest events by start-time from the FOSDEM 2026 schedule, and converts HTML descriptions into plain text.

The Event Importer uses the FOSDEM 2026 schedule from 31/01/2026 - 01/02/2026


## Setup

1.
pnpm install

2.
Create the .env file in the project root and copy .env.example to it

3.
pnpm typecheck
pnpm build
*MongoDB must be running*
pnpm start

4.
Open the webpage in your browser and press 'import from FOSDEM'