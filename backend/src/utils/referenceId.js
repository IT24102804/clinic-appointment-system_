function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getNextReferenceNumber(records, prefix) {
  return records.reduce((max, record) => {
    const rawValue = record.referenceId || "";
    const numberPart = rawValue.replace(`${prefix}-`, "");
    const parsed = Number(numberPart);

    return Number.isFinite(parsed) && parsed > max ? parsed : max;
  }, 0) + 1;
}

function addReferenceId(schema, prefix) {
  schema.add({
    referenceId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
  });

  schema.pre("validate", async function assignReferenceId() {
    if (this.referenceId) {
      return;
    }

    const records = await this.constructor
      .find({ referenceId: new RegExp(`^${escapeRegExp(prefix)}-\\d+$`) })
      .select("referenceId")
      .lean();
    const nextNumber = getNextReferenceNumber(records, prefix);
    this.referenceId = `${prefix}-${String(nextNumber).padStart(4, "0")}`;
  });
}

module.exports = {
  addReferenceId,
};
