import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Wrench,
  Sparkles,
  ArrowRight,
  Filter,
  Building2,
  Layers,
  MapPin,
  TrendingUp,
  Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { InteractiveMap } from '../components/InteractiveMap';

export function AuthorityDashboard({ setCurrentTab }) {
  const { user, showToast } = useAuth();
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [activeTab, setActiveTab] = useState('QUEUE');
  const [progressValue, setProgressValue] = useState(75);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [afterImageUrl, setAfterImageUrl] = useState('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80');

  const fetchAuthorityData = async () => {
    try {
      const [queueRes, statsRes] = await Promise.all([
        fetch('/api/authority/priority-queue', {
          headers: { Authorization: `Bearer ${localStorage.getItem('civicsense_token')}` }
        }),
        fetch('/api/authority/analytics', {
          headers: { Authorization: `Bearer ${localStorage.getItem('civicsense_token')}` }
        })
      ]);

      const queueData = await queueRes.json();
      const statsData = await statsRes.json();

      if (queueData.success) {
        setPriorityQueue(queueData.priorityQueue);
        if (queueData.priorityQueue.length > 0 && !selectedIssue) {
          setSelectedIssue(queueData.priorityQueue[0]);
          setProgressValue(queueData.priorityQueue[0].progress || 0);
          setSelectedTeamId(queueData.priorityQueue[0].assignedTeamId || queueData.priorityQueue[0].recommendedTeam?.id || '');
        }
      }
      if (statsData.success) setStats(statsData.stats);
    } catch (err) {
      console.error('Error loading authority data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorityData();
  }, []);

  const handleAssignTeam = async (issueId, teamId) => {
    try {
      const res = await fetch(`/api/authority/master-issues/${issueId}/assign-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('civicsense_token')}`
        },
        body: JSON.stringify({ teamId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchAuthorityData();
      }
    } catch (err) {
      showToast('Assignment error', 'error');
    }
  };

  const handleUpdateProgress = async (issueId, newProgress) => {
    try {
      const res = await fetch(`/api/authority/master-issues/${issueId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('civicsense_token')}`
        },
        body: JSON.stringify({ progressPercentage: newProgress })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchAuthorityData();
      }
    } catch (err) {
      showToast('Progress update error', 'error');
    }
  };

  const handleSubmitResolution = async (issueId) => {
    try {
      const res = await fetch(`/api/authority/master-issues/${issueId}/submit-resolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('civicsense_token')}`
        },
        body: JSON.stringify({ afterImage: afterImageUrl })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchAuthorityData();
      }
    } catch (err) {
      showToast('Resolution submission error', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Officer Jurisdiction Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-amber-700 font-bold uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
              {user?.designation || 'Zonal Authority Officer'} • Badge: {user?.badgeNumber || 'AUTH-RD-1204'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Authority Command & Priority Queue
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Road-level aggregated master hubs ranked dynamically by AI impact score & citizen report volume.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'QUEUE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Priority Queue
          </button>
          <button
            onClick={() => setActiveTab('MAP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MAP'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ward Telemetry Map
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase">Total Issues</div>
          <div className="text-xl font-black text-slate-900 mt-1">{stats?.totalAssigned || priorityQueue.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-rose-600 uppercase">Critical (81–100)</div>
          <div className="text-xl font-black text-rose-600 mt-1">{stats?.criticalCount || 2}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-orange-600 uppercase">High Priority</div>
          <div className="text-xl font-black text-orange-600 mt-1">{stats?.highCount || 1}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-amber-600 uppercase">Pending</div>
          <div className="text-xl font-black text-amber-600 mt-1">{stats?.pendingCount || 1}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-blue-600 uppercase">In Progress</div>
          <div className="text-xl font-black text-blue-600 mt-1">{stats?.inProgressCount || 2}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-emerald-600 uppercase">Resolved</div>
          <div className="text-xl font-black text-emerald-600 mt-1">{stats?.resolvedCount || 1}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-rose-600 uppercase">SLA Breached</div>
          <div className="text-xl font-black text-rose-600 mt-1">{stats?.slaBreachedCount || 1}</div>
        </div>
      </div>

      {activeTab === 'MAP' ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Authorized Jurisdiction Live Map</h3>
          <InteractiveMap
            masterIssues={priorityQueue}
            onSelectIssue={(issue) => {
              setSelectedIssue(issue);
              setActiveTab('QUEUE');
            }}
          />
        </div>
      ) : (
        /* Priority Queue Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Smart Priority Queue List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>AI Dynamic Priority Queue</span>
                <span className="text-xs font-mono text-amber-800 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 font-bold">
                  {priorityQueue.length} Active Hubs
                </span>
              </h3>
            </div>

            <div className="space-y-3">
              {priorityQueue.map((item, index) => {
                const isSelected = selectedIssue?.id === item.id;
                const isCritical = item.priorityScore >= 81;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedIssue(item);
                      setProgressValue(item.progress || 0);
                      setSelectedTeamId(item.assignedTeamId || item.recommendedTeam?.id || '');
                    }}
                    className={`p-4 rounded-2xl cursor-pointer border transition-all shadow-xs space-y-3 ${
                      isSelected
                        ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-300/40 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-700">
                          #{index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                          {item.roadName}
                        </span>
                      </div>

                      <div
                        className={`px-2 py-0.5 rounded-lg text-xs font-extrabold uppercase border ${
                          isCritical
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}
                      >
                        Priority {item.priorityScore}/100
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                      <div>
                        <span className="text-slate-500">Reports: </span>
                        <strong className="text-blue-700 font-bold">{item.complaintCount} Complaints</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Affected: </span>
                        <strong className="text-indigo-700 font-bold">{item.affectedCitizens} Citizens</strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                        <span>Work Progress ({item.status})</span>
                        <span className="text-blue-600 font-bold">{item.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Master Issue Management Center */}
          {selectedIssue && (
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                {/* Header info */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                        {selectedIssue.masterCode}
                      </span>
                      {selectedIssue.isHotspot && (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          🔥 HOTSPOT {selectedIssue.hotspotGrowth}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">
                      {selectedIssue.roadName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedIssue.landmark}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-rose-600">
                      {selectedIssue.priorityScore}/100
                    </div>
                    <div className="text-[10px] font-extrabold uppercase text-slate-500">
                      AI SEVERITY: {selectedIssue.severity}
                    </div>
                  </div>
                </div>

                {/* Road Impact & Aggregation Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold">Total Reports</div>
                    <div className="text-base font-black text-blue-700">{selectedIssue.complaintCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold">Affected Citizens</div>
                    <div className="text-base font-black text-indigo-700">{selectedIssue.affectedCitizens}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold">SLA Status</div>
                    <div className={`text-xs font-bold mt-1 ${selectedIssue.slaStatus === 'BREACHED' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {selectedIssue.slaStatus}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold">Assigned Team</div>
                    <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                      {selectedIssue.assignedTeam?.name || 'Pending Dispatch'}
                    </div>
                  </div>
                </div>

                {/* Team Assignment Drawer */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      <span>AI-Recommended Field Team Assignment</span>
                    </label>
                    <span className="text-[11px] text-slate-500">Matched by Department & Distance</span>
                  </div>

                  {selectedIssue.recommendedTeam && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Recommended: {selectedIssue.recommendedTeam.name}</span>
                        <div className="text-[11px] text-slate-600 mt-0.5">{selectedIssue.recommendationReason}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Select Field Maintenance Team...</option>
                      <option value="team_road_3">Road Maintenance Team #3 (Lead: Er. Suresh Kadam - 2.4 km away - 4 tasks)</option>
                      <option value="team_road_1">Rapid Asphalt Patch Team #1 (Lead: Mahesh Jadhav - 4.1 km away)</option>
                      <option value="team_san_2">Sanitation Rapid Response Unit #2 (Lead: Nitin Gaikwad - 1.8 km away)</option>
                      <option value="team_elec_4">Electrical & Signal Crew #4 (Lead: Vijay More - 3.2 km away)</option>
                      <option value="team_drain_1">Drainage & Monsoon Emergency Unit (Lead: Ganesh Shinde - 1.2 km away)</option>
                    </select>

                    <button
                      onClick={() => handleAssignTeam(selectedIssue.id, selectedTeamId)}
                      disabled={!selectedTeamId}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs transition-all whitespace-nowrap"
                    >
                      [ASSIGN TEAM]
                    </button>
                  </div>
                </div>

                {/* Work Progress Controller */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Live Work Progress Percentage (0% — 100%)</span>
                    </label>
                    <span className="text-sm font-black text-blue-700">{progressValue}% Complete</span>
                  </div>

                  {/* Progress Buttons Row */}
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setProgressValue(pct);
                          handleUpdateProgress(selectedIssue.id, pct);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          progressValue === pct
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${progressValue}%` }}
                    />
                  </div>
                </div>

                {/* Resolution Submission & Before/After Upload */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload Post-Repair Image & Submit Resolution</span>
                    </label>
                    <span className="text-[11px] text-slate-500">AI Verification Required</span>
                  </div>

                  <input
                    type="text"
                    value={afterImageUrl}
                    onChange={(e) => setAfterImageUrl(e.target.value)}
                    placeholder="Paste restored surface image URL..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />

                  <button
                    onClick={() => handleSubmitResolution(selectedIssue.id)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Upload Resolution Photo & Run AI Quality Audit</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
