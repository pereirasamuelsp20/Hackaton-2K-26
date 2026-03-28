import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../../store/useAppStore';
import {
  Activity, Users, Bed, CheckCircle, Clock, BarChart3,
  UserCog, FileOutput, Printer, ChevronRight, AlertCircle, Flag
} from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5001/api';

const VIEWS = [
  { id: 'overview',   label: 'Macro Overview', icon: BarChart3 },
  { id: 'staff_mgmt', label: 'Add Members',    icon: Users },
  { id: 'staff',      label: 'Staff Matrix',   icon: UserCog },
  { id: 'handover',   label: 'Shift Handover', icon: FileOutput },
  { id: 'flags',      label: 'Flags & Delays', icon: Flag },
];

const STAFF = [
  { name: 'Dr. Ananya',    role: 'Doctor',   ward: 'Cardiology Ward',      shift: 'Morning', avatar: 'A' },
  { name: 'Nurse Siddhi',  role: 'Nurse',    ward: 'Neurology Ward',       shift: 'Morning', avatar: 'S' },
  { name: 'Dr. Rajan',     role: 'Doctor',   ward: 'Pediatrics Ward',      shift: 'Evening', avatar: 'R' },
  { name: 'Nurse Priya',   role: 'Nurse',    ward: 'Cardiology Ward',      shift: 'Evening', avatar: 'P' },
  { name: 'Cleaner Aditya',role: 'Cleaning', ward: 'All Wards',            shift: 'Morning', avatar: 'C' },
  { name: 'Dr. Fernando',  role: 'Doctor',   ward: 'General Surgery Ward', shift: 'Night',   avatar: 'F' },
];

const STATUS_COLORS = {
  AVAILABLE:     'bg-green-500/20 text-green-400 border-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.3)]',
  OCCUPIED:      'bg-red-500/20 text-red-500 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
  RESERVED:      'bg-blue-500/20 text-blue-400 border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  NEEDS_CLEANING:'bg-yellow-500/20 text-yellow-400 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
  IN_CLEANING:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
};

