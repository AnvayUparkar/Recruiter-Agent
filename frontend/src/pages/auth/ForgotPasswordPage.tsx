import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader, ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { ThemeToggle } from '../../components/navigation/ThemeToggle';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
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

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post(ENDPOINTS.AUTH_FORGOT_PASSWORD, { email });
      setSuccess(response.data.message || 'OTP sent successfully.');
      setTimeout(() => {
        setSuccess('');
        setStep(2);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await apiClient.post(ENDPOINTS.AUTH_VERIFY_OTP, { email, otp });
      setSuccess('OTP verified! Please enter a new password.');
      setTimeout(() => {
        setSuccess('');
        setStep(3);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post(ENDPOINTS.AUTH_RESET_PASSWORD, { email, otp, password });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-20">
      <AnimatedBackground />

      {/* Top Navigation */}
      <div className="absolute top-10 left-6 right-6 z-50 flex justify-between items-center max-w-7xl mx-auto">
        <Link
          to="/login"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
          <span className="font-medium text-sm hidden sm:inline">Back to Login</span>
        </Link>
        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-sm">
          <ThemeToggle />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="backdrop-blur-lg bg-white/10 dark:bg-neutral-800/20 border border-white/20 dark:border-neutral-700/30 rounded-2xl shadow-2xl p-8 lg:p-10"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4"
            >
              <KeyRound className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {step === 1 && "Forgot Password"}
              {step === 2 && "Enter OTP"}
              {step === 3 && "Reset Password"}
            </h2>
            <p className="text-gray-600 dark:text-neutral-400">
              {step === 1 && "Enter your email to receive a recovery code"}
              {step === 2 && `We've sent a 6-digit code to ${email}`}
              {step === 3 && "Create a new, secure password"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRequestOTP}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 dark:bg-neutral-800/70 dark:text-neutral-100 dark:placeholder-neutral-500 backdrop-blur-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm font-medium">{error}</div>}
                {success && <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-600 text-sm font-medium flex items-center space-x-2"><CheckCircle className="h-5 w-5" /><span>{success}</span></div>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group"
                >
                  {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <span>Send Code</span>}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2">
                    6-Digit OTP
                  </label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 dark:bg-neutral-800/70 dark:text-neutral-100 dark:placeholder-neutral-500 backdrop-blur-sm tracking-[0.5em] font-mono text-center"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                </div>

                {error && <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm font-medium">{error}</div>}
                {success && <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-600 text-sm font-medium flex items-center space-x-2"><CheckCircle className="h-5 w-5" /><span>{success}</span></div>}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-4 rounded-xl font-medium text-gray-600 dark:text-neutral-300 border-2 border-gray-200 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group"
                  >
                    {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <span>Verify</span>}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleResetPassword}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2">
                    New Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 dark:bg-neutral-800/70 dark:text-neutral-100 dark:placeholder-neutral-500 backdrop-blur-sm"
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
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your new password"
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 dark:bg-neutral-800/70 dark:text-neutral-100 dark:placeholder-neutral-500 backdrop-blur-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {error && <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm font-medium">{error}</div>}
                {success && <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-600 text-sm font-medium flex items-center space-x-2"><CheckCircle className="h-5 w-5" /><span>{success}</span></div>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group"
                >
                  {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <span>Reset Password</span>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
