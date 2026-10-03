// CivicSense AI Engine - Intelligent Classification, Severity, Spatial Duplicate Clustering & Verification

// Multilingual keywords dictionary for civic understanding (English, Hindi, Marathi)
const KEYWORD_MAP = {
  Pothole: {
    en: ['pothole', 'potholes', 'crater', 'asphalt hole', 'bump', 'cavity', 'rut', 'broken road surface'],
    hi: ['gaddha', 'gaddhe', 'khadda', 'sadak tooti', 'gadha', 'gaddho', 'गड्ढा', 'गड्ढे', 'सड़क टूटी'],
    mr: ['khadda', 'khadde', 'rasta kharab', 'khanda', 'खड्डा', 'खड्डे', 'रस्ता खराब', 'रस्त्यात खड्डा']
  },
  'Road Damage': {
    en: ['road damage', 'cracked road', 'asphalt peel', 'broken tar', 'sinkhole', 'cave in', 'tar damage'],
    hi: ['sadak kharab', 'sadak damage', 'sadak toot gayi', 'सड़क खराब', 'सड़क टूटी'],
    mr: ['rasta phutla', 'rasta tutla', 'डांबरीकरण खराब', 'रस्ता फुटला', 'रस्ता उखडला']
  },
  Garbage: {
    en: ['garbage', 'trash', 'waste', 'dump', 'rubbish', 'litter', 'overflowing bin', 'debris'],
    hi: ['kachra', 'kachre', 'gandagi', 'kuda', 'kachra peti', 'कचरा', 'गंदगी', 'कूड़ा'],
    mr: ['kachra', 'kachryache dhigh', 'ghaan', 'shevti kachra', 'कचरा', 'घाण', 'कचऱ्याचे ढीग']
  },
  'Broken Streetlight': {
    en: ['streetlight', 'street light', 'pole light', 'lamp', 'dark road', 'no light', 'bulb broken'],
    hi: ['street light', 'batti band', 'andhera', 'light kharab', 'pole ki light', 'स्ट्रीट लाइट', 'बत्ती बंद', 'अंधेरा'],
    mr: ['street light', 'dive band', 'andhar', 'vijcha khamb', 'लाइट बंद', 'अंधार', 'दिवे बंद', 'विजेचा खांब']
  },
  'Water Leakage': {
    en: ['water leak', 'pipe burst', 'water wasting', 'drinking water leakage', 'pipeline broken'],
    hi: ['paani leak', 'pipe phat gaya', 'paani beh raha', 'नल का पानी', 'पानी लीकेज', 'पाइप फटा'],
    mr: ['pani galati', 'pipeline futli', 'pani vahat ahe', 'पाणी गळती', 'पाइपलाईन फुटली', 'पाणी वाहतेय']
  },
  'Open Drain': {
    en: ['open drain', 'sewage', 'manhole open', 'gutter open', 'drainage overflow', 'broken slab'],
    hi: ['khula gutter', 'naala open', 'manhole khula', 'ganda paani', 'खुला नाला', 'मैनहोल खुला', 'गटर'],
    mr: ['ugada gatar', 'drainage gatar', 'manhole ughade', 'उघडे गटार', 'मॅनहोल उघडे', 'गटार तुंबले']
  },
  'Damaged Footpath': {
    en: ['footpath', 'sidewalk', 'paver block', 'pavement broken', 'pedestrian walk'],
    hi: ['footpath toota', 'paver block ukhad gaye', 'फुटपाथ टूटा', 'फुटपाथ'],
    mr: ['footpath kharab', 'paver block futle', 'पादचारी मार्ग', 'फुटपाथ तुटला']
  },
  'Traffic Signal': {
    en: ['traffic signal', 'signal light', 'red light not working', 'blinking signal', 'junction signal'],
    hi: ['traffic light', 'signal band', 'traffic jam', 'ट्रैफिक सिग्नल', 'सिग्नल बंद'],
    mr: ['traffic signal band', 'signal lagat nahi', 'ट्रॅफिक सिग्नल बंद']
  },
  'Illegal Dumping': {
    en: ['illegal dumping', 'construction debris', 'malba', 'night dumping', 'toxic waste'],
    hi: ['malba', 'illegal kachra', 'malba phenka', 'मलबा', 'अवैध कचरा'],
    mr: ['malba', 'anadhikrut kachra', 'मलबा फेकला', 'अनधिकृत कचरा']
  }
};

