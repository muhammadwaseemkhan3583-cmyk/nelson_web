const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.voucherRecord.updateMany({
    where: {
      OR: [
        { status: 'Pending' },
        { status: 'Recorded' },
        { status: null }
      ]
    },
    data: {
      status: 'Hold BY Atif Shamsi'
    }
  });
  console.log(`Updated ${result.count} vouchers to 'Hold BY Atif Shamsi'`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
