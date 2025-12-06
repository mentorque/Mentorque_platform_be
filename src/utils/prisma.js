const { PrismaClient } = require('../../generated/prisma');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

module.exports = prisma;

