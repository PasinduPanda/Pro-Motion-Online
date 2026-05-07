const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const prisma = require('./prisma');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const treatmentRoutes = require('./routes/treatments');
const sessionRoutes = require('./routes/sessions');
const exerciseRoutes = require('./routes/exercises');
const appointmentRoutes = require('./routes/appointments');
const invoiceRoutes = require('./routes/invoices');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/uploads');
const userRoutes = require('./routes/users');
const patientAuthRoutes = require('./routes/patientAuth');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/patient', patientAuthRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Pro-Motion API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Pro-Motion server running on port ${PORT}`);
  
  // Auto-seed admin user if DB is empty
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('Database empty, auto-seeding admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@pro-motion.com',
          password: hashedPassword,
          role: 'admin'
        }
      });
      console.log('Admin user auto-created: admin@pro-motion.com / admin123');
    }
  } catch (error) {
    console.error('Auto-seeding failed:', error);
  }

  // Backfill patientId and PIN for existing patients that are missing them
  try {
    const patientsWithoutId = await prisma.patient.findMany({
      where: { patientId: null }
    });
    if (patientsWithoutId.length > 0) {
      console.log(`Backfilling patientId for ${patientsWithoutId.length} existing patients...`);
      for (const patient of patientsWithoutId) {
        const patientId = 'PT' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        const hashedPin = await bcrypt.hash(pin, 10);
        await prisma.patient.update({
          where: { id: patient.id },
          data: { patientId, pin: hashedPin }
        });
        console.log(`  Assigned ${patientId} to patient: ${patient.fullName}`);
      }
      console.log('Backfill complete.');
    }
  } catch (error) {
    console.error('Patient backfill failed:', error);
  }
});


module.exports = app;