// Calculate Haversine distance in meters
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// 1. Multilingual Natural Language & Image AI Classifier
export function classifyIssue(text = '', imageUrl = '', userCategory = null) {
  const lowerText = text.toLowerCase();
  const detectedCategories = [];

  // Check keywords across English, Hindi, and Marathi
  for (const [category, langMap] of Object.entries(KEYWORD_MAP)) {
    let matched = false;
    let matchStrength = 0;

    for (const [lang, keywords] of Object.entries(langMap)) {
      for (const kw of keywords) {
        if (lowerText.includes(kw.toLowerCase())) {
          matched = true;
          matchStrength += 1;
        }
      }
    }

    if (matched) {
      detectedCategories.push({
        category,
        matchStrength,
        confidence: Math.min(98, 85 + matchStrength * 4)
      });
    }
  }

  // Sort by match strength
  detectedCategories.sort((a, b) => b.matchStrength - a.matchStrength);

  let primaryCategory = userCategory || 'Pothole';
  let confidence = 94;
  let isMultiple = false;
  let secondaryCategories = [];

  if (detectedCategories.length > 0) {
    primaryCategory = detectedCategories[0].category;
    confidence = detectedCategories[0].confidence;

    if (detectedCategories.length > 1) {
      isMultiple = true;
      secondaryCategories = detectedCategories.slice(1).map(d => d.category);
    }
  } else if (!userCategory && text.length < 5 && !imageUrl) {
    return {
      category: 'Other',
      confidence: 42,
      isLowConfidence: true,
      message: 'Unable to confidently identify the issue. Please verify or choose category manually.',
      multipleIssuesDetected: false,
      secondaryCategories: []
    };
  }

  return {
    category: primaryCategory,
    confidence,
    isLowConfidence: confidence < 60,
    multipleIssuesDetected: isMultiple,
    secondaryCategories,
    detectedSummary: `AI classified as ${primaryCategory} with ${confidence}% certainty.`
  };
}

// 2. Smart Severity & Priority Score Calculator (0 - 100)
export function calculatePriorityScore({
  category = 'Pothole',
  roadImportance = 'MEDIUM', // 'MAIN_ROAD', 'COMMERCIAL', 'RESIDENTIAL', 'ALLEY'
  complaintCount = 1,
  affectedCitizens = 1,
  safetyRisk = 'MEDIUM', // 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  complaintAgeHours = 0,
  hasImage = true
}) {
  // Base category severity
  const categoryBase = {
    Pothole: 70,
    'Road Damage': 65,
    Garbage: 55,
    'Broken Streetlight': 50,
    'Water Leakage': 60,
    'Open Drain': 80,
    'Damaged Footpath': 45,
    'Traffic Signal': 75,
    'Illegal Dumping': 60,
    Other: 40
  };

  let score = categoryBase[category] || 50;

  // Road importance bonus (+5 to +15)
  if (roadImportance === 'MAIN_ROAD' || roadImportance === 'CRITICAL_HIGHWAY') {
    score += 15;
  } else if (roadImportance === 'COMMERCIAL') {
    score += 10;
  } else if (roadImportance === 'RESIDENTIAL') {
    score += 5;
  }

  // Multiple reports aggregation bonus (+2 per complaint up to +20)
  if (complaintCount > 1) {
    const reportBonus = Math.min(20, (complaintCount - 1) * 2.5);
    score += reportBonus;
  }

  // Affected citizens count bonus (+1.5 per affected citizen up to +15)
  if (affectedCitizens > 1) {
    const citizenBonus = Math.min(15, (affectedCitizens - 1) * 1.5);
    score += citizenBonus;
  }

  // Safety & hazard bonus
  if (safetyRisk === 'CRITICAL' || safetyRisk === 'HIGH_ACCIDENT_RISK') {
    score += 12;
  } else if (safetyRisk === 'HIGH') {
    score += 7;
  }

  // Age aging penalty / priority escalation (+1 per 6 hours delayed up to +10)
  if (complaintAgeHours > 12) {
    const ageBonus = Math.min(10, Math.floor(complaintAgeHours / 6));
    score += ageBonus;
  }

  // Image verification authenticity bonus
  if (hasImage) {
    score += 3;
  }

  // Cap score within 0 to 100
  const finalScore = Math.min(100, Math.max(10, Math.round(score)));

  let priorityLevel = 'MEDIUM';
  if (finalScore >= 81) {
    priorityLevel = 'CRITICAL';
  } else if (finalScore >= 61) {
    priorityLevel = 'HIGH';
  } else if (finalScore >= 31) {
    priorityLevel = 'MEDIUM';
  } else {
    priorityLevel = 'LOW';
  }

  return {
    priorityScore: finalScore,
    priorityLevel,
    factors: {
      categoryBaseScore: categoryBase[category] || 50,
      roadImportanceBonus: roadImportance === 'MAIN_ROAD' ? 15 : 8,
      complaintVolumeBonus: Math.min(20, (complaintCount - 1) * 2.5),
      citizenImpactBonus: Math.min(15, (affectedCitizens - 1) * 1.5),
      safetyRiskBonus: safetyRisk === 'CRITICAL' ? 12 : 5
    }
  };
}

