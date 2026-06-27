import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Loader, Shield, Sparkles, Zap, ArrowRight, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle } from '../../components/navigation/ThemeToggle';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-neutral-950 dark:via-blue-950 dark:to-purple-950" />
      <motion.div
        className="absolute top-1/4 -left-20 w-96 h-96 bg-green-300 dark:bg-green-800 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-20 w-96 h-96 bg-blue-300 dark:bg-blue-800 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
        animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const from = location.state?.from?.pathname || null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/api/v1/auth/login', { email, password });
      const { access_token, user } = response.data;
      login(access_token, user);

      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'recruiter') {
        navigate('/dashboard');
      } else {
        navigate('/profile');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    { icon: <Shield className="h-5 w-5" />, text: "Secure & Encrypted" },
    { icon: <Sparkles className="h-5 w-5" />, text: "AI-Powered Analytics" },
    { icon: <Zap className="h-5 w-5" />, text: "Instant Access" },
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
        {/* Left Side */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4 mt-16"
            >
              <LogIn className="h-12 w-12 text-white" />
            </motion.div>

            <h1 className="text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                Welcome Back
              </span>
              <br />
              <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                To Recruiter AI
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-neutral-300 leading-relaxed">
              Continue your journey with AI-powered candidate ranking, intelligent copilot, and deep recruitment analytics.
            </p>

            <div className="space-y-4 pt-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center space-x-3 backdrop-blur-lg bg-white/30 dark:bg-neutral-800/30 p-4 rounded-xl border border-white/40 dark:border-neutral-700/40"
                >
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
                    {benefit.icon}
                  </div>
                  <span className="text-gray-700 dark:text-neutral-200 font-medium">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="pt-6"
            >
              <div className="p-6 backdrop-blur-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-neutral-100 mb-1">Your data is safe with us</p>
                    <p className="text-sm text-gray-600 dark:text-neutral-400">
                      We use industry-leading encryption and JWT-based auth to protect your account.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <div className="backdrop-blur-lg bg-white/10 dark:bg-neutral-800/20 border border-white/20 dark:border-neutral-700/30 rounded-2xl shadow-2xl p-8 lg:p-10">
            <div className="lg:hidden text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-block p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4"
              >
                <LogIn className="h-8 w-8 text-white" />
              </motion.div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Sign In
              </h2>
              <p className="text-gray-600 dark:text-neutral-400">Access your personalized recruiter dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                  <input
                    type="email"
                    id="login-email"
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 dark:bg-neutral-800/70 dark:text-neutral-100 dark:placeholder-neutral-500 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-neutral-800/90"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-600 hover:text-purple-600 font-medium transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="login-password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 dark:bg-neutral-800/70 dark:text-neutral-100 dark:placeholder-neutral-500 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-neutral-800/90"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 text-center"
            >
              <p className="text-gray-600 dark:text-neutral-400 text-sm">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-blue-600 hover:text-purple-600 font-semibold transition-colors duration-200 inline-flex items-center space-x-1"
                >
                  <span>Sign up here</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8"
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-neutral-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm text-gray-500 dark:text-neutral-400 rounded-full">
                    Secure Login
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
