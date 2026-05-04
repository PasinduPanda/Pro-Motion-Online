const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/all', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        treatment: {
          include: { patient: { select: { fullName: true } } }
        },
        therapist: { select: { id: true, name: true } },
        sessionExercises: {
          include: { exercise: true }
        }
      },
      orderBy: { sessionDate: 'desc' },
      take: req.query.limit ? parseInt(req.query.limit) : 50
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all sessions' });
  }
});

router.get('/treatment/:treatmentId', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { treatmentId: req.params.treatmentId },
      include: {
        therapist: { select: { id: true, name: true } },
        sessionExercises: {
          include: { exercise: true }
        }
      },
      orderBy: { sessionDate: 'desc' }
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        treatment: {
          include: { patient: true }
        },
        therapist: { select: { id: true, name: true } },
        sessionExercises: {
          include: { exercise: true }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

router.post(
  '/',
  authorize('admin', 'therapist'),
  [
    body('treatmentId').notEmpty().withMessage('Treatment ID is required'),
    body('sessionDate').isISO8601().withMessage('Valid session date is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { treatmentId, sessionDate, painLevel, notes, nextSessionDate, exercises } = req.body;

      const treatment = await prisma.treatment.findUnique({ where: { id: treatmentId } });
      if (!treatment) {
        return res.status(404).json({ error: 'Treatment not found' });
      }

      const session = await prisma.session.create({
        data: {
          treatmentId,
          therapistId: req.user.id,
          sessionDate: new Date(sessionDate),
          painLevel,
          notes,
          nextSessionDate: nextSessionDate ? new Date(nextSessionDate) : null
        }
      });

      if (exercises && exercises.length > 0) {
        for (const ex of exercises) {
          await prisma.sessionExercise.create({
            data: {
              sessionId: session.id,
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps
            }
          });
        }
      }

      const createdSession = await prisma.session.findUnique({
        where: { id: session.id },
        include: {
          sessionExercises: { include: { exercise: true } }
        }
      });

      res.status(201).json(createdSession);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create session' });
    }
  }
);

router.put('/:id', authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { sessionDate, painLevel, notes, nextSessionDate } = req.body;

    const data = {};
    if (sessionDate) data.sessionDate = new Date(sessionDate);
    if (painLevel !== undefined) data.painLevel = painLevel;
    if (notes !== undefined) data.notes = notes;
    if (nextSessionDate) data.nextSessionDate = new Date(nextSessionDate);
    else if (nextSessionDate === null) data.nextSessionDate = null;

    const session = await prisma.session.update({
      where: { id: req.params.id },
      data
    });

    res.json(session);
  } catch (error) {
res.status(500).json({ error: 'Failed to update session' });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await prisma.session.delete({ where: { id: req.params.id } });
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;