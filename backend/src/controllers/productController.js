const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
  const { search, category } = req.query;
  const query = { createdBy: req.user.id, isActive: true };
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  const products = await Product.find(query).sort({ category: 1, name: 1 });
  res.json({ success: true, products });
};

exports.getProduct = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, createdBy: req.user.id });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
};

exports.createProduct = async (req, res) => {
  const product = await Product.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, product });
};

exports.updateProduct = async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    req.body, { new: true }
  );
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
};

exports.deleteProduct = async (req, res) => {
  await Product.findOneAndUpdate({ _id: req.params.id, createdBy: req.user.id }, { isActive: false });
  res.json({ success: true, message: 'Product deactivated' });
};
