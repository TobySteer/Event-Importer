import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';

// custom
import { Event } from './models/event.js';
import { importFosdemEvents } from './services/import-fosdem-events.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/events', async (_req, res) => {
    try {
        const events = await Event.find({ provider: 'fosdem' })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.json({ events });
    } catch {
        res.status(500).json({
            error: 'Unable to load events',
        });
    }
});

let importInProgress = false;

app.post('/api/import', async (_req, res) => {
    if (importInProgress) {
        res.status(409).json({
            error: 'An import is already running',
        });
        return;
    }

    importInProgress = true;

    try {
        const result = await importFosdemEvents();
        res.json(result);
    } catch (error) {
        console.error(
            '[import] Failed:',
            error instanceof Error ? error.message : 'Unknown error',
        );

        res.status(500).json({
            error: 'Import failed. Check the backend terminal.',
        });
    } finally {
        importInProgress = false;
    }
});

async function startServer() {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error('MONGODB_URI is missing from .env');
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT must be an integer between 1 and 65535');
    }

    await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
    });

    console.log('Connected to MongoDB');

    app.listen(port, '127.0.0.1', () => {
        console.log(`Server running at http://127.0.0.1:${port}`);
    });
}

startServer().catch(() => {
    console.error(
        'Startup failed. Check your .env settings and that MongoDB is running.',
    );
    process.exit(1);
});