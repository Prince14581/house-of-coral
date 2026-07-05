const Product = require('../models/Product');
const JubileeEvent = require('../models/JubileeEvent');

exports.searchUnified = async (req, res) => {
  const { query, category, minPrice, maxPrice, type } = req.query;

  try {
    let results = [];
    
    // Search in Bazaar (Products)
    if (!type || type === 'bazaar') {
      const productQuery = {
        itemName: { $regex: query || '', $options: 'i' },
        ...(category && { category }),
        ...(minPrice && { price: { $gte: parseFloat(minPrice) } }),
        ...(maxPrice && { price: { $lte: parseFloat(maxPrice) } })
      };
      const products = await Product.find(productQuery).limit(20);
      results.push(...products.map(p => ({ ...p.toObject(), type: 'bazaar' })));
    }

    // Search in Jubilee (Events)
    if (!type || type === 'jubilee') {
      const eventQuery = {
        title: { $regex: query || '', $options: 'i' }
      };
      const events = await JubileeEvent.find(eventQuery).limit(20);
      results.push(...events.map(e => ({ ...e.toObject(), type: 'jubilee' })));
    }

    res.status(200).json({ count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ error: 'Search engine failure' });
  }
};
