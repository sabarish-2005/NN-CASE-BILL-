const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const { v4: uuidv4 } = require('uuid');

const connectDB = require('./config/db');
const Bill = require('./models/Bill');
const Customer = require('./models/Customer');
const Product = require('./models/Product');
const Labor = require('./models/Labor');

async function migrate() {
  await connectDB();
  console.log('Connected to MongoDB. Starting migration...');

  const models = [Bill, Customer, Product, Labor];

  for (const Model of models) {
    console.log(`Migrating ${Model.modelName}...`);
    const records = await Model.find({ uuid: { $exists: false } });
    
    let count = 0;
    for (const record of records) {
      record.uuid = uuidv4();
      record.syncStatus = 'synced';
      record.deviceId = 'server';
      
      // Special handling for Labor workRecords
      if (Model.modelName === 'Labor' && record.workRecords) {
        for (const wr of record.workRecords) {
          if (!wr.uuid) wr.uuid = uuidv4();
          wr.syncStatus = 'synced';
          wr.deviceId = 'server';
        }
      }
      
      await record.save({ validateBeforeSave: false }); // Skip validation just in case
      count++;
    }
    console.log(`Migrated ${count} ${Model.modelName} records.`);
  }

  console.log('Migration completed successfully.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
