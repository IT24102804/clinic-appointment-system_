const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const User = require('../models/User');

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ------------------ ADMIN: List all patients (with optional search) ------------------
// Search matches NIC, phone, firstName, or lastName (case-insensitive, partial).
exports.listAllPatients = async (req, res) => {
  try {
    const rawSearch = String(req.query.search || '').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ];

    if (rawSearch) {
      const safe = escapeRegExp(rawSearch);
      const regex = new RegExp(safe, 'i');
      pipeline.push({
        $match: {
          $or: [
            { NIC: regex },
            { phone: regex },
            { 'user.firstName': regex },
            { 'user.lastName': regex },
            {
              $expr: {
                $regexMatch: {
                  input: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
                  regex: safe,
                  options: 'i',
                },
              },
            },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          NIC: 1,
          phone: 1,
          gender: 1,
          dateOfBirth: 1,
          address: 1,
          createdAt: 1,
          user: {
            _id: '$user._id',
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            email: '$user.email',
            status: '$user.status',
          },
        },
      },
    );

    const patients = await Patient.aggregate(pipeline);
    res.json({ success: true, data: patients, count: patients.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ ADMIN: Get single patient by id ------------------
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid patient id' });
    }

    const patient = await Patient.findById(id).populate('userId', 'firstName lastName email status role');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ Get logged-in patient's profile ------------------
exports.getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id }).populate('userId', 'firstName lastName email');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ Update logged-in patient's profile ------------------
exports.updateMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id }).populate('userId', 'firstName lastName email');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    const { phone, gender, address, additionalAddresses, emergencyContact } = req.body;

    const normalizePhone10 = (value) => String(value || '').replace(/\D/g, '');
    const isPhone10 = (value) => /^\d{10}$/.test(normalizePhone10(value));

    if (phone !== undefined) {
      const cleaned = normalizePhone10(phone);
      if (!/^\d{10}$/.test(cleaned)) {
        return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });
      }
      patient.phone = cleaned;
    }

    if (gender !== undefined) {
      patient.gender = gender;
    }

    if (address !== undefined) {
      patient.address = String(address).trim();
    }

    if (additionalAddresses !== undefined) {
      if (!Array.isArray(additionalAddresses)) {
        return res.status(400).json({ success: false, message: 'additionalAddresses must be an array' });
      }

      if (additionalAddresses.length > 3) {
        return res.status(400).json({ success: false, message: 'You can add up to 3 additional addresses.' });
      }

      patient.additionalAddresses = additionalAddresses
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          if (!item.line || !String(item.line).trim()) {
            const error = new Error('Each additional address must include an address line.');
            error.statusCode = 400;
            throw error;
          }

          return {
            _id: item._id,
            label: item.label,
            line: item.line,
          };
        });
    }

    if (emergencyContact !== undefined) {
      if (emergencyContact === null) {
        patient.emergencyContact = null;
      } else if (typeof emergencyContact === 'object' && emergencyContact) {
        const name = String(emergencyContact.name || '').trim();
        const phone = normalizePhone10(emergencyContact.phone);
        const relationship = String(emergencyContact.relationship || '').trim();

        if (!name || !phone || !relationship) {
          return res.status(400).json({
            success: false,
            message: 'Emergency contact must include name, phone, and relationship.',
          });
        }

        if (!isPhone10(phone)) {
          return res.status(400).json({
            success: false,
            message: 'Emergency contact phone must be exactly 10 digits',
          });
        }

        patient.emergencyContact = {
          name,
          phone,
          relationship,
        };
      } else {
        return res.status(400).json({ success: false, message: 'emergencyContact must be an object or null' });
      }
    }

    await patient.save();
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ Delete one additional address ------------------
exports.deleteMyAdditionalAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findOne({ userId: req.user.id }).populate('userId', 'firstName lastName email');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    const before = patient.additionalAddresses.length;
    patient.additionalAddresses = patient.additionalAddresses.filter((address) => String(address._id) !== String(id));
    const after = patient.additionalAddresses.length;

    if (before === after) {
      return res.status(404).json({ success: false, message: 'Additional address not found' });
    }

    await patient.save();
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ Delete emergency contact ------------------
// Truly removes the emergencyContact field from the patient document in MongoDB
// (using $unset), not just setting it to null.
exports.deleteMyEmergencyContact = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    await Patient.updateOne(
      { _id: patient._id },
      { $unset: { emergencyContact: '' } }
    );

    const updated = await Patient.findById(patient._id).populate('userId', 'firstName lastName email');
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};