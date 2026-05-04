const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const where = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const exercise = await prisma.exercise.findUnique({
      where: { id: req.params.id }
    });

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

router.post(
  '/',
  authorize('admin', 'therapist'),
  [
    body('name').notEmpty().withMessage('Name is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, videoUrl } = req.body;

      const exercise = await prisma.exercise.create({
        data: { name, description, videoUrl }
      });

      res.status(201).json(exercise);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create exercise' });
    }
  }
);

router.put('/:id', authorize('admin', 'therapist'), async (req, res) => {
  try {
    const { name, description, videoUrl } = req.body;

    const data = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (videoUrl !== undefined) data.videoUrl = videoUrl;

    const exercise = await prisma.exercise.update({
      where: { id: req.params.id },
      data
    });

    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update exercise' });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await prisma.exercise.delete({ where: { id: req.params.id } });
    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete exercise' });
  }
});

module.exports = router;