import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { Admin } from '../models/Admin.js';
import { User } from '../models/User.js';
import { Candidate } from '../models/Candidate.js';
import { ElectionSchedule } from '../models/ElectionSchedule.js';
import { config } from '../config/index.js';

export async function seedDatabase() {
  console.log('[Seed] Starting database seeding...');
  await connectDB();

  try {
    // 1. Seed Admin
    const existingAdmin = await Admin.findOne({ username: config.adminDefaultUsername.toLowerCase() });
    if (!existingAdmin) {
      await Admin.create({
        username: config.adminDefaultUsername,
        password: config.adminDefaultPassword,
        role: 'admin',
      });
      console.log(`[Seed] Created default admin: "${config.adminDefaultUsername}" (Password: "${config.adminDefaultPassword}")`);
    } else {
      console.log(`[Seed] Admin user "${config.adminDefaultUsername}" already exists.`);
    }

    // 2. Seed Sample Candidates if candidates collection is empty
    const candidateCount = await Candidate.countDocuments();
    if (candidateCount === 0) {
      console.log('[Seed] Seeding initial sample candidates...');
      await Candidate.insertMany([
        {
          name: 'Narendra Modi',
          dob: '1950-09-17',
          age: '74',
          electionType: 'parliament',
          state: 'Uttar Pradesh',
          district: 'Varanasi',
          constituency: 'Varanasi',
          partyName: 'Bharatiya Janata Party',
          partyAbbr: 'BJP',
          partySymbol: 'Lotus',
          partySymbolImage: '',
        },
        {
          name: 'Rahul Gandhi',
          dob: '1970-06-19',
          age: '54',
          electionType: 'parliament',
          state: 'Uttar Pradesh',
          district: 'Rae Bareli',
          constituency: 'Rae Bareli',
          partyName: 'Indian National Congress',
          partyAbbr: 'INC',
          partySymbol: 'Hand',
          partySymbolImage: '',
        },
        {
          name: 'Arvind Kejriwal',
          dob: '1968-08-16',
          age: '56',
          electionType: 'assembly',
          state: 'Delhi',
          district: 'New Delhi',
          constituency: 'New Delhi',
          partyName: 'Aam Aadmi Party',
          partyAbbr: 'AAP',
          partySymbol: 'Broom',
          partySymbolImage: '',
        },
        {
          name: 'Asaduddin Owaisi',
          dob: '1969-05-13',
          age: '57',
          electionType: 'parliament',
          state: 'Telangana',
          district: 'Hyderabad',
          constituency: 'Hyderabad',
          partyName: 'All India Majlis-e-Ittehadul Muslimeen',
          partyAbbr: 'AIMIM',
          partySymbol: 'Kite',
          partySymbolImage: '',
        },
        {
          name: 'Sudesh Mahto',
          dob: '1974-06-28',
          age: '52',
          electionType: 'assembly',
          state: 'Jharkhand',
          district: 'Ranchi',
          constituency: 'Silli',
          partyName: 'All Jharkhand Students Union',
          partyAbbr: 'AJSU',
          partySymbol: 'Banana',
          partySymbolImage: '',
        },
        {
          name: 'N. Rangasamy',
          dob: '1950-08-04',
          age: '76',
          electionType: 'assembly',
          state: 'Puducherry',
          district: 'Puducherry',
          constituency: 'Thattanchavady',
          partyName: 'All India N.R. Congress',
          partyAbbr: 'AINRC',
          partySymbol: 'Jug',
          partySymbolImage: '',
        },
        {
          name: 'Dushyant Chautala',
          dob: '1988-04-03',
          age: '38',
          electionType: 'assembly',
          state: 'Haryana',
          district: 'Hisar',
          constituency: 'Uchana Kalan',
          partyName: 'Jannayak Janta Party',
          partyAbbr: 'JJP',
          partySymbol: 'Lock & Key',
          partySymbolImage: '',
        },
        {
          name: 'Debabrata Biswas',
          dob: '1952-10-14',
          age: '73',
          electionType: 'parliament',
          state: 'West Bengal',
          district: 'Kolkata',
          constituency: 'Kolkata Uttar',
          partyName: 'All India Forward Bloc',
          partyAbbr: 'AIFB',
          partySymbol: 'Lion',
          partySymbolImage: '',
        },
        {
          name: 'Omar Abdullah',
          dob: '1970-03-10',
          age: '56',
          electionType: 'assembly',
          state: 'Jammu & Kashmir',
          district: 'Budgam',
          constituency: 'Budgam',
          partyName: 'Jammu & Kashmir National Conference',
          partyAbbr: 'JKNC',
          partySymbol: 'Plough',
          partySymbolImage: '',
        },
        {
          name: 'Naveen Patnaik',
          dob: '1946-10-16',
          age: '79',
          electionType: 'assembly',
          state: 'Odisha',
          district: 'Ganjam',
          constituency: 'Hinjili',
          partyName: 'Biju Janata Dal',
          partyAbbr: 'BJD',
          partySymbol: 'Conch',
          partySymbolImage: '',
        },
        {
          name: 'Mayawati',
          dob: '1956-01-15',
          age: '70',
          electionType: 'parliament',
          state: 'Uttar Pradesh',
          district: 'Lucknow',
          constituency: 'Lucknow',
          partyName: 'Bahujan Samaj Party',
          partyAbbr: 'BSP',
          partySymbol: 'Elephant',
          partySymbolImage: '',
        },
        {
          name: 'Anupriya Patel',
          dob: '1981-04-28',
          age: '45',
          electionType: 'parliament',
          state: 'Uttar Pradesh',
          district: 'Mirzapur',
          constituency: 'Mirzapur',
          partyName: 'Apna Dal (Soneylal)',
          partyAbbr: 'AD(S)',
          partySymbol: 'Cup & Saucer',
          partySymbolImage: '',
        },
        {
          name: 'K. Chandrashekar Rao',
          dob: '1954-02-17',
          age: '72',
          electionType: 'assembly',
          state: 'Telangana',
          district: 'Siddipet',
          constituency: 'Gajwel',
          partyName: 'Bharat Rashtra Samithi',
          partyAbbr: 'BRS',
          partySymbol: 'Car',
          partySymbolImage: '',
        },
      ]);
      console.log('[Seed] Sample candidates created.');
    }

    // 3. Seed Sample Election Schedule if none exists
    const scheduleCount = await ElectionSchedule.countDocuments();
    if (scheduleCount === 0) {
      const today = new Date().toISOString().split('T')[0];
      await ElectionSchedule.create({
        date: today,
        fromTime: '08:00',
        toTime: '20:00',
        allConstituencies: true,
        status: 'active',
        startedAt: new Date(),
      });
      console.log(`[Seed] Sample active election schedule created for today (${today} 08:00 - 20:00).`);
    }

    console.log('[Seed] Seeding completed successfully!');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
  } finally {
    await disconnectDB();
  }
}

// Allow direct CLI execution: tsx src/utils/seedData.ts
if (process.argv[1]?.includes('seedData')) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
