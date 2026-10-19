import { Schema, model } from 'mongoose';

const eventSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        summary: { type: String, default: '' },
        summaryGeneratedBy: {
            type: String,
            enum: ['gemini'],
        },

        attribution: {
            source: String,
            authors: [String],
            license: String,
            licenseUrl: String,
            changes: [String],
        },

        provider: {
            type: String,
            enum: ['fosdem'],
            required: true,
        },

        sourceUrl: { type: String, required: true, unique: true },
        imageUrl: String,

        startDate: Date,
        endDate: Date,

        location: {
            venue: String,
            city: String,
            country: String,
        },

        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },

        scrapedAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
);

export const Event = model('Event', eventSchema);