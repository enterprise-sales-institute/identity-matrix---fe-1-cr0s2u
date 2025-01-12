/**
 * @fileoverview MongoDB model definition for visitor tracking in Identity Matrix
 * Implements GDPR-compliant visitor data structure with performance optimizations
 * @version 1.0.0
 */

import { Schema, model } from 'mongoose'; // v6.11.x
import { IVisitor, IVisitorMetadata, IEnrichedData } from '../../../interfaces/visitor.interface';
import { VISITOR_STATUS } from '../../../constants/visitor.constants';

/**
 * MongoDB schema definition for visitor location data
 */
const LocationSchema = new Schema({
    country: { type: String, required: true },
    city: { type: String, required: true },
    region: { type: String, required: true },
    postalCode: { type: String, required: true },
    timezone: { type: String, required: true }
}, { _id: false });

/**
 * MongoDB schema definition for visitor metadata
 */
const MetadataSchema = new Schema({
    ipAddress: {
        type: String,
        required: true,
        validate: {
            validator: (v: string) => /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(v),
            message: 'Invalid IP address format'
        }
    },
    userAgent: { type: String, required: true },
    referrer: { type: String },
    currentPage: { type: String, required: true },
    previousPages: [{ type: String }],
    customParams: { type: Map, of: String },
    location: { type: LocationSchema, required: true },
    deviceType: { type: String, required: true },
    browser: { type: String, required: true },
    os: { type: String, required: true }
}, { _id: false });

/**
 * MongoDB schema definition for enriched visitor data
 */
const EnrichedDataSchema = new Schema({
    company: { type: String, required: true },
    title: { type: String },
    industry: { type: String },
    size: { type: String },
    revenue: { type: String },
    website: { type: String },
    technologies: [{ type: String }],
    linkedinUrl: { type: String },
    socialProfiles: { type: Map, of: String },
    customFields: { type: Map, of: Schema.Types.Mixed }
}, { _id: false });

/**
 * Main visitor schema definition with GDPR compliance and performance optimizations
 */
const VisitorSchema = new Schema<IVisitor>({
    id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    companyId: {
        type: String,
        required: true,
        ref: 'Company',
        index: true
    },
    email: {
        type: String,
        sparse: true,
        index: true,
        validate: {
            validator: (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
            message: 'Invalid email format'
        }
    },
    name: { type: String },
    phone: { type: String },
    status: {
        type: String,
        required: true,
        enum: Object.values(VISITOR_STATUS),
        default: VISITOR_STATUS.ANONYMOUS,
        index: true
    },
    metadata: {
        type: MetadataSchema,
        required: true
    },
    enrichedData: {
        type: EnrichedDataSchema,
        default: null
    },
    visits: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },
    totalTimeSpent: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    firstSeen: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    lastSeen: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    lastEnriched: {
        type: Date
    },
    isActive: {
        type: Boolean,
        required: true,
        default: false,
        index: true
    },
    tags: {
        type: Map,
        of: Schema.Types.Mixed
    },
    gdprConsent: {
        type: Boolean,
        required: true,
        default: false
    },
    retentionDate: {
        type: Date,
        expires: 0
    }
}, {
    timestamps: true,
    collection: 'visitors',
    versionKey: false,
    strict: true,
    validateBeforeSave: true,
    optimisticConcurrency: true,
    collation: { locale: 'en', strength: 2 },
    compression: { enable: true }
});

// Compound indexes for performance optimization
VisitorSchema.index({ companyId: 1, status: 1 });
VisitorSchema.index({ companyId: 1, lastSeen: -1 });
VisitorSchema.index({ companyId: 1, email: 1 }, { sparse: true });

// Pre-save middleware for data sanitization
VisitorSchema.pre('save', function(next) {
    // Anonymize IP address for GDPR compliance if no consent
    if (!this.gdprConsent && this.metadata?.ipAddress) {
        this.metadata.ipAddress = this.metadata.ipAddress.replace(/\.\d+$/, '.xxx');
    }
    next();
});

// Pre-update middleware for lastSeen timestamp
VisitorSchema.pre('findOneAndUpdate', function(next) {
    this.set({ lastSeen: new Date() });
    next();
});

// Create and export the Visitor model
const VisitorModel = model<IVisitor>('Visitor', VisitorSchema);
export default VisitorModel;