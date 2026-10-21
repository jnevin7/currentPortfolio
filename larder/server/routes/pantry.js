import express from 'express';
import { getPantry, setPantryItem, setFavourite } from '../controllers/pantryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getPantry);
router.patch('/', protect, setPantryItem);
router.patch('/favourite', protect, setFavourite);

export default router;
