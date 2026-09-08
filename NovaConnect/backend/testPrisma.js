require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

try {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  });
  prisma.$connect().then(() => {
    process.exit(0);
  }).catch(e => {
    fs.writeFileSync('error_out.txt', e.stack || e.toString());
  });
} catch(e) {
  fs.writeFileSync('error_out.txt', e.stack || e.toString());
}
