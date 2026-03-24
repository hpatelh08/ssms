import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/teacher_portal');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    await connectDB();

    // Clear existing users
    await User.deleteMany({});
    console.log('Existing users cleared');

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('teacher123', saltRounds);

    // Create default users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', saltRounds),
        role: 'admin'
      },
      // Teachers for each class-section
      {
        name: 'dixit',
        email: 'dixit@gmail.com',
        password: await bcrypt.hash('dixit@123', saltRounds),
        role: 'teacher',
        assignedClass: '8-A',
        division: 'A',
        username: 'teacher8-A'
      },
      {
        name: 'hetvi',
        email: 'hetvi@gmail.com',
        password: await bcrypt.hash('hetvi@123', saltRounds),
        role: 'teacher',
        assignedClass: '8-B',
        division: 'B',
        username: 'teacher8-B'
      },
      {
        name: 'bharat',
        email: 'bharat@gmail.com',
        password: await bcrypt.hash('bharat@123', saltRounds),
        role: 'teacher',
        assignedClass: '8-C',
        division: 'C',
        username: 'teacher8-C'
      },
      {
        name: 'narendra',
        email: 'narendra@gmail.com',
        password: await bcrypt.hash('narendra@123', saltRounds),
        role: 'teacher',
        assignedClass: '9-A',
        division: 'A',
        username: 'teacher9-A'
      },
      {
        name: 'mahesh',
        email: 'mahesh@gmail.com',
        password: await bcrypt.hash('mahesh@123', saltRounds),
        role: 'teacher',
        assignedClass: '9-B',
        division: 'B',
        username: 'teacher9-B'
      },
      {
        name: 'vaibhavi',
        email: 'vaibhavi@gmail.com',
        password: await bcrypt.hash('vaibhavi@123', saltRounds),
        role: 'teacher',
        assignedClass: '9-C',
        division: 'C',
        username: 'teacher9-C'
      },
      {
        name: 'pratik',
        email: 'pratik@gmail.com',
        password: await bcrypt.hash('pratik@123', saltRounds),
        role: 'teacher',
        assignedClass: '10-A',
        division: 'A',
        username: 'teacher10-A'
      },
      {
        name: 'heena',
        email: 'heena@gmail.com',
        password: await bcrypt.hash('heena@123', saltRounds),
        role: 'teacher',
        assignedClass: '10-B',
        division: 'B',
        username: 'teacher10-B'
      },
      // Example/demo users
      {
        name: 'John Doe',
        email: 'teacher@example.com',
        password: hashedPassword,
        role: 'teacher'
      },
      {
        name: 'Jane Smith',
        email: 'student@example.com',
        password: await bcrypt.hash('student123', saltRounds),
        role: 'student'
      },
      {
        name: 'Robert Johnson',
        email: 'parent@example.com',
        password: await bcrypt.hash('parent123', saltRounds),
        role: 'parent'
      },
      {
        name: 'Alice Williams',
        email: 'accountant@example.com',
        password: await bcrypt.hash('accountant123', saltRounds),
        role: 'accountant'
      }
    ];

    await User.insertMany(users);
    console.log('Users seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();