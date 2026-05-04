const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'therapist'));

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalPatients = await prisma.patient.count();
    const totalTreatments = await prisma.treatment.count();
    const todayAppointments = await prisma.appointment.count({
      where: { dateTime: { gte: today, lt: tomorrow }, status: 'booked' }
    });
    const todaySessions = await prisma.session.count({
      where: { sessionDate: { gte: today, lt: tomorrow } }
    });
    const activeTreatments = await prisma.treatment.count({ where: { status: 'active' } });
    const unpaidInvoices = await prisma.invoice.aggregate({
      where: { status: 'unpaid' },
      _sum: { totalAmount: true }
    });
    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amount: true }
    });

    res.json({
      totalPatients,
      totalTreatments,
      todayAppointments,
      todaySessions,
      activeTreatments,
      unpaidAmount: unpaidInvoices._sum.totalAmount || 0,
      totalRevenue: totalRevenue._sum.amount || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.paymentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: {
          include: { patient: { select: { fullName: true } } }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    const total = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({ payments, total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue' });
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const { date } = req.query;
    const startDate = date ? new Date(date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: { dateTime: { gte: startDate, lt: endDate } },
      include: {
        patient: { select: { fullName: true, phone: true } },
        therapist: { select: { name: true } }
      },
      orderBy: { dateTime: 'asc' }
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments report' });
  }
});

router.get('/patients', async (req, res) => {
  try {
    const { month } = req.query;
    const where = {};

    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const start = new Date(year, monthNum - 1, 1);
      const end = new Date(year, monthNum, 1);
      where.createdAt = { gte: start, lt: end };
    }

    const patients = await prisma.patient.findMany({
      where,
      select: { id: true, fullName: true, phone: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients report' });
  }
});

module.exports = router;