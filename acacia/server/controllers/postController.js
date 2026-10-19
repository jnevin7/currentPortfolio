import Post from '../models/Post.js';

export const getPosts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content, category } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const post = await Post.create({ author: req.user.username, content, category });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
};

export const reactToPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { reactions: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to react to post' });
  }
};