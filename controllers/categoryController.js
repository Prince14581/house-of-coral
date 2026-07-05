const Category = require('../models/Category');

// Fetch the full tree structure
exports.getCategoryTree = async (req, res) => {
  try {
    const { pillar } = req.params;
    const categories = await Category.find({ pillar, isActive: true });
    
    // Simple helper to build tree
    const buildTree = (cats, parentId = null) => {
      return cats
        .filter(c => String(c.parentId) === String(parentId))
        .map(c => ({
          ...c.toObject(),
          children: buildTree(cats, c._id)
        }));
    };
    
    res.status(200).json(buildTree(categories));
  } catch (err) {
    res.status(500).json({ error: 'Failed to build category tree' });
  }
};

// Admin/System: Add category
exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: 'Category creation failed' });
  }
};
