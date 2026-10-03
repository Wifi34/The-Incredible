import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Step-by-step End-to-End Simulation Runner
router.post('/step', (req, res) => {
  try {
    const { stepIndex } = req.body;
    const master = db.getMasterIssueById('R1028');

    if (!master) {
      return res.status(404).json({ success: false, message: 'Master issue R1028 not found' });
    }

    let message = '';
    let updatedStep = stepIndex;

    switch (stepIndex) {
      case 1:
        // Step 1: Citizens report 20 complaints on Ward 12 Main Road
        master.complaintCount = 20;
        master.affectedCitizens = 18;
        master.priorityScore = 98;
        master.severity = 'CRITICAL';
        master.status = 'NOT STARTED';
        master.progress = 0;
        master.assignedTeamId = null;
        master.afterImage = null;
        master.aiVerificationScore = null;
        message = '20 citizens reported potholes on Ward 12 Main Road. AI clustered into Master Issue #R1028 with Priority 98/100 (CRITICAL).';
        break;

      case 2:
        // Step 2: Authority assigns Road Maintenance Team #3
        master.assignedAuthorityId = 'usr_authority_1';
        master.assignedTeamId = 'team_road_3';
        master.status = 'ASSIGNED';
        master.progress = 10;
        message = 'Authority Officer Rajesh Deshmukh assigned Road Maintenance Team #3 (Lead: Er. Suresh Kadam, 2.4 km away).';
        break;

      case 3:
        // Step 3: Work started -> 25%
        master.status = 'IN PROGRESS';
        master.progress = 25;
        message = 'Road Maintenance Team #3 mobilized on site. Asphalt milling & barricading active. Progress: 25%.';
        break;

      case 4:
        // Step 4: Progress 50%
        master.status = 'IN PROGRESS';
        master.progress = 50;
        message = 'Sub-base compaction and binder course laid. Progress: 50%.';
        break;

      case 5:
        // Step 5: Progress 75%
        master.status = 'IN PROGRESS';
        master.progress = 75;
        message = 'Wearing course asphalt rolling and surface smoothing in progress. Progress: 75%.';
        break;

      case 6:
        // Step 6: 100% Work Complete + After Image Uploaded
        master.status = 'RESOLUTION SUBMITTED';
        master.progress = 100;
        master.afterImage = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80';
        master.aiVerificationScore = 96;
        message = 'Authority uploaded after-repair imagery. AI Computer Vision verified asphalt restoration at 96% confidence. Citizen verification notifications sent.';
        break;

      case 7:
        // Step 7: Citizen Confirms Resolution -> COMPLETED
        master.status = 'COMPLETED';
        master.progress = 100;
        master.complaintIds.forEach(cId => {
          db.updateComplaint(cId, { status: 'COMPLETED' });
        });
        message = 'Citizens verified & confirmed fix (YES — ISSUE FIXED). Master Road Issue #R1028 marked as COMPLETED. Resolution time: 18 hours. Admin analytics updated!';
        break;

      default:
        message = 'Simulation in standard state.';
    }

    db.updateMasterIssue(master.id, {
      status: master.status,
      progress: master.progress,
      assignedTeamId: master.assignedTeamId,
      afterImage: master.afterImage,
      aiVerificationScore: master.aiVerificationScore
    });

    res.json({
      success: true,
      currentStep: updatedStep,
      message,
      masterIssue: db.getMasterIssueById('R1028')
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Demo step failed', error: err.message });
  }
});

// Reset Demo State to Initial Seed
router.post('/reset', (req, res) => {
  try {
    db.init();
    res.json({ success: true, message: 'CivicLens demo state successfully reset to default!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Reset failed', error: err.message });
  }
});

export default router;
