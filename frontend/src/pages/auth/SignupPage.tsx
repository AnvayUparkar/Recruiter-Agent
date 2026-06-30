import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserPlus, Mail, Lock, User as UserIcon, Loader, CheckCircle,
  Sparkles, Shield, Zap, ArrowRight, Briefcase, ArrowLeft,
  Eye, EyeOff
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle } from '../../components/navigation/ThemeToggle';

// ─── Animated Background ────────────────────────────────────────────────────
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-neutral-950 dark:via-blue-950 dark:to-purple-950" />
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-blue-400 dark:bg-blue-600 rounded-full opacity-20"
        initial={{
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
          y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
        }}
        animate={{
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
          y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
        }}
        transition={{ duration: Math.random() * 20 + 10, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
      />
    ))}
    <motion.div
      className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 dark:from-blue-800 dark:to-purple-800 rounded-full opacity-10"
      animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-indigo-400 to-pink-400 dark:from-indigo-800 dark:to-pink-800 rounded-full opacity-10"
      animate={{ y: [0, 30, 0], x: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-green-400 to-blue-400 dark:from-green-800 dark:to-blue-800 rounded-full opacity-10"
      animate={{ scale: [1, 1.2, 1], rotate: [0, -180, -360] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

// ─── Role Card ───────────────────────────────────────────────────────────────
interface RoleCardProps {
  id: 'user' | 'recruiter';
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: (role: 'user' | 'recruiter') => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ id, title, description, icon, selected, onSelect }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onSelect(id)}
    className={`flex-1 cursor-pointer rounded-xl p-5 border-2 transition-all duration-200 ${
      selected
        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-900/20'
        : 'border-gray-200 dark:border-neutral-600 bg-white/40 dark:bg-neutral-800/40 hover:border-blue-300'
    }`}
  >
    <div className={`flex items-center justify-center w-11 h-11 rounded-xl mb-3 transition-colors ${
      selected ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-gray-100 dark:bg-neutral-700 text-gray-500'
    }`}>
      {icon}
    </div>
    <h3 className="font-semibold text-gray-800 dark:text-neutral-100 mb-1">{title}</h3>
    <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">{description}</p>
    <div className={`mt-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
      selected ? 'border-blue-500' : 'border-gray-300 dark:border-neutral-600'
    }`}>
      {selected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-blue-500" />
      )}
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<'user' | 'recruiter' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const handleNextStep = () => {
    if (!role) { setError('Please select a role to continue.'); return; }
    setError('');
    setStep(2);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters long'); return; }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/v1/auth/signup', {
        full_name: name,
        email,
        password,
        role,
      });

      const { access_token, user } = response.data;
      login(access_token, user);
      setSuccess('Account created! Redirecting...');

      const from = location.state?.from?.pathname || null;

      setTimeout(() => {
        if (from) {
          navigate(from, { replace: true });
        } else {
          navigate(user.role === 'recruiter' ? '/dashboard' : '/profile');
        }
      }, 800);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Connection failed. Is the backend running?');
      setIsLoading(false);
    }
  };

  const benefits = [
    { icon: <Sparkles className="h-5 w-5" />, text: 'Access AI-Powered Ranking' },
    { icon: <Shield className="h-5 w-5" />, text: 'Private & Secure Data' },
    { icon: <Zap className="h-5 w-5" />, text: 'Personalized Role Dashboard' },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-20">
      <AnimatedBackground />

      {/* Top Navigation */}
      <div className="absolute top-10 left-6 right-6 z-50 flex justify-between items-center max-w-7xl mx-auto">
        <Link 
          to="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
          <span className="font-medium text-sm hidden sm:inline">Back to Home</span>
        </Link>
        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-sm">
          <ThemeToggle />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* ── Left Side - Form ── */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <div className="backdrop-blur-lg bg-white/10 dark:bg-neutral-800/20 border border-white/20 dark:border-neutral-700/30 rounded-2xl shadow-2xl p-8 lg:p-10">

            {/* Mobile header */}
            <div className="lg:hidden text-center mb-8">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-block p-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4"
              >
                <UserPlus className="h-8 w-8 text-white" />
              </motion.div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                {step === 1 ? 'Choose Your Role' : 'Create Your Account'}
              </h2>
              <p className="text-gray-600 dark:text-neutral-400">
                {step === 1 ? 'Select how you want to use the platform' : 'Fill in your details to get started'}
              </p>
            </div>

            {/* ── STEP 1: Role Selection ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <RoleCard
                    id="user"
                    title="Candidate"
                    description="Search opportunities and manage your professional profile."
                    icon={<UserIcon className="h-5 w-5" />}
                    selected={role === 'user'}
                    onSelect={setRole}
                  />
                  <RoleCard
                    id="recruiter"
                    title="Recruiter"
                    description="Find, rank, and evaluate top candidates using AI."
                    icon={<Briefcase className="h-5 w-5" />}
                    selected={role === 'recruiter'}
                    onSelect={setRole}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  onClick={handleNextStep}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2 group"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </motion.button>
              </div>
            )}

            {/* ── STEP 2: Registration Form ── */}
            {step === 2 && (
              <div className="space-y-5">
                {/* Name */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2">Full Name</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" />
                    <input
                      type="text"
                      id="signup-name"
                      placeholder="John Doe"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/70 dark:bg-neutral-800/70 dark:text-neutral-100 dark:placeholder-neutral-500 backdrop-blur-sm"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>
                </motion.div>

                {/* Email */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" />
                    <input
                      type="email"
                      id="signup-email"
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/70 dark:bg-neutral-800/70 dark:text-neutral-100 dark:placeholder-neutral-500 backdrop-blur-sm"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="signup-password"
                      placeholder="Minimum 6 characters"
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/70 dark:bg-neutral-800/70 dark:text-neutral-100 dark:placeholder-neutral-500 backdrop-blur-sm"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-500 transition-colors duration-200 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </motion.div>

                {/* Confirm Password */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="signup-confirm-password"
                      placeholder="Re-enter your password"
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/70 dark:bg-neutral-800/70 dark:text-neutral-100 dark:placeholder-neutral-500 backdrop-blur-sm"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-500 transition-colors duration-200 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </motion.div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Success */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-600 text-sm font-medium flex items-center space-x-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>{success}</span>
                  </motion.div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3.5 rounded-xl font-medium text-gray-600 dark:text-neutral-300 border-2 border-gray-200 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Back
                  </button>
                  <motion.button
                    onClick={submit}
                    disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    className="flex-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white px-6 py-3.5 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Footer link */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 text-center"
            >
              <p className="text-gray-600 dark:text-neutral-400 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-green-600 hover:text-blue-600 font-semibold transition-colors duration-200">
                  Login here
                </Link>
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Right Side - Benefits ── */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-block p-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4 mt-16"
            >
              <UserPlus className="h-12 w-12 text-white" />
            </motion.div>

            <h1 className="text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Start Your Recruiting
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
                Journey Today
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-neutral-300 leading-relaxed">
              Join thousands of recruiters and candidates who trust our AI-powered platform for smarter hiring decisions.
            </p>

            <div className="space-y-4 pt-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center space-x-3 backdrop-blur-lg bg-white/30 dark:bg-neutral-800/30 p-4 rounded-xl border border-white/40 dark:border-neutral-700/40"
                >
                  <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg text-white">
                    {benefit.icon}
                  </div>
                  <span className="text-gray-700 dark:text-neutral-200 font-medium">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="pt-6"
            >
              <p className="text-sm text-gray-600 dark:text-neutral-400 italic">
                "This platform transformed how our team discovers and ranks talent. The AI ranking is incredibly accurate!"
                <span className="font-semibold"> — Priya K., Senior TA Manager</span>
              </p>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
