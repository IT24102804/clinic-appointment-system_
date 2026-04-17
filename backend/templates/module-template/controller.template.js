const TODO_MODEL = require("../models/TODO_MODEL_FILE");

async function listEntities(req, res) {
  const records = await TODO_MODEL.find().sort({ createdAt: -1 }).lean();

  return res.status(200).json({
    success: true,
    message: "Records retrieved successfully.",
    data: records,
  });
}

async function getEntity(req, res) {
  const record = await TODO_MODEL.findById(req.params.id).lean();

  if (!record) {
    return res.status(404).json({
      success: false,
      message: "Record not found.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Record retrieved successfully.",
    data: record,
  });
}

async function createEntity(req, res) {
  const record = await TODO_MODEL.create(req.body);

  return res.status(201).json({
    success: true,
    message: "Record created successfully.",
    data: record,
  });
}

async function updateEntity(req, res) {
  const record = await TODO_MODEL.findById(req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: "Record not found.",
    });
  }

  Object.assign(record, req.body);
  await record.save();

  return res.status(200).json({
    success: true,
    message: "Record updated successfully.",
    data: record,
  });
}

async function deleteEntity(req, res) {
  const record = await TODO_MODEL.findById(req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: "Record not found.",
    });
  }

  await record.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Record deleted successfully.",
    data: { id: req.params.id },
  });
}

module.exports = {
  createEntity,
  deleteEntity,
  getEntity,
  listEntities,
  updateEntity,
};
