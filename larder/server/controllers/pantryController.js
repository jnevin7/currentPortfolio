import PantryItem from '../models/PantryItem.js';

// GET /api/pantry — the user's whole pantry, as a flat array of
// { name, have, favourite }. The client turns this into a lookup map once
// and uses it to pre-tick any recipe's ingredient list.
export const getPantry = async (req, res) => {
  try {
    const items = await PantryItem.find({ userId: req.user.id }).select('name have favourite -_id');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pantry' });
  }
};

// PATCH /api/pantry — upsert a single ingredient's have/don't-have state.
// This is called both when ticking a box on a recipe's ingredient list
// (have: true) and when unticking one because you've run out (have: false)
// — either way it's remembered for every future recipe that calls for the
// same ingredient.
export const setPantryItem = async (req, res) => {
  try {
    const { name, have } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Ingredient name is required' });
    }
    if (typeof have !== 'boolean') {
      return res.status(400).json({ error: 'have must be a boolean' });
    }

    const normalized = name.trim().toLowerCase();
    if (!normalized) {
      return res.status(400).json({ error: 'Ingredient name is required' });
    }

    const item = await PantryItem.findOneAndUpdate(
      { userId: req.user.id, name: normalized },
      { have },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ name: item.name, have: item.have });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pantry' });
  }
};

// PATCH /api/pantry/favourite — star or unstar an ingredient as a
// favourite. This is independent of `have`: you might favourite "garlic"
// because you love cooking with it, long before you've ticked it as
// something you currently have in stock. If this is the very first time
// we've seen this ingredient for this user, it's created with have:false
// rather than letting the schema default (true) apply — favouriting
// something is not the same as claiming you own it.
export const setFavourite = async (req, res) => {
  try {
    const { name, favourite } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Ingredient name is required' });
    }
    if (typeof favourite !== 'boolean') {
      return res.status(400).json({ error: 'favourite must be a boolean' });
    }

    const normalized = name.trim().toLowerCase();
    if (!normalized) {
      return res.status(400).json({ error: 'Ingredient name is required' });
    }

    const item = await PantryItem.findOneAndUpdate(
      { userId: req.user.id, name: normalized },
      { $set: { favourite }, $setOnInsert: { have: false } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ name: item.name, have: item.have, favourite: item.favourite });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update favourite' });
  }
};
