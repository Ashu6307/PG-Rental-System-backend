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

const createSuperAdmin = async () => {
  try {
    await connectDB();

    // Secret key for extra security
    const secretKey = process.env.ADMIN_SECRET_KEY || 'mySuperSecretKey123';
    const inputSecret = await askQuestion('Enter Super Admin registration secret key: ');
    if (inputSecret !== secretKey) {
      console.error('❌ Invalid secret key. Exiting.');
      rl.close();
      process.exit(1);
    }

    const name = await askQuestion('Enter Super Admin name: ');
    const email = await askQuestion('Enter Super Admin email: ');
    const password = await askQuestion('Enter Super Admin password: ', true);
    const confirmPassword = await askQuestion('Confirm Super Admin password: ', true);
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
    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters long.');
      rl.close();
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('👤 Super Admin already exists!');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`🔥 Role: ${existingAdmin.role}`);
      console.log(`🔐 Status: ${existingAdmin.isActive ? 'Active' : 'Inactive'}`);
      rl.close();
      process.exit(0);
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 12);
    const superAdmin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'super_admin', // Always create Super Admin
      isActive: true,
      assignedCities: [], // Super admin has access to all cities
      permissions: {
        ownerVerification: true,
        propertyApproval: true,
        userManagement: true,
        cityManagement: true,    // Super admin can manage cities
        adminManagement: true    // Super admin can manage other admins
      },
      createdAt: new Date(),
      lastLogin: null,
      stats: {
        ownersVerified: 0,
        propertiesApproved: 0,
        inquiriesHandled: 0,
        lastActiveDate: new Date()
      }
    });

    console.log('\n🎉 SUPER ADMIN CREATED SUCCESSFULLY!');
    console.log('==========================================');
    console.log(`👑 Name: ${superAdmin.name}`);
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`🔥 Role: SUPER ADMIN`);
    console.log(`✅ Status: Active`);
    console.log(`🌍 Cities: All Cities Access`);
    console.log(`🔐 Permissions: Full System Control`);
    console.log(`📅 Created: ${new Date().toLocaleString()}`);
    console.log('==========================================');
    console.log('🚀 Super Admin can now:');
    console.log('  • Login to admin dashboard');
    console.log('  • Create/manage other admins');
    console.log('  • Manage all cities and properties');
    console.log('  • Access all system features');
    console.log('🌐 Login URL: http://localhost:3500/sys-mgmt/auth');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating Super Admin:', error.message);
    rl.close();
    process.exit(1);
  }
};

console.log('🚀 Super Admin Registration');
console.log('👑 This will create a new SUPER ADMIN account with full system control.');
console.log('🔥 Super Admin has complete access to all features and can manage other admins.');

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

createSuperAdmin();