export default function AdminDashboard() {
  const { wards, fetchWards, requestReview, patients, fetchPatients } = useAppStore();
  const [activeView, setActiveView] = useState('overview');
  const [selectedWard, setSelectedWard] = useState(null);
  const [wardBeds, setWardBeds] = useState([]);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const [staffAssignments, setStaffAssignments] = useState(
    Object.fromEntries(STAFF.map(s => [s.name, s.ward]))
  );
  const [dbStaff, setDbStaff] = useState([]);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '', role: 'Doctor' });
  const [creatingMember, setCreatingMember] = useState(false);

  useEffect(() => { 
    fetchWards(); 
    fetchPatients(); 
    fetchDbStaff();
  }, [fetchWards, fetchPatients]);

  const fetchDbStaff = async () => {
    try {
      const res = await axios.get(`${API}/auth/staff`);
      setDbStaff(res.data);
    } catch (e) { console.error('Error fetching staff list'); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setCreatingMember(true);
    try {
      await axios.post(`${API}/auth/register`, newMember);
      await fetchDbStaff();
      setNewMember({ name: '', email: '', password: '', role: 'Doctor' });
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to add member');
    } finally {
      setCreatingMember(false);
    }
  };

  const handleRequestReviewAdmin = async (patientId) => {
    await requestReview(patientId);
    if (selectedWard) {
      handleWardClick(selectedWard);
    }
    fetchPatients();
  };

  const handleWardClick = async (ward) => {
    setSelectedWard(ward);
    setLoadingBeds(true);
    try {
      const res = await axios.get(`${API}/wards/${ward.id}/beds`);
      setWardBeds(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingBeds(false); }
  };

  const totalStats = wards.reduce((acc, w) => ({
    total:     acc.total     + (w.stats?.total || 0),
    occupied:  acc.occupied  + (w.stats?.occupied || 0),
    available: acc.available + (w.stats?.available || 0),
    cleaning:  acc.cleaning  + (w.stats?.cleaning || 0),
  }), { total: 0, occupied: 0, available: 0, cleaning: 0 });

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-10">
      {/* View Tabs */}
      <div className="flex gap-1 bg-white/3 p-1 rounded-2xl border border-white/5 w-fit">
        {VIEWS.map(v => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => { setActiveView(v.id); setSelectedWard(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeView === v.id
                  ? 'bg-white/10 text-white border border-white/10 shadow'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              }`}
            >
              <Icon size={15} />
              {v.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >

          {/* ── VIEW: STAFF MANAGEMENT (NEW) ── */}
          {activeView === 'staff_mgmt' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Card */}
              <div className="lg:col-span-1 glass p-6 rounded-3xl border border-white/10 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 blur-[60px] rounded-full pointer-events-none" />
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                  <Activity size={20} className="text-neon-purple" /> Add New Staff
                </h3>
                <form onSubmit={handleAddMember} className="space-y-4 relative z-10">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block ml-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={newMember.name}
                      onChange={e => setNewMember({...newMember, name: e.target.value})}
                      placeholder="e.g. Dr. John Doe"
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block ml-1">Email Address</label>
                    <input 
                      required
                      type="email" 
                      value={newMember.email}
                      onChange={e => setNewMember({...newMember, email: e.target.value})}
                      placeholder="john@wardwatch.com"
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block ml-1">Initial Access Key</label>
                    <input 
                      required
                      type="password" 
                      value={newMember.password}
                      onChange={e => setNewMember({...newMember, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block ml-1">Operational Role</label>
                    <select 
                      value={newMember.role}
                      onChange={e => setNewMember({...newMember, role: e.target.value})}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                    >
                      <option value="DOCTOR">Doctor</option>
                      <option value="NURSE">Nurse</option>
                      <option value="CLEANING">Cleaning Staff</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={creatingMember}
                    className="w-full bg-linear-to-r from-neon-blue to-neon-purple text-white font-black py-3.5 rounded-xl shadow-lg mt-2 transition-all disabled:opacity-50"
                  >
                    {creatingMember ? 'Initializing Member...' : 'Register Member'}
                  </motion.button>
                </form>
              </div>

              {/* Staff List */}
              <div className="lg:col-span-2 glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-white/5 bg-white/3 flex justify-between items-center">
                  <h3 className="text-lg font-black text-white">Registered Team Members</h3>
                  <span className="text-xs bg-neon-blue/20 text-neon-blue px-3 py-1 rounded-full font-bold">{dbStaff.length} Total</span>
                </div>
                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {dbStaff.map(member => (
                    <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/3 transition group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-neon-blue/20 to-neon-purple/20 flex items-center justify-center font-bold text-neon-blue border border-white/10">
                          {member.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-neon-blue transition-colors">{member.name}</div>
                          <div className="text-xs text-zinc-500">{member.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border ${
                          (member.role?.toUpperCase() === 'ADMINISTRATOR' || member.role?.toUpperCase() === 'ADMIN') ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                          (member.role?.toUpperCase() === 'DOCTOR') ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30' :
                          (member.role?.toUpperCase() === 'NURSE') ? 'bg-pink-500/10 text-pink-400 border-pink-500/30' :
                          'bg-orange-500/10 text-orange-400 border-orange-500/30'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))}
                  {dbStaff.length === 0 && (
                    <div className="py-20 text-center text-zinc-500 italic">No members found in operation registry.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW: MACRO OVERVIEW ── */}
          {activeView === 'overview' && (
            <div>
              {/* Global KPI Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Capacity', value: totalStats.total,     icon: Bed,         color: 'text-zinc-400'  },
                  { label: 'Occupied',        value: totalStats.occupied,  icon: Users,       color: 'text-neon-blue' },
                  { label: 'Available',       value: totalStats.available, icon: CheckCircle, color: 'text-green-400' },
                  { label: 'Needs Cleaning',  value: totalStats.cleaning,  icon: Clock,       color: 'text-red-400'   },
                ].map(kpi => {
                  const Icon = kpi.icon;
                  return (
                    <div key={kpi.label} className="glass rounded-2xl p-4 border border-white/5">
                      <div className={`flex items-center gap-2 text-xs font-semibold mb-2 ${kpi.color}`}>
                        <Icon size={14} /> {kpi.label}
                      </div>
                      <div className={`text-4xl font-black ${kpi.color}`}>{kpi.value}</div>
                    </div>
                  );
                })}
              </div>

              {/* Ward Cards or Bed Detail */}
              {!selectedWard ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {wards.map(ward => (
                    <motion.div
                      key={ward.id}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleWardClick(ward)}
                      className="glass p-6 rounded-3xl cursor-pointer border border-white/5 hover:border-white/15 transition-all relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-linear-to-br from-neon-blue/0 to-neon-purple/0 group-hover:from-neon-blue/8 group-hover:to-neon-purple/8 transition-all duration-500" />
                      <div className="flex items-center justify-between mb-5 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-white/8 rounded-xl">
                            <Activity className="text-neon-blue" size={22} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-white">{ward.name}</h3>
                            <p className="text-zinc-500 text-xs">Capacity: {ward.capacity} Beds</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-300 transition" />
                      </div>
                      {/* Occupancy bar */}
                      <div className="mb-4 relative z-10">
                        <div className="flex justify-between text-xs text-zinc-500 mb-1">
                          <span>Occupancy</span>
                          <span>{Math.round(((ward.stats?.occupied || 0) / (ward.stats?.total || 1)) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-neon-blue to-neon-purple rounded-full transition-all"
                            style={{ width: `${((ward.stats?.occupied || 0) / (ward.stats?.total || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 relative z-10">
                        {[
                          { label: 'Avail',    value: ward.stats?.available, color: 'text-green-400' },
                          { label: 'Occupied', value: ward.stats?.occupied,  color: 'text-neon-blue' },
                          { label: 'Cleaning', value: ward.stats?.cleaning,  color: 'text-red-400'   },
                          { label: 'Reserved', value: ward.stats?.reserved,  color: 'text-yellow-400'},
                        ].map(stat => (
                          <div key={stat.label} className="bg-zinc-900/50 rounded-xl p-2 text-center border border-white/5">
                            <div className={`text-2xl font-black ${stat.color}`}>{stat.value ?? 0}</div>
                            <div className="text-zinc-500 text-[10px] mt-0.5">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <button
                      onClick={() => setSelectedWard(null)}
                      className="px-4 py-2 bg-white/8 hover:bg-white/15 rounded-xl text-sm font-semibold transition"
                    >
                      ← Back
                    </button>
                    <h2 className="text-2xl font-black">{selectedWard.name} — Bed Detail</h2>
                  </div>
                  {loadingBeds ? (
                    <div className="text-center py-16 text-zinc-500 animate-pulse">Loading beds…</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {wardBeds.map(bed => (
                        <div key={bed.id} className={`p-4 rounded-2xl border glass ${STATUS_COLORS[bed.status] || 'border-white/10 bg-white/5'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-lg font-black">{bed.number}</span>
                            <span className="text-[10px] border border-current rounded-full px-2 py-0.5 uppercase font-bold">
                              {bed.status?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          {bed.patient
                            ? (
                              <div className="mt-2 pt-2 border-t border-current/20">
                                <div className="text-xs font-semibold truncate">{bed.patient.name}</div>
                                {bed.patient.healTimeDays && ((Date.now() - new Date(bed.patient.admissionDate).getTime()) / (1000 * 3600 * 24)) > bed.patient.healTimeDays && !bed.patient.adminReviewRequested && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRequestReviewAdmin(bed.patient.id); }}
                                    className="mt-2 text-[10px] w-full px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/40 rounded-lg hover:bg-red-500 hover:text-white transition"
                                  >
                                    Request Review
                                  </button>
                                )}
                              </div>
                            )
                            : <div className="text-xs opacity-40 mt-2 pt-2 border-t border-current/20 italic">Empty</div>
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── VIEW: STAFF MATRIX ── */}
          {activeView === 'staff' && (
            <div>
              <h3 className="text-xl font-black text-white mb-5 flex items-center gap-2">
                <UserCog size={20} className="text-neon-purple" /> Staff Assignment Matrix
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Staff list */}
                <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/5 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                    On-Duty Staff
                  </div>
                  {STAFF.map(s => (
                    <div key={s.name} className="flex items-center gap-4 px-5 py-3 border-b border-white/5 last:border-0 hover:bg-white/3 transition">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                        s.role === 'Doctor'   ? 'bg-neon-blue/20 text-neon-blue'   :
                        s.role === 'Nurse'    ? 'bg-pink-500/20 text-pink-400'     :
                        'bg-orange-500/20 text-orange-400'
                      }`}>{s.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-white">{s.name}</div>
                        <div className="text-xs text-zinc-500">{s.role} &nbsp;•&nbsp; {staffAssignments[s.name]}</div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                        s.shift === 'Morning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                        s.shift === 'Evening' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}>{s.shift}</span>
                    </div>
                  ))}
                </div>
                {/* Ward coverage */}
                <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/5 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                    Ward Coverage
                  </div>
                  {wards.map(w => {
                    const assignedStaff = STAFF.filter(s => staffAssignments[s.name] === w.name || staffAssignments[s.name] === 'All Wards');
                    return (
                      <div key={w.id} className="px-5 py-4 border-b border-white/5 last:border-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-white">{w.name}</span>
                          <span className="text-xs text-zinc-500">{assignedStaff.length} assigned</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {assignedStaff.map(s => (
                            <span key={s.name} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                              s.role === 'Doctor'   ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30'     :
                              s.role === 'Nurse'    ? 'bg-pink-500/10 text-pink-400 border-pink-500/30'        :
                              'bg-orange-500/10 text-orange-400 border-orange-500/30'
                            }`}>{s.name}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW: SHIFT HANDOVER ── */}
          {activeView === 'handover' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <FileOutput size={20} className="text-neon-blue" /> Formal Shift Handover Report
                </h3>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-white/8 hover:bg-white/15 px-4 py-2 rounded-xl text-sm font-semibold transition border border-white/10"
                >
                  <Printer size={15} /> Execute Print
                </button>
              </div>

              <div className="glass rounded-2xl border border-white/5 p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <div className="text-2xl font-black text-white">WardWatch Shift Summary</div>
                    <div className="text-sm text-zinc-500 mt-1">
                      {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      &nbsp;—&nbsp;Generated at {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">Prepared by</div>
                    <div className="font-bold text-neon-blue">Admin Samuel</div>
                  </div>
                </div>

                {/* Ward Summary Table */}
                <div>
                  <h4 className="font-bold text-zinc-300 mb-3 text-sm uppercase tracking-wider">Ward Status Summary</h4>
                  <div className="rounded-xl overflow-hidden border border-white/8">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5 text-xs text-zinc-400 uppercase tracking-wider">
                          <th className="text-left px-4 py-3">Ward</th>
                          <th className="text-center px-4 py-3">Total</th>
                          <th className="text-center px-4 py-3">Occupied</th>
                          <th className="text-center px-4 py-3">Available</th>
                          <th className="text-center px-4 py-3">Cleaning</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {wards.map(w => (
                          <tr key={w.id} className="hover:bg-white/3">
                            <td className="px-4 py-3 font-semibold text-white">{w.name}</td>
                            <td className="px-4 py-3 text-center text-zinc-400">{w.stats?.total}</td>
                            <td className="px-4 py-3 text-center text-neon-blue font-bold">{w.stats?.occupied}</td>
                            <td className="px-4 py-3 text-center text-green-400 font-bold">{w.stats?.available}</td>
                            <td className="px-4 py-3 text-center text-red-400 font-bold">{w.stats?.cleaning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Handover Notes */}
                <div>
                  <h4 className="font-bold text-zinc-300 mb-3 text-sm uppercase tracking-wider">Shift Notes</h4>
                  <div className="space-y-2">
                    {[
                      'Cardiology Ward — Bed CA-03 flagged for post-op monitoring overnight.',
                      'Cleaning staff cleared 4 beds this shift. 1 bed pending.',
                      'No critical incidents reported. Vitals stable across wards.',
                      'Neurology intake of 2 new patients expected early morning shift.',
                    ].map((note, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/3 rounded-xl p-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-blue mt-1.5 shrink-0" />
                        <span className="text-sm text-zinc-300">{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW: FLAGS ── */}
          {activeView === 'flags' && (
            <div>
              <h3 className="text-xl font-black text-white mb-5 flex items-center gap-2">
                <Flag size={20} className="text-red-400" /> Operational Delays & Flags
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Discharge Delays */}
                <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/5 text-xs uppercase tracking-wider text-red-400 font-bold bg-red-500/5">
                    Delayed Discharges
                  </div>
                  <div className="divide-y divide-white/5 p-2">
                     {patients.filter(p => p.bed && p.healTimeDays && ((Date.now() - new Date(p.admissionDate).getTime()) / (1000 * 3600 * 24)) > p.healTimeDays).map(p => (
                         <div key={p.id} className="p-3 bg-white/3 rounded-xl m-2 hover:bg-white/5 transition">
                           <div className="flex justify-between items-center mb-1">
                             <div className="font-bold text-white text-sm">{p.name}</div>
                             {!p.adminReviewRequested && (
                                <button
                                   onClick={(e) => { e.stopPropagation(); handleRequestReviewAdmin(p.id); }}
                                   className="text-[10px] px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/40 rounded-lg hover:bg-red-500 hover:text-white transition"
                                >
                                  Request Review
                                </button>
                             )}
                           </div>
                           <div className="text-xs text-zinc-400">Exceeded typical recovery by {Math.floor((Date.now() - new Date(p.admissionDate).getTime()) / (1000 * 3600 * 24)) - p.healTimeDays} days.</div>
                         </div>
                     ))}
                     {patients.filter(p => p.bed && p.healTimeDays && ((Date.now() - new Date(p.admissionDate).getTime()) / (1000 * 3600 * 24)) > p.healTimeDays).length === 0 && (
                         <div className="p-8 text-center text-zinc-500 text-xs">No delayed discharges detected.</div>
                     )}
                  </div>
                </div>

                {/* Cleaning Delays */}
                <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/5 text-xs uppercase tracking-wider text-yellow-400 font-bold bg-yellow-500/5">
                    Cleaning Delays
                  </div>
                  <div className="divide-y divide-white/5 p-2">
                     {wards.flatMap(w => (w.beds || []).map(b => ({ ...b, ward: w }))).filter(b => b.status === 'NEEDS_CLEANING' || b.status === 'IN_CLEANING').map(b => (
                         <div key={b.id} className="p-3 bg-white/3 rounded-xl m-2 flex justify-between items-center">
                           <div>
                             <div className="font-bold text-white text-sm">Bed {b.number}</div>
                             <div className="text-xs text-zinc-400">{b.ward?.name || 'Unknown Ward'}</div>
                           </div>
                           <div className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded-full font-bold">
                             {b.status.replace('_', ' ')}
                           </div>
                         </div>
                     ))}
                     {wards.flatMap(w => (w.beds || [])).filter(b => b.status === 'NEEDS_CLEANING' || b.status === 'IN_CLEANING').length === 0 && (
                         <div className="p-8 text-center text-zinc-500 text-xs">No cleaning delays detected.</div>
                     )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
