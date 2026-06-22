import React from "react";

interface SidebarGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarGroup: React.FC<SidebarGroupProps> = ({ children, className = "" }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {children}
    </div>
  );
};

export default SidebarGroup;
