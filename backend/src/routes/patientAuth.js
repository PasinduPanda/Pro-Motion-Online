const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get current patient profile - This is handled by the route below

router.post('/register', [
  body('fullName').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
  body('gender').notEmpty().withMessage('Gender is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, phone, dateOfBirth, gender, address, emergencyContact, email } = req.body;

    const existingPatient = await prisma.patient.findFirst({ 
      where: { phone } 
    });
    if (existingPatient) {
      return res.status(400).json({ error: 'Patient already exists with this phone number' });
    }

    const patientId = 'PT' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(pin, 10);
    const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();

    const patient = await prisma.patient.create({
      data: {
        patientId,
        fullName,
        phone,
        dateOfBirth: new Date(dateOfBirth),
        age,
        gender,
        address,
        emergencyContact,
        email,
        pin: hashedPin
      }
    });

    res.status(201).json({
      message: 'Patient registered successfully',
      patient: { 
        id: patient.id,
        patientId: patient.patientId,
        fullName: patient.fullName, 
        phone: patient.phone,
        pin: pin 
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register patient' });
  }
});

router.post('/login', [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('phone').notEmpty().withMessage('Phone is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientId, phone } = req.body;

    const patient = await prisma.patient.findFirst({ 
      where: { patientId, phone } 
    });
    
    if (!patient) {
      return res.status(401).json({ error: 'Invalid Patient ID or Phone number' });
    }

    const token = jwt.sign(
      { userId: patient.id, role: 'patient', patientId: patient.patientId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      patient: { 
        id: patient.id, 
        patientId: patient.patientId,
        fullName: patient.fullName, 
        phone: patient.phone,
        email: patient.email,
        role: 'patient' 
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

router.post('/reset-pin', [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('phone').notEmpty().withMessage('Phone is required')
], async (req, res) => {
  try {
    const { patientId, phone } = req.body;

    const patient = await prisma.patient.findFirst({ 
      where: { patientId, phone } 
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(newPin, 10);

    await prisma.patient.update({
      where: { id: patient.id },
      data: { pin: hashedPin }
    });

    res.json({ 
      message: 'PIN reset successful',
      newPin: newPin,
      patientId: patient.patientId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset PIN' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Not a patient account' });
    }
    
    const patient = await prisma.patient.findUnique({
      where: { id: req.user.id },
      include: {
        medicalHistory: true,
        treatments: { 
          include: { 
            sessions: true, 
            therapist: { select: { name: true } } 
          } 
        },
        appointments: { orderBy: { dateTime: 'desc' }, take: 10 },
        invoices: { include: { payments: true }, orderBy: { createdAt: 'desc' }, take: 10 },
        reports: { orderBy: { uploadedAt: 'desc' } }
      }
    });

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient data' });
  }
});

router.get('/treatments', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Not a patient account' });
    }

    const treatments = await prisma.treatment.findMany({
      where: { patientId: req.user.id },
      include: {
        therapist: { select: { name: true } },
        sessions: {
          include: { sessionExercises: { include: { exercise: true } } },
          orderBy: { sessionDate: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(treatments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch treatments' });
  }
});

router.get('/exercises', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Not a patient account' });
    }

    const treatments = await prisma.treatment.findMany({
      where: { patientId: req.user.id, status: 'active' },
      include: {
        sessions: {
          include: { sessionExercises: { include: { exercise: true } } }
        }
      }
    });

    const exercises = [];
    treatments.forEach(t => {
      t.sessions.forEach(s => {
        s.sessionExercises.forEach(se => {
          exercises.push({ 
            id: se.exercise.id,
            name: se.exercise.name,
            description: se.exercise.description,
            sets: se.sets,
            reps: se.reps,
            videoUrl: se.exercise.videoUrl,
            sessionDate: s.sessionDate
          });
        });
      });
    });

    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

router.get('/appointments', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Not a patient account' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: req.user.id },
      include: { therapist: { select: { name: true } } },
      orderBy: { dateTime: 'desc' }
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/invoices', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Not a patient account' });
    }

    const invoices = await prisma.invoice.findMany({
      where: { patientId: req.user.id },
      include: { payments: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.get('/reports', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Not a patient account' });
    }

    const reports = await prisma.patientReport.findMany({
      where: { patientId: req.user.id },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.put('/update-profile', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Not a patient account' });
    }

    const { email, address, emergencyContact } = req.body;
    
    const patient = await prisma.patient.update({
      where: { id: req.user.id },
      data: { email, address, emergencyContact }
    });

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;