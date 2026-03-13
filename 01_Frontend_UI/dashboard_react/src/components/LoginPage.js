import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { FaBrain, FaEye, FaEyeSlash, FaChartLine, FaShieldAlt, FaUserMd } from 'react-icons/fa';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('doctor');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('na_token', data.access_token);
      localStorage.setItem('na_user', JSON.stringify(data.user));
      localStorage.setItem('na_token_expiry', Date.now() + (24 * 60 * 60 * 1000));
      dispatch({ type: 'SET_USER', payload: data.user });
      dispatch({ type: 'SET_TOKEN', payload: data.access_token });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.register({ email, password, full_name: fullName, role });
      const data = await api.login(email, password);
      localStorage.setItem('na_token', data.access_token);
      localStorage.setItem('na_user', JSON.stringify(data.user));
      localStorage.setItem('na_token_expiry', Date.now() + (24 * 60 * 60 * 1000));
      dispatch({ type: 'SET_USER', payload: data.user });
      dispatch({ type: 'SET_TOKEN', payload: data.access_token });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#050d1a' }}>
      {/* Floating background nodes */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            width: 6 + Math.random() * 12, height: 6 + Math.random() * 12,
            left: `${10 + Math.random() * 80}%`, top: `${10 + Math.random() * 80}%`,
            background: i % 2 === 0 ? 'rgba(0,198,255,0.15)' : 'rgba(123,47,190,0.15)',
            filter: `blur(${2 + Math.random() * 4}px)`,
            animation: `float ${5 + Math.random() * 5}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
      ))}

      {/* LEFT — Marketing Panel */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(ellipse at center, #00C6FF 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <FaBrain className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black">
                <span className="text-white">Neuro</span>
                <span className="text-cyan-400">Assist</span>
              </h1>
            </div>
          </div>
          <p className="text-cyan-300/80 text-lg font-medium mb-10">Clinical AI that explains itself</p>

          <div className="space-y-6 text-left">
            {[
              { icon: <FaBrain />, title: '3D Brain Visualization', desc: 'Interactive model highlighting affected regions' },
              { icon: <FaChartLine />, title: 'AI Explainability via Grad-CAM', desc: 'See where the AI looks to make its diagnosis' },
              { icon: <FaUserMd />, title: 'Doctor-in-the-Loop Design', desc: 'AI assists — clinicians decide' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400 shrink-0">{f.icon}</div>
                <div>
                  <h3 className="text-white font-bold text-sm">{f.title}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-gray-500 text-xs mt-10">Used in clinical research environments</p>
        </div>
      </div>

      {/* RIGHT — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0d1f3c] rounded-2xl border border-white/10 p-8 shadow-2xl">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <FaBrain className="text-xl text-cyan-400" />
            <span className="text-xl font-black"><span className="text-white">Neuro</span><span className="text-cyan-400">Assist</span></span>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-black/30 rounded-xl p-1 mb-6">
            <button onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}>
              Sign In
            </button>
            <button onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}>
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
          )}

          <form onSubmit={isLogin ? handleSignIn : handleRegister} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="Dr. Jane Doe" />
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Role</label>
                <div className="flex gap-3">
                  {[
                    { id: 'doctor', label: 'Doctor', icon: '🩺' },
                    { id: 'patient', label: 'Patient', icon: '👤' },
                  ].map(r => (
                    <button key={r.id} type="button" onClick={() => setRole(r.id)}
                      className={`flex-1 py-3 rounded-xl text-center border transition-all ${role === r.id ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400' : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/15'}`}>
                      <div className="text-lg">{r.icon}</div>
                      <div className="text-xs font-bold mt-1">{r.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                placeholder="doctor@neuroassist.ai" />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  {showPassword ? <FaEyeSlash size={14}/> : <FaEye size={14}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6">
            <button onClick={() => setShowDemo(!showDemo)}
              className="text-xs text-gray-500 hover:text-cyan-400 transition-colors w-full text-center">
              {showDemo ? 'Hide' : '🔑 Show'} demo credentials
            </button>
            {showDemo && (
              <div className="mt-2 p-3 rounded-lg bg-black/30 border border-white/5 text-xs text-gray-400 space-y-1">
                <div><span className="text-cyan-400">Doctor:</span> doctor@neuroassist.ai / Demo@2024</div>
                <div><span className="text-purple-400">Patient:</span> meera@demo.com / patient123</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
