const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
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
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

router.get('/patient/:patientId', async (req, res) => {
  try {
    const reports = await prisma.patientReport.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { uploadedAt: 'desc' }
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.post('/patient/:patientId', authorize('admin', 'therapist', 'receptionist'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const report = await prisma.patientReport.create({
      data: {
        patientId: req.params.patientId,
        filename: req.file.originalname,
        filePath: `/uploads/${req.file.filename}`,
        fileType: req.file.mimetype,
        description: req.body.description || ''
      }
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload report' });
  }
});

router.delete('/:id', authorize('admin', 'therapist'), async (req, res) => {
  try {
    const report = await prisma.patientReport.findUnique({ where: { id: req.params.id } });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const filePath = path.join(__dirname, '../../..', report.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.patientReport.delete({ where: { id: req.params.id } });
    res.json({ message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

module.exports = router;