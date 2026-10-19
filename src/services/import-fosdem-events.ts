
//custom imports
import { Event } from '../models/event.js';
import {
    readFosdemEvents,
    mapFosdemEvent,
} from '../providers/fosdem.js';
import { importFosdemEvent } from './import-fosdem-event.js';

export async function importFosdemEvents() {
    const events = await readFosdemEvents();
    const selected = events
        .map(mapFosdemEvent)
        .sort((a, b) =>
            b.startDate.getTime() - a.startDate.getTime() ||
            a.sourceUrl.localeCompare(b.sourceUrl),
        )
        .slice(0, 3);

    let inserted = 0;
    let duplicates = 0;
    let failed = 0;

    for (const event of selected) {
        try {
            const result = await importFosdemEvent(event);

            if (result.outcome === 'inserted') {
                inserted++;
            } else {
                duplicates++;
            }
        } catch (error) {
            failed++;

            console.error(
                `[import] Failed to import "${event.title}":`,
                error instanceof Error ? error.message : 'Unknown error',
            );
        }
    }

    const olderEvents = await Event.find({ provider: 'fosdem' })
        .sort({ createdAt: -1, _id: -1 })
        .skip(3)
        .select('_id')
        .lean();

    if (olderEvents.length > 0) {
        await Event.deleteMany({
            provider: 'fosdem',
            _id: {
                $in: olderEvents.map(event => event._id),
            },
        });
    }

    return {
        discovered: events.length,
        selected: selected.length,
        inserted,
        duplicates,
        failed,
    };
}