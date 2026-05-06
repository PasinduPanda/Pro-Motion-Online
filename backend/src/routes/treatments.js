const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `diagnosis-${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { patientId, status } = req.query;
    const where = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const treatments = await prisma.treatment.findMany({
      where,
      include: {
        patient: true,
        therapist: { select: { id: true, name: true, email: true } },
        _count: { select: { sessions: true } },
        treatmentExercises: {
          include: { exercise: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(treatments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch treatments' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const treatment = await prisma.treatment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        therapist: { select: { id: true, name: true, email: true } },
        sessions: {
          orderBy: { sessionDate: 'desc' }
        },
        treatmentExercises: {
          include: { exercise: true }
        }
      }
    });

    if (!treatment) {
      return res.status(404).json({ error: 'Treatment not found' });
    }

    res.json(treatment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch treatment' });
  }
});

router.post(
  '/',
  authorize('admin', 'therapist'),
  upload.single('diagnosisImage'),
  async (req, res) => {
    try {
      const { patientId, diagnosis, treatmentPlan, startDate, endDate, status, exercises } = req.body;

      const treatmentData = {
        patientId,
        therapistId: req.user.id,
        diagnosis,
        treatmentPlan,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'active'
      };

      if (req.file) {
        treatmentData.diagnosisImage = `/uploads/${req.file.filename}`;
      }

      if (exercises) {
        const parsedExercises = JSON.parse(exercises);
        if (parsedExercises.length > 0) {
          treatmentData.treatmentExercises = {
            create: parsedExercises.map(ex => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps
            }))
          };
        }
      }

      const treatment = await prisma.treatment.create({
        data: treatmentData,
        include: {
          patient: true,
          therapist: { select: { id: true, name: true } },
          treatmentExercises: { include: { exercise: true } }
        }
      });

      res.status(201).json(treatment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create treatment' });
    }
  }
);

router.put('/:id', authorize('admin', 'therapist'), upload.single('diagnosisImage'), async (req, res) => {
  try {
    const { diagnosis, treatmentPlan, startDate, endDate, status, exercises } = req.body;

    const data = {};
    if (diagnosis) data.diagnosis = diagnosis;
    if (treatmentPlan) data.treatmentPlan = treatmentPlan;
    if (startDate) data.startDate = new Date(startDate);
    if (endDate) data.endDate = new Date(endDate);
    if (status) data.status = status;

    if (req.file) {
      data.diagnosisImage = `/uploads/${req.file.filename}`;
    }

    if (exercises) {
      const parsedExercises = typeof exercises === 'string' ? JSON.parse(exercises) : exercises;
      await prisma.treatmentExercise.deleteMany({ where: { treatmentId: req.params.id } });
      if (parsedExercises.length > 0) {
        data.treatmentExercises = {
          create: parsedExercises.map(ex => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps
          }))
        };
      }
    }

    const treatment = await prisma.treatment.update({
      where: { id: req.params.id },
      data,
      include: {
        treatmentExercises: { include: { exercise: true } }
      }
    });

    res.json(treatment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update treatment' });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await prisma.treatment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Treatment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete treatment' });
  }
});

module.exports = router;