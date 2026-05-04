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

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        patient: { select: { id: true, fullName: true } },
        _count: { select: { payments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        payments: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

router.post(
  '/',
  authorize('admin', 'receptionist'),
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('totalAmount').isFloat({ min: 0 }).withMessage('Valid total amount is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { patientId, totalAmount, items } = req.body;

      const invoice = await prisma.invoice.create({
        data: {
          patientId,
          totalAmount,
          status: 'unpaid'
        },
        include: {
          patient: { select: { id: true, fullName: true } }
        }
      });

      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  }
);

router.post(
  '/:id/payments',
  authorize('admin', 'receptionist'),
  [
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('paymentMethod').isIn(['cash', 'card', 'online']).withMessage('Invalid payment method')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount, paymentMethod } = req.body;
      const invoiceId = req.params.id;

      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      const payment = await prisma.payment.create({
        data: {
          invoiceId,
          amount,
          paymentMethod
        }
      });

      const payments = await prisma.payment.findMany({
        where: { invoiceId },
        select: { amount: true }
      });

      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      if (totalPaid >= parseFloat(invoice.totalAmount)) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: 'paid' }
        });
      }

      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process payment' });
    }
  }
);

router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;