import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { Mail, Lock, Loader2, ArrowRight, Info } from 'lucide-react';
import axios from 'axios';

const ROLE_CREDENTIALS = {
  'Administrator': { email: '225samuel0032@dbit.in',  label: 'Admin Samuel',   color: '#a855f7' },
  'Doctor':        { email: '225ananya0117@dbit.in',  label: 'Dr. Ananya',     color: '#00f0ff' },
  'Nurse':         { email: '225siddhi0091@dbit.in',  label: 'Nurse Siddhi',   color: '#ec4899' },
  'Cleaning Staff':{ email: 'adityatol18@gmail.com',  label: 'Cleaner Aditya', color: '#f59e0b' },
};

const roles = Object.keys(ROLE_CREDENTIALS);

export default function Login() {
  const [role, setRole]         = useState(roles[0]);
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const navigate = useNavigate();
  const setUser  = useAppStore(state => state.setUser);

  const cred = ROLE_CREDENTIALS[role];

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) { setError('Please enter the password: 12345'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('http://localhost:5001/api/auth/login', {
        email: cred.email, password, role,
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden text-white w-full">
      <div className="absolute top-0 -left-1/4 w-[1000px] h-[1000px] bg-neon-blue/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 -right-1/4 w-[1000px] h-[1000px] bg-neon-purple/10 rounded-full blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-3xl p-8 shadow-2xl relative z-10 w-full">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-neon-blue to-neon-purple">
              Welcome Back
            </h2>
            <p className="text-zinc-400 mt-2 text-sm">Select your role and sign in</p>
          </div>

          {/* Password hint banner removed for security */}
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
                    className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all border ${
                      role === r
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'bg-transparent border-white/8 text-zinc-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-filled email representation */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Email</label>
              <div className="flex items-center gap-3 bg-zinc-900/80 border border-white/8 rounded-xl px-4 py-3">
                <Mail size={16} className="text-zinc-600 shrink-0" />
                <span className="text-sm text-zinc-300 font-mono truncate">******************</span>
              </div>
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
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all"
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
                : <><span>Sign in as {cred.label}</span><ArrowRight size={18} /></>
              }
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
