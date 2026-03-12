import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  id: string; // The original ID from CSV or generated universally unique identifier
  name: string;
  company: string;
  role: string;
  email: string;
  notes: string;
  attributes: Map<string, string>;
  created_at: Date;
}

const ContactSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, index: true },
  company: { type: String, required: false, index: true },
  role: { type: String, required: false },
  email: { type: String, required: false, index: true },
  notes: { type: String, required: false },
  attributes: {
    type: Map,
    of: String,
    default: {}
  },
  created_at: { type: Date, default: Date.now }
}, {
  id: false
});

// Regular indexes for aggregation performance (sorting and grouping)
ContactSchema.index({ role: 1 });

// Create text indexes on structured data and specific arbitrary fields if needed
// This supports the core search requirement for AI retrieval
ContactSchema.index({ name: 'text', company: 'text', role: 'text', email: 'text' });

export default mongoose.model<IContact>('Contact', ContactSchema);
