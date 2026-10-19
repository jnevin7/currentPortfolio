import express from 'express';
import { searchRecipes, getRecipe } from '../controllers/recipeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', protect, searchRecipes);
router.get('/:id', protect, getRecipe);

export default router;
