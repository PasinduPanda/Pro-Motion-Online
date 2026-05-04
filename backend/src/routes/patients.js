const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  async (req, res) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } }
            ]
          }
        : {};

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.patient.count({ where })
      ]);

      res.json({ patients, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  }
);

router.get('/:id', async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        medicalHistory: true,
        treatments: {
          include: {
            therapist: { select: { name: true } },
            sessions: {
              include: {
                therapist: { select: { name: true } },
                sessionExercises: { include: { exercise: true } }
              }
            }
          }
        },
        appointments: {
          include: {
            therapist: { select: { name: true } }
          },
          orderBy: { dateTime: 'desc' }
        },
        invoices: {
          include: {
            payments: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

router.post(
  '/',
  authorize('admin', 'receptionist', 'therapist'),
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('phone').notEmpty().withMessage('Phone is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { fullName, dateOfBirth, gender, phone, address, emergencyContact, conditions, allergies, pastInjuries, notes } = req.body;

      const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();

      const patient = await prisma.patient.create({
        data: {
          fullName,
          dateOfBirth: new Date(dateOfBirth),
          age,
          gender,
          phone,
          address,
          emergencyContact,
          medicalHistory: {
            create: {
              conditions,
              allergies,
              pastInjuries,
              notes
            }
          }
        },
        include: { medicalHistory: true }
      });

      res.status(201).json(patient);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create patient' });
    }
  }
);

router.put('/:id', authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { fullName, dateOfBirth, gender, phone, address, emergencyContact } = req.body;

    let data = { fullName, phone, address, emergencyContact };

    if (dateOfBirth) {
      data.dateOfBirth = new Date(dateOfBirth);
      data.age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
    }

    if (gender) data.gender = gender;

    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data
    });

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await prisma.patient.delete({ where: { id: req.params.id } });
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

router.put(
  '/:id/medical-history',
  authorize('admin', 'therapist'),
  async (req, res) => {
    try {
      const { conditions, allergies, pastInjuries, notes } = req.body;

      const medicalHistory = await prisma.medicalHistory.upsert({
        where: { patientId: req.params.id },
        create: {
          patientId: req.params.id,
          conditions,
          allergies,
          pastInjuries,
          notes
        },
        update: {
          conditions,
          allergies,
          pastInjuries,
          notes
        }
      });

      res.json(medicalHistory);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update medical history' });
    }
  }
);

module.exports = router;