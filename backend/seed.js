/**
 * seed.js
 * Seeds the MongoDB database with data from src/data/*.json
 * Run once: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Post = require('./models/Post');
const Job = require('./models/Job');
const Event = require('./models/Event');
const User = require('./models/User');
const Notification = require('./models/Notification');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ── Create seed users ──────────────────────────────────────
    await User.deleteMany({});
    const rawPassword = 'alumni@123';

    const alumniUser = await User.create({
      name: 'Bharath K',
      email: 'bharath@mamcet.com',
      password: rawPassword,
      role: 'alumni',
      company: 'HILIFE AI',
      designation: 'Senior Software Engineer',
      batch: '2020-2024',
      bio: 'Building scalable AI solutions and passionate about mentoring the next generation of engineers.',
      connections: '500+',
      views: 1240,
      skills: ['React.js', 'Node.js', 'System Design', 'Cloud Computing', 'AI Integration'],
      experience: [
        { title: 'Senior Software Engineer', company: 'HILIFE AI', duration: '2024 - Present', desc: 'Leading the development of core AI integration modules.' },
        { title: 'Full Stack Developer', company: 'TechInnovate Solutions', duration: '2022 - 2024', desc: 'Worked on enterprise-level SaaS products using MERN stack.' }
      ],
      education: [
        { school: 'MAMCET', degree: 'B.E. Computer Science and Engineering', duration: '2020 - 2024' }
      ]
    });

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@mamcet.com',
      password: rawPassword,
      role: 'admin',
      company: 'MAMCET',
      designation: 'Placement Coordinator'
    });

    const studentUser = await User.create({
      name: 'Student User',
      email: 'student@mamcet.com',
      password: rawPassword,
      role: 'student',
      batch: '2022-2026'
    });

    console.log('✅ Users seeded');

    // ── Seed Posts (Feed) ──────────────────────────────────────
    await Post.deleteMany({});
    await Post.create([
      {
        userId: adminUser._id,
        userName: 'MAMCET Placement Cell',
        userRole: 'Official Account',
        userPic: '',
        content: 'We are thrilled to announce that TCS is visiting our campus for the 2025/26 batch placement drive. Registration is now open on the portal!',
        media: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        likes: 45,
        likedBy: [],
        shares: 12,
        comments: [{ userId: adminUser._id, userName: 'Dr. S. Kumar', content: 'Great opportunity for our students! Looking forward to seeing high participation.', likes: 5 }]
      },
      {
        userId: alumniUser._id,
        userName: 'Priya Sharma',
        userRole: 'SDE-II at Google',
        userPic: '',
        content: 'Just completed my 2nd year at Google. Grateful for the foundation MAMCET provided. If anyone needs tips for Big Tech interviews, feel free to reach out!',
        media: '',
        likes: 128,
        likedBy: [alumniUser._id],
        shares: 8,
        comments: [{ userId: alumniUser._id, userName: 'Bharath K', content: 'Congratulations Priya! Proud of your achievements.', likes: 2 }]
      }
    ]);
    console.log('✅ Posts seeded');

    // ── Seed Jobs ──────────────────────────────────────────────
    await Job.deleteMany({});
    await Job.create([
      {
        title: 'Senior Frontend Developer',
        company: 'Amazon',
        location: 'Bangalore, KA',
        type: 'Full-time',
        experience: '3+ Years',
        salary: '₹25,00,000 - ₹40,00,000 PA',
        postedBy: adminUser._id,
        postedByName: 'Alumni Connection',
        description: 'Looking for a React expert to help us build the next generation of AWS console features.',
        skills: ['React', 'TypeScript', 'Micro-frontends'],
        appliedBy: []
      },
      {
        title: 'Graduate Trainee Engineer',
        company: 'Zoho',
        location: 'Chennai, TN',
        type: 'Full-time',
        experience: 'Freshers (2025 Batch)',
        salary: '₹5,00,000 - ₹8,00,000 PA',
        postedBy: alumniUser._id,
        postedByName: 'HILIFE AI',
        description: 'Zoho is hiring for its core engineering team. Strong problem-solving skills required.',
        skills: ['Java', 'Data Structures', 'Problem Solving'],
        appliedBy: [studentUser._id]
      }
    ]);
    console.log('✅ Jobs seeded');

    // ── Seed Events ────────────────────────────────────────────
    await Event.deleteMany({});
    await Event.create([
      {
        title: "Annual Alumni Meet '26",
        category: 'Networking',
        date: '2026-03-15',
        time: '10:00 AM',
        venue: 'MAMCET Grand Hall',
        desc: 'Join us for our biggest annual gathering to reconnect with batchmates and explore networking opportunities.',
        image: 'https://images.unsplash.com/photo-1540575861501-7ad0582373f2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        registeredBy: [],
        createdBy: adminUser._id
      },
      {
        title: 'Expert Talk: Industry 5.0',
        category: 'Webinar',
        date: '2026-04-05',
        time: '02:00 PM',
        venue: 'Virtual (Google Meet)',
        desc: 'A masterclass by our distinguished alumni on the upcoming trends in Industry 5.0 and AI.',
        image: 'https://images.unsplash.com/photo-1505373633519-21516fcf648a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        registeredBy: [alumniUser._id],
        createdBy: adminUser._id
      }
    ]);
    console.log('✅ Events seeded');

    // ── Seed Notifications ─────────────────────────────────────
    await Notification.deleteMany({});
    const allUserIds = [alumniUser._id, studentUser._id];
    const notifDocs = [];
    for (const uid of allUserIds) {
      notifDocs.push(
        { userId: uid, type: 'event', title: 'Pongal Celebration', description: 'Join us for a vibrant Pongal Celebration event.', date: 'March 15, 2026', icon: '🎉', isRead: false },
        { userId: uid, type: 'event', title: 'Annual Alumni Meet', description: 'Network with fellow alumni and celebrate shared memories.', date: 'April 20, 2026', icon: '👥', isRead: false },
        { userId: uid, type: 'job', title: 'Administrative Assistant', company: 'Tech Innovations Inc.', description: 'Join our administrative team!', posted: '2 days ago', icon: '💼', isRead: false },
        { userId: uid, type: 'job', title: 'Software Engineer (React)', company: 'CloudScale Systems', description: 'We are seeking a talented React developer.', posted: '3 hours ago', icon: '⚛️', isRead: false },
        { userId: uid, type: 'message', title: 'New message from Sophia Carter', description: 'Hey! How have you been? Let\'s catch up soon!', icon: '💬', isRead: false }
      );
    }
    await Notification.create(notifDocs);
    console.log('✅ Notifications seeded');

    console.log('\n🎉 Database seeding complete!');
    console.log('─────────────────────────────────────────');
    console.log('Test Credentials:');
    console.log('  Alumni  → bharath@mamcet.com / alumni@123');
    console.log('  Admin   → admin@mamcet.com   / alumni@123');
    console.log('  Student → student@mamcet.com / alumni@123');
    console.log('─────────────────────────────────────────');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

run();
