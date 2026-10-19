import express from 'express';
import { getPantry, setPantryItem } from '../controllers/pantryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getPantry);
router.patch('/', protect, setPantryItem);

export default router;