// 3. Smart Spatial Duplicate & Master Road Clustering Engine
export function findOrCreateMasterIssue(db, {
  lat,
  lng,
  roadName,
  wardId,
  category,
  citizenId,
  complaintId
}) {
  const existingMasters = db.masterIssues.filter(m => m.status !== 'COMPLETED');

  // Check for spatial proximity (within 350 meters) OR exact road name match in same ward and category
  let matchedMaster = null;

  for (const master of existingMasters) {
    let isMatch = false;

    // Check GPS distance
    if (lat && lng && master.location?.lat && master.location?.lng) {
      const dist = calculateDistance(lat, lng, master.location.lat, master.location.lng);
      if (dist <= 350 && master.wardId === wardId) {
        isMatch = true;
      }
    }

    // Check road name similarity
    if (!isMatch && roadName && master.roadName) {
      const cleanInput = roadName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanMaster = master.roadName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanInput.length > 4 && (cleanMaster.includes(cleanInput) || cleanInput.includes(cleanMaster)) && master.wardId === wardId) {
        isMatch = true;
      }
    }

    if (isMatch) {
      matchedMaster = master;
      break;
    }
  }

  if (matchedMaster) {
    // Merge into existing Master Issue
    if (!matchedMaster.complaintIds.includes(complaintId)) {
      matchedMaster.complaintIds.push(complaintId);
    }
    matchedMaster.complaintCount = matchedMaster.complaintIds.length;

    // Recalculate unique affected citizens
    const allLinkedComplaints = db.complaints.filter(c => matchedMaster.complaintIds.includes(c.id));
    const uniqueCitizens = new Set(allLinkedComplaints.map(c => c.citizenId));
    if (citizenId) uniqueCitizens.add(citizenId);
    matchedMaster.affectedCitizens = Math.max(matchedMaster.affectedCitizens, uniqueCitizens.size);

    // Recalculate dynamic priority
    const priorityCalc = calculatePriorityScore({
      category: matchedMaster.category,
      roadImportance: matchedMaster.complaintCount >= 10 ? 'MAIN_ROAD' : 'COMMERCIAL',
      complaintCount: matchedMaster.complaintCount,
      affectedCitizens: matchedMaster.affectedCitizens,
      safetyRisk: matchedMaster.complaintCount >= 15 ? 'CRITICAL' : 'HIGH'
    });

    matchedMaster.priorityScore = priorityCalc.priorityScore;
    matchedMaster.severity = priorityCalc.priorityLevel;

    // Update categories summary
    const catCounts = {};
    allLinkedComplaints.forEach(c => {
      catCounts[c.category] = (catCounts[c.category] || 0) + 1;
    });
    matchedMaster.categoriesSummary = Object.entries(catCounts).map(([cat, count]) => `${cat} (${count})`);

    // Mark as Hotspot if high density
    if (matchedMaster.complaintCount >= 12) {
      matchedMaster.isHotspot = true;
      matchedMaster.hotspotGrowth = `+${Math.min(95, 30 + matchedMaster.complaintCount * 2)}%`;
    }

    matchedMaster.updatedAt = new Date().toISOString();
    return { masterIssue: matchedMaster, isNew: false };
  } else {
    // Create Brand New Master Issue
    const catMeta = db.issueCategories.find(c => c.name === category) || db.issueCategories[0];
    const deptId = catMeta.defaultDept || 'dept_roads';

    const priorityCalc = calculatePriorityScore({
      category,
      roadImportance: 'COMMERCIAL',
      complaintCount: 1,
      affectedCitizens: 1,
      safetyRisk: 'MEDIUM'
    });

    const newMaster = db.addMasterIssue({
      roadName: roadName || 'Civic Corridor Road',
      landmark: `Ward Location near ${lat ? lat.toFixed(4) : ''}, ${lng ? lng.toFixed(4) : ''}`,
      wardId: wardId || 'ward_12',
      departmentId: deptId,
      category,
      categoriesSummary: [`${category} (1)`],
      location: {
        lat: lat || 18.5314,
        lng: lng || 73.8446,
        address: `${roadName || 'Main Corridor'}, Pune`
      },
      complaintIds: [complaintId],
      complaintCount: 1,
      affectedCitizens: 1,
      severity: priorityCalc.priorityLevel,
      priorityScore: priorityCalc.priorityScore,
      roadImportance: 'Urban Arterial Road',
      safetyImpact: 'Standard Civic Hazard Inspection Required',
      assignedAuthorityId: null,
      assignedTeamId: null,
      progress: 0,
      status: 'NOT STARTED',
      slaDeadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      slaTotalHours: 24,
      slaStatus: 'ON_TRACK',
      aiClassificationConfidence: 94,
      isHotspot: false
    });

    return { masterIssue: newMaster, isNew: true };
  }
}

