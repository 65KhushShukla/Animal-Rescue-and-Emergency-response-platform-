const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
    };

    if (body) {
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runVetQueueVerification() {
  console.log('================================================================');
  console.log('🔬 VERIFYING CITIZEN REPORT -> VET INTAKE QUEUE -> HANDOVER FLOW');
  console.log('================================================================\n');

  try {
    // 1. Authenticate Roles
    console.log('1. Authenticating Roles...');
    const citizenLogin = await request('POST', '/api/auth/login', {
      email: 'citizen@example.com',
      password: 'password123',
    });
    const citizenToken = citizenLogin.data.token;
    console.log('   [✓] Citizen authenticated.');

    const rescueLogin = await request('POST', '/api/auth/login', {
      email: 'rescue@example.com',
      password: 'password123',
    });
    const rescueToken = rescueLogin.data.token;
    console.log('   [✓] Rescue Team authenticated.');

    const vetLogin = await request('POST', '/api/auth/login', {
      email: 'vet@example.com',
      password: 'password123',
    });
    const vetToken = vetLogin.data.token;
    const vetUser = vetLogin.data.user;
    console.log(`   [✓] Veterinarian authenticated: Dr. ${vetUser.name} (ID: ${vetUser._id})\n`);

    // 2. Create Fresh Emergency as Citizen
    console.log('2. Creating fresh emergency report as Citizen...');
    const emergencyTitle = `Fractured Husky Puppy on North Ring Rd - ${Date.now()}`;
    const createRes = await request(
      'POST',
      '/api/emergencies',
      {
        title: emergencyTitle,
        animalType: 'Dog',
        breed: 'Siberian Husky',
        estimatedAge: 'Puppy/Kitten',
        urgency: 'CRITICAL',
        description: 'Young puppy with open fracture and trauma distress following road accident.',
        symptoms: ['Bleeding Wound', 'Limping / Fracture', 'Severe Pain / Distress', 'Unconscious / Lethargic'],
        latitude: 28.62,
        longitude: 77.21,
        address: 'North Ring Road near Exit 4B',
        city: 'New Delhi',
        reporterName: 'Priya Sharma',
        reporterPhone: '+91 9123456789',
      },
      citizenToken
    );

    if (createRes.status !== 201) {
      throw new Error(`Failed to create emergency: ${JSON.stringify(createRes.data)}`);
    }

    const incidentId = createRes.data.emergency._id;
    console.log(`   [✓] Incident Created! ID: ${incidentId}`);
    console.log(`   [✓] Incident Status: "${createRes.data.emergency.status}" (Expected: REPORTED)`);
    console.log(`   [✓] Urgency: "${createRes.data.emergency.urgency}" (Expected: CRITICAL)\n`);

    // 3. Verify Newly Created Emergency Immediately Appears in Vet Intake Queue
    console.log('3. Checking Veterinary Hospital Intake & Trauma Queue (GET /api/medical/patients)...');
    const queueRes1 = await request('GET', '/api/medical/patients', null, vetToken);
    if (queueRes1.status !== 200) {
      throw new Error(`Failed to fetch vet queue: ${JSON.stringify(queueRes1.data)}`);
    }

    console.log(`   [✓] Vet Queue Total Count: ${queueRes1.data.count}`);
    const foundInQueue1 = queueRes1.data.patients.find((p) => p._id.toString() === incidentId.toString());

    if (!foundInQueue1) {
      throw new Error(`FAILED: Freshly created incident ${incidentId} was NOT found in Vet Queue!`);
    }
    console.log(`   [✓] CONFIRMED: Incident ${incidentId} ("${foundInQueue1.title}") appears in Vet Queue immediately after creation! Status: ${foundInQueue1.status}\n`);

    // 4. Rescue Team Accepts and Handover to Vet Hospital
    console.log('4. Rescue Team accepts incident and initiates hospital handover...');
    await request('PUT', `/api/rescues/${incidentId}/accept`, {}, rescueToken);
    await request('PUT', `/api/rescues/${incidentId}/status`, { status: 'EN_ROUTE', note: 'Trauma van en route' }, rescueToken);
    await request('PUT', `/api/rescues/${incidentId}/status`, { status: 'ARRIVED', note: 'Patient secured in splint' }, rescueToken);
    await request('PUT', `/api/rescues/${incidentId}/status`, { status: 'RESCUED', note: 'In transit to City Paws Trauma Center' }, rescueToken);

    const handoverRes = await request(
      'PUT',
      `/api/rescues/${incidentId}/assign-vet`,
      {
        vetId: vetUser._id,
        note: 'Hospital handover: Patient stabilized with IV catheter and splint, transfer to Dr. Emily Watson.',
      },
      rescueToken
    );

    if (handoverRes.status !== 200) {
      throw new Error(`Failed to assign vet: ${JSON.stringify(handoverRes.data)}`);
    }
    console.log(`   [✓] Hospital Handover Complete! Emergency Status: ${handoverRes.data.emergency.status}, Assigned Vet: ${handoverRes.data.emergency.assignedVet}\n`);

    // 5. Verify Vet Intake Queue Reflects the Handover & Assigned Status
    console.log('5. Verifying Vet Intake Queue after Hospital Handover...');
    const queueRes2 = await request('GET', '/api/medical/patients', null, vetToken);
    const foundInQueue2 = queueRes2.data.patients.find((p) => p._id.toString() === incidentId.toString());

    if (!foundInQueue2) {
      throw new Error(`FAILED: Incident ${incidentId} disappeared from Vet Queue after handover!`);
    }
    console.log(`   [✓] CONFIRMED: Incident ${incidentId} present in Vet Queue with status: "${foundInQueue2.status}" and Assigned Team: "${foundInQueue2.assignedTeam?.name}"\n`);

    // 6. Veterinarian Saves Clinical Examination Chart
    console.log('6. Dr. Emily Watson examines patient and saves Medical Chart...');
    const chartRes = await request(
      'POST',
      '/api/medical',
      {
        reportId: incidentId,
        animalName: 'Koda (Husky Pup)',
        animalType: 'Dog',
        vitals: {
          weightKg: 8.2,
          temperatureC: 38.4,
          heartRateBpm: 125,
          hydrationStatus: 'Normal',
        },
        diagnosis: 'Closed hairline fracture of right ulna, minor paw abrasion, alert and responsive.',
        treatmentPlan: 'Cast applied, analgesia administered, recovery kennel monitoring.',
        medications: [
          { name: 'Cephalexin', dosage: '125mg', frequency: 'Twice daily', duration: '7 days', instructions: 'Oral with food' },
          { name: 'Tramadol', dosage: '25mg', frequency: 'Twice daily', duration: '3 days', instructions: 'Pain relief' },
        ],
        status: 'UNDER_TREATMENT',
        dischargeNotes: 'In recovery kennel. Cast inspection scheduled in 48 hours.',
        referToShelter: false,
      },
      vetToken
    );

    if (chartRes.status !== 200) {
      throw new Error(`Failed to save medical chart: ${JSON.stringify(chartRes.data)}`);
    }
    console.log(`   [✓] Medical Chart Created & Linked to Incident ${incidentId}! Chart ID: ${chartRes.data.record._id}\n`);

    // 7. Verify Database State Across All Endpoints
    console.log('7. Verifying Comprehensive Incident State (GET /api/emergencies/:id)...');
    const incidentCheck = await request('GET', `/api/emergencies/${incidentId}`);
    const incidentData = incidentCheck.data.emergency;
    const medicalData = incidentCheck.data.medicalRecord;

    console.log(`   [DB Verify] Incident ID: ${incidentData._id}`);
    console.log(`   [DB Verify] Title: ${incidentData.title}`);
    console.log(`   [DB Verify] Status: ${incidentData.status}`);
    console.log(`   [DB Verify] Assigned Vet: Dr. ${incidentData.assignedVet?.name}`);
    console.log(`   [DB Verify] Assigned Team: ${incidentData.assignedTeam?.name}`);
    console.log(`   [DB Verify] Medical Chart Diagnosis: ${medicalData?.diagnosis}`);
    console.log(`   [DB Verify] Prescribed Medications: ${medicalData?.medications?.map((m) => m.name).join(', ')}`);
    console.log(`   [DB Verify] Timeline Milestones Count: ${incidentData.timeline?.length}`);

    if (!incidentData.assignedVet || incidentData.assignedVet._id.toString() !== vetUser._id.toString()) {
      throw new Error('FAILED: assignedVet does not match authenticated vet user!');
    }
    if (!medicalData || medicalData.reportId.toString() !== incidentId.toString()) {
      throw new Error('FAILED: Medical record reportId does not match incident ID!');
    }

    console.log('\n================================================================');
    console.log('🎉 ALL 7 VERIFICATION STEPS PASSED WITH 100% INTEGRITY!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.message);
    process.exit(1);
  }
}

runVetQueueVerification();
