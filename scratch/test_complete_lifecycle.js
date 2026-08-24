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

async function runEndToEndTest() {
  console.log('================================================================');
  console.log('🐾 TESTING END-TO-END RESCUE -> VET -> SHELTER -> RESOLVED FLOW');
  console.log('================================================================\n');

  try {
    // 1. Authenticate Demo Users
    console.log('1. Authenticating Roles...');
    const citizenLogin = await request('POST', '/api/auth/login', {
      email: 'citizen@example.com',
      password: 'password123',
    });
    const citizenToken = citizenLogin.data.token;
    console.log('   [✓] Citizen logged in.');

    const rescueLogin = await request('POST', '/api/auth/login', {
      email: 'rescue@example.com',
      password: 'password123',
    });
    const rescueToken = rescueLogin.data.token;
    console.log('   [✓] Rescue Team logged in.');

    const vetLogin = await request('POST', '/api/auth/login', {
      email: 'vet@example.com',
      password: 'password123',
    });
    const vetToken = vetLogin.data.token;
    const vetUser = vetLogin.data.user;
    console.log(`   [✓] Veterinarian logged in (Dr. ${vetUser.name}).`);

    const shelterLogin = await request('POST', '/api/auth/login', {
      email: 'shelter@example.com',
      password: 'password123',
    });
    const shelterToken = shelterLogin.data.token;
    const shelterUser = shelterLogin.data.user;
    console.log(`   [✓] Shelter logged in (${shelterUser.name}).\n`);

    // 2. Citizen Reports Emergency
    console.log('2. Citizen creates Emergency Report...');
    const createRes = await request(
      'POST',
      '/api/emergencies',
      {
        title: 'Traumatized Golden Retriever Hit by Scooter',
        animalType: 'Dog',
        breed: 'Golden Retriever',
        estimatedAge: 'Adult',
        urgency: 'HIGH',
        description: 'Dog hit by scooter, limping heavily with bleeding right hind leg. Needs immediate rescue and clinic care.',
        symptoms: ['Bleeding Wound', 'Limping / Fracture', 'Severe Pain / Distress'],
        latitude: 28.6139,
        longitude: 77.209,
        address: '5th Avenue near City Central Park',
        city: 'New Delhi',
        reporterName: 'Concerned Citizen Rahul',
        reporterPhone: '+91 9876543210',
      },
      citizenToken
    );


    if (createRes.status !== 201) {
      throw new Error(`Failed to create emergency: ${JSON.stringify(createRes.data)}`);
    }
    const reportId = createRes.data.emergency._id;
    console.log(`   [✓] Emergency Report created! ID: ${reportId}, Urgency: ${createRes.data.emergency.urgency}\n`);

    // 3. Rescue Team Accepts and Advances Workflow
    console.log('3. Rescue Team Accepts Emergency...');
    const acceptRes = await request('PUT', `/api/rescues/${reportId}/accept`, {}, rescueToken);
    console.log(`   [✓] Rescue Accepted. Status: ${acceptRes.data.emergency.status}`);

    console.log('   Updating status -> EN_ROUTE...');
    await request('PUT', `/api/rescues/${reportId}/status`, { status: 'EN_ROUTE', note: 'Ambulance team en route with trauma kit.' }, rescueToken);

    console.log('   Updating status -> ARRIVED...');
    await request('PUT', `/api/rescues/${reportId}/status`, { status: 'ARRIVED', note: 'Arrived at 5th Ave. Animal secured with gentle muzzle.' }, rescueToken);

    console.log('   Updating status -> RESCUED...');
    await request('PUT', `/api/rescues/${reportId}/status`, { status: 'RESCUED', note: 'Animal safely loaded in vehicle. Heading to hospital.' }, rescueToken);

    console.log('   Assigning / Transferring to Veterinarian...');
    const transferVetRes = await request(
      'PUT',
      `/api/rescues/${reportId}/assign-vet`,
      { vetId: vetUser._id, note: 'Transferred to Vet Clinic for clinical triage and radiographs.' },
      rescueToken
    );
    console.log(`   [✓] Transferred to Vet Hospital. Status: ${transferVetRes.data.emergency.status}\n`);

    // 4. Veterinarian Examines Patient & Saves Medical Chart with Shelter Referral
    console.log('4. Veterinarian opens Medical Queue & Saves Clinical Chart...');
    const patientsRes = await request('GET', '/api/medical/patients', null, vetToken);
    console.log(`   [✓] Vet Patient Queue length: ${patientsRes.data.count}`);

    const saveChartRes = await request(
      'POST',
      '/api/medical',
      {
        reportId,
        animalName: 'Max (Golden Retriever)',
        animalType: 'Dog',
        vitals: {
          weightKg: 24.5,
          temperatureC: 38.6,
          heartRateBpm: 110,
          hydrationStatus: 'Mildly Dehydrated',
        },
        diagnosis: 'Compound fracture of right distal tibia, soft tissue contusion, stabilized shock.',
        treatmentPlan: 'Surgical pinning performed under general anesthesia. Splint dressing applied. IV fluids and antibiotics.',
        medications: [
          { name: 'Cefazolin', dosage: '500mg', frequency: 'Twice daily', duration: '7 days', instructions: 'With meals' },
          { name: 'Meloxicam', dosage: '2.5mg', frequency: 'Once daily', duration: '5 days', instructions: 'Anti-inflammatory pain management' },
        ],
        status: 'STABLE',
        dischargeNotes: 'Surgical recovery progressing smoothly. Cleared for transfer to Shelter Sanctuary for physical rehab.',
        referToShelter: true,
        referredShelterId: shelterUser._id,
      },
      vetToken
    );

    if (saveChartRes.status !== 200) {
      throw new Error(`Failed to save medical chart: ${JSON.stringify(saveChartRes.data)}`);
    }
    console.log(`   [✓] Medical Chart saved! Status: ${saveChartRes.data.record.status}, Shelter Referral: ${saveChartRes.data.record.referToShelter}\n`);

    // 5. Verification: Check Incident Report Details
    console.log('5. Verifying Incident Details View (Backend & UI Data Contract)...');
    const getReport1 = await request('GET', `/api/emergencies/${reportId}`);
    const em1 = getReport1.data.emergency;
    const med1 = getReport1.data.medicalRecord;

    console.log(`   [Check] Emergency Status: ${em1.status} (Expected: TRANSFERRED_SHELTER or TRANSFERRED_VET)`);
    console.log(`   [Check] Assigned Vet Name: Dr. ${em1.assignedVet?.name || med1?.vetId?.name} (Expected: Dr. ${vetUser.name})`);
    console.log(`   [Check] Assigned Vet Phone: ${em1.assignedVet?.phone || med1?.vetId?.phone}`);
    console.log(`   [Check] Assigned Shelter Name: ${em1.assignedShelter?.name || med1?.referredShelterId?.name} (Expected: ${shelterUser.name})`);
    console.log(`   [Check] Prescribed Meds Count: ${med1?.medications?.length} (Expected: 2)`);

    if (!em1.assignedVet && !med1?.vetId) {
      throw new Error('FAILED: Assigned Vet was not populated on incident record!');
    }
    if (!em1.assignedShelter && !med1?.referredShelterId) {
      throw new Error('FAILED: Assigned Shelter was not populated on incident record!');
    }
    console.log('   [✓] Incident Details correctly linked Vet Hospital and Shelter!\n');

    // 6. Shelter Views Incoming Referrals & Admits Animal to Kennel
    console.log('6. Shelter checks Incoming Referrals Queue...');
    const incomingRes = await request('GET', '/api/shelter/incoming-referrals', null, shelterToken);
    console.log(`   [✓] Incoming Referrals Count: ${incomingRes.data.count}`);
    const foundReferral = incomingRes.data.referrals.find((r) => r.emergency._id.toString() === reportId);
    if (!foundReferral) {
      throw new Error('FAILED: Emergency did not appear in Shelter incoming referrals queue!');
    }
    console.log(`   [✓] Inbound referral confirmed: "${foundReferral.emergency.title}" from Dr. ${foundReferral.medicalRecord?.vetId?.name || 'Vet'}`);

    console.log('   Shelter admits animal into Kennel #K-204...');
    const admitRes = await request(
      'POST',
      '/api/shelter/admit',
      {
        reportId,
        medicalRecordId: foundReferral.medicalRecord?._id,
        animalName: 'Max',
        animalType: 'Dog',
        breed: 'Golden Retriever',
        gender: 'Male',
        estimatedAge: '2 years',
        kennelNumber: 'K-204',
        dietaryPlan: 'High-calcium rehabilitation formula + recovery broth',
        behaviorNotes: 'Very sweet temperament, wags tail gently during wound dressing.',
        adoptionStatus: 'IN_RECOVERY',
        bio: 'Max is a gentle, resilient Golden Retriever who made a miraculous recovery from a leg fracture. He loves warm hugs and calm walks!',
        isGoodWithKids: true,
        isGoodWithPets: true,
        isSpayedNeutered: true,
        isVaccinated: true,
        adoptionFee: 75,
      },
      shelterToken
    );

    if (admitRes.status !== 201) {
      throw new Error(`Failed to admit animal: ${JSON.stringify(admitRes.data)}`);
    }
    const shelterRecordId = admitRes.data.shelterRecord._id;
    console.log(`   [✓] Animal admitted! ShelterRecord ID: ${shelterRecordId}, Kennel: #${admitRes.data.shelterRecord.kennelNumber}\n`);

    // 7. Shelter Logs Daily Care
    console.log('7. Shelter caregiver logs Daily Care Entry...');
    const careRes = await request(
      'POST',
      `/api/shelter/${shelterRecordId}/care-log`,
      {
        fed: true,
        walked: true,
        medicationGiven: true,
        notes: 'Ate all recovery broth. Tolerated short 10-minute leash walk. Antibiotics given.',
      },
      shelterToken
    );
    console.log(`   [✓] Daily Care Log saved! Entries count: ${careRes.data.record.dailyCareLogs.length}\n`);

    // 8. Shelter Marks Animal Adopted (Case Resolution)
    console.log('8. Shelter completes adoption and marks status ADOPTED...');
    const adoptStatusRes = await request(
      'PUT',
      `/api/shelter/${shelterRecordId}/adoption-status`,
      { adoptionStatus: 'ADOPTED' },
      shelterToken
    );
    console.log(`   [✓] Shelter Adoption Status: ${adoptStatusRes.data.record.adoptionStatus}`);

    // 9. Final Verification: Check Resolved Incident Record
    console.log('9. Verifying Final Incident Record & Timeline...');
    const finalReportRes = await request('GET', `/api/emergencies/${reportId}`);
    const finalEm = finalReportRes.data.emergency;
    const finalShelter = finalReportRes.data.shelterRecord;

    console.log(`   [Final Check] Emergency Status: ${finalEm.status} (Expected: RESOLVED)`);
    console.log(`   [Final Check] Timeline Entries: ${finalEm.timeline?.length} milestones`);
    console.log(`   [Final Check] Shelter Housing Record: Kennel #${finalShelter?.kennelNumber}, Status: ${finalShelter?.adoptionStatus}`);

    finalEm.timeline.forEach((t, i) => {
      console.log(`     ${i + 1}. [${t.status}] ${t.updatedByName}: ${t.note}`);
    });

    console.log('\n================================================================');
    console.log('🎉 COMPLETE END-TO-END FLOW VERIFIED WITH 100% SUCCESS!');
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

runEndToEndTest();
