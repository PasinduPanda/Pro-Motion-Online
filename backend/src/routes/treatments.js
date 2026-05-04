const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

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
        _count: { select: { sessions: true } }
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
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
    body('treatmentPlan').notEmpty().withMessage('Treatment plan is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { patientId, diagnosis, treatmentPlan, startDate, endDate, status } = req.body;

      const treatment = await prisma.treatment.create({
        data: {
          patientId,
          therapistId: req.user.id,
          diagnosis,
          treatmentPlan,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          status: status || 'active'
        },
        include: {
          patient: true,
          therapist: { select: { id: true, name: true } }
        }
      });

      res.status(201).json(treatment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create treatment' });
    }
  }
);

router.put('/:id', authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { diagnosis, treatmentPlan, startDate, endDate, status } = req.body;

    const data = {};
    if (diagnosis) data.diagnosis = diagnosis;
    if (treatmentPlan) data.treatmentPlan = treatmentPlan;
    if (startDate) data.startDate = new Date(startDate);
    if (endDate) data.endDate = new Date(endDate);
    if (status) data.status = status;

    const treatment = await prisma.treatment.update({
      where: { id: req.params.id },
      data
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