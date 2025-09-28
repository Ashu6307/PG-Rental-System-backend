import mongoose from 'mongoose';
import { config } from 'dotenv';
import readline from 'readline';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Admin from './models/Admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: __dirname + '/.env' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

function askQuestion(query, hide = false) {
  return new Promise((resolve) => {
    if (!hide) {
      rl.question(query, resolve);
    } else {
      // Hide password input
      process.stdout.write(query);
      rl.question('', (answer) => {
        resolve(answer);
      });
    }
  });
}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected...');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const createMainAdmin = async () => {
  try {
    await connectDB();

    // Secret key for extra security
    const secretKey = process.env.ADMIN_SECRET_KEY || 'mySuperSecretKey123';
    const inputSecret = await askQuestion('Enter admin registration secret key: ');
    if (inputSecret !== secretKey) {
      console.error('❌ Invalid secret key. Exiting.');
      rl.close();
      process.exit(1);
    }

    const name = await askQuestion('Enter admin name: ');
    const email = await askQuestion('Enter admin email: ');
    const password = await askQuestion('Enter admin password: ', true);
    const confirmPassword = await askQuestion('Confirm admin password: ', true);
    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match. Exiting.');
      rl.close();
      process.exit(1);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format. Please enter a valid email.');
      rl.close();
      process.exit(1);
    }

    // Validate password strength
    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters long.');
      rl.close();
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('👤 Admin already exists!');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`🔐 Status: ${existingAdmin.isActive ? 'Active' : 'Inactive'}`);
      rl.close();
      process.exit(0);
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 12); // Increased rounds for better security
    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      lastLogin: null
    });

    console.log('\n🎉 ADMIN CREATED SUCCESSFULLY!');
    console.log('==========================================');
    console.log(`� Name: ${admin.name}`);
    console.log(`�📧 Email: ${admin.email}`);
    console.log(`� Role: ${admin.role}`);
    console.log(`✅ Status: Active`);
    console.log(`📅 Created: ${new Date().toLocaleString()}`);
    console.log('==========================================');
    console.log('� Admin can now login to dashboard!');
    console.log('🌐 Login URL: http://localhost:3000/admin/login');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    rl.close();
    process.exit(1);
  }
};

console.log('🚀 Secure Admin Registration');
console.log('👑 This will create a new admin account.');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Process interrupted. Cleaning up...');
  rl.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Process terminated. Cleaning up...');
  rl.close();
  process.exit(0);
});

createMainAdmin();
