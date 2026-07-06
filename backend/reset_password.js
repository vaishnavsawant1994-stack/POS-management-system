const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  // Reset for Admin
  const adminRes = await prisma.user.updateMany({
    where: { email: 'admin_demo1@restaurant.com' },
    data: { password: hashedPassword }
  });
  console.log('Updated Admin:', adminRes);

  // Reset for Cashier
  const cashierRes = await prisma.user.updateMany({
    where: { email: 'cashier_demo1@restaurant.com' },
    data: { password: hashedPassword }
  });
  console.log('Updated Cashier:', cashierRes);
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