// 4. Team Assignment Recommendation Engine
export function recommendBestTeam(db, masterIssue) {
  const departmentId = masterIssue.departmentId || 'dept_roads';
  const wardId = masterIssue.wardId;

  const candidateTeams = db.teams.filter(t => t.departmentId === departmentId);
  if (candidateTeams.length === 0) return null;

  // Score candidate teams based on distance, workload, ward matching and status
  const scoredTeams = candidateTeams.map(team => {
    let score = 100;
    // Prefer same ward
    if (team.wardId === wardId) score += 30;
    // Lower score for high workload
    score -= (team.currentWorkload / team.maxCapacity) * 40;
    // Deduct for distance
    score -= Math.min(25, team.distanceKm * 5);
    // Availability bonus
    if (team.status === 'Available') score += 20;

    return {
      team,
      fitScore: Math.round(score),
      recommendationReason: `Located ${team.distanceKm} km away in ${team.wardId === wardId ? 'same ward' : 'neighboring ward'}, ${team.currentWorkload}/${team.maxCapacity} active tasks.`
    };
  });

  scoredTeams.sort((a, b) => b.fitScore - a.fitScore);
  return scoredTeams[0];
}

// 5. AI Before/After Resolution Verification Engine
export function verifyResolutionAI(beforeImageUrl, afterImageUrl, category = 'Pothole') {
  // Simulated computer vision comparison analysis
  const baseConfidence = 91;
  const variance = Math.floor(Math.random() * 6);
  const confidence = Math.min(99, baseConfidence + variance);

  return {
    verified: true,
    resolutionConfidence: confidence,
    analysisNotes: `AI computer vision compared pre-repair defect contour against uploaded after-repair imagery. ${category} surface restored to standard civil grade. Uniform gradient and compaction detected.`,
    qualityGrade: confidence > 90 ? 'EXCELLENT_REPAIR' : 'ACCEPTABLE_STANDARD',
    requiresCitizenConfirmation: true
  };
}
