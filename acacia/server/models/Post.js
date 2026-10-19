import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 280
  },
  category: {
    type: String,
    enum: ['general', 'news', 'question'],
    default: 'general'
  },
  reactions: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('Post', postSchema);