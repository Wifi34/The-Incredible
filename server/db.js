import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  initSupabase,
  saveUserToSupabase,
  saveComplaintToSupabase,
  updateComplaintInSupabase,
  saveTimelineUpdateToSupabase,
  saveNotificationToSupabase
} from './supabaseDb.js';

// Database Store with live Supabase PostgreSQL persistence and caching
class Database {
  constructor() {
    this.users = [];
    this.complaints = [];
    this.masterIssues = [];
    this.roadIssues = [];
    this.complaintUpdates = [];
    this.notifications = [];
    this.authorities = [];
    this.departments = [];
    this.wards = [];
    this.teams = [];
    this.feedback = [];
    this.auditLogs = [];
    this.issueCategories = [];
    this.slaRecords = [];

    this.init();
  }

  async init() {
    // 1. Issue Categories
    this.issueCategories = [
      { id: 'cat_pothole', name: 'Pothole', defaultDept: 'dept_roads', baseSeverity: 70, slaHours: { CRITICAL: 6, HIGH: 24, MEDIUM: 72, LOW: 168 } },
      { id: 'cat_road_damage', name: 'Road Damage', defaultDept: 'dept_roads', baseSeverity: 65, slaHours: { CRITICAL: 6, HIGH: 24, MEDIUM: 72, LOW: 168 } },
      { id: 'cat_garbage', name: 'Garbage', defaultDept: 'dept_sanitation', baseSeverity: 55, slaHours: { CRITICAL: 4, HIGH: 12, MEDIUM: 48, LOW: 120 } },
      { id: 'cat_streetlight', name: 'Broken Streetlight', defaultDept: 'dept_electrical', baseSeverity: 50, slaHours: { CRITICAL: 8, HIGH: 24, MEDIUM: 72, LOW: 168 } },
      { id: 'cat_water_leak', name: 'Water Leakage', defaultDept: 'dept_water', baseSeverity: 60, slaHours: { CRITICAL: 4, HIGH: 12, MEDIUM: 48, LOW: 96 } },
      { id: 'cat_open_drain', name: 'Open Drain', defaultDept: 'dept_water', baseSeverity: 80, slaHours: { CRITICAL: 4, HIGH: 12, MEDIUM: 36, LOW: 72 } },
      { id: 'cat_footpath', name: 'Damaged Footpath', defaultDept: 'dept_roads', baseSeverity: 45, slaHours: { CRITICAL: 12, HIGH: 36, MEDIUM: 96, LOW: 240 } },
      { id: 'cat_traffic_signal', name: 'Traffic Signal', defaultDept: 'dept_traffic', baseSeverity: 75, slaHours: { CRITICAL: 3, HIGH: 8, MEDIUM: 24, LOW: 48 } },
      { id: 'cat_illegal_dumping', name: 'Illegal Dumping', defaultDept: 'dept_sanitation', baseSeverity: 60, slaHours: { CRITICAL: 6, HIGH: 18, MEDIUM: 48, LOW: 120 } },
      { id: 'cat_other', name: 'Other', defaultDept: 'dept_roads', baseSeverity: 40, slaHours: { CRITICAL: 12, HIGH: 24, MEDIUM: 72, LOW: 168 } }
    ];

    // 2. Departments
    this.departments = [
      { id: 'dept_roads', name: 'Road & Highway Infrastructure', code: 'RHI', head: 'Er. R. K. Shinde', phone: '+91 98230 11001' },
      { id: 'dept_sanitation', name: 'Solid Waste & Sanitation Management', code: 'SWM', head: 'Dr. Sunita Kulkarni', phone: '+91 98230 11002' },
      { id: 'dept_electrical', name: 'Public Lighting & Electrical Works', code: 'PLE', head: 'Er. Anand Shinde', phone: '+91 98230 11003' },
      { id: 'dept_water', name: 'Water Supply & Sewerage Board', code: 'WSB', head: 'Er. V. Deshpande', phone: '+91 98230 11004' },
      { id: 'dept_traffic', name: 'Traffic & Urban Mobility Command', code: 'TMC', head: 'Insp. P. Thorat', phone: '+91 98230 11005' }
    ];

    // 3. Wards
    this.wards = [
      { id: 'ward_12', name: 'Ward 12 - Shivaji Nagar & University Area', zone: 'Zone 1 - Central', lat: 18.5314, lng: 73.8446, totalPopulation: 145000 },
      { id: 'ward_8', name: 'Ward 8 - Laxmi Road & Commercial Market', zone: 'Zone 2 - South', lat: 18.5167, lng: 73.8562, totalPopulation: 182000 },
      { id: 'ward_7', name: 'Ward 7 - Kalyani Nagar & IT Corridor', zone: 'Zone 3 - East', lat: 18.5463, lng: 73.9033, totalPopulation: 160000 },
      { id: 'ward_5', name: 'Ward 5 - Kasba Peth & Heritage Sector', zone: 'Zone 4 - North-West', lat: 18.5204, lng: 73.8567, totalPopulation: 120000 }
    ];

    // 4. Field Teams
    this.teams = [
      {
        id: 'team_road_3',
        name: 'Road Maintenance Team #3',
        departmentId: 'dept_roads',
        wardId: 'ward_12',
        leadName: 'Er. Suresh Kadam',
        phone: '+91 98450 33003',
        membersCount: 8,
        equipment: ['Asphalt Roller', 'Hot-mix Applicator', 'Safety Barricades', 'Compactor'],
        currentWorkload: 4,
        maxCapacity: 8,
        distanceKm: 2.4,
        status: 'Available',
        rating: 4.8
      },
      {
        id: 'team_road_1',
        name: 'Rapid Asphalt Patch Team #1',
        departmentId: 'dept_roads',
        wardId: 'ward_8',
        leadName: 'Mahesh Jadhav',
        phone: '+91 98450 33001',
        membersCount: 6,
        equipment: ['Cold-patch Truck', 'Vibratory Plate'],
        currentWorkload: 2,
        maxCapacity: 6,
        distanceKm: 4.1,
        status: 'Available',
        rating: 4.6
      },
      {
        id: 'team_san_2',
        name: 'Sanitation Rapid Response Unit #2',
        departmentId: 'dept_sanitation',
        wardId: 'ward_8',
        leadName: 'Nitin Gaikwad',
        phone: '+91 98450 33002',
        membersCount: 10,
        equipment: ['Hydraulic Compactor', 'Waste Disinfection Sprayer'],
        currentWorkload: 3,
        maxCapacity: 6,
        distanceKm: 1.8,
        status: 'Available',
        rating: 4.9
      },
      {
        id: 'team_elec_4',
        name: 'Electrical & Signal Crew #4',
        departmentId: 'dept_electrical',
        wardId: 'ward_7',
        leadName: 'Vijay More',
        phone: '+91 98450 33004',
        membersCount: 5,
        equipment: ['Sky-lift Crane Truck', 'Circuit Analyzer', 'LED Replacement Stock'],
        currentWorkload: 1,
        maxCapacity: 5,
        distanceKm: 3.2,
        status: 'Available',
        rating: 4.7
      },
      {
        id: 'team_drain_1',
        name: 'Drainage & Monsoon Emergency Unit',
        departmentId: 'dept_water',
        wardId: 'ward_5',
        leadName: 'Ganesh Shinde',
        phone: '+91 98450 33005',
        membersCount: 7,
        equipment: ['Suction Vacuum Truck', 'Silt Excavator'],
        currentWorkload: 5,
        maxCapacity: 6,
        distanceKm: 1.2,
        status: 'Busy',
        rating: 4.5
      }
    ];

    // 5. Seed Users
    const citizenPassword = await bcrypt.hash('Citizen@123', 10);
    const authorityPassword = await bcrypt.hash('Authority@123', 10);
    const adminPassword = await bcrypt.hash('Admin@123', 10);

    this.users = [
      {
        id: 'usr_citizen_1',
        name: 'Rahul Sharma',
        email: 'citizen@civicsense.gov',
        passwordHash: citizenPassword,
        phone: '+91 98765 43210',
        role: 'CITIZEN',
        address: 'Flat 402, Green Avenue, FC Road',
        city: 'Pune',
        wardId: 'ward_12',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        createdAt: '2026-09-15T09:00:00.000Z'
      },
      {
        id: 'usr_citizen_2',
        name: 'Priya Patil',
        email: 'priya@civicsense.gov',
        passwordHash: citizenPassword,
        phone: '+91 98765 43211',
        role: 'CITIZEN',
        address: 'B-12 Shanti Heights, Ward 12 Main Road',
        city: 'Pune',
        wardId: 'ward_12',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        createdAt: '2026-09-18T10:30:00.000Z'
      },
      {
        id: 'usr_citizen_3',
        name: 'Amit Verma',
        email: 'amit@civicsense.gov',
        passwordHash: citizenPassword,
        phone: '+91 98765 43212',
        role: 'CITIZEN',
        address: '74 Market Yard, Laxmi Road',
        city: 'Pune',
        wardId: 'ward_8',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
        createdAt: '2026-09-20T14:15:00.000Z'
      },
      {
        id: 'usr_authority_1',
        name: 'Officer Rajesh Deshmukh',
        email: 'authority.roads@civicsense.gov',
        passwordHash: authorityPassword,
        phone: '+91 98220 99881',
        role: 'AUTHORITY',
        address: 'PMC Road Division Office, Ward 12',
        city: 'Pune',
        wardId: 'ward_12',
        departmentId: 'dept_roads',
        designation: 'Superintending Road Infrastructure Engineer',
        badgeNumber: 'AUTH-RD-1204',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        createdAt: '2026-08-01T08:00:00.000Z'
      },
      {
        id: 'usr_authority_2',
        name: 'Officer Sunita Kulkarni',
        email: 'authority.sanitation@civicsense.gov',
        passwordHash: authorityPassword,
        phone: '+91 98220 99882',
        role: 'AUTHORITY',
        address: 'Zonal Sanitation Control, Ward 8',
        city: 'Pune',
        wardId: 'ward_8',
        departmentId: 'dept_sanitation',
        designation: 'Chief Sanitation & Public Health Officer',
        badgeNumber: 'AUTH-SN-0819',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
        createdAt: '2026-08-01T08:00:00.000Z'
      },
      {
        id: 'usr_authority_3',
        name: 'Officer Anand Shinde',
        email: 'authority.electrical@civicsense.gov',
        passwordHash: authorityPassword,
        phone: '+91 98220 99883',
        role: 'AUTHORITY',
        address: 'Public Works Electrical Division, Ward 7',
        city: 'Pune',
        wardId: 'ward_7',
        departmentId: 'dept_electrical',
        designation: 'Senior Electrical Infrastructure Superintendent',
        badgeNumber: 'AUTH-EL-0702',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        createdAt: '2026-08-01T08:00:00.000Z'
      },
      {
        id: 'usr_admin_1',
        name: 'Dr. K. Mehta',
        email: 'admin@civicsense.gov',
        passwordHash: adminPassword,
        phone: '+91 98110 00001',
        role: 'ADMIN',
        address: 'Municipal Corporation Headquarters, Civic Command Center',
        city: 'Pune',
        wardId: 'ward_12',
        departmentId: 'dept_roads',
        designation: 'Municipal Commissioner & CivicSense Director',
        badgeNumber: 'ADMIN-HQ-001',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        createdAt: '2026-07-01T08:00:00.000Z'
      }
    ];

    // 6. Master Road Issues (Aggregated Hubs)
    this.masterIssues = [
      {
        id: 'R1028',
        masterCode: 'MASTER ISSUE #R1028',
        roadName: 'Ward 12 Main Road',
        landmark: 'Near Model Colony Junction to University Gate',
        wardId: 'ward_12',
        departmentId: 'dept_roads',
        category: 'Pothole',
        categoriesSummary: ['Pothole (18)', 'Road Damage (5)', 'Broken Streetlight (5)'],
        location: {
          lat: 18.5314,
          lng: 73.8446,
          address: 'Ward 12 Main Road, Shivaji Nagar, Pune, Maharashtra 411005'
        },
        complaintIds: [
          'C1001', 'C1002', 'C1003', 'C1004', 'C1005', 'C1006', 'C1007', 'C1008',
          'C1009', 'C1010', 'C1011', 'C1012', 'C1013', 'C1014', 'C1015', 'C1016',
          'C1017', 'C1018', 'C1019', 'C1020'
        ],
        complaintCount: 20,
        affectedCitizens: 18,
        severity: 'CRITICAL',
        priorityScore: 98,
        roadImportance: 'Main Arterial Road (Heavy Transit)',
        safetyImpact: 'Severe vehicle damage, 2 two-wheeler skids reported',
        assignedAuthorityId: 'usr_authority_1',
        assignedTeamId: 'team_road_3',
        progress: 75,
        status: 'IN PROGRESS',
        slaDeadline: new Date(Date.now() + 2 * 3600 * 1000).toISOString(), // 2 hrs remaining
        slaTotalHours: 24,
        slaStatus: 'APPROACHING_DEADLINE',
        beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        workImage: 'https://images.unsplash.com/photo-1584463699031-6484646700c2?auto=format&fit=crop&w=800&q=80',
        afterImage: null,
        aiVerificationScore: null,
        aiClassificationConfidence: 96,
        isHotspot: true,
        hotspotGrowth: '+59%',
        createdAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'R1029',
        masterCode: 'MASTER ISSUE #R1029',
        roadName: 'Laxmi Market Road',
        landmark: 'Opposite City Flower Bazaar',
        wardId: 'ward_8',
        departmentId: 'dept_sanitation',
        category: 'Garbage',
        categoriesSummary: ['Garbage (7)', 'Illegal Dumping (2)'],
        location: {
          lat: 18.5167,
          lng: 73.8562,
          address: 'Laxmi Road, Market Yard, Pune, Maharashtra 411002'
        },
        complaintIds: ['C1021', 'C1022', 'C1023', 'C1024', 'C1025'],
        complaintCount: 9,
        affectedCitizens: 9,
        severity: 'HIGH',
        priorityScore: 87,
        roadImportance: 'Commercial Market Corridors',
        safetyImpact: 'Public health hazard, odor and pedestrian blockage',
        assignedAuthorityId: 'usr_authority_2',
        assignedTeamId: 'team_san_2',
        progress: 100,
        status: 'RESOLUTION SUBMITTED',
        slaDeadline: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // Breached
        slaTotalHours: 12,
        slaStatus: 'BREACHED',
        beforeImage: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
        workImage: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
        afterImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
        aiVerificationScore: 94,
        aiClassificationConfidence: 92,
        isHotspot: false,
        createdAt: new Date(Date.now() - 31 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'R1030',
        masterCode: 'MASTER ISSUE #R1030',
        roadName: 'Tech Park IT Link Road',
        landmark: 'Near Cyber Tower Curve',
        wardId: 'ward_7',
        departmentId: 'dept_electrical',
        category: 'Broken Streetlight',
        categoriesSummary: ['Broken Streetlight (7)'],
        location: {
          lat: 18.5463,
          lng: 73.9033,
          address: 'Kalyani Nagar IT Link, Pune 411014'
        },
        complaintIds: ['C1026', 'C1027', 'C1028'],
        complaintCount: 7,
        affectedCitizens: 6,
        severity: 'HIGH',
        priorityScore: 74,
        roadImportance: 'IT Corridor Arterial',
        safetyImpact: 'High risk night accident zone',
        assignedAuthorityId: 'usr_authority_3',
        assignedTeamId: 'team_elec_4',
        progress: 30,
        status: 'IN PROGRESS',
        slaDeadline: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
        slaTotalHours: 24,
        slaStatus: 'ON_TRACK',
        beforeImage: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
        workImage: null,
        afterImage: null,
        aiVerificationScore: null,
        aiClassificationConfidence: 91,
        isHotspot: false,
        createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'R1031',
        masterCode: 'MASTER ISSUE #R1031',
        roadName: 'Old Town Heritage Road',
        landmark: 'Kasba Ganpati Chowk',
        wardId: 'ward_5',
        departmentId: 'dept_water',
        category: 'Open Drain',
        categoriesSummary: ['Open Drain (10)', 'Water Leakage (4)'],
        location: {
          lat: 18.5204,
          lng: 73.8567,
          address: 'Kasba Peth Main Road, Pune 411011'
        },
        complaintIds: ['C1029', 'C1030'],
        complaintCount: 14,
        affectedCitizens: 12,
        severity: 'CRITICAL',
        priorityScore: 94,
        roadImportance: 'Heritage Dense Residential Zone',
        safetyImpact: 'Severe pedestrian hazard, open septic trench',
        assignedAuthorityId: null,
        assignedTeamId: null,
        progress: 0,
        status: 'NOT STARTED',
        slaDeadline: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // Breached
        slaTotalHours: 12,
        slaStatus: 'BREACHED',
        beforeImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
        workImage: null,
        afterImage: null,
        aiVerificationScore: null,
        aiClassificationConfidence: 95,
        isHotspot: true,
        hotspotGrowth: '+42%',
        createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'R1032',
        masterCode: 'MASTER ISSUE #R1032',
        roadName: 'Fergusson College (FC) Road',
        landmark: 'Opposite Vaishali Restaurant & Goodluck Chowk',
        wardId: 'ward_12',
        departmentId: 'dept_roads',
        category: 'Pothole',
        categoriesSummary: ['Pothole (12)', 'Cracked Asphalt (4)'],
        location: {
          lat: 18.5246,
          lng: 73.8415,
          address: 'FC Road, Shivaji Nagar, Pune, Maharashtra 411004'
        },
        complaintIds: ['C1031', 'C1032', 'C1033'],
        complaintCount: 16,
        affectedCitizens: 15,
        severity: 'HIGH',
        priorityScore: 88,
        roadImportance: 'High Density Commercial & Youth Hub',
        safetyImpact: 'High traffic congestion, sudden brake skids',
        assignedAuthorityId: 'usr_authority_1',
        assignedTeamId: 'team_road_1',
        progress: 40,
        status: 'IN PROGRESS',
        slaDeadline: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
        slaTotalHours: 24,
        slaStatus: 'ON_TRACK',
        beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        workImage: null,
        afterImage: null,
        aiVerificationScore: null,
        aiClassificationConfidence: 97,
        isHotspot: true,
        hotspotGrowth: '+33%',
        createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'R1033',
        masterCode: 'MASTER ISSUE #R1033',
        roadName: 'Kothrud Paud Road Corridor',
        landmark: 'Near Kinara Hotel Flyover Junction',
        wardId: 'ward_12',
        departmentId: 'dept_roads',
        category: 'Pothole',
        categoriesSummary: ['Pothole (8)', 'Loose Gravel (3)'],
        location: {
          lat: 18.5074,
          lng: 73.8077,
          address: 'Paud Road, Kothrud, Pune, Maharashtra 411038'
        },
        complaintIds: ['C1034', 'C1035'],
        complaintCount: 11,
        affectedCitizens: 10,
        severity: 'MEDIUM',
        priorityScore: 58,
        roadImportance: 'Western Pune Arterial Link',
        safetyImpact: 'Vehicle suspension damages and traffic slowdowns',
        assignedAuthorityId: 'usr_authority_1',
        assignedTeamId: null,
        progress: 10,
        status: 'ASSIGNED',
        slaDeadline: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
        slaTotalHours: 36,
        slaStatus: 'ON_TRACK',
        beforeImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        workImage: null,
        afterImage: null,
        aiVerificationScore: null,
        aiClassificationConfidence: 94,
        isHotspot: false,
        createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'R1034',
        masterCode: 'MASTER ISSUE #R1034',
        roadName: 'Swargate Bus Station Perimeter',
        landmark: 'Jedhe Chowk Underpass Entry',
        wardId: 'ward_8',
        departmentId: 'dept_sanitation',
        category: 'Garbage',
        categoriesSummary: ['Garbage (15)', 'Overflowing Bins (6)'],
        location: {
          lat: 18.5018,
          lng: 73.8587,
          address: 'Jedhe Chowk, Swargate, Pune, Maharashtra 411042'
        },
        complaintIds: ['C1036', 'C1037', 'C1038'],
        complaintCount: 21,
        affectedCitizens: 21,
        severity: 'CRITICAL',
        priorityScore: 96,
        roadImportance: 'Major State Transit Terminal',
        safetyImpact: 'Severe foul odor, stray animal hazard, pest breeding',
        assignedAuthorityId: 'usr_authority_2',
        assignedTeamId: 'team_san_1',
        progress: 60,
        status: 'IN PROGRESS',
        slaDeadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        slaTotalHours: 12,
        slaStatus: 'APPROACHING_DEADLINE',
        beforeImage: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
        workImage: null,
        afterImage: null,
        aiVerificationScore: null,
        aiClassificationConfidence: 98,
        isHotspot: true,
        hotspotGrowth: '+68%',
        createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'R1035',
        masterCode: 'MASTER ISSUE #R1035',
        roadName: 'Hadapsar Gadital Vegetable Market',
        landmark: 'Opposite Solapur Road Overbridge',
        wardId: 'ward_8',
        departmentId: 'dept_sanitation',
        category: 'Garbage',
        categoriesSummary: ['Garbage (10)', 'Rotting Agro-Waste (8)'],
        location: {
          lat: 18.5089,
          lng: 73.9260,
          address: 'Gadital Market, Hadapsar, Pune, Maharashtra 411028'
        },
        complaintIds: ['C1039', 'C1040'],
        complaintCount: 18,
        affectedCitizens: 16,
        severity: 'HIGH',
        priorityScore: 82,
        roadImportance: 'Wholesale Market Corridor',
        safetyImpact: 'Blocked market lanes, leachate flow onto asphalt',
        assignedAuthorityId: 'usr_authority_2',
        assignedTeamId: 'team_san_2',
        progress: 20,
        status: 'IN PROGRESS',
        slaDeadline: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
        slaTotalHours: 18,
        slaStatus: 'ON_TRACK',
        beforeImage: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
        workImage: null,
        afterImage: null,
        aiVerificationScore: null,
        aiClassificationConfidence: 95,
        isHotspot: true,
        hotspotGrowth: '+45%',
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'R1036',
        masterCode: 'MASTER ISSUE #R1036',
        roadName: 'Viman Nagar Central Avenue',
        landmark: 'Near Phoenix Market City Outer Ring',
        wardId: 'ward_7',
        departmentId: 'dept_electrical',
        category: 'Broken Streetlight',
        categoriesSummary: ['Broken Streetlight (9)', 'Pole Damage (2)'],
        location: {
          lat: 18.5679,
          lng: 73.9143,
          address: 'Viman Nagar Main Road, Pune, Maharashtra 411014'
        },
        complaintIds: ['C1041', 'C1042'],
        complaintCount: 11,
        affectedCitizens: 11,
        severity: 'HIGH',
        priorityScore: 79,
        roadImportance: 'Commercial & Airport Connector Road',
        safetyImpact: 'Pitch dark pedestrian crossings, night collision risk',
        assignedAuthorityId: 'usr_authority_3',
        assignedTeamId: 'team_elec_4',
        progress: 80,
        status: 'IN PROGRESS',
        slaDeadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
        slaTotalHours: 24,
        slaStatus: 'ON_TRACK',
        beforeImage: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
        workImage: null,
        afterImage: null,
        aiVerificationScore: null,
        aiClassificationConfidence: 93,
        isHotspot: true,
        hotspotGrowth: '+29%',
        createdAt: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'R1037',
        masterCode: 'MASTER ISSUE #R1037',
        roadName: 'Baner High Street Corridor',
        landmark: 'Near Balewadi Phata Traffic Signal',
        wardId: 'ward_7',
        departmentId: 'dept_electrical',
        category: 'Broken Streetlight',
        categoriesSummary: ['Broken Streetlight (5)', 'Flashing Luminaire (3)'],
        location: {
          lat: 18.5590,
          lng: 73.7868,
          address: 'Baner High Street, Baner, Pune, Maharashtra 411045'
        },
        complaintIds: ['C1043', 'C1044'],
        complaintCount: 8,
        affectedCitizens: 8,
        severity: 'MEDIUM',
        priorityScore: 62,
        roadImportance: 'Tech Corridor Commercial Strip',
        safetyImpact: 'Reduced visibility for pedestrians and two-wheelers',
        assignedAuthorityId: 'usr_authority_3',
        assignedTeamId: null,
        progress: 0,
        status: 'NOT STARTED',
        slaDeadline: new Date(Date.now() + 22 * 3600 * 1000).toISOString(),
        slaTotalHours: 36,
        slaStatus: 'ON_TRACK',
        beforeImage: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
        workImage: null,
        afterImage: null,
        aiVerificationScore: null,
        aiClassificationConfidence: 90,
        isHotspot: false,
        createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'R1038',
        masterCode: 'MASTER ISSUE #R1038',
        roadName: 'Senapati Bapat Road Storm Drain',
        landmark: 'Near Symbiosis Campus & Chatushrungi Hill Foot',
        wardId: 'ward_5',
        departmentId: 'dept_water',
        category: 'Open Drain',
        categoriesSummary: ['Open Drain (8)', 'Waterlogging (6)'],
        location: {
          lat: 18.5355,
          lng: 73.8291,
          address: 'Senapati Bapat Road, Pune, Maharashtra 411016'
        },
        complaintIds: ['C1045', 'C1046'],
        complaintCount: 14,
        affectedCitizens: 12,
        severity: 'CRITICAL',
        priorityScore: 92,
        roadImportance: 'Major University & IT Hub Arterial',
        safetyImpact: 'Severe rainwater backflow, submerged road curbs',
        assignedAuthorityId: null,
        assignedTeamId: null,
        progress: 15,
        status: 'ASSIGNED',
        slaDeadline: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        slaTotalHours: 18,
        slaStatus: 'ON_TRACK',
        beforeImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
        workImage: null,
        afterImage: null,
        aiVerificationScore: null,
        aiClassificationConfidence: 96,
        isHotspot: true,
        hotspotGrowth: '+52%',
        createdAt: new Date(Date.now() - 11 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'R1039',
        masterCode: 'MASTER ISSUE #R1039',
        roadName: 'Katraj Spillway Channel Road',
        landmark: 'Near Rajiv Gandhi Zoological Park Entry',
        wardId: 'ward_5',
        departmentId: 'dept_water',
        category: 'Water Leakage',
        categoriesSummary: ['Water Leakage (11)', 'Burst Pipeline (4)'],
        location: {
          lat: 18.4575,
          lng: 73.8588,
          address: 'Katraj-Kondhwa Road, Pune, Maharashtra 411046'
        },
        complaintIds: ['C1047', 'C1048'],
        complaintCount: 15,
        affectedCitizens: 14,
        severity: 'HIGH',
        priorityScore: 85,
        roadImportance: 'Southern Pune Outer Bypass',
        safetyImpact: 'Continuous potable water loss, road foundation weakening',
        assignedAuthorityId: null,
        assignedTeamId: null,
        progress: 0,
        status: 'NOT STARTED',
        slaDeadline: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
        slaTotalHours: 24,
        slaStatus: 'ON_TRACK',
        beforeImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
        workImage: null,
        afterImage: null,
        aiVerificationScore: null,
        aiClassificationConfidence: 94,
        isHotspot: false,
        createdAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // 7. Seed Individual Complaints (Linked to Citizens and Master Issues)
    this.complaints = [
      {
        id: 'C1001',
        citizenId: 'usr_citizen_1',
        citizenName: 'Rahul Sharma',
        citizenEmail: 'citizen@civicsense.gov',
        citizenPhone: '+91 98765 43210',
        category: 'Pothole',
        roadName: 'Ward 12 Main Road',
        description: 'Huge pothole right in front of Model Colony bus stop. Two bikes almost slipped this morning.',
        images: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'],
        location: {
          lat: 18.5314,
          lng: 73.8446,
          address: 'Ward 12 Main Road, Model Colony, Pune'
        },
        wardId: 'ward_12',
        masterIssueId: 'R1028',
        severity: 'CRITICAL',
        priorityScore: 95,
        aiConfidence: 94,
        aiDetection: {
          detectedObject: 'Severe Asphalt Pothole & Sub-base Failure',
          confidence: 0.94,
          estimatedDepthCm: 18,
          boundingBox: [0.15, 0.22, 0.85, 0.78],
          safetyRiskLevel: 'HIGH_ACCIDENT_RISK'
        },
        status: 'IN PROGRESS',
        assignedAuthorityId: 'usr_authority_1',
        assignedTeamId: 'team_road_3',
        anonymous: false,
        createdAt: '2026-10-02T10:20:00.000Z',
        updatedAt: '2026-10-03T09:00:00.000Z'
      },
      {
        id: 'C1002',
        citizenId: 'usr_citizen_2',
        citizenName: 'Priya Patil',
        citizenEmail: 'priya@civicsense.gov',
        citizenPhone: '+91 98765 43211',
        category: 'Pothole',
        roadName: 'Ward 12 Main Road',
        description: 'Deep road crater near Shanti Heights gate on Ward 12 Main Road. Causing massive traffic jam.',
        images: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'],
        location: {
          lat: 18.5318,
          lng: 73.8450,
          address: 'Ward 12 Main Road, Pune'
        },
        wardId: 'ward_12',
        masterIssueId: 'R1028',
        severity: 'CRITICAL',
        priorityScore: 96,
        aiConfidence: 96,
        aiDetection: {
          detectedObject: 'Multiple Road Potholes',
          confidence: 0.96,
          estimatedDepthCm: 22,
          safetyRiskLevel: 'HIGH_ACCIDENT_RISK'
        },
        status: 'IN PROGRESS',
        assignedAuthorityId: 'usr_authority_1',
        assignedTeamId: 'team_road_3',
        anonymous: false,
        createdAt: '2026-10-02T11:05:00.000Z',
        updatedAt: '2026-10-03T09:00:00.000Z'
      },
      {
        id: 'C1021',
        citizenId: 'usr_citizen_3',
        citizenName: 'Amit Verma',
        citizenEmail: 'amit@civicsense.gov',
        citizenPhone: '+91 98765 43212',
        category: 'Garbage',
        roadName: 'Laxmi Market Road',
        description: 'Road pe kachra phaila hua hai aur bada gaddha bhi hai flower market ke samne.',
        images: ['https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80'],
        location: {
          lat: 18.5167,
          lng: 73.8562,
          address: 'Laxmi Market Road, Pune'
        },
        wardId: 'ward_8',
        masterIssueId: 'R1029',
        severity: 'HIGH',
        priorityScore: 87,
        aiConfidence: 92,
        aiDetection: {
          detectedObject: 'Overflowing Commercial Solid Waste',
          confidence: 0.92,
          safetyRiskLevel: 'HEALTH_HAZARD'
        },
        status: 'RESOLUTION SUBMITTED',
        assignedAuthorityId: 'usr_authority_2',
        assignedTeamId: 'team_san_2',
        anonymous: false,
        createdAt: '2026-10-02T08:15:00.000Z',
        updatedAt: '2026-10-03T10:15:00.000Z'
      }
    ];

    // Seed dummy complaints C1003 to C1020 for the 20-complaint road aggregation demo
    for (let i = 3; i <= 20; i++) {
      const paddedId = `C10${i < 10 ? '0' + i : i}`;
      this.complaints.push({
        id: paddedId,
        citizenId: `usr_citizen_${(i % 3) + 1}`,
        citizenName: i % 2 === 0 ? `Citizen Reporter #${i}` : `Resident Ward 12 (#${i})`,
        citizenEmail: `citizen${i}@civicsense.gov`,
        citizenPhone: `+91 98765 432${i < 10 ? '0' + i : i}`,
        category: i % 4 === 0 ? 'Road Damage' : (i % 5 === 0 ? 'Broken Streetlight' : 'Pothole'),
        roadName: 'Ward 12 Main Road',
        description: `Persistent severe pothole and surface crack at chainage km 1.${i} on Ward 12 Main Road.`,
        images: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'],
        location: {
          lat: 18.5314 + (Math.random() - 0.5) * 0.004,
          lng: 73.8446 + (Math.random() - 0.5) * 0.004,
          address: `Ward 12 Main Road, Pole #${10 + i}, Pune`
        },
        wardId: 'ward_12',
        masterIssueId: 'R1028',
        severity: 'CRITICAL',
        priorityScore: 92 + (i % 7),
        aiConfidence: 91 + (i % 8),
        aiDetection: {
          detectedObject: 'Asphalt Deterioration & Pothole Hazard',
          confidence: 0.93
        },
        status: 'IN PROGRESS',
        assignedAuthorityId: 'usr_authority_1',
        assignedTeamId: 'team_road_3',
        anonymous: i % 3 === 0,
        createdAt: new Date(Date.now() - (24 - i) * 3600 * 1000).toISOString(),
        updatedAt: '2026-10-03T09:00:00.000Z'
      });
    }

    // 8. Work Progress & Timelines
    this.complaintUpdates = [
      {
        id: 'upd_101',
        masterIssueId: 'R1028',
        timestamp: '2026-10-02T10:20:00.000Z',
        action: 'CITIZEN_SUBMITTED',
        actor: 'Rahul Sharma (Citizen)',
        details: 'Initial complaint C1001 registered with GPS location and photo.'
      },
      {
        id: 'upd_102',
        masterIssueId: 'R1028',
        timestamp: '2026-10-02T10:21:00.000Z',
        action: 'AI_CLASSIFIED',
        actor: 'CivicSense AI Engine',
        details: 'Classified as Pothole (Confidence: 94%). Priority calculated at 92/100.'
      },
      {
        id: 'upd_103',
        masterIssueId: 'R1028',
        timestamp: '2026-10-02T10:22:00.000Z',
        action: 'DUPLICATE_AGGREGATION',
        actor: 'Smart Spatial Cluster Engine',
        details: 'Identified 20 correlated complaints on Ward 12 Main Road. Created Master Road Issue #R1028. Priority elevated to 98/100 (CRITICAL).'
      },
      {
        id: 'upd_104',
        masterIssueId: 'R1028',
        timestamp: '2026-10-02T11:00:00.000Z',
        action: 'AUTHORITY_ASSIGNED',
        actor: 'Officer Rajesh Deshmukh',
        details: 'Assigned to Road Maintenance Team #3 (Lead: Er. Suresh Kadam, 2.4 km away).'
      },
      {
        id: 'upd_105',
        masterIssueId: 'R1028',
        timestamp: '2026-10-02T12:30:00.000Z',
        action: 'WORK_STARTED',
        actor: 'Road Maintenance Team #3',
        details: 'Crew mobilized on site. Asphalt cutting, excavation, and safety barricading initiated. Progress: 25%.'
      },
      {
        id: 'upd_106',
        masterIssueId: 'R1028',
        timestamp: '2026-10-02T16:00:00.000Z',
        action: 'WORK_PROGRESS_UPDATE',
        actor: 'Road Maintenance Team #3',
        details: 'Base compaction and binder layer laid. Progress updated to 50%.'
      },
      {
        id: 'upd_107',
        masterIssueId: 'R1028',
        timestamp: '2026-10-03T09:00:00.000Z',
        action: 'WORK_PROGRESS_UPDATE',
        actor: 'Road Maintenance Team #3',
        details: 'Hot-mix asphalt wearing course rolling in progress. Progress: 75%.'
      },
      // Updates for R1029 (Garbage)
      {
        id: 'upd_201',
        masterIssueId: 'R1029',
        timestamp: '2026-10-02T08:15:00.000Z',
        action: 'CITIZEN_SUBMITTED',
        actor: 'Amit Verma (Citizen)',
        details: 'Complaint registered for commercial waste dumping.'
      },
      {
        id: 'upd_202',
        masterIssueId: 'R1029',
        timestamp: '2026-10-02T09:00:00.000Z',
        action: 'AUTHORITY_ASSIGNED',
        actor: 'Officer Sunita Kulkarni',
        details: 'Assigned to Sanitation Rapid Response Unit #2.'
      },
      {
        id: 'upd_203',
        masterIssueId: 'R1029',
        timestamp: '2026-10-03T10:15:00.000Z',
        action: 'RESOLUTION_SUBMITTED',
        actor: 'Officer Sunita Kulkarni',
        details: 'Compactor cleared 2.8 tons of waste. Disinfection wash completed. Before & After images uploaded. AI Resolution Confidence: 94%.'
      }
    ];

    // 9. Notifications
    this.notifications = [
      {
        id: 'notif_1',
        userId: 'usr_citizen_1',
        type: 'PROGRESS_UPDATE',
        title: 'Work in Progress: Ward 12 Main Road',
        message: 'Road Maintenance Team #3 has reached 75% completion on your reported pothole issue (Master #R1028).',
        issueId: 'R1028',
        read: false,
        createdAt: '2026-10-03T09:00:00.000Z'
      },
      {
        id: 'notif_2',
        userId: 'usr_citizen_3',
        type: 'VERIFICATION_REQUIRED',
        title: 'Resolution Verification Required',
        message: 'Authority has marked Laxmi Market Road garbage issue as resolved. Please verify before/after images and confirm resolution.',
        issueId: 'R1029',
        read: false,
        createdAt: '2026-10-03T10:15:00.000Z'
      },
      {
        id: 'notif_3',
        userId: 'usr_authority_1',
        type: 'HIGH_PRIORITY_ALERT',
        title: '🚨 High Civic Priority: Ward 12 Main Road',
        message: 'Master Road Issue #R1028 has 20 aggregated complaints from 18 citizens. Priority: 98/100 (CRITICAL).',
        issueId: 'R1028',
        read: true,
        createdAt: '2026-10-02T10:22:00.000Z'
      },
      {
        id: 'notif_4',
        userId: 'usr_admin_1',
        type: 'SLA_BREACH_ALERT',
        title: '🚨 SLA Breached: Laxmi Market Road',
        message: 'Issue #R1029 breached the 12-hour resolution SLA by 3 hours. Resolution now submitted for verification.',
        issueId: 'R1029',
        read: false,
        createdAt: '2026-10-03T08:00:00.000Z'
      },
      {
        id: 'notif_5',
        userId: 'usr_admin_1',
        type: 'HOTSPOT_DETECTED',
        title: '🔥 Emerging Civic Hotspot: Ward 12',
        message: 'Pothole complaints in Ward 12 increased +59% this month (43 vs 27 last month). Inspection recommended.',
        issueId: 'R1028',
        read: false,
        createdAt: '2026-10-03T06:00:00.000Z'
      }
    ];

    // 10. Audit Logs
    this.auditLogs = [
      {
        id: 'log_1',
        userId: 'usr_citizen_1',
        userName: 'Rahul Sharma',
        userRole: 'CITIZEN',
        action: 'SUBMIT_COMPLAINT',
        targetType: 'COMPLAINT',
        targetId: 'C1001',
        oldStatus: null,
        newStatus: 'REPORTED',
        details: 'Citizen submitted pothole complaint on Ward 12 Main Road with geo-coordinates 18.5314, 73.8446.',
        ip: '192.168.1.45',
        timestamp: '2026-10-02T10:20:00.000Z'
      },
      {
        id: 'log_2',
        userId: 'system_ai',
        userName: 'CivicSense AI Hub',
        userRole: 'SYSTEM',
        action: 'AI_AGGREGATION',
        targetType: 'MASTER_ISSUE',
        targetId: 'R1028',
        oldStatus: null,
        newStatus: 'MERGED_MASTER',
        details: 'Aggregated 20 reports into Master Road Issue #R1028 with Priority 98/100.',
        ip: 'internal',
        timestamp: '2026-10-02T10:22:00.000Z'
      },
      {
        id: 'log_3',
        userId: 'usr_authority_1',
        userName: 'Officer Rajesh Deshmukh',
        userRole: 'AUTHORITY',
        action: 'ASSIGN_TEAM',
        targetType: 'MASTER_ISSUE',
        targetId: 'R1028',
        oldStatus: 'NOT_STARTED',
        newStatus: 'ASSIGNED',
        details: 'Assigned Road Maintenance Team #3 (Lead: Er. Suresh Kadam).',
        ip: '10.0.12.14',
        timestamp: '2026-10-02T11:00:00.000Z'
      },
      {
        id: 'log_4',
        userId: 'usr_authority_1',
        userName: 'Officer Rajesh Deshmukh',
        userRole: 'AUTHORITY',
        action: 'UPDATE_PROGRESS',
        targetType: 'MASTER_ISSUE',
        targetId: 'R1028',
        oldStatus: '50%',
        newStatus: '75%',
        details: 'Wearing course asphalt rolling active. Progress elevated to 75%.',
        ip: '10.0.12.14',
        timestamp: '2026-10-03T09:00:00.000Z'
      }
    ];

    // 11. Citizen Feedback records
    this.feedback = [
      {
        id: 'fb_1',
        masterIssueId: 'R1027',
        citizenId: 'usr_citizen_2',
        citizenName: 'Priya Patil',
        rating: 5,
        comment: 'Problem was fixed properly and road is completely smooth now. Thank you PMC & CivicSense!',
        category: 'Pothole',
        roadName: 'University Road',
        createdAt: '2026-09-28T14:30:00.000Z'
      }
    ];

    // Initialize Supabase PostgreSQL database tables and seeds
    initSupabase(this.users, this.complaints).catch(err => console.warn('Supabase init notice:', err.message));
  }

  // --- Helper Methods ---

  findUserById(id) {
    return this.users.find(u => u.id === id);
  }

  findUserByEmail(email) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user) {
    const newUser = { id: user.id || `usr_${uuidv4()}`, createdAt: new Date().toISOString(), ...user };
    this.users.push(newUser);
    saveUserToSupabase(newUser).catch(err => console.warn('Supabase save user notice:', err.message));
    return newUser;
  }

  getComplaints(filter = {}) {
    return this.complaints.filter(c => {
      if (filter.citizenId && c.citizenId !== filter.citizenId) return false;
      if (filter.wardId && c.wardId !== filter.wardId) return false;
      if (filter.category && c.category !== filter.category) return false;
      if (filter.masterIssueId && c.masterIssueId !== filter.masterIssueId) return false;
      if (filter.status && c.status !== filter.status) return false;
      return true;
    });
  }

  getComplaintById(id) {
    return this.complaints.find(c => c.id === id);
  }

  addComplaint(complaint) {
    const newComplaint = {
      id: complaint.id || `C${1000 + this.complaints.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...complaint
    };
    this.complaints.unshift(newComplaint);
    saveComplaintToSupabase(newComplaint).catch(err => console.warn('Supabase save complaint notice:', err.message));
    return newComplaint;
  }

  updateComplaint(id, updates) {
    const index = this.complaints.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.complaints[index] = {
      ...this.complaints[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    updateComplaintInSupabase(id, updates).catch(err => console.warn('Supabase update complaint notice:', err.message));
    return this.complaints[index];
  }

  getMasterIssues(filter = {}) {
    return this.masterIssues.filter(m => {
      if (filter.wardId && m.wardId !== filter.wardId) return false;
      if (filter.departmentId && m.departmentId !== filter.departmentId) return false;
      if (filter.category && m.category !== filter.category) return false;
      if (filter.severity && m.severity !== filter.severity) return false;
      if (filter.status && m.status !== filter.status) return false;
      return true;
    });
  }

  getMasterIssueById(id) {
    return this.masterIssues.find(m => m.id === id || m.masterCode === id);
  }

  addMasterIssue(issue) {
    const id = issue.id || `R${1000 + this.masterIssues.length + 1}`;
    const newIssue = {
      id,
      masterCode: `MASTER ISSUE #${id}`,
      complaintIds: [],
      complaintCount: 1,
      affectedCitizens: 1,
      progress: 0,
      status: 'NOT STARTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...issue
    };
    this.masterIssues.unshift(newIssue);
    return newIssue;
  }

  updateMasterIssue(id, updates) {
    const index = this.masterIssues.findIndex(m => m.id === id);
    if (index === -1) return null;
    this.masterIssues[index] = {
      ...this.masterIssues[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.masterIssues[index];
  }

  addTimelineUpdate(update) {
    const newUpdate = {
      id: `upd_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      ...update
    };
    this.complaintUpdates.push(newUpdate);
    saveTimelineUpdateToSupabase(newUpdate).catch(err => console.warn('Supabase save update notice:', err.message));
    return newUpdate;
  }

  getTimelineUpdates(masterIssueId) {
    return this.complaintUpdates.filter(u => u.masterIssueId === masterIssueId);
  }

  addNotification(notif) {
    const newNotif = {
      id: `notif_${uuidv4().slice(0, 8)}`,
      read: false,
      createdAt: new Date().toISOString(),
      ...notif
    };
    this.notifications.unshift(newNotif);
    saveNotificationToSupabase(newNotif).catch(err => console.warn('Supabase save notification notice:', err.message));
    return newNotif;
  }

  getNotifications(userId) {
    return this.notifications.filter(n => n.userId === userId);
  }

  markNotificationRead(id, userId) {
    const notif = this.notifications.find(n => n.id === id && n.userId === userId);
    if (notif) notif.read = true;
    return notif;
  }

  addAuditLog(log) {
    const newLog = {
      id: `log_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  getAuditLogs(limit = 100) {
    return this.auditLogs.slice(0, limit);
  }

  addFeedback(fb) {
    const newFb = {
      id: `fb_${uuidv4().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      ...fb
    };
    this.feedback.unshift(newFb);
    return newFb;
  }

  getFeedback(filter = {}) {
    return this.feedback.filter(f => {
      if (filter.masterIssueId && f.masterIssueId !== filter.masterIssueId) return false;
      return true;
    });
  }
}

export const db = new Database();
