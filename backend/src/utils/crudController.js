const { deleteCloudinaryFile } = require("../multer/cloudinaryUpload");

function cleanPayload(payload) {
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
}

function applyPopulate(query, populate = []) {
  return populate.reduce((currentQuery, item) => currentQuery.populate(item), query);
}

function findByIdWithPopulate(Model, id, populate) {
  return applyPopulate(Model.findById(id), populate);
}

function createCrudController({
  Model,
  resourceName,
  buildPayload,
  queryFields = [],
  populate = [],
  attachment = {},
}) {
  const lowerName = resourceName.toLowerCase();
  const urlField = attachment.urlField || "attachmentUrl";
  const nameField = attachment.nameField || "attachmentName";
  const publicIdField = attachment.publicIdField || "attachmentPublicId";
  const resourceTypeField = attachment.resourceTypeField || "attachmentResourceType";

  async function list(req, res) {
    const filters = {};

    queryFields.forEach((field) => {
      if (req.query[field]) {
        filters[field] = req.query[field];
      }
    });

    const records = await applyPopulate(Model.find(filters).sort({ createdAt: -1 }), populate).lean();

    return res.status(200).json({
      success: true,
      message: `${resourceName} records retrieved successfully.`,
      data: records,
    });
  }

  async function getById(req, res) {
    const record = await applyPopulate(Model.findById(req.params.id), populate).lean();

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `${resourceName} not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `${resourceName} retrieved successfully.`,
      data: record,
    });
  }

  async function create(req, res) {
    const created = await Model.create(cleanPayload(buildPayload(req.body)));
    const record = await findByIdWithPopulate(Model, created._id, populate).lean();

    return res.status(201).json({
      success: true,
      message: `${resourceName} created successfully.`,
      data: record,
    });
  }

  async function update(req, res) {
    const record = await Model.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `${resourceName} not found.`,
      });
    }

    Object.assign(record, cleanPayload(buildPayload(req.body)));
    await record.save();

    const updated = await findByIdWithPopulate(Model, record._id, populate).lean();

    return res.status(200).json({
      success: true,
      message: `${resourceName} updated successfully.`,
      data: updated,
    });
  }

  async function remove(req, res) {
    const record = await Model.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `${resourceName} not found.`,
      });
    }

    if (record[publicIdField]) {
      await deleteCloudinaryFile(record[publicIdField], record[resourceTypeField]);
    }

    await record.deleteOne();

    return res.status(200).json({
      success: true,
      message: `${resourceName} deleted successfully.`,
      data: { id: req.params.id },
    });
  }

  async function uploadAttachment(req, res) {
    const record = await Model.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `${resourceName} not found.`,
      });
    }

    if (!req.uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "An attachment file is required.",
      });
    }

    if (record[publicIdField]) {
      await deleteCloudinaryFile(record[publicIdField], record[resourceTypeField]);
    }

    record[urlField] = req.uploadedFile.url;
    record[nameField] = req.uploadedFile.originalName;
    record[publicIdField] = req.uploadedFile.publicId;
    record[resourceTypeField] = req.uploadedFile.resourceType;
    await record.save();

    const updated = await findByIdWithPopulate(Model, record._id, populate).lean();

    return res.status(200).json({
      success: true,
      message: `${resourceName} attachment uploaded successfully.`,
      data: updated,
    });
  }

  async function deleteAttachment(req, res) {
    const record = await Model.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `${resourceName} not found.`,
      });
    }

    if (!record[urlField]) {
      return res.status(404).json({
        success: false,
        message: `${resourceName} attachment not found.`,
      });
    }

    await deleteCloudinaryFile(record[publicIdField], record[resourceTypeField]);

    record[urlField] = "";
    record[nameField] = "";
    record[publicIdField] = "";
    record[resourceTypeField] = "";
    await record.save();

    const updated = await findByIdWithPopulate(Model, record._id, populate).lean();

    return res.status(200).json({
      success: true,
      message: `${resourceName} attachment removed successfully.`,
      data: updated,
    });
  }

  return {
    list,
    getById,
    create,
    update,
    remove,
    uploadAttachment,
    deleteAttachment,
  };
}

module.exports = {
  createCrudController,
};
