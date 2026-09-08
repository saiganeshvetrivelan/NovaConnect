const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Backfill existing users with random roll numbers so they don't break during login
  const existingUsers = await prisma.user.findMany();
  for (const user of existingUsers) {
    if (!user.roll_number) {
      let mockRoll = '';
      if (user.role === 'Student') mockRoll = `7181${Math.floor(1000 + Math.random() * 9000)}`;
      else if (user.role === 'Faculty') mockRoll = `FAC${Math.floor(100 + Math.random() * 900)}`;
      else mockRoll = `USR${Math.floor(100 + Math.random() * 900)}`;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { roll_number: mockRoll }
      });
      console.log(`Backfilled ${user.name} with roll no: ${mockRoll}`);
    }
  }

  // Create Master Admin
  const adminEmail = 'admin@novaconnect.edu';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    const password_hash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'System Administrator',
        email: adminEmail,
        roll_number: 'ADMIN001',
        password_hash,
        role: 'Admin',
        department: 'IT Services'
      }
    });
    console.log(`Created Master Admin: ${admin.email} / password: admin123`);
  } else {
    console.log('Master Admin already exists.');
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
