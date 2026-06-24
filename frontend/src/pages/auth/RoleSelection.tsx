import React from "react";
import { motion } from "framer-motion";
import { User, Briefcase } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface RoleSelectionProps {
  selectedRole: "user" | "recruiter" | null;
  onSelect: (role: "user" | "recruiter") => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ selectedRole, onSelect }) => {
  const roles = [
    {
      id: "user" as const,
      title: "USER",
      icon: User,
      description: "Search opportunities and manage your professional profile.",
    },
    {
      id: "recruiter" as const,
      title: "RECRUITER",
      icon: Briefcase,
      description: "Find, rank, and evaluate top candidates using AI.",
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-6 w-full mt-4">
      {roles.map((role) => {
        const isSelected = selectedRole === role.id;
        const Icon = role.icon;

        return (
          <motion.div
            key={role.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(role.id)}
            className={twMerge(
              clsx(
                "flex-1 relative cursor-pointer overflow-hidden rounded-2xl p-6 text-left transition-all duration-300",
                "bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)]",
                isSelected
                  ? "border-primary/50 shadow-[0_8px_32px_0_rgba(14,165,233,0.2)] bg-primary/10"
                  : "hover:border-white/20 hover:bg-white/10"
              )
            )}
          >
            {/* Animated background gradient for selected state */}
            {isSelected && (
              <motion.div
                layoutId="role-selection-bg"
                className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}

            <div className="relative z-10 flex flex-col h-full">
              <div
                className={clsx(
                  "flex items-center justify-center w-12 h-12 rounded-full mb-4 transition-colors",
                  isSelected ? "bg-primary text-white" : "bg-white/10 text-gray-300"
                )}
              >
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 tracking-wide">{role.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed flex-grow">
                {role.description}
              </p>
              
              {/* Custom Radio Button Indicator */}
              <div className="mt-4 flex justify-end">
                <div
                  className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    isSelected ? "border-primary" : "border-gray-500"
                  )}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 rounded-full bg-primary"
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
