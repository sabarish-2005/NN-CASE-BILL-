const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Labor = require('../models/Labor');

const models = {
  bill: Bill,
  customer: Customer,
  product: Product,
  labor: Labor,
};

exports.processSync = async (req, res) => {
  const { operations, lastSyncTimestamp, deviceId } = req.body;
  const userId = req.user.id;

  const applied = [];
  const conflicts = [];
  const errors = [];

  // 1. Process incoming operations
  if (operations && Array.isArray(operations)) {
    for (const op of operations) {
      try {
        const { id, entityType, entityUuid, operation, payloadJson, createdAt } = op;
        const Model = models[entityType];
        
        // Special case for work_record (part of Labor)
        if (entityType === 'work_record') {
            await processWorkRecordOp(op, userId, applied, conflicts, errors);
            continue;
        }

        if (!Model) {
          errors.push({ id, message: `Unknown entityType: ${entityType}` });
          continue;
        }

        const payload = JSON.parse(payloadJson);
        const existing = await Model.findOne({ uuid: entityUuid });

        if (operation === 'create') {
          if (existing) {
            // Already exists, treat as update if newer
            if (new Date(payload.updatedAt) > new Date(existing.updatedAt)) {
              await updateEntity(Model, existing, payload, userId, deviceId);
              applied.push(id);
            } else {
              // Ignore, client has older data
              applied.push(id); // Ack it so client removes from queue
            }
          } else {
            // Create
            payload.createdBy = userId;
            payload.deviceId = deviceId;
            payload.syncStatus = 'synced';
            await Model.create(payload);
            applied.push(id);
          }
        } else if (operation === 'update') {
          if (!existing) {
            // Treat as create
            payload.createdBy = userId;
            payload.deviceId = deviceId;
            payload.syncStatus = 'synced';
            await Model.create(payload);
            applied.push(id);
          } else {
            // Conflict check
            if (entityType === 'bill' && existing.status === 'final' && existing.deviceId !== deviceId) {
               // Flag conflict on finalized bills edited on multiple devices
               existing.syncStatus = 'conflict';
               await existing.save();
               conflicts.push({ uuid: entityUuid, entityType });
               applied.push(id); // We handled it
            } else if (new Date(payload.updatedAt) > new Date(existing.updatedAt)) {
              await updateEntity(Model, existing, payload, userId, deviceId);
              applied.push(id);
            } else {
              applied.push(id); // Ack
            }
          }
        } else if (operation === 'delete') {
          if (existing && new Date(payload.deletedAt) > new Date(existing.updatedAt)) {
            existing.deletedAt = new Date(payload.deletedAt);
            existing.syncStatus = 'synced';
            existing.deviceId = deviceId;
            await existing.save();
            applied.push(id);
          } else {
             applied.push(id); // Ack
          }
        }
      } catch (err) {
        errors.push({ id: op.id, message: err.message });
      }
    }
  }

  // 2. Pull updates since lastSyncTimestamp
  const serverUpdates = {};
  const queryTime = lastSyncTimestamp ? new Date(lastSyncTimestamp) : new Date(0);

  for (const [key, Model] of Object.entries(models)) {
    const records = await Model.find({
      createdBy: userId,
      updatedAt: { $gt: queryTime }
    });
    serverUpdates[key] = records;
  }

  res.json({
    success: true,
    applied,
    conflicts,
    errors,
    serverUpdates,
    serverTimestamp: new Date().toISOString()
  });
};

async function updateEntity(Model, existing, payload, userId, deviceId) {
  // Strip immutable or restricted fields
  delete payload._id;
  delete payload.uuid;
  
  Object.assign(existing, payload);
  existing.syncStatus = 'synced';
  existing.deviceId = deviceId;
  existing.updatedBy = userId;
  await existing.save();
}

async function processWorkRecordOp(op, userId, applied, conflicts, errors) {
    const { id, entityUuid, operation, payloadJson, createdAt } = op;
    const payload = JSON.parse(payloadJson);
    const labor = await Labor.findOne({ uuid: payload.laborUuid });
    
    if (!labor) {
        // Can't apply work record without labor. Might arrive out of order?
        // We could just record error, client will retry.
        errors.push({ id, message: 'Labor parent not found' });
        return;
    }

    const existingRecord = labor.workRecords.find(r => r.uuid === entityUuid);

    if (operation === 'create' || operation === 'update') {
        if (existingRecord) {
             if (new Date(payload.updatedAt) > new Date(existingRecord.updatedAt || 0)) {
                 Object.assign(existingRecord, payload);
                 existingRecord.syncStatus = 'synced';
                 existingRecord.deviceId = payload.deviceId;
             }
        } else {
             payload.syncStatus = 'synced';
             labor.workRecords.push(payload);
        }
        await labor.save();
        applied.push(id);
    } else if (operation === 'delete') {
        if (existingRecord) {
             existingRecord.deletedAt = payload.deletedAt;
             existingRecord.syncStatus = 'synced';
             await labor.save();
        }
        applied.push(id);
    }
}
