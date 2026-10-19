import express from 'express';
import { getPosts, createPost, reactToPost } from '../controllers/postController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPosts);
router.post('/', protect, createPost);
router.patch('/:id/react', protect, reactToPost);

export default router;