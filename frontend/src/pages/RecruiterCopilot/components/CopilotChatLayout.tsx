import React from "react";

interface CopilotChatLayoutProps {
  /** Left sidebar content */
  sidebar: React.ReactNode;
  /** Main chat content */
  chat: React.ReactNode;
}

/**
 * Responsive two-panel shell for the Recruiter Copilot:
 *  - Desktop (≥1024px): 320px sidebar | flex-1 chat
 *  - Tablet/Mobile: stacked
 */
const CopilotChatLayout: React.FC<CopilotChatLayoutProps> = ({ sidebar, chat }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full max-w-7xl mx-auto w-full">
      {/* Sidebar */}
      <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
        {sidebar}
      </aside>

      {/* Chat area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {chat}
      </main>
    </div>
  );
};

export default CopilotChatLayout;
