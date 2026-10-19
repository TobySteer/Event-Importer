const eventsList = document.querySelector('#events-list');
const eventsStatus = document.querySelector('#events-status');

async function loadEvents() {
    eventsStatus.textContent = 'Loading saved events…';
    eventsList.replaceChildren();

    try {
        const response = await fetch('/api/events');

        if (!response.ok) {
            throw new Error(`Unable to load events: HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.events)) {
            throw new Error('The server returned an unexpected response');
        }

        const events = data.events.filter(
            event => event.provider === 'fosdem',
        );

        for (const event of events) {
            const article = document.createElement('article');
            article.style.marginBottom = '3rem';

            const heading = document.createElement('h3');
            heading.textContent = event.title;

            const summary = document.createElement('p');
            summary.textContent =
                event.summary || event.description || 'No description available.';

            const summaryLabel = document.createElement('p');
            summaryLabel.textContent = event.summary
                ? 'AI-generated summary'
                : 'Source description';

            const credits = document.createElement('p');
            const authors = event.attribution?.authors ?? [];
            credits.textContent = authors.length
                ? `Speaker credits: ${authors.join(', ')}`
                : 'Source: FOSDEM 2026';
            const dates = document.createElement('p');

            const dateFormatter = new Intl.DateTimeFormat('en-GB', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Europe/Brussels',
            });

            dates.textContent =
                `${dateFormatter.format(new Date(event.startDate))} – ` +
                `${dateFormatter.format(new Date(event.endDate))} ` +
                '(Europe/Brussels)';

            const source = document.createElement('a');
            source.textContent = 'View original event on FOSDEM';

            const sourceUrl = new URL(event.sourceUrl);

            if (
                sourceUrl.protocol === 'https:' &&
                sourceUrl.hostname === 'fosdem.org'
            ) {
                source.href = sourceUrl.href;
                source.target = '_blank';
                source.rel = 'noopener noreferrer';
            }
            article.append(
                heading,
                dates,
                summaryLabel,
                summary,
                credits,
                source,
            );
            eventsList.append(article);
        }

        eventsStatus.textContent = events.length
            ? `Showing ${events.length} saved FOSDEM events.`
            : 'No FOSDEM events have been imported yet.';
    } catch (error) {
        console.error(error);
        eventsStatus.textContent =
            'Could not load saved events. Check that the server is running.';
    }
}

loadEvents();

const importButton = document.querySelector('#import-button');
const importStatus = document.querySelector('#import-status');

importButton.addEventListener('click', async () => {
    importButton.disabled = true;
    importStatus.textContent = 'Importing events…';

    try {
        const response = await fetch('/api/import', {
            method: 'POST',
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Import failed');
        }

        const outcome = result.failed > 0
            ? 'Import finished with errors'
            : 'Import complete';

        importStatus.textContent =
            `${outcome}: ${result.inserted} added, ` +
            `${result.duplicates} already saved, ` +
            `${result.failed} failed.`;

        await loadEvents();
    } catch (error) {
        console.error(error);
        importStatus.textContent =
            'Import could not be confirmed. Refresh the event list ' +
            'before retrying; the server may still be processing it.';
    } finally {
        importButton.disabled = false;
    }
});

importButton.disabled = false;
importStatus.textContent = 'Ready to import.';