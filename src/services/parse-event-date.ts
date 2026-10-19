export function parseEventDate(value: string): Date | undefined {
    if (!value) return undefined;

    const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
    const timestamp =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

    if (!dateOnly.test(value) && !timestamp.test(value)) {
        throw new Error('Event date is invalid or lacks a timezone');
    }

    // avoids impossible dates
    const calendarDate = value.slice(0, 10);
    const calendarCheck = new Date(`${calendarDate}T00:00:00.000Z`);

    if (
        Number.isNaN(calendarCheck.getTime()) ||
        calendarCheck.toISOString().slice(0, 10) !== calendarDate
    ) {
        throw new Error('Event contains an impossible calendar date');
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new Error('Event contains an invalid date or time');
    }

    return date;
}