const Doctor = require("../models/Doctor");
const { createCrudController } = require("../utils/crudController");

function parseAvailabilityText(value) {
  if (!value || typeof value !== "string") {
    return undefined;
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => {
      const match = item.match(/^(sun|mon|tue|wed|thu|fri|sat)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);

      if (!match) {
        return null;
      }

      return {
        dayOfWeek: match[1],
        startTime: match[2],
        endTime: match[3],
      };
    })
    .filter(Boolean);
}

function buildPayload(body) {
  return {
    fullName: body.fullName?.trim(),
    specialization: body.specialization?.trim(),
    phone: body.phone?.trim(),
    email: body.email?.trim().toLowerCase(),
    room: body.room?.trim(),
    experienceYears: body.experienceYears === undefined || body.experienceYears === "" ? undefined : Number(body.experienceYears),
    sessionFee: body.sessionFee === undefined || body.sessionFee === "" ? undefined : Number(body.sessionFee),
    availability: Array.isArray(body.availability) ? body.availability : parseAvailabilityText(body.availabilityText),
    availabilityStatus: body.availabilityStatus,
    status: body.status,
  };
}

module.exports = createCrudController({
  Model: Doctor,
  resourceName: "Doctor",
  buildPayload,
  queryFields: ["status", "availabilityStatus", "specialization"],
  attachment: {
    urlField: "profileImageUrl",
    nameField: "profileImageName",
    publicIdField: "profileImagePublicId",
    resourceTypeField: "profileImageResourceType",
  },
});
