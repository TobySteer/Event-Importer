import { mongo } from 'mongoose';

// custom imports
import { Event } from '../models/event.js';
import type { mapFosdemEvent } from '../providers/fosdem.js';

type FosdemEventToSave = ReturnType<typeof mapFosdemEvent> & {
    summary: string;
    summaryGeneratedBy: 'gemini';
    scrapedAt: Date;
    attribution: {
        changes: string[];
    };
};

export async function saveEvent(
    event: FosdemEventToSave,
) {
    // wait for models indexes
    await Event.init();

    try {
        const saved = await Event.create(event);

        return {
            outcome: 'inserted' as const,
            eventId: saved._id.toString(),
        };
    } catch (error) {
        if (
            error instanceof mongo.MongoServerError &&
            error.code === 11000
        ) {
            return {
                outcome: 'duplicate' as const,
            };
        }

        throw error;
    }
}