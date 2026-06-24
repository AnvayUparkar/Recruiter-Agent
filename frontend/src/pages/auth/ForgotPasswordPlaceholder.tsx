import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function ForgotPasswordPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden p-4">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-12 relative z-10 text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-4">Forgot Password</h1>
        <p className="text-gray-400 mb-8">
          Password reset functionality is not implemented in this demo. Please contact support or create a new account.
        </p>

        <Link
          to="/login"
          className="inline-block w-full bg-primary text-white py-3.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          Return to Login
        </Link>
      </motion.div>
    </div>
  );
}
