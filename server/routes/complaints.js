import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  classifyIssue,
  classifyIssueWithGemini,
  calculatePriorityScore,
  findOrCreateMasterIssue,
  verifyResolutionAI
} from '../aiService.js';

const router = express.Router();

// 1. AI Real-time Image & Text Analyzer (Preview before submitting)
router.post('/ai-analyze', async (req, res) => {
  try {
    const { text, imageUrl, userCategory } = req.body;

    const classification = await classifyIssueWithGemini(text, imageUrl, userCategory);
    const priority = calculatePriorityScore({
      category: classification.category,
      roadImportance: 'MAIN_ROAD',
      complaintCount: 1,
      affectedCitizens: 1,
      safetyRisk: classification.severity || 'HIGH',
      hasImage: Boolean(imageUrl)
    });

    res.json({
      success: true,
      classification,
      priority,
      aiConfidence: classification.confidence,
      multiIssueDetected: classification.multipleIssuesDetected,
      secondaryCategories: classification.secondaryCategories,
      safetyRiskLevel: priority.priorityLevel,
      isGeminiPowered: classification.isGeminiPowered
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI Analysis error', error: err.message });
  }
});

// 2. Submit New Civic Complaint (Citizen)
router.post('/', authenticateToken, requireRole('CITIZEN', 'ADMIN'), async (req, res) => {
  try {
    const {
      description,
      category: requestedCategory,
      roadName,
      location,
      images,
      wardId,
      anonymous
    } = req.body;

    if (!description && (!images || images.length === 0)) {
      return res.status(400).json({ success: false, message: 'Please provide issue description or upload an image.' });
    }

    const lat = location?.lat || 18.5314;
    const lng = location?.lng || 73.8446;
    const cleanRoadName = roadName || 'Ward 12 Main Road';
    const effectiveWardId = wardId || req.user.wardId || 'ward_12';

    // 1. AI Classification & NLP Analysis with Google Gemini
    const aiResult = await classifyIssueWithGemini(description, images?.[0], requestedCategory);
    const resolvedCategory = requestedCategory || aiResult.category;

    // Temporary ID for clustering
    const tempComplaintId = `C${1000 + db.complaints.length + 1}`;

    // 2. Smart Spatial Duplicate & Clustering Engine
    const { masterIssue, isNew } = findOrCreateMasterIssue(db, {
      lat,
      lng,
      roadName: cleanRoadName,
      wardId: effectiveWardId,
      category: resolvedCategory,
      citizenId: req.user.id,
      complaintId: tempComplaintId
    });

    // 3. Create Individual Citizen Complaint
    const newComplaint = db.addComplaint({
      id: tempComplaintId,
      citizenId: req.user.id,
      citizenName: anonymous ? 'Anonymous Citizen' : req.user.name,
      citizenEmail: anonymous ? 'anonymous@civicsense.gov' : req.user.email,
      citizenPhone: anonymous ? 'Hidden' : req.user.phone,
      category: resolvedCategory,
      roadName: cleanRoadName,
      description,
      images: images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'],
      location: {
        lat,
        lng,
        address: location?.address || `${cleanRoadName}, Nagpur`
      },
      wardId: effectiveWardId,
      masterIssueId: masterIssue.id,
      severity: masterIssue.severity,
      priorityScore: masterIssue.priorityScore,
      aiConfidence: aiResult.confidence,
      aiDetection: {
        detectedObject: `${resolvedCategory} - ${aiResult.detectedSummary}`,
        confidence: aiResult.confidence / 100,
        multipleDetected: aiResult.multipleIssuesDetected,
        secondaryCategories: aiResult.secondaryCategories
      },
      status: masterIssue.status === 'NOT STARTED' ? 'REPORTED' : masterIssue.status,
      assignedAuthorityId: masterIssue.assignedAuthorityId,
      assignedTeamId: masterIssue.assignedTeamId,
      anonymous: Boolean(anonymous)
    });

    // 4. Timeline Event
    db.addTimelineUpdate({
      masterIssueId: masterIssue.id,
      action: isNew ? 'CITIZEN_SUBMITTED' : 'DUPLICATE_REPORT_LINKED',
      actor: `${req.user.name} (Citizen)`,
      details: isNew
        ? `New complaint ${newComplaint.id} submitted for ${resolvedCategory} on ${cleanRoadName}.`
        : `Correlated report ${newComplaint.id} linked to Master Issue #${masterIssue.id}. Total reports on road: ${masterIssue.complaintCount}.`
    });

    // 5. Notifications
    // Citizen Notification
    db.addNotification({
      userId: req.user.id,
      type: 'COMPLAINT_SUBMITTED',
      title: isNew ? 'Complaint Registered Successfully' : 'Complaint Merged with Active Road Hub',
      message: isNew
        ? `Your complaint #${newComplaint.id} for ${resolvedCategory} on ${cleanRoadName} has been recorded with AI Priority ${masterIssue.priorityScore}/100.`
        : `Your complaint #${newComplaint.id} has been aggregated with ${masterIssue.complaintCount - 1} other reports on ${cleanRoadName} (Master #${masterIssue.id}).`,
      issueId: masterIssue.id
    });

    // Authority Notification
    const relevantAuthorities = db.users.filter(u => u.role === 'AUTHORITY' && u.wardId === effectiveWardId);
    relevantAuthorities.forEach(auth => {
      db.addNotification({
        userId: auth.id,
        type: masterIssue.priorityScore >= 80 ? 'HIGH_PRIORITY_ALERT' : 'NEW_ISSUE',
        title: masterIssue.priorityScore >= 80
          ? `🚨 CRITICAL CIVIC ALERT: ${cleanRoadName}`
          : `New Issue Reported: ${cleanRoadName}`,
        message: `${masterIssue.complaintCount} citizens reported ${resolvedCategory} on ${cleanRoadName}. Priority: ${masterIssue.priorityScore}/100.`,
        issueId: masterIssue.id
      });
    });

    // Admin Notification if Critical Cluster
    if (masterIssue.complaintCount >= 5 || masterIssue.priorityScore >= 85) {
      const admins = db.users.filter(u => u.role === 'ADMIN');
      admins.forEach(adm => {
        db.addNotification({
          userId: adm.id,
          type: 'HIGH_COMPLAINT_CLUSTER',
          title: `⚠️ Large Complaint Cluster: ${cleanRoadName}`,
          message: `Concentration of ${masterIssue.complaintCount} complaints on ${cleanRoadName} (${effectiveWardId}). Master Issue #${masterIssue.id}.`,
          issueId: masterIssue.id
        });
      });
    }

    // 6. Award Civic Credit Coins (20 to 50 Coins per report submitted)
    const hasPhoto = images && images.length > 0;
    const hasDetailedText = description && description.length >= 20;
    const coinsEarned = 20 + (hasPhoto ? 15 : 0) + (hasDetailedText ? 15 : 0);

    const citizen = db.users.find(u => u.id === req.user.id);
    if (citizen) {
      citizen.coins = (citizen.coins || 0) + coinsEarned;
    }
    const totalCoins = citizen ? citizen.coins : ((req.user.coins || 0) + coinsEarned);

    // Add Coin Reward Notification
    db.addNotification({
      userId: req.user.id,
      type: 'REWARD_EARNED',
      title: `🪙 +${coinsEarned} Civic Coins Awarded!`,
      message: `You earned ${coinsEarned} Civic Coins (${hasPhoto ? '+15 Photo bonus ' : ''}${hasDetailedText ? '+15 Description bonus ' : ''}) for reporting on ${cleanRoadName}! Balance: ${totalCoins} Coins (200 Coins = ₹5 Rupees).`,
      issueId: masterIssue.id
    });

    // 7. Audit Log
    db.addAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'SUBMIT_COMPLAINT',
      targetType: 'COMPLAINT',
      targetId: newComplaint.id,
      oldStatus: null,
      newStatus: newComplaint.status,
      details: `Citizen submitted complaint on ${cleanRoadName}. Earned +${coinsEarned} Civic Coins. Linked to Master Issue #${masterIssue.id} with Priority ${masterIssue.priorityScore}/100.`
    });

    res.status(201).json({
      success: true,
      message: isNew
        ? `Complaint registered! You earned +${coinsEarned} Civic Coins.`
        : `Smart Duplicate Engine correlated your complaint with ${masterIssue.complaintCount - 1} existing reports on this road! (+${coinsEarned} Coins)`,
      complaint: newComplaint,
      masterIssue,
      reward: {
        coinsEarned,
        totalCoins,
        reason: 'Civic Hazard Reported',
        breakdown: [
          { item: 'Base Report Bounty', amount: 20 },
          ...(hasPhoto ? [{ item: 'Photo Evidence Bonus', amount: 15 }] : []),
          ...(hasDetailedText ? [{ item: 'Detailed Description Bonus', amount: 15 }] : [])
        ]
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit complaint', error: err.message });
  }
});

// 2.5. Convert 200 Coins into ₹5 Rupees Cash / Direct Benefit
router.post('/convert-coins', authenticateToken, (req, res) => {
  try {
    const citizen = db.users.find(u => u.id === req.user.id);
    const currentCoins = citizen ? (citizen.coins || 0) : (req.user.coins || 0);

    if (currentCoins < 200) {
      return res.status(400).json({
        success: false,
        message: `You need at least 200 coins to convert into ₹5 Rupees. Current balance: ${currentCoins} coins.`
      });
    }

    const blocks = Math.max(1, parseInt(req.body.blocks || 1, 10));
    const coinsToDeduct = blocks * 200;

    if (currentCoins < coinsToDeduct) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins for ${blocks} conversion block(s). Required: ${coinsToDeduct} coins, Available: ${currentCoins} coins.`
      });
    }

    const rupeesEarned = blocks * 5;
    if (citizen) {
      citizen.coins -= coinsToDeduct;
      citizen.convertedRupees = (citizen.convertedRupees || 0) + rupeesEarned;
    }

    // Add Notification
    db.addNotification({
      userId: req.user.id,
      type: 'REWARD_EARNED',
      title: `💰 ₹${rupeesEarned} Converted from ${coinsToDeduct} Coins!`,
      message: `Successfully converted ${coinsToDeduct} Civic Coins into ₹${rupeesEarned} Rupees Cash / Municipal Utility Credit! Remaining balance: ${citizen?.coins || 0} coins.`,
    });

    res.json({
      success: true,
      message: `🎉 Successfully converted ${coinsToDeduct} coins into ₹${rupeesEarned} Rupees!`,
      coinsDeducted: coinsToDeduct,
      rupeesEarned,
      remainingCoins: citizen ? citizen.coins : currentCoins - coinsToDeduct,
      totalRupeesClaimed: citizen?.convertedRupees || rupeesEarned
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to convert coins', error: err.message });
  }
});

// 3. Get Citizen's Own Complaints (Role: CITIZEN or ADMIN)
router.get('/my', authenticateToken, (req, res) => {
  try {
    let complaints;
    if (req.user.role === 'ADMIN') {
      complaints = db.complaints;
    } else {
      complaints = db.getComplaints({ citizenId: req.user.id });
    }

    // Attach Master Issue details to each complaint for rich UI
    const enriched = complaints.map(c => {
      const master = db.getMasterIssueById(c.masterIssueId);
      const team = master?.assignedTeamId ? db.teams.find(t => t.id === master.assignedTeamId) : null;
      const authority = master?.assignedAuthorityId ? db.findUserById(master.assignedAuthorityId) : null;
      return {
        ...c,
        masterIssue: master,
        teamName: team?.name || 'Assigned Rapid Response Unit',
        authorityName: authority?.name || 'Zonal Authority'
      };
    });

    res.json({ success: true, count: enriched.length, complaints: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch complaints', error: err.message });
  }
});

// 4. Get Single Complaint Details with Strict Ownership Enforcement
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const complaint = db.getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Role-based Access Control & Ownership Verification
    if (req.user.role === 'CITIZEN' && complaint.citizenId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '403 Forbidden: You can only view and track your own citizen complaints.'
      });
    }

    const masterIssue = db.getMasterIssueById(complaint.masterIssueId);
    const timeline = masterIssue ? db.getTimelineUpdates(masterIssue.id) : [];
    const team = masterIssue?.assignedTeamId ? db.teams.find(t => t.id === masterIssue.assignedTeamId) : null;
    const authority = masterIssue?.assignedAuthorityId ? db.findUserById(masterIssue.assignedAuthorityId) : null;

    res.json({
      success: true,
      complaint,
      masterIssue,
      timeline,
      team,
      authority: authority ? { name: authority.name, phone: authority.phone, designation: authority.designation } : null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving complaint details', error: err.message });
  }
});

// 5. Citizen Resolution Verification (YES -> CLOSED / NO -> REOPENED)
router.post('/:id/verify-resolution', authenticateToken, requireRole('CITIZEN', 'ADMIN'), (req, res) => {
  try {
    const { isFixed, rejectionReason, verificationPhoto } = req.body;
    const complaint = db.getComplaintById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (req.user.role === 'CITIZEN' && complaint.citizenId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only verify your own complaints.' });
    }

    const master = db.getMasterIssueById(complaint.masterIssueId);

    if (isFixed) {
      // Confirmed by Citizen -> Mark as CLOSED / COMPLETED
      db.updateComplaint(complaint.id, { status: 'COMPLETED' });

      if (master) {
        db.updateMasterIssue(master.id, {
          status: 'COMPLETED',
          progress: 100,
          completedAt: new Date().toISOString()
        });

        // Update all related complaints in this master hub
        master.complaintIds.forEach(cId => {
          db.updateComplaint(cId, { status: 'COMPLETED' });
        });

        // Timeline event
        db.addTimelineUpdate({
          masterIssueId: master.id,
          action: 'CITIZEN_CONFIRMED_RESOLUTION',
          actor: `${req.user.name} (Citizen)`,
          details: `Citizen verified and confirmed resolution. Master Issue #${master.id} marked as COMPLETED.`
        });
      }

      // Notifications
      db.addNotification({
        userId: req.user.id,
        type: 'COMPLAINT_CLOSED',
        title: 'Issue Successfully Resolved & Closed 🎉',
        message: `Thank you for confirming resolution for ${complaint.roadName}. Your feedback helps improve civic life!`,
        issueId: master?.id
      });

      if (master?.assignedAuthorityId) {
        db.addNotification({
          userId: master.assignedAuthorityId,
          type: 'RESOLUTION_CONFIRMED',
          title: 'Citizen Confirmed Resolution ✅',
          message: `Citizen ${req.user.name} confirmed satisfactory resolution for ${master.roadName} (Master #${master.id}).`,
          issueId: master.id
        });
      }

      // Award +100 Civic Coins for resolution quality verification
      const verifyReward = db.awardCoins(
        req.user.id,
        100,
        `Verified fix for ${complaint.roadName}`
      ) || { coinsEarned: 100, totalCoins: (req.user.coins || 0) + 100 };

      // Audit Log
      db.addAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CITIZEN_VERIFY_SUCCESS',
        targetType: 'COMPLAINT',
        targetId: complaint.id,
        oldStatus: 'RESOLUTION SUBMITTED',
        newStatus: 'COMPLETED',
        details: `Citizen ${req.user.name} verified fix as successful. Earned +100 Civic Coins. Issue closed.`
      });

      return res.json({
        success: true,
        message: 'Resolution verified! The civic issue has been marked as COMPLETED. (+100 Coins Awarded 🎉)',
        status: 'COMPLETED',
        reward: {
          coinsEarned: 100,
          totalCoins: verifyReward.totalCoins,
          reason: 'Quality Resolution Verification'
        }
      });
    } else {
      // Rejected by Citizen -> Reopen Issue
      const reason = rejectionReason || 'Citizen inspected and indicated the problem is still not fixed.';

      db.updateComplaint(complaint.id, { status: 'REOPENED' });

      if (master) {
        db.updateMasterIssue(master.id, {
          status: 'REOPENED',
          progress: 40,
          priorityScore: Math.min(100, master.priorityScore + 10)
        });

        // Timeline update
        db.addTimelineUpdate({
          masterIssueId: master.id,
          action: 'CITIZEN_REJECTED_RESOLUTION',
          actor: `${req.user.name} (Citizen)`,
          details: `Citizen rejected resolution: "${reason}". Reopened with escalated priority.`
        });
      }

      // Notifications to Authority & Admin
      if (master?.assignedAuthorityId) {
        db.addNotification({
          userId: master.assignedAuthorityId,
          type: 'RESOLUTION_REJECTED',
          title: '⚠️ Citizen Rejected Resolution',
          message: `Citizen ${req.user.name} reported issue still not fixed on ${master.roadName}: "${reason}". Immediate re-inspection required.`,
          issueId: master.id
        });
      }

      // Audit Log
      db.addAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CITIZEN_REJECT_RESOLUTION',
        targetType: 'COMPLAINT',
        targetId: complaint.id,
        oldStatus: 'RESOLUTION SUBMITTED',
        newStatus: 'REOPENED',
        details: `Citizen rejected resolution: "${reason}". Issue reopened.`
      });

      return res.json({
        success: true,
        message: 'Issue has been REOPENED. Authority notified for mandatory re-inspection.',
        status: 'REOPENED'
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Resolution verification failed', error: err.message });
  }
});

// 6. Submit Citizen Feedback & Star Rating
router.post('/:id/feedback', authenticateToken, requireRole('CITIZEN'), (req, res) => {
  try {
    const { rating, comment } = req.body;
    const complaint = db.getComplaintById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const newFb = db.addFeedback({
      masterIssueId: complaint.masterIssueId,
      complaintId: complaint.id,
      citizenId: req.user.id,
      citizenName: req.user.name,
      rating: rating || 5,
      comment: comment || 'Thank you for resolving the issue!',
      category: complaint.category,
      roadName: complaint.roadName
    });

    res.status(201).json({ success: true, message: 'Thank you for your valuable feedback!', feedback: newFb });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Feedback submission failed', error: err.message });
  }
});

// 7. Get Citizen Notifications
router.get('/notifications/my', authenticateToken, (req, res) => {
  try {
    const notifs = db.getNotifications(req.user.id);
    res.json({ success: true, notifications: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: err.message });
  }
});

// 8. Mark Notification as Read
router.put('/notifications/:id/read', authenticateToken, (req, res) => {
  try {
    const notif = db.markNotificationRead(req.params.id, req.user.id);
    res.json({ success: true, notification: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification', error: err.message });
  }
});

export default router;
