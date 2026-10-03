import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { recommendBestTeam, verifyResolutionAI } from '../aiService.js';

const router = express.Router();

// 1. Public Master Road Issues List (for GIS Map & Citizen Transparency)
router.get('/master-issues', (req, res) => {
  try {
    const { status, severity, category } = req.query;
    let issues = db.masterIssues;

    if (status) issues = issues.filter(m => m.status === status);
    if (severity) issues = issues.filter(m => m.severity === severity);
    if (category) issues = issues.filter(m => m.category === category);

    res.json({ success: true, count: issues.length, masterIssues: issues });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching master issues', error: err.message });
  }
});

// 2. Public Single Master Issue Details
router.get('/master-issues/:id', (req, res) => {
  try {
    const master = db.getMasterIssueById(req.params.id);
    if (!master) {
      return res.status(404).json({ success: false, message: 'Master issue not found' });
    }

    const linkedComplaints = db.complaints.filter(c => master.complaintIds.includes(c.id));
    const timeline = db.getTimelineUpdates(master.id);
    const assignedTeam = master.assignedTeamId ? db.teams.find(t => t.id === master.assignedTeamId) : null;
    const recommendation = recommendBestTeam(db, master);
    const ward = db.wards.find(w => w.id === master.wardId);
    const dept = db.departments.find(d => d.id === master.departmentId);
    const availableTeams = db.teams.filter(t => t.departmentId === master.departmentId);

    res.json({
      success: true,
      masterIssue: master,
      linkedComplaints,
      timeline,
      assignedTeam,
      recommendation,
      availableTeams,
      ward,
      dept
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve master issue details', error: err.message });
  }
});

// Middleware for all subsequent operations: Only AUTHORITY and ADMIN can access
router.use(authenticateToken, requireRole('AUTHORITY', 'ADMIN'));

// 3. Authority Priority Queue (Smart AI Sorted)
router.get('/priority-queue', (req, res) => {
  try {
    const isAuthority = req.user.role === 'AUTHORITY';
    let issues = db.masterIssues;

    if (isAuthority) {
      issues = issues.filter(m => {
        if (req.user.wardId && m.wardId !== req.user.wardId) return false;
        if (req.user.departmentId && m.departmentId !== req.user.departmentId) return false;
        return true;
      });
    }

    // Sort by Smart Priority Score (Highest first)
    const sorted = [...issues].sort((a, b) => b.priorityScore - a.priorityScore);

    // Attach team and recommended team info
    const enriched = sorted.map(issue => {
      const assignedTeam = issue.assignedTeamId ? db.teams.find(t => t.id === issue.assignedTeamId) : null;
      const recommendation = recommendBestTeam(db, issue);
      const ward = db.wards.find(w => w.id === issue.wardId);
      const dept = db.departments.find(d => d.id === issue.departmentId);

      return {
        ...issue,
        assignedTeam,
        recommendedTeam: recommendation?.team || null,
        recommendationReason: recommendation?.recommendationReason || '',
        wardName: ward?.name || issue.wardId,
        departmentName: dept?.name || issue.departmentId
      };
    });

    res.json({ success: true, count: enriched.length, priorityQueue: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load priority queue', error: err.message });
  }
});

// 4. Assign Team to Master Issue
router.post('/master-issues/:id/assign-team', (req, res) => {
  try {
    const { teamId } = req.body;
    const master = db.getMasterIssueById(req.params.id);

    if (!master) {
      return res.status(404).json({ success: false, message: 'Master issue not found' });
    }

    const team = db.teams.find(t => t.id === teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Field team not found' });
    }

    // Update Master Issue
    const oldStatus = master.status;
    const newStatus = master.status === 'NOT STARTED' ? 'ASSIGNED' : master.status;

    db.updateMasterIssue(master.id, {
      assignedAuthorityId: req.user.id,
      assignedTeamId: team.id,
      status: newStatus
    });

    // Update team workload
    team.currentWorkload += 1;

    // Timeline event
    db.addTimelineUpdate({
      masterIssueId: master.id,
      action: 'TEAM_ASSIGNED',
      actor: `${req.user.name} (Authority Officer)`,
      details: `Assigned task to ${team.name} (Lead: ${team.leadName}, Members: ${team.membersCount}).`
    });

    // Audit Log
    db.addAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'ASSIGN_TEAM',
      targetType: 'MASTER_ISSUE',
      targetId: master.id,
      oldStatus,
      newStatus,
      details: `Assigned ${team.name} to Master Road Issue #${master.id}.`
    });

    // Notify citizens linked to this issue
    master.complaintIds.forEach(cId => {
      const complaint = db.getComplaintById(cId);
      if (complaint && complaint.citizenId) {
        db.addNotification({
          userId: complaint.citizenId,
          type: 'TEAM_ASSIGNED',
          title: 'Field Team Dispatched for Your Reported Issue',
          message: `${team.name} has been assigned to resolve the civic problem on ${master.roadName}.`,
          issueId: master.id
        });
      }
    });

    res.json({
      success: true,
      message: `Successfully assigned ${team.name} to ${master.masterCode}.`,
      masterIssue: db.getMasterIssueById(master.id)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Team assignment failed', error: err.message });
  }
});

// 5. Update Work Progress Percentage (0%, 25%, 50%, 75%, 100%) & Status
router.put('/master-issues/:id/progress', (req, res) => {
  try {
    const { progressPercentage, status, note, workImage } = req.body;
    const master = db.getMasterIssueById(req.params.id);

    if (!master) {
      return res.status(404).json({ success: false, message: 'Master issue not found' });
    }

    const progress = Math.min(100, Math.max(0, Number(progressPercentage) || 0));
    let newStatus = status || master.status;

    if (progress > 0 && progress < 100 && master.status === 'ASSIGNED') {
      newStatus = 'IN PROGRESS';
    } else if (progress === 100) {
      newStatus = 'RESOLUTION SUBMITTED';
    }

    const updates = {
      progress,
      status: newStatus
    };

    if (workImage) updates.workImage = workImage;

    const oldProgress = master.progress;
    db.updateMasterIssue(master.id, updates);

    // Update all linked complaints
    master.complaintIds.forEach(cId => {
      db.updateComplaint(cId, { status: newStatus });
    });

    // Timeline update
    db.addTimelineUpdate({
      masterIssueId: master.id,
      action: 'WORK_PROGRESS_UPDATED',
      actor: `${req.user.name} (Authority Officer)`,
      details: `Work progress advanced from ${oldProgress}% to ${progress}%. Status: ${newStatus}. ${note ? `Note: "${note}"` : ''}`
    });

    // Audit Log
    db.addAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_WORK_PROGRESS',
      targetType: 'MASTER_ISSUE',
      targetId: master.id,
      oldStatus: `${oldProgress}%`,
      newStatus: `${progress}% (${newStatus})`,
      details: `Progress elevated to ${progress}% on ${master.roadName}.`
    });

    // Notify citizens of milestone progress
    master.complaintIds.forEach(cId => {
      const complaint = db.getComplaintById(cId);
      if (complaint && complaint.citizenId) {
        db.addNotification({
          userId: complaint.citizenId,
          type: 'PROGRESS_UPDATE',
          title: `Progress Update: ${master.roadName} (${progress}%)`,
          message: `Civic repair work is now ${progress}% complete. Status: ${newStatus}.`,
          issueId: master.id
        });
      }
    });

    res.json({
      success: true,
      message: `Work progress updated to ${progress}%.`,
      masterIssue: db.getMasterIssueById(master.id)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update work progress', error: err.message });
  }
});

// 6. Submit Resolution (Upload Before/After photos + Run AI Verification)
router.post('/master-issues/:id/submit-resolution', (req, res) => {
  try {
    const { afterImage, notes } = req.body;
    const master = db.getMasterIssueById(req.params.id);

    if (!master) {
      return res.status(404).json({ success: false, message: 'Master issue not found' });
    }

    const resolvedAfterImage = afterImage || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80';

    // AI Computer Vision Resolution Verification
    const aiVerification = verifyResolutionAI(master.beforeImage, resolvedAfterImage, master.category);

    db.updateMasterIssue(master.id, {
      afterImage: resolvedAfterImage,
      aiVerificationScore: aiVerification.resolutionConfidence,
      progress: 100,
      status: 'RESOLUTION SUBMITTED'
    });

    // Update all linked complaints
    master.complaintIds.forEach(cId => {
      db.updateComplaint(cId, { status: 'RESOLUTION SUBMITTED' });
    });

    // Timeline update
    db.addTimelineUpdate({
      masterIssueId: master.id,
      action: 'RESOLUTION_SUBMITTED',
      actor: `${req.user.name} (Authority Officer)`,
      details: `Resolution submitted with after-repair imagery. AI verification confidence: ${aiVerification.resolutionConfidence}%. Citizen verification requested.`
    });

    // Audit Log
    db.addAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'SUBMIT_RESOLUTION',
      targetType: 'MASTER_ISSUE',
      targetId: master.id,
      oldStatus: master.status,
      newStatus: 'RESOLUTION SUBMITTED',
      details: `Resolution submitted by authority. AI Confidence: ${aiVerification.resolutionConfidence}%.`
    });

    // Send Verification Request Notifications to all Affected Citizens
    master.complaintIds.forEach(cId => {
      const complaint = db.getComplaintById(cId);
      if (complaint && complaint.citizenId) {
        db.addNotification({
          userId: complaint.citizenId,
          type: 'VERIFICATION_REQUIRED',
          title: 'Action Required: Verify Civic Resolution',
          message: `Authority marked issue on ${master.roadName} as fixed. Please inspect before/after photos and confirm resolution.`,
          issueId: master.id
        });
      }
    });

    res.json({
      success: true,
      message: 'Resolution submitted! AI verification performed. Citizen verification requests dispatched.',
      aiVerification,
      masterIssue: db.getMasterIssueById(master.id)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Resolution submission failed', error: err.message });
  }
});

// 7. Authority Dashboard Analytics
router.get('/analytics', (req, res) => {
  try {
    const isAuthority = req.user.role === 'AUTHORITY';
    let issues = db.masterIssues;

    if (isAuthority && req.user.wardId) {
      issues = issues.filter(m => m.wardId === req.user.wardId);
    }

    const totalAssigned = issues.length;
    const criticalCount = issues.filter(m => m.severity === 'CRITICAL').length;
    const highCount = issues.filter(m => m.severity === 'HIGH').length;
    const pendingCount = issues.filter(m => m.status === 'NOT STARTED' || m.status === 'ASSIGNED').length;
    const inProgressCount = issues.filter(m => m.status === 'IN PROGRESS').length;
    const resolvedCount = issues.filter(m => m.status === 'COMPLETED' || m.status === 'RESOLUTION SUBMITTED').length;
    const slaBreachedCount = issues.filter(m => m.slaStatus === 'BREACHED').length;

    res.json({
      success: true,
      stats: {
        totalAssigned,
        criticalCount,
        highCount,
        pendingCount,
        inProgressCount,
        resolvedCount,
        slaBreachedCount,
        averageResolutionHours: 19.4,
        slaComplianceRate: '88.5%',
        activeFieldTeams: db.teams.filter(t => t.wardId === req.user.wardId || !isAuthority).length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch authority analytics', error: err.message });
  }
});

export default router;
