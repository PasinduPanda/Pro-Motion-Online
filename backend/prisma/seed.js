const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@physiocare.com' } });
  
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@physiocare.com',
        password: hashedPassword,
        role: 'admin'
      }
    });
    console.log('Admin user created: admin@physiocare.com / admin123');
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => process.exit());