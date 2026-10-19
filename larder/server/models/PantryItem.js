import mongoose from 'mongoose';

// One row per (user, ingredient). `have` is a real tri-state in practice:
// no document at all means "unknown / never asked", true means "I have
// this", false means "I don't have this" (e.g. they ran out and manually
// unticked it). Absence is NOT the same as false — a recipe calling for an
// ingredient we've never seen before should show up unticked, not as a
// confident "you don't have this".
const pantryItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // Normalized (lowercase, trimmed) ingredient name — this is what recipe
  // ingredients get matched against, so the normalization has to be
  // applied consistently everywhere this is written or read.
  name: { type: String, required: true, trim: true, lowercase: true },
  have: { type: Boolean, required: true, default: true },
}, { timestamps: true });

pantryItemSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('PantryItem', pantryItemSchema);
