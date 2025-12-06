const prisma = require('../src/utils/prisma');
const bcrypt = require('bcrypt');

const admins = [
  {
    email: 'raajit.chatterjee@mentorque.com',
    password: 'Raajit@2025',
    name: 'Raajit Chatterjee',
    isAdmin: true,
    verifiedByAdmin: true,
  },
  {
    email: 'shresth.agrawal@mentorque.com',
    password: 'Shresth@2025',
    name: 'Shresth Agrawal',
    isAdmin: true,
    verifiedByAdmin: true,
  },
  {
    email: 'shikhar.prasad@mentorque.com',
    password: 'Shikhar@2025',
    name: 'Shikhar Prasad',
    isAdmin: true,
    verifiedByAdmin: true,
  },
];

async function createAdmins() {
  try {
    console.log('🌱 Starting admin account creation...\n');

    for (const admin of admins) {
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      
      // Check if admin already exists (checking by email, excluding soft-deleted)
      const existing = await prisma.adminMentor.findFirst({
        where: { 
          email: admin.email,
          deletedAt: null,
        },
      });

      if (existing) {
        // Update existing admin to ensure isAdmin is true and update password
        await prisma.adminMentor.update({
          where: { id: existing.id },
          data: {
            isAdmin: true,
            verifiedByAdmin: true,
            name: admin.name,
            password: hashedPassword, // Update password
          },
        });
        console.log(`✅ Updated existing admin: ${admin.name} (${admin.email})`);
        console.log(`   Password: ${admin.password}`);
      } else {
        await prisma.adminMentor.create({
          data: {
            ...admin,
            password: hashedPassword,
          },
        });
        console.log(`✅ Created admin: ${admin.name} (${admin.email})`);
        console.log(`   Password: ${admin.password}`);
      }
    }

    console.log('\n📋 Admin Accounts Created:');
    console.log('========================');
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${admin.password}`);
      console.log('');
    });

    console.log('✅ Admin account creation completed successfully!');
  } catch (error) {
    console.error('❌ Error creating admin accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmins()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

