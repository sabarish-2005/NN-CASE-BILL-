require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

async function seed() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  }

  let user = await User.findOne({ email: 'sabarish@nn.com' });
  if (user) {
    console.log('✓ Admin user already exists');
    return user;
  }

  user = await User.create({
    name: 'Sabarish',
    email: 'sabarish@nn.com',
    password: 'sabarish123',
    role: 'admin',
    settings: {
      accountNo: '45172475098',
      ifsc: 'SBIN0071059',
    },
  });
  console.log('✓ Admin user created  email: sabarish@nn.com  password: sabarish123');

  await Customer.deleteMany({ createdBy: user._id });
  await Customer.insertMany([
    { name: 'Sri Murugan Plastics', phone: '9876543210', addr: '45, Gandhi Road, Coimbatore', city: 'Coimbatore', pincode: '641001', createdBy: user._id },
    { name: 'Kaveri Agro Industries', phone: '9087654321', addr: '12, Industrial Area, Tiruppur', city: 'Tiruppur', pincode: '641604', gstin: '33AABCK1234F1ZV', createdBy: user._id },
    { name: 'Lakshmi Grow Bags', phone: '9543210987', addr: '78, Market Street, Erode', city: 'Erode', pincode: '638001', createdBy: user._id },
    { name: 'Murugan Nursery', phone: '9111222333', addr: 'Near Bus Stand, Salem', city: 'Salem', pincode: '636001', createdBy: user._id },
    { name: 'Green World Farms', phone: '9222333444', addr: '15, Ring Road, Coimbatore', city: 'Coimbatore', pincode: '641018', createdBy: user._id },
  ]);
  console.log('✓ 5 customers seeded');

  await Product.deleteMany({ createdBy: user._id });
  await Product.insertMany([
    { name: 'Grow Bag (12"×12")', hsn: '3923', unit: 'Nos', rate: 1.5, gstRate: 12, category: 'Grow Bag', createdBy: user._id },
    { name: 'Grow Bag (18"×18")', hsn: '3923', unit: 'Nos', rate: 2.2, gstRate: 12, category: 'Grow Bag', createdBy: user._id },
    { name: 'Grow Bag (24"×24")', hsn: '3923', unit: 'Nos', rate: 3.5, gstRate: 12, category: 'Grow Bag', createdBy: user._id },
    { name: 'Grow Bag (36"×36")', hsn: '3923', unit: 'Nos', rate: 5.0, gstRate: 12, category: 'Grow Bag', createdBy: user._id },
    { name: 'Grow Bag (48"×48")', hsn: '3923', unit: 'Nos', rate: 8.0, gstRate: 12, category: 'Grow Bag', createdBy: user._id },
    { name: 'Open Top Cover (Small)', hsn: '3923', unit: 'Nos', rate: 1.8, gstRate: 12, category: 'Open Top Cover', createdBy: user._id },
    { name: 'Open Top Cover (Medium)', hsn: '3923', unit: 'Nos', rate: 2.5, gstRate: 12, category: 'Open Top Cover', createdBy: user._id },
    { name: 'Open Top Cover (Large)', hsn: '3923', unit: 'Nos', rate: 2.8, gstRate: 12, category: 'Open Top Cover', createdBy: user._id },
    { name: 'Cutting Charges (Per Hour)', hsn: '9988', unit: 'Hour', rate: 500.0, gstRate: 18, category: 'Cutting', createdBy: user._id },
    { name: 'Labour Charges (Per Piece)', hsn: '9988', unit: 'Nos', rate: 0.5, gstRate: 18, category: 'Labour', createdBy: user._id },
    { name: 'Job Work Charges', hsn: '9988', unit: 'Nos', rate: 1.0, gstRate: 18, category: 'Other', createdBy: user._id },
  ]);
  console.log('✓ 11 products seeded');
  console.log('\n🚀 Seed complete! Login: sabarish@nn.com / sabarish123');

  return user;
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = seed;
