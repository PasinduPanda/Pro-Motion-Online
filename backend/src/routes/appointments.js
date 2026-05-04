const express = require('express');
const { body, validationResult, query } = require('express-validator');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { date, status, therapistId } = req.query;
    const where = {};

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.dateTime = { gte: startDate, lt: endDate };
    }
    if (status) where.status = status;
    if (therapistId) where.therapistId = therapistId;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        therapist: { select: { id: true, name: true } }
      },
      orderBy: { dateTime: 'asc' }
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        dateTime: { gte: today, lt: tomorrow },
        status: 'booked'
      },
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        therapist: { select: { id: true, name: true } }
      },
      orderBy: { dateTime: 'asc' }
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today\'s appointments' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        therapist: { select: { id: true, name: true, email: true } }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

router.post(
  '/',
  authorize('admin', 'receptionist'),
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('therapistId').notEmpty().withMessage('Therapist ID is required'),
    body('dateTime').isISO8601().withMessage('Valid date/time is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { patientId, therapistId, dateTime, notes } = req.body;

      const appointment = await prisma.appointment.create({
        data: {
          patientId,
          therapistId,
          dateTime: new Date(dateTime),
          notes
        },
        include: {
          patient: { select: { id: true, fullName: true, phone: true } },
          therapist: { select: { id: true, name: true } }
        }
      });

      res.status(201).json(appointment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  }
);

router.put('/:id', authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const { patientId, therapistId, dateTime, status, notes } = req.body;

    const data = {};
    if (patientId) data.patientId = patientId;
    if (therapistId) data.therapistId = therapistId;
    if (dateTime) data.dateTime = new Date(dateTime);
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data,
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        therapist: { select: { id: true, name: true } }
      }
    });

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

module.exports = router;