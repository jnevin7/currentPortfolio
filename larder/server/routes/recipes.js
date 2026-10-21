import express from 'express';
import { searchRecipes, getRecipe, getRandomRecipes, getSuggestions } from '../controllers/recipeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Literal routes must come before the /:id catch-all, or Express would try
// to match "random"/"suggestions" as a recipe id.
router.get('/search', protect, searchRecipes);
router.get('/random', protect, getRandomRecipes);
router.get('/suggestions', protect, getSuggestions);
router.get('/:id', protect, getRecipe);

export default router;
