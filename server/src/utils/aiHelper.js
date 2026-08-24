const https = require('https');

/**
 * Heuristic/Rule-based AI triage engine for emergency assessment
 */
const analyzeEmergencyRuleBased = (description = '', animalType = 'Dog', symptoms = []) => {
  const text = `${description} ${symptoms.join(' ')}`.toLowerCase();
  
  let severity = 'MEDIUM';
  let confidence = 0.85;
  const detectedInjuries = [];
  const immediateAdvice = [];

  // Critical indicators
  if (
    text.includes('hit by car') ||
    text.includes('accident') ||
    text.includes('bleeding heavily') ||
    text.includes('unconscious') ||
    text.includes('unresponsive') ||
    text.includes('seizure') ||
    text.includes('poison') ||
    text.includes('choking') ||
    text.includes('cannot breathe') ||
    text.includes('severe head trauma')
  ) {
    severity = 'CRITICAL';
    confidence = 0.94;
    detectedInjuries.push('Severe Trauma / Life Threatening Emergency');
    immediateAdvice.push('Do NOT attempt to move the animal quickly unless in immediate traffic danger.');
    immediateAdvice.push('Keep the animal warm with a light blanket or cloth.');
    immediateAdvice.push('Apply gentle direct pressure with a clean cloth if there is active bleeding.');
    immediateAdvice.push('Keep bystanders and loud noises away to reduce shock.');
  } 
  // High indicators
  else if (
    text.includes('broken leg') ||
    text.includes('fracture') ||
    text.includes('limping badly') ||
    text.includes('deep wound') ||
    text.includes('burn') ||
    text.includes('mange') ||
    text.includes('maggot') ||
    text.includes('infestation') ||
    text.includes('abandoned newborn') ||
    text.includes('puppies crying') ||
    text.includes('trapped in drain')
  ) {
    severity = 'HIGH';
    confidence = 0.89;
    detectedInjuries.push('Significant Injury / Vulnerable Condition');
    immediateAdvice.push('Approach calmly and speak softly to avoid startling the animal.');
    immediateAdvice.push('Offer clean drinking water in a shallow bowl if the animal is conscious.');
    immediateAdvice.push('Keep a safe visual watch on the animal until the rescue dispatch arrives.');
  } 
  // Medium / Low indicators
  else if (
    text.includes('skin infection') ||
    text.includes('mild limp') ||
    text.includes('malnourished') ||
    text.includes('lost collar') ||
    text.includes('stray wandering')
  ) {
    severity = 'MEDIUM';
    confidence = 0.82;
    detectedInjuries.push('Mild Condition / Shelter Assessment Needed');
    immediateAdvice.push('Provide a small amount of food and water.');
    immediateAdvice.push('Note down identifiable features (collar, fur pattern, ear notches).');
  } else {
    severity = 'LOW';
    confidence = 0.75;
    detectedInjuries.push('General Animal Welfare Check');
    immediateAdvice.push('Monitor animal behavior and keep dispatch updated if location changes.');
  }

  // Animal specific additions
  if (animalType === 'Bird') {
    immediateAdvice.push('Place the bird in a ventilated, dark cardboard box lined with paper towels to prevent panic.');
  } else if (animalType === 'Cat') {
    immediateAdvice.push('Use a thick towel to gently wrap if moving to safety to prevent scratching due to fear.');
  }

  return {
    severity,
    confidence,
    immediateAdvice,
    detectedInjuries,
    analyzedAt: new Date(),
  };
};

/**
 * Hybrid AI analyzer that calls Gemini API if key is present, otherwise uses smart rule engine
 */
const analyzeEmergency = async (description, animalType, symptoms = []) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return analyzeEmergencyRuleBased(description, animalType, symptoms);
  }

  try {
    const prompt = `You are a specialized Veterinary Emergency Triage AI.
Analyze this animal emergency report:
Animal: ${animalType}
Description: ${description}
Symptoms: ${symptoms.join(', ')}

Return ONLY valid JSON matching this exact structure:
{
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "confidence": number between 0.7 and 0.99,
  "immediateAdvice": ["actionable citizen step 1", "actionable citizen step 2", "actionable citizen step 3"],
  "detectedInjuries": ["injury 1", "injury 2"]
}`;

    const postData = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    return new Promise((resolve) => {
      const req = https.request(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
          timeout: 5000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              const textResponse = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textResponse) {
                const result = JSON.parse(textResponse);
                return resolve({
                  ...result,
                  analyzedAt: new Date(),
                });
              }
            } catch (e) {
              // fallback if parse fails
            }
            resolve(analyzeEmergencyRuleBased(description, animalType, symptoms));
          });
        }
      );

      req.on('error', () => {
        resolve(analyzeEmergencyRuleBased(description, animalType, symptoms));
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(analyzeEmergencyRuleBased(description, animalType, symptoms));
      });

      req.write(postData);
      req.end();
    });
  } catch (err) {
    return analyzeEmergencyRuleBased(description, animalType, symptoms);
  }
};

module.exports = {
  analyzeEmergency,
  analyzeEmergencyRuleBased,
};
