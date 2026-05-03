const NIC_PATTERN = /^([0-9]{9}[VXvx]|[0-9]{12})$/;
const PHONE_PATTERN = /^(?:\+94|0)[0-9]{9}$/;
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

function normalizeTimeToMinutes(value) {
  if (!TIME_PATTERN.test(String(value))) {
    return null;
  }

  const [hours, minutes] = String(value).split(":").map(Number);
  return hours * 60 + minutes;
}

function isEndTimeAfterStartTime(value, { req, path }) {
  const indexMatch = path.match(/^availability\.(\d+)\.endTime$/);
  const index = indexMatch ? Number(indexMatch[1]) : null;
  const availabilityItem = Number.isInteger(index) ? req.body.availability?.[index] : null;
  const startMinutes = normalizeTimeToMinutes(availabilityItem?.startTime);
  const endMinutes = normalizeTimeToMinutes(value);

  if (startMinutes === null || endMinutes === null) {
    return true;
  }

  return endMinutes > startMinutes;
}

function calculateAge(dateValue) {
  const birthDate = new Date(dateValue);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function isAtLeastAge(minAge) {
  return (value) => {
    const age = calculateAge(value);
    return age !== null && age >= minAge;
  };
}

module.exports = {
  calculateAge,
  isAtLeastAge,
  isEndTimeAfterStartTime,
  NIC_PATTERN,
  PHONE_PATTERN,
  STRONG_PASSWORD_PATTERN,
  TIME_PATTERN,
};
