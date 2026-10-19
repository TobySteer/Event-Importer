import { Event } from '../models/event.js';
import type { mapFosdemEvent } from '../providers/fosdem.js';
import { summariseEvent } from './summarise-event.js';
import { saveEvent } from './save-event.js';

type MappedFosdemEvent = ReturnType<typeof mapFosdemEvent>;

export async function importFosdemEvent(event: MappedFosdemEvent) {
    if (await Event.exists({ sourceUrl: event.sourceUrl })) {
        return { outcome: 'duplicate' as const };
    }

    const summary = await summariseEvent(
        event.title,
        event.description,
    );

    const changes = ['Converted source HTML to plain text.'];

    if (summary) {
        changes.push('Added an AI-generated summary using Gemini.');
    }

    return saveEvent({
        ...event,
        summary,
        summaryGeneratedBy: 'gemini',
        scrapedAt: new Date(),
        attribution: {
            ...event.attribution,
            changes,
        },
    });
}