const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const EmergencyReport = require('../models/EmergencyReport');
const MedicalRecord = require('../models/MedicalRecord');
const ShelterRecord = require('../models/ShelterRecord');
const VolunteerTask = require('../models/VolunteerTask');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    console.log('[Seed] Checking if seed data is needed...');
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[Seed] Database already has ${userCount} users. Skipping initial seed.`);
      return;
    }

    console.log('[Seed] Seeding demo users and initial platform data...');

    // 1. Create Demo Users for all 6 roles
    const demoUsers = [
      {
        name: 'Sarah Jenkins',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen',
        phone: '+1 555-0101',
        address: '142 Maple Avenue, Green District',
        location: { type: 'Point', coordinates: [77.2090, 28.6139] },
        isVerified: true,
      },
      {
        name: 'Alex Rivera (Rapid Response Unit)',
        email: 'rescue@example.com',
        password: 'password123',
        role: 'rescue_team',
        organizationName: 'Pawsome Rapid Animal Rescue',
        badgeNumber: 'RESCUE-09',
        phone: '+1 555-0102',
        address: 'HQ Base 1, West Boulevard',
        location: { type: 'Point', coordinates: [77.2150, 28.6200] },
        isVerified: true,
        skills: ['K9 First Aid', 'Trauma Handling', 'High Angle Extraction', 'Ambulance Driver'],
      },
      {
        name: 'Dr. Emily Watson (DVM)',
        email: 'vet@example.com',
        password: 'password123',
        role: 'veterinarian',
        organizationName: 'City Paws Veterinary Hospital & Trauma Center',
        badgeNumber: 'VET-LIC-4412',
        phone: '+1 555-0103',
        address: '77 Healthcare Drive, Suite 100',
        location: { type: 'Point', coordinates: [77.2250, 28.6280] },
        isVerified: true,
      },
      {
        name: 'Haven Animal Sanctuary & Shelter',
        email: 'shelter@example.com',
        password: 'password123',
        role: 'shelter',
        organizationName: 'Haven Animal Sanctuary',
        badgeNumber: 'SHELTER-HQ-01',
        phone: '+1 555-0104',
        address: '500 Greenfield Meadow Road',
        location: { type: 'Point', coordinates: [77.1950, 28.6050] },
        isVerified: true,
      },
      {
        name: 'Maya Lin',
        email: 'volunteer@example.com',
        password: 'password123',
        role: 'volunteer',
        phone: '+1 555-0105',
        address: '88 Sunnyvale Crescent',
        location: { type: 'Point', coordinates: [77.2000, 28.6100] },
        isVerified: true,
        skills: ['Animal Foster', 'Dog Walking', 'Feeding Coordination', 'Social Media'],
      },
      {
        name: 'Platform Administrator',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        organizationName: 'Emergency Response Command',
        badgeNumber: 'ADMIN-SYS-01',
        phone: '+1 555-0100',
        address: 'City Operations Center',
        location: { type: 'Point', coordinates: [77.2090, 28.6139] },
        isVerified: true,
      },
    ];

    const createdUsers = await User.create(demoUsers);
    const [citizen, rescueTeam, vet, shelter, volunteer, admin] = createdUsers;

    console.log('[Seed] Demo users created successfully.');

    // 2. Create Initial Emergency Reports
    const sampleEmergencies = [
      {
        title: 'Injured Golden Retriever near City Park entrance',
        animalType: 'Dog',
        breed: 'Golden Retriever Mix',
        estimatedAge: 'Adult',
        urgency: 'CRITICAL',
        status: 'REPORTED',
        description: 'Dog appears to have been hit by a bicycle or vehicle. Limping severely on left rear leg and has a bleeding laceration. Staying near the park bench.',
        symptoms: ['Bleeding', 'Severe Limp', 'Dehydration', 'Shivering'],
        media: [
          {
            url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
            mediaType: 'image',
          },
        ],
        location: {
          type: 'Point',
          coordinates: [77.2185, 28.6190],
          address: 'North Gate, City Central Park',
          city: 'Metropolis',
          landmark: 'Opposite Coffee House',
        },
        reporter: {
          user: citizen._id,
          name: citizen.name,
          phone: citizen.phone,
          email: citizen.email,
        },
        aiTriage: {
          severity: 'CRITICAL',
          confidence: 0.93,
          immediateAdvice: [
            'Keep a safe distance while speaking in soothing tones.',
            'Do not give hard solid foods right now.',
            'Keep the animal warm with a cloth if feasible.',
          ],
          detectedInjuries: ['Suspected Rear Limb Fracture', 'Active Bleeding / Laceration'],
          analyzedAt: new Date(),
        },
        timeline: [
          {
            status: 'REPORTED',
            updatedBy: citizen._id,
            updatedByName: citizen.name,
            note: 'Emergency reported with photo and GPS pin.',
            timestamp: new Date(Date.now() - 35 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Kitten trapped under drainage bridge',
        animalType: 'Cat',
        breed: 'Domestic Short Hair (Tabby)',
        estimatedAge: 'Puppy/Kitten',
        urgency: 'HIGH',
        status: 'ACCEPTED',
        description: 'Small kitten crying for help under the culvert grate. Water level is low but kitten is unable to climb the slippery concrete slope.',
        symptoms: ['Trapped', 'Hypothermia', 'Vocal Distress'],
        media: [
          {
            url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
            mediaType: 'image',
          },
        ],
        location: {
          type: 'Point',
          coordinates: [77.2100, 28.6250],
          address: 'Bridge crossing 5th Street & Riverside',
          city: 'Metropolis',
          landmark: 'Under East Bridge Arch',
        },
        reporter: {
          user: citizen._id,
          name: citizen.name,
          phone: citizen.phone,
          email: citizen.email,
        },
        assignedTeam: rescueTeam._id,
        aiTriage: {
          severity: 'HIGH',
          confidence: 0.88,
          immediateAdvice: [
            'Do not reach into deep fast-flowing water.',
            'Keep visual contact on the kitten location.',
            'Prepare a towel or carrier for when rescue team arrives.',
          ],
          detectedInjuries: ['Hypothermia Risk', 'Entrapment'],
          analyzedAt: new Date(Date.now() - 60 * 60 * 1000),
        },
        timeline: [
          {
            status: 'REPORTED',
            updatedBy: citizen._id,
            updatedByName: citizen.name,
            note: 'Citizen reported kitten in drain pipe.',
            timestamp: new Date(Date.now() - 60 * 60 * 1000),
          },
          {
            status: 'ACCEPTED',
            updatedBy: rescueTeam._id,
            updatedByName: rescueTeam.name,
            note: 'Rescue unit dispatched with extraction gear.',
            timestamp: new Date(Date.now() - 40 * 60 * 1000),
          },
        ],
      },
      {
        title: 'Injured Barn Owl with wing fracture',
        animalType: 'Bird',
        breed: 'Barn Owl',
        estimatedAge: 'Adult',
        urgency: 'HIGH',
        status: 'TRANSFERRED_VET',
        description: 'Found on sidewalk unable to fly. Right wing droops significantly. Alert and defensive.',
        symptoms: ['Broken Wing', 'Unable to Fly'],
        media: [
          {
            url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
            mediaType: 'image',
          },
        ],
        location: {
          type: 'Point',
          coordinates: [77.2280, 28.6110],
          address: 'Botanical Garden Avenue',
          city: 'Metropolis',
          landmark: 'Near Rose Garden Pavilion',
        },
        reporter: {
          user: citizen._id,
          name: citizen.name,
          phone: citizen.phone,
          email: citizen.email,
        },
        assignedTeam: rescueTeam._id,
        assignedVet: vet._id,
        aiTriage: {
          severity: 'HIGH',
          confidence: 0.91,
          immediateAdvice: [
            'Place in a well-ventilated, dim box lined with paper towels.',
            'Do not attempt to feed birds of prey.',
            'Keep noise and handling minimal.',
          ],
          detectedInjuries: ['Right Wing Trauma / Probable Fracture'],
          analyzedAt: new Date(Date.now() - 120 * 60 * 1000),
        },
        timeline: [
          {
            status: 'REPORTED',
            updatedByName: 'Citizen',
            note: 'Injured owl reported.',
            timestamp: new Date(Date.now() - 120 * 60 * 1000),
          },
          {
            status: 'ACCEPTED',
            updatedByName: rescueTeam.name,
            note: 'Rescue team en-route.',
            timestamp: new Date(Date.now() - 100 * 60 * 1000),
          },
          {
            status: 'RESCUED',
            updatedByName: rescueTeam.name,
            note: 'Secured safely in aviary carrier.',
            timestamp: new Date(Date.now() - 75 * 60 * 1000),
          },
          {
            status: 'TRANSFERRED_VET',
            updatedByName: `Dr. ${vet.name}`,
            note: 'Admitted to veterinary hospital for X-Ray imaging.',
            timestamp: new Date(Date.now() - 50 * 60 * 1000),
          },
        ],
      },
    ];

    const createdEmergencies = await EmergencyReport.create(sampleEmergencies);
    const owlEmergency = createdEmergencies[2];

    // 3. Create Sample Medical Record
    const sampleMedRecord = await MedicalRecord.create({
      reportId: owlEmergency._id,
      animalName: 'Barnaby the Owl',
      animalType: 'Bird',
      vetId: vet._id,
      intakeDate: new Date(Date.now() - 50 * 60 * 1000),
      vitals: {
        weightKg: 0.45,
        temperatureC: 40.2,
        heartRateBpm: 240,
        hydrationStatus: 'Normal',
      },
      symptoms: ['Right wing drooping', 'Pain on palpation'],
      diagnosis: 'Closed fracture of right radius/ulna. No internal hemorrhaging.',
      treatmentPlan: 'Figure-eight wing bandage splinting, anti-inflammatory analgesics, cage rest.',
      medications: [
        {
          name: 'Meloxicam (Avian suspension)',
          dosage: '0.2 mg/kg',
          frequency: 'Once daily with food',
          duration: '5 days',
          instructions: 'Oral syringe delivery',
        },
        {
          name: 'Enrofloxacin',
          dosage: '10 mg/kg',
          frequency: 'Twice daily',
          duration: '7 days',
          instructions: 'Prophylactic antibiotic',
        },
      ],
      surgeries: [],
      vaccinations: [],
      status: 'UNDER_TREATMENT',
      referToShelter: true,
      referredShelterId: shelter._id,
    });

    // 4. Create Sample Shelter Records (Ready for Adoption & In Recovery)
    await ShelterRecord.create([
      {
        shelterId: shelter._id,
        animalName: 'Bella',
        animalType: 'Dog',
        breed: 'Labrador Retriever Mix',
        gender: 'Female',
        estimatedAge: '2 years',
        kennelNumber: 'K-104',
        intakeDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        dietaryPlan: '2 cups High-Protein Kibble, morning & evening',
        behaviorNotes: 'Extremely sweet, loves fetch, very friendly with children.',
        adoptionStatus: 'READY_FOR_ADOPTION',
        dailyCareLogs: [
          {
            date: new Date(),
            caregiverName: 'Shelter Staff Mark',
            fed: true,
            walked: true,
            medicationGiven: false,
            notes: 'Bella had a great 30-min walk in the yard.',
          },
        ],
        adoptionProfile: {
          bio: 'Bella was rescued from a rainy street corner two weeks ago. Now healthy, vaccinated, and spayed, she is looking for a loving forever family!',
          photos: [
            'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80',
          ],
          isGoodWithKids: true,
          isGoodWithPets: true,
          isSpayedNeutered: true,
          isVaccinated: true,
          adoptionFee: 50,
        },
      },
      {
        shelterId: shelter._id,
        animalName: 'Milo & Oliver',
        animalType: 'Cat',
        breed: 'Ginger Tabby Brothers',
        gender: 'Male',
        estimatedAge: '6 months',
        kennelNumber: 'C-02',
        intakeDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dietaryPlan: 'Kitten wet food + dry formula',
        behaviorNotes: 'Playful bonded pair, purr loudly when petted.',
        adoptionStatus: 'READY_FOR_ADOPTION',
        dailyCareLogs: [],
        adoptionProfile: {
          bio: 'Rescued together from an abandoned warehouse. Inseparable, joyful kittens that bring endless happiness to any home.',
          photos: [
            'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80',
          ],
          isGoodWithKids: true,
          isGoodWithPets: true,
          isSpayedNeutered: true,
          isVaccinated: true,
          adoptionFee: 75,
        },
      },
      {
        shelterId: shelter._id,
        animalName: 'Barnaby (Rehab)',
        animalType: 'Bird',
        breed: 'Barn Owl',
        gender: 'Male',
        estimatedAge: 'Adult',
        kennelNumber: 'Aviary-01',
        intakeDate: new Date(),
        dietaryPlan: 'Avian recovery diet',
        behaviorNotes: 'Calm, recovering from wing fracture splint.',
        adoptionStatus: 'IN_RECOVERY',
        dailyCareLogs: [],
        adoptionProfile: {
          bio: 'Currently recovering under veterinary supervision. Will be released to sanctuary upon full flight recovery.',
          photos: [
            'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
          ],
          isGoodWithKids: false,
          isGoodWithPets: false,
          isSpayedNeutered: false,
          isVaccinated: false,
          adoptionFee: 0,
        },
      },
    ]);

    // 5. Create Sample Volunteer Tasks
    await VolunteerTask.create([
      {
        title: 'Assist Weekend Adoption Drive & Dog Walking',
        description: 'Help walk shelter dogs, assist visitors with adoption inquiries, and hand out awareness flyers.',
        taskType: 'SHELTER_FEEDING',
        urgency: 'HIGH',
        location: { address: 'Haven Sanctuary, 500 Greenfield Meadow Road' },
        shelterId: shelter._id,
        createdBy: shelter._id,
        status: 'OPEN',
        estimatedHours: 3,
      },
      {
        title: 'Emergency Transport: Animal Food Supplies Delivery',
        description: 'Pick up donated kibble bags from Central Supply Depot and deliver to North Shelter branch.',
        taskType: 'ANIMAL_TRANSPORT',
        urgency: 'NORMAL',
        location: { address: 'Central Supply Depot, Warehouse 4' },
        createdBy: rescueTeam._id,
        assignedVolunteer: volunteer._id,
        status: 'ASSIGNED',
        estimatedHours: 2,
      },
      {
        title: 'Foster Home Needed for 3 Rescued Newborn Kittens',
        description: 'Provide temporary bottle feeding and warm shelter for 3 weeks until kittens can be vaccinated.',
        taskType: 'FOSTER_CARE',
        urgency: 'CRITICAL',
        location: { address: 'City Central' },
        createdBy: shelter._id,
        status: 'OPEN',
        estimatedHours: 10,
      },
    ]);

    // 6. Create Sample Notifications
    await Notification.create([
      {
        recipient: citizen._id,
        title: '🚨 Emergency Report Created',
        message: 'Your emergency report for "Injured Golden Retriever" has been logged. Teams in your area have been alerted.',
        type: 'STATUS_UPDATE',
        link: `/reports/${createdEmergencies[0]._id}`,
        isRead: false,
      },
      {
        recipient: rescueTeam._id,
        title: '🚨 New Emergency in Your Radius',
        message: 'Critical emergency reported at North Gate, City Central Park.',
        type: 'EMERGENCY_ALERT',
        link: `/rescues`,
        isRead: false,
      },
      {
        recipient: vet._id,
        title: '🏥 New Patient Assigned',
        message: 'Barnaby the Owl has been transferred to your clinic for medical treatment.',
        type: 'MEDICAL_UPDATE',
        link: `/veterinary`,
        isRead: true,
      },
    ]);

    console.log('[Seed] Database initialization complete!');
  } catch (err) {
    console.error('[Seed Error]:', err.message);
  }
};

module.exports = seedData;

// If executed directly from command line (npm run seed)
if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
  const connectDB = require('../config/db');
  
  (async () => {
    await connectDB();
    await seedData();
    console.log('[Seed] Seed script finished.');
    process.exit(0);
  })();
}
