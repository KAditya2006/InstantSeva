require('dotenv').config({ path: './backend/.env' });
const connectDB = require('../config/db');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const ensureUser = async (email, data) => {
  let user = await User.findOne({ email });
  if (user) {
    Object.assign(user, data);
    await user.save();
    return user;
  }

  user = await User.create({ ...data, email, password: 'password123' });
  return user;
};

const seed = async () => {
  await connectDB();

  await ensureUser('admin@hyperlocal.test', { name: 'Admin User', role: 'admin', isVerified: true });
  const customer = await ensureUser('customer@hyperlocal.test', { name: 'Customer User', role: 'user', isVerified: true, location: { type: 'Point', coordinates: [77.1025, 28.7041], address: 'Rohini, Delhi', homeNumber: 'H-12, Sector 9' } });
  
  const additionalLocations = [
    { email: 'plumber1@test.com', name: 'Amit Plumber', profession: 'Plumbing', coords: [77.391, 28.5355], address: 'Sector 62, Noida' },
    { email: 'electric1@test.com', name: 'Suresh Electric', profession: 'Electrical', coords: [77.0266, 28.4595], address: 'Cyber Hub, Gurgaon' },
    { email: 'carpenter1@test.com', name: 'Vikram Woodwork', profession: 'Carpentry', coords: [77.2167, 28.6667], address: 'Civil Lines, Delhi' },
    { email: 'tutor1@test.com', name: 'Priya Maths', profession: 'Tutors', coords: [77.3159, 28.5823], address: 'Sector 15, Noida' },
    { email: 'multi1@test.com', name: 'All-Rounder Raj', professions: ['Plumbing', 'Electrical'], coords: [77.209, 28.6139], address: 'Connaught Place, Delhi' }
  ];

  const { getWorkerModel } = require('../models/WorkerModels');

  for (const loc of additionalLocations) {
    const user = await ensureUser(loc.email, {
      name: loc.name,
      role: 'worker',
      isVerified: true,
      location: { type: 'Point', coordinates: loc.coords, address: loc.address }
    });

    const professions = loc.professions || [loc.profession];
    const targetCollection = professions.length > 1 ? 'multi_professional' : professions[0];
    const DynamicModel = getWorkerModel(targetCollection);

    await DynamicModel.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        professions,
        experience: 4,
        bio: `Professional ${professions.join(' & ')} with years of local experience.`,
        pricing: { amount: 500, unit: 'hour' },
        availability: true,
        approvalStatus: 'approved'
      },
      { upsert: true, new: true }
    );

    // Also sync to main WorkerProfile for global search
    await WorkerProfile.findOneAndUpdate(
      { user: user._id },
      { user: user._id, skills: professions, experience: 4, bio: `Verified ${professions[0]}`, approvalStatus: 'approved' },
      { upsert: true }
    );
  }

  console.log('Seed complete');
  console.log('Admin: admin@hyperlocal.test / password123');
  console.log('Customer: customer@hyperlocal.test / password123');
  console.log('Worker: worker@hyperlocal.test / password123');
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
