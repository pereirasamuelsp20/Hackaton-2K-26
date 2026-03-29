import { useState, Suspense, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { Mail, Lock, Loader2, ArrowRight, Info } from 'lucide-react';
import axios from 'axios';
import Spline from '@splinetool/react-spline';

// Simple Error Boundary to catch Spline loading errors
class SplineErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Spline Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const ROLE_CREDENTIALS = {
  'Administrator': { email: '225samuel0032@dbit.in', label: 'Admin Samuel', color: '#a855f7' },
  'Doctor': { email: '225ananya0117@dbit.in', label: 'Doctor Ananya', color: '#00f0ff' },
  'Nurse': { email: '225siddhi0091@dbit.in', label: 'Nurse Siddhi', color: '#ec4899' },
  'Cleaning Staff': { email: 'adityatol18@gmail.com', label: 'Cleaner Aditya', color: '#f59e0b' },
};

const roles = Object.keys(ROLE_CREDENTIALS);

export default function Login() {
  const [role, setRole] = useState(roles[0]);
  const [password, setPassword] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const setUser = useAppStore(state => state.setUser);

  const cred = ROLE_CREDENTIALS[role];

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError(null);
    setEmailInput('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) { setError('Please enter the password'); return; }
    
    const finalEmail = role === 'Administrator' ? cred.email : emailInput;
    if (role !== 'Administrator' && !finalEmail) { setError('Please input an email'); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('http://localhost:5001/api/auth/login', {
        email: finalEmail, password, role,
      });
      setUser(res.data, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Is the backend running on port 5001?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden text-white w-full">
      {/* 3D Spline Background via iframe (bypass 403 errors) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <iframe 
          src="https://my.spline.design/claritystream-OsRba2hzrCLo28QwrFSb2s4r/" 
          frameBorder="0" 
          width="100%" 
          height="100%"
          className="w-full h-full scale-110 opacity-70"
          title="Spline 3D Scene"
        />
      </div>

      <div className="absolute top-0 -left-1/4 w-[1000px] h-[1000px] bg-neon-blue/10 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute bottom-0 -right-1/4 w-[1000px] h-[1000px] bg-neon-purple/10 rounded-full blur-[200px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass rounded-3xl p-8 shadow-2xl relative z-10 w-full">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-neon-blue to-neon-purple">
              Welcome Back
            </h2>
            <p className="text-zinc-400 mt-2 text-sm">Select your role and sign in</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Role pill buttons */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3 block">Select Role</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    style={role === r ? {
                      borderColor: ROLE_CREDENTIALS[r].color + '60',
                      boxShadow: `0 0 16px ${ROLE_CREDENTIALS[r].color}30`,
                    } : {}}
                    className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all border ${role === r
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'bg-transparent border-white/8 text-zinc-500 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Configurable email section based on Role */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Email</label>
              {role === 'Administrator' ? (
                <div className="flex items-center gap-3 bg-zinc-900/80 border border-white/8 rounded-xl px-4 py-3">
                  <Mail size={16} className="text-zinc-600 shrink-0" />
                  <span className="text-sm text-zinc-300 font-mono truncate">******************</span>
                </div>
              ) : (
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="username"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all text-sm"
                  />
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  autoComplete="current-password"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all text-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-neon-blue to-neon-purple text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading
                ? <Loader2 className="animate-spin" size={20} />
                : <><span>Sign in as {role === 'Administrator' ? cred.label : role}</span><ArrowRight size={18} /></>
              }
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
