const prisma = require('../src/utils/prisma');
const bcrypt = require('bcrypt');

const mentors = [
  {
    email: 'mentor1@mentorque.com',
    password: 'mentor123',
    name: 'Sarah Johnson',
    expertise: 'Software Engineering & Full Stack Development',
    background: 'Senior Software Engineer at Google with 8 years of experience. Specialized in web development, system design, and mentorship.',
    availability: 'Monday-Friday: 2 PM - 6 PM EST',
    picture: 'https://i.pravatar.cc/150?img=1',
    isAdmin: false,
  },
  {
    email: 'mentor2@mentorque.com',
    password: 'mentor123',
    name: 'Michael Chen',
    expertise: 'Data Science & Machine Learning',
    background: 'Lead Data Scientist at Meta. PhD in Computer Science. Expert in ML algorithms, data engineering, and career guidance.',
    availability: 'Tuesday-Thursday: 10 AM - 2 PM EST',
    picture: 'https://i.pravatar.cc/150?img=2',
    isAdmin: false,
  },
  {
    email: 'mentor3@mentorque.com',
    password: 'mentor123',
    name: 'Emily Rodriguez',
    expertise: 'Product Management & UX Design',
    background: 'Product Manager at Amazon with 7 years of experience. Expert in product strategy, user research, and agile methodologies.',
    availability: 'Monday-Wednesday: 3 PM - 7 PM EST',
    picture: 'https://i.pravatar.cc/150?img=3',
    isAdmin: false,
  },
  {
    email: 'mentor4@mentorque.com',
    password: 'mentor123',
    name: 'David Kim',
    expertise: 'DevOps & Cloud Architecture',
    background: 'DevOps Engineer at Microsoft. Expert in AWS, Kubernetes, CI/CD pipelines, and infrastructure automation.',
    availability: 'Wednesday-Friday: 11 AM - 3 PM EST',
    picture: 'https://i.pravatar.cc/150?img=4',
    isAdmin: false,
  },
  {
    email: 'mentor5@mentorque.com',
    password: 'mentor123',
    name: 'Jessica Williams',
    expertise: 'Mobile Development & iOS/Android',
    background: 'Mobile Developer at Apple. 6 years of experience in iOS and Android development. Expert in React Native and native mobile apps.',
    availability: 'Monday-Friday: 1 PM - 5 PM EST',
    picture: 'https://i.pravatar.cc/150?img=5',
    isAdmin: false,
  },
];

const admin = {
  email: 'admin@mentorque.com',
  password: 'admin123',
  name: 'Admin User',
  expertise: 'Platform Administration',
  background: 'System Administrator with full access to the platform.',
  availability: '24/7',
  picture: 'https://i.pravatar.cc/150?img=6',
  isAdmin: true,
};

async function seed() {
  try {
    console.log('🌱 Starting admin/mentor seed...');

    // Hash passwords and create mentors
    for (const mentor of mentors) {
      const hashedPassword = await bcrypt.hash(mentor.password, 10);
      
      const existing = await prisma.adminMentor.findUnique({
        where: { email: mentor.email },
      });

      if (existing) {
        console.log(`⚠️  Mentor ${mentor.email} already exists, skipping...`);
        continue;
      }

      await prisma.adminMentor.create({
        data: {
          ...mentor,
          password: hashedPassword,
        },
      });

      console.log(`✅ Created mentor: ${mentor.email} (Password: ${mentor.password})`);
    }

    // Create admin
    const hashedAdminPassword = await bcrypt.hash(admin.password, 10);
    
    const existingAdmin = await prisma.adminMentor.findUnique({
      where: { email: admin.email },
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin ${admin.email} already exists, skipping...`);
    } else {
      await prisma.adminMentor.create({
        data: {
          ...admin,
          password: hashedAdminPassword,
        },
      });

      console.log(`✅ Created admin: ${admin.email} (Password: ${admin.password})`);
    }

    console.log('\n📋 Login Credentials:');
    console.log('========================');
    console.log('Admin:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: ${admin.password}`);
    console.log('\nMentors:');
    mentors.forEach((mentor, index) => {
      console.log(`  Mentor ${index + 1}:`);
      console.log(`    Email: ${mentor.email}`);
      console.log(`    Password: ${mentor.password}`);
    });

    console.log('\n✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding admin/mentors:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });














