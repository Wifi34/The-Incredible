import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Users,
  Building2,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Filter,
  FileText,
  UserPlus,
  ArrowUpRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminDashboard({ setCurrentTab }) {
  const { user, showToast } = useAuth();
  const [overview, setOverview] = useState(null);
  const [workTasks, setWorkTasks] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState('MONITORING');
  const [selectedWardFilter, setSelectedWardFilter] = useState('ALL');

  // New Authority Creation Form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('+91 98220 99884');
  const [newUserPassword, setNewUserPassword] = useState('Authority@123');
  const [newUserRole, setNewUserRole] = useState('AUTHORITY');
  const [newUserWard, setNewUserWard] = useState('ward_12');
  const [newUserDept, setNewUserDept] = useState('dept_roads');

  const fetchAdminData = async () => {
    try {
      const [overviewRes, workRes, authRes, auditRes] = await Promise.all([
        fetch('/api/admin/overview', {
          headers: { Authorization: `Bearer ${localStorage.getItem('civicsense_token')}` }
        }),
        fetch('/api/admin/work-monitoring', {
          headers: { Authorization: `Bearer ${localStorage.getItem('civicsense_token')}` }
        }),
        fetch('/api/admin/authorities-performance', {
          headers: { Authorization: `Bearer ${localStorage.getItem('civicsense_token')}` }
        }),
        fetch('/api/admin/audit-logs', {
          headers: { Authorization: `Bearer ${localStorage.getItem('civicsense_token')}` }
        })
      ]);

      const oData = await overviewRes.json();
      const wData = await workRes.json();
      const aData = await authRes.json();
      const lData = await auditRes.json();

      if (oData.success) setOverview(oData);
      if (wData.success) setWorkTasks(wData.tasks);
      if (aData.success) setAuthorities(aData.authorities);
      if (lData.success) setAuditLogs(lData.logs);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleEscalate = async (taskId) => {
    try {
      const res = await fetch(`/api/admin/escalate/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('civicsense_token')}`
        },
        body: JSON.stringify({ escalationReason: 'Admin emergency dispatch: High civic density & SLA breached.' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Task #${taskId} successfully escalated to Emergency High Priority!`, 'success');
        fetchAdminData();
      }
    } catch (err) {
      showToast('Escalation failed', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('civicsense_token')}`
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          phone: newUserPhone,
          password: newUserPassword,
          role: newUserRole,
          wardId: newUserWard,
          departmentId: newUserDept
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setNewUserName('');
        setNewUserEmail('');
        fetchAdminData();
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('User creation error', 'error');
    }
  };

  const filteredTasks = workTasks.filter(t => {
    if (selectedWardFilter === 'ALL') return true;
    return t.wardId === selectedWardFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-purple-700 font-bold uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
              Chief Municipal Administrator Command • Pune HQ
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            CivicLens City-Wide Work Monitoring Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time oversight of all 4 municipal wards, field maintenance teams, active SLA breaches, and officer KPIs.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200">
          {[
            { id: 'MONITORING', label: 'Work Center' },
            { id: 'HOTSPOTS', label: 'Civic Hotspots' },
            { id: 'PERFORMANCE', label: 'Officer KPIs' },
            { id: 'USERS', label: 'Accounts' },
            { id: 'AUDIT', label: 'Audit Logs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                adminTab === tab.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* High-Level Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase">Total Active Work</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{overview?.stats?.activeWork || 84}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Tasks ongoing</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-emerald-600 uppercase">Completed Today</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{overview?.stats?.completedToday || 31}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Verified fixes</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-rose-600 uppercase">Delayed Tasks</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{overview?.stats?.delayedTasks || 7}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Over SLA target</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-rose-600 uppercase">Critical (81–100)</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{overview?.stats?.criticalIssues || 12}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Urgent hazards</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-amber-600 uppercase">SLA Breached</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{overview?.stats?.slaBreached || 4}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Escalation ready</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-indigo-700 uppercase">High-Density Roads</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{overview?.stats?.highComplaintRoads || 9}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">&gt; 5 reports each</div>
        </div>
      </div>

      {/* TAB 1: Work Monitoring Center */}
      {adminTab === 'MONITORING' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span>Active Work Monitoring Grid</span>
            </h3>

            {/* Ward Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Ward:</span>
              <select
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 shadow-xs"
              >
                <option value="ALL">All Wards (System-wide)</option>
                <option value="ward_12">Ward 12 (Shivaji Nagar)</option>
                <option value="ward_8">Ward 8 (Laxmi Road)</option>
                <option value="ward_7">Ward 7 (Kalyani Nagar)</option>
                <option value="ward_5">Ward 5 (Kasba Peth)</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Road Hub & Location</th>
                    <th className="px-5 py-3.5">Ward / Dept</th>
                    <th className="px-5 py-3.5">Authority & Team</th>
                    <th className="px-5 py-3.5">Complaints</th>
                    <th className="px-5 py-3.5">Live Progress</th>
                    <th className="px-5 py-3.5">Status & SLA</th>
                    <th className="px-5 py-3.5 text-right">Escalation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTasks.map((task) => {
                    const isSlaBreached = task.slaStatus === 'BREACHED';
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{task.roadName}</div>
                          <div className="text-[11px] text-slate-500">{task.landmark}</div>
                          <span className="inline-block text-[10px] font-mono text-purple-700 mt-0.5 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                            {task.masterCode}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-800">{task.wardName?.split('-')[0]}</div>
                          <div className="text-[11px] text-slate-500">{task.departmentName}</div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-800">{task.authorityName || 'Unassigned'}</div>
                          <div className="text-[11px] text-blue-700">{task.teamName || 'No Team Dispatched'}</div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-extrabold text-blue-700">{task.complaintCount} Reports</div>
                          <div className="text-[10px] text-slate-500">{task.affectedCitizens} Citizens</div>
                        </td>

                        <td className="px-5 py-4 min-w-[130px]">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                            <span>{task.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                              isSlaBreached
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {task.slaStatus}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">
                            {task.status}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleEscalate(task.id)}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 transition-all"
                          >
                            🚨 Escalate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Emerging Hotspots */}
      {adminTab === 'HOTSPOTS' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-600" />
            <span>Emerging Municipal Hotspots (+40% Growth Rate)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workTasks.filter(t => t.isHotspot).map((hotspot) => (
              <div key={hotspot.id} className="p-6 rounded-3xl bg-white border border-rose-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-extrabold">
                        🔥 {hotspot.hotspotGrowth} Growth
                      </span>
                      <span className="text-xs font-mono text-slate-500">{hotspot.masterCode}</span>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 mt-1.5">{hotspot.roadName}</h4>
                    <p className="text-xs text-slate-500">{hotspot.landmark}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-rose-600">{hotspot.complaintCount}</span>
                    <div className="text-[10px] text-slate-500 font-semibold">Complaints</div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  Heavy cluster surge detected by AI Spatial Engine. Dispatched squad workload increased.
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Ward: <strong className="text-slate-800">{hotspot.wardName}</strong></span>
                  <button
                    onClick={() => handleEscalate(hotspot.id)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Deploy Emergency Unit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Authority Officer Performance KPIs */}
      {adminTab === 'PERFORMANCE' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <span>Zonal Authority Officer Performance & SLA Scorecard</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {authorities.map((auth) => (
              <div key={auth.authorityId} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{auth.name}</h4>
                    <p className="text-xs text-amber-700 font-semibold">{auth.designation}</p>
                    <p className="text-[10px] text-slate-500">{auth.departmentName}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {auth.badgeNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Assigned</div>
                    <div className="text-sm font-extrabold text-slate-900">{auth.totalAssigned}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Completed</div>
                    <div className="text-sm font-extrabold text-emerald-600">{auth.completed}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">In Progress</div>
                    <div className="text-sm font-extrabold text-blue-700">{auth.inProgress}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Delayed / SLA</div>
                    <div className="text-sm font-extrabold text-rose-600">{auth.delayed}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <span>Avg Resolution: <strong className="text-slate-900">{auth.averageResolutionHours}h</strong></span>
                  <span>Compliance: <strong className="text-emerald-600 font-bold">{auth.slaCompliancePercentage}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: User Accounts & Authority Provisioning */}
      {adminTab === 'USERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleCreateUser} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" />
              <span>Provision Authority / Admin Account</span>
            </h3>
            <p className="text-xs text-slate-500">
              Only Administrators can create Authority and Municipal Supervisor accounts. Public users register as CITIZEN only.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Full Name & Title</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Officer Sunita Kulkarni"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Official Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. authority.new@civicsense.gov"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 font-semibold block mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  >
                    <option value="AUTHORITY">AUTHORITY (Zonal Officer)</option>
                    <option value="ADMIN">ADMIN (Municipal Director)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-semibold block mb-1">Ward Jurisdiction</label>
                  <select
                    value={newUserWard}
                    onChange={(e) => setNewUserWard(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500"
                  >
                    <option value="ward_12">Ward 12</option>
                    <option value="ward_8">Ward 8</option>
                    <option value="ward_7">Ward 7</option>
                    <option value="ward_5">Ward 5</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all"
              >
                Create Official Account
              </button>
            </div>
          </form>

          {/* Persona quick switch notice */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-3 flex flex-col justify-between shadow-sm">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900">Pre-Configured System Accounts</h4>
              <p className="text-xs text-slate-500">
                You can switch between predefined test personas anytime from the top navigation bar dropdown.
              </p>
              <div className="space-y-2 pt-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between">
                  <span><strong className="text-slate-900">Rahul Sharma</strong> (Citizen)</span>
                  <span className="text-blue-700 font-semibold">citizen@civicsense.gov</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between">
                  <span><strong className="text-slate-900">Officer Rajesh</strong> (Authority)</span>
                  <span className="text-amber-700 font-semibold">authority.roads@civicsense.gov</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between">
                  <span><strong className="text-slate-900">Dr. K. Mehta</strong> (Admin)</span>
                  <span className="text-purple-700 font-semibold">admin@civicsense.gov</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Audit Logs */}
      {adminTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Immutable System-Wide Audit Log History</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono font-semibold">{auditLogs.length} Records</span>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 max-h-[500px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-700">{log.action}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                      {log.userRole}: {log.userName}
                    </span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
