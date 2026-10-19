import { XMLParser } from 'fast-xml-parser';
import { compile } from 'html-to-text';

//custom
import { parseEventDate } from '../services/parse-event-date.js';

const htmlToText = compile({
    wordwrap: false,
});

const SCHEDULE_URL =
    'https://archive.fosdem.org/2026/schedule/xml';

export async function fetchFosdemSchedule(): Promise<unknown> {
    const response = await fetch(SCHEDULE_URL, {
        signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
        throw new Error(
            `FOSDEM schedule request failed: HTTP ${response.status}`,
        );
    }

    const xml = await response.text();

    const parser = new XMLParser({
        ignoreAttributes: false,
        parseTagValue: false,
        isArray: (name) =>
            ['day', 'room', 'event'].includes(name),
    });

    return parser.parse(xml);
}

function requireObject(
    value: unknown,
    label: string,
): Record<string, unknown> {
    if (
        typeof value !== 'object' ||
        value === null ||
        Array.isArray(value)
    ) {
        throw new Error(`Expected ${label} to be an object`);
    }

    return value as Record<string, unknown>;
}

export async function readFosdemEvents() {
    const data = requireObject(
        await fetchFosdemSchedule(),
        'feed',
    );

    const schedule = requireObject(data.schedule, 'schedule');

    if (!Array.isArray(schedule.day)) {
        throw new Error('Expected schedule.day to be a list');
    }

    const events: Record<string, unknown>[] = [];

    for (const dayValue of schedule.day) {
        const day = requireObject(dayValue, 'day');

        if (!Array.isArray(day.room)) {
            throw new Error('Expected day.room to be a list');
        }

        for (const roomValue of day.room) {
            const room = requireObject(roomValue, 'room');

            if (!Array.isArray(room.event)) {
                throw new Error('Expected room.event to be a list');
            }

            for (const eventValue of room.event) {
                events.push(requireObject(eventValue, 'event'));
            }
        }
    }

    return events;
}

export function getFosdemTimes(event: Record<string, unknown>) {
    const date = event.date;
    const duration = event.duration;

    const timestampPattern =
        /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/;

    if (typeof date !== 'string' || !timestampPattern.test(date)) {
        throw new Error('FOSDEM event needs a start time with a timezone');
    }

    const startDate = parseEventDate(date);

    if (!startDate) {
        throw new Error('FOSDEM event is missing its start time');
    }

    if (typeof duration !== 'string') {
        throw new Error('FOSDEM event is missing its duration');
    }

    const match = /^(\d{2,3}):([0-5]\d)$/.exec(duration);

    if (!match) {
        throw new Error('FOSDEM duration must use hours:minutes');
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const durationMs = (hours * 60 + minutes) * 60_000;

    if (durationMs === 0) {
        throw new Error('FOSDEM event duration must be positive');
    }

    const endDate = new Date(startDate.getTime() + durationMs);

    return { startDate, endDate };
}

function getFosdemDescription(event: Record<string, unknown>): string {
    const parts: string[] = [];

    for (const field of ['abstract', 'description'] as const) {
        const value = event[field];

        if (value === undefined || value === '') {
            continue;
        }

        if (typeof value !== 'string') {
            throw new Error(`Expected FOSDEM ${field} to be text`);
        }

        const text = htmlToText(value).trim();

        if (text && !parts.includes(text)) {
            parts.push(text);
        }
    }

    return parts.join('\n\n');
}

export function mapFosdemEvent(event: Record<string, unknown>) {
    if (typeof event.title !== 'string' || !event.title.trim()) {
        throw new Error('FOSDEM event is missing its title');
    }

    if (typeof event.url !== 'string' || !event.url.trim()) {
        throw new Error('FOSDEM event is missing its source URL');
    }

    const sourceUrl = new URL(event.url);

    if (
        sourceUrl.protocol !== 'https:' ||
        sourceUrl.hostname !== 'fosdem.org' ||
        sourceUrl.port !== '' ||
        sourceUrl.username ||
        sourceUrl.password ||
        !sourceUrl.pathname.startsWith('/2026/schedule/event/')
    ) {
        throw new Error('Expected an official FOSDEM 2026 event URL');
    }

    sourceUrl.hash = '';

    const { startDate, endDate } = getFosdemTimes(event);

    const persons =
        event.persons === undefined || event.persons === ''
            ? {}
            : requireObject(event.persons, 'persons');

    const rawPeople = persons.person === undefined
        ? []
        : Array.isArray(persons.person)
            ? persons.person
            : [persons.person];

    const authors = rawPeople.map((personValue) => {
        const person = requireObject(personValue, 'person');
        const name = person['#text'];

        if (typeof name !== 'string' || !name.trim()) {
            throw new Error('FOSDEM speaker is missing their name');
        }

        return name.trim();
    });

    return {
        title: event.title.trim(),
        description: getFosdemDescription(event),
        provider: 'fosdem' as const,
        sourceUrl: sourceUrl.href,
        startDate,
        endDate,
        attribution: {
            source: 'FOSDEM 2026',
            authors,
            license: 'CC BY 4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        },
    };
}