import React, { useState } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import {
  Sparkles,
  Settings,
  Mail,
  User,
  Trash2,
  CheckCircle,
  Filter,
  Briefcase,
  ExternalLink,
  Info,
  ChevronDown,
} from "lucide-react";

import { Button } from "../../components/ui/Button/Button";
import { Card } from "../../components/ui/Card/Card";
import { Input } from "../../components/ui/Input/Input";
import { Textarea } from "../../components/ui/Input/Textarea";
import { SearchInput } from "../../components/ui/Input/SearchInput";
import { IconWrapper } from "../../components/ui/Icon/IconWrapper";
import { StatusBadge, ScoreBadge, RankBadge } from "../../components/ui/Badge/Badge";
import { Modal } from "../../components/ui/Modal/Modal";
import { Drawer } from "../../components/ui/Modal/Drawer";
import { Dialog } from "../../components/ui/Modal/Dialog";
import { Tooltip } from "../../components/ui/Tooltip/Tooltip";
import { Popover } from "../../components/ui/Tooltip/Popover";
import { Select } from "../../components/ui/Dropdown/Select";
import { Dropdown } from "../../components/ui/Dropdown/Dropdown";
import { MultiSelect } from "../../components/ui/Dropdown/MultiSelect";
import { Tabs } from "../../components/ui/Tabs/Tabs";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
} from "../../components/ui/Skeleton/Skeleton";

export const DesignSystemPreview: React.FC = () => {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  // State controls for interactive preview showcases
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [singleSelectVal, setSingleSelectVal] = useState("strong-hire");
  const [multiSelectVals, setMultiSelectVals] = useState<string[]>(["typescript", "react"]);
  const [activeTab, setActiveTab] = useState("candidates");

  const [inputText, setInputText] = useState("");
  const [inputError, setInputError] = useState("");

  const [loadingState, setLoadingState] = useState(false);

  // Options mock data
  const selectOptions = [
    { value: "strong-hire", label: "Strong Hire Recommendation" },
    { value: "hire", label: "Hire" },
    { value: "watch", label: "Watch List" },
    { value: "reject", label: "Do Not Pursue" },
  ];

  const skillOptions = [
    { value: "typescript", label: "TypeScript" },
    { value: "react", label: "React" },
    { value: "nodejs", label: "Node.js" },
    { value: "python", label: "Python" },
    { value: "docker", label: "Docker" },
  ];

  const showcaseTabs = [
    { id: "candidates", label: "Candidates", count: 24 },
    { id: "rankings", label: "AI Rankings", count: 8 },
    { id: "jobs", label: "Job Descriptions" },
  ];

  // Accent Presets
  const accentPresets = [
    { name: "Electric Blue", color: "#4F7CFF" },
    { name: "Neon Purple", color: "#A855F7" },
    { name: "Emerald", color: "#10B981" },
    { name: "Amber Gold", color: "#F59E0B" },
    { name: "Rose Crimson", color: "#F43F5E" },
  ];

  const toggleLoading = () => {
    setLoadingState(true);
    setTimeout(() => setLoadingState(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary py-8 px-4 md:px-8 max-w-7xl mx-auto font-sans transition-colors duration-300 select-none pb-24">
      
      {/* Dynamic Theme Controls Dashboard */}
      <div className="glass-panel border border-glass-border p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-strong">
        <div>
          <h1 className="font-display-xl text-heading-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent animate-pulse" />
            AI Recruiter Design System
          </h1>
          <p className="text-body-md text-text-muted mt-1">
            Visual Engine Dashboard — Powered by React 19, Framer Motion, and Tailwind CSS.
          </p>
        </div>

        {/* Theme Settings Selector */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Active Accent Picker */}
          <div className="flex flex-col gap-2">
            <span className="text-caption font-bold text-text-muted uppercase tracking-wider">
              Theme Accent
            </span>
            <div className="flex items-center gap-2">
              {accentPresets.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => setAccentColor(preset.color)}
                  style={{ backgroundColor: preset.color }}
                  className="w-6 h-6 rounded-full border border-glass-border hover:scale-110 active:scale-95 transition-transform"
                  title={preset.name}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-7 h-7 rounded-full bg-transparent border-0 cursor-pointer p-0 shrink-0"
                title="Custom Color Picker"
              />
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-col gap-2">
            <span className="text-caption font-bold text-text-muted uppercase tracking-wider">
              Theme Mode
            </span>
            <div className="flex bg-surface-hover border border-glass-border rounded-lg p-0.5">
              {(["light", "dark", "system"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`px-3 py-1 text-body-sm font-semibold rounded-md capitalize transition-colors ${
                    theme === mode
                      ? "bg-accent text-white shadow-sm"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="md:col-span-1 flex flex-col gap-2 self-start sticky top-8 z-20">
          <span className="text-caption font-bold text-text-muted uppercase tracking-wider px-3 mb-2">
            Showcase Sections
          </span>
          {["Buttons", "Cards", "Inputs & Selects", "Badges & Icons", "Modals & Dialogs", "Tooltips & Tabs", "Skeleton States", "Empty States"].map((sec) => (
            <a
              key={sec}
              href={`#${sec.toLowerCase().replace(/[^a-z]/g, "")}`}
              className="px-3 py-2 rounded-lg text-body-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors font-medium border border-transparent hover:border-glass-border"
            >
              {sec}
            </a>
          ))}
        </aside>

        {/* Components View Area */}
        <main className="md:col-span-3 flex flex-col gap-12">
          
          {/* Buttons Section */}
          <section id="buttons" className="scroll-mt-8">
            <h2 className="text-heading-xl font-bold border-b border-glass-border pb-2 mb-6">
              Buttons
            </h2>
            <Card className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="primary">Primary Accent</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost Accent</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="primary" leftIcon={Sparkles}>With Left Icon</Button>
                <Button variant="outline" rightIcon={ExternalLink}>With Right Icon</Button>
                <Button variant="primary" isLoading={loadingState} onClick={toggleLoading}>
                  {loadingState ? "Saving..." : "Click to load (2s)"}
                </Button>
                <Button variant="primary" disabled>Disabled State</Button>
              </div>
            </Card>
          </section>

          {/* Cards Section */}
          <section id="cards" className="scroll-mt-8">
            <h2 className="text-heading-xl font-bold border-b border-glass-border pb-2 mb-6">
              Cards with 3D Tilt
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card enableTilt={true} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-heading-md font-semibold">Interactive Card</h3>
                </div>
                <p className="text-body-md text-text-muted">
                  Hover over this card to witness a pointer spotlight sweep and 3D tilting effect. Move your cursor dynamically.
                </p>
              </Card>

              <Card enableTilt={true} glow={true} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-brandPurple/10 border border-brandPurple/20">
                    <Settings className="h-5 w-5 text-brandPurple" />
                  </div>
                  <h3 className="font-heading-md font-semibold">Active Neon Glow</h3>
                </div>
                <p className="text-body-md text-text-muted">
                  This card renders with a permanent ambient accent glow on the borders, highlighting important elements.
                </p>
              </Card>
            </div>
          </section>

          {/* Inputs Section */}
          <section id="inputsselects" className="scroll-mt-8">
            <h2 className="text-heading-xl font-bold border-b border-glass-border pb-2 mb-6">
              Inputs & Dropdowns
            </h2>
            <Card className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Floating Inputs */}
                <Input
                  label="Candidate Full Name"
                  placeholder="Enter name"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (e.target.value.length < 3) {
                      setInputError("Name must contain at least 3 characters");
                    } else {
                      setInputError("");
                    }
                  }}
                  error={inputError}
                />
                
                <Input
                  label="Email Address"
                  placeholder="Enter email"
                  defaultValue="candidate@domain.com"
                  success={true}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SearchInput placeholder="Search global candidates..." isLoading={loadingState} />
                <Textarea label="Recruiter Copilot Instructions" placeholder="Write instructions..." />
              </div>

              {/* Custom Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Select
                  label="Suitability Score Type"
                  options={selectOptions}
                  value={singleSelectVal}
                  onChange={setSingleSelectVal}
                />
                <MultiSelect
                  label="Candidate Key Skills"
                  options={skillOptions}
                  selectedValues={multiSelectVals}
                  onChange={setMultiSelectVals}
                />
                <div className="flex flex-col gap-1.5 justify-end">
                  <span className="text-body-sm font-medium text-text-muted select-none">
                    Action Menu
                  </span>
                  <Dropdown
                    trigger={
                      <Button variant="outline" rightIcon={ChevronDown} className="w-full">
                        Candidate Actions
                      </Button>
                    }
                    items={[
                      { label: "View Profile", icon: User },
                      { label: "Email Interview Details", icon: Mail },
                      { label: "Accept Recommendation", icon: CheckCircle, variant: "success" },
                      { label: "Delete Archive", icon: Trash2, variant: "danger" },
                    ]}
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* Badges Section */}
          <section id="badgesicons" className="scroll-mt-8">
            <h2 className="text-heading-xl font-bold border-b border-glass-border pb-2 mb-6">
              Badges & Animated Icons
            </h2>
            <Card className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-4 items-center">
                <StatusBadge variant="info">Open Position</StatusBadge>
                <StatusBadge variant="success">Strong Hire</StatusBadge>
                <StatusBadge variant="warning">Shortlist Delay</StatusBadge>
                <StatusBadge variant="danger">Rejected</StatusBadge>
                <StatusBadge variant="muted">Archived</StatusBadge>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <ScoreBadge score={94} />
                <ScoreBadge score={72} />
                <ScoreBadge score={43} />
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <RankBadge rank={1} />
                <RankBadge rank={2} />
                <RankBadge rank={3} />
                <RankBadge rank={12} />
              </div>

              {/* Icon wrapper animations */}
              <div className="flex gap-8 items-center border-t border-glass-border pt-4">
                <div className="flex flex-col items-center gap-1">
                  <IconWrapper icon={Settings} animation="spin" variant="accent" size="lg" />
                  <span className="text-caption text-text-muted">Spin</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <IconWrapper icon={Sparkles} animation="pulse" variant="success" size="lg" />
                  <span className="text-caption text-text-muted">Pulse</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <IconWrapper icon={Mail} animation="rotate-hover" variant="warning" size="lg" />
                  <span className="text-caption text-text-muted">Rotate Hover</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <IconWrapper icon={User} animation="bounce-hover" variant="danger" size="lg" />
                  <span className="text-caption text-text-muted">Bounce Hover</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <IconWrapper icon={Briefcase} animation="glow-hover" variant="info" size="lg" />
                  <span className="text-caption text-text-muted">Glow Hover</span>
                </div>
              </div>
            </Card>
          </section>

          {/* Modals & Dialogs Section */}
          <section id="modalsdialogs" className="scroll-mt-8">
            <h2 className="text-heading-xl font-bold border-b border-glass-border pb-2 mb-6">
              Modals, Drawers & Dialogs
            </h2>
            <Card className="flex flex-col gap-4">
              <p className="text-body-md text-text-muted">
                Standard trigger buttons to invoke accessible overlays. Open each to test focus trap, backdrop blur and spring entries.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" onClick={() => setModalOpen(true)}>Open Modal</Button>
                <Button variant="outline" onClick={() => setDrawerOpen(true)}>Open Side Drawer</Button>
                <Button variant="danger" onClick={() => setDialogOpen(true)}>Open Confirm Dialog</Button>
              </div>

              {/* Modal instance */}
              <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Analyze Candidate Fit">
                <div className="space-y-4">
                  <p>
                    Analyzing candidate profile against job description. This process cross-references matching skills, experience levels, and potential risk factors.
                  </p>
                  <Input label="Add specific analyzer tag" placeholder="E.g. Senior Staff" />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={() => setModalOpen(false)}>Analyze</Button>
                  </div>
                </div>
              </Modal>

              {/* Drawer instance */}
              <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Recruiter Settings Menu">
                <div className="space-y-6">
                  <p>Customize the automated recruiter matching parameters below.</p>
                  <Select
                    label="Minimum Matching Threshold"
                    options={[
                      { value: "80", label: "80% Match Score" },
                      { value: "70", label: "70% Match Score" },
                    ]}
                    value="80"
                    onChange={() => {}}
                  />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="autosend" className="rounded border-glass-border bg-glass h-4 w-4" />
                    <label htmlFor="autosend" className="text-body-sm text-text-primary">Auto-send interview invites</label>
                  </div>
                </div>
              </Drawer>

              {/* Dialog confirmation instance */}
              <Dialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onConfirm={() => setDialogOpen(false)}
                variant="danger"
                title="Archive Candidate Profile?"
                description="This action is irreversible. The candidate match history, AI analysis feedback, and notes will be permanently removed."
                confirmLabel="Delete Permanent"
              />
            </Card>
          </section>

          {/* Tooltips & Tabs Section */}
          <section id="tooltipstabs" className="scroll-mt-8">
            <h2 className="text-heading-xl font-bold border-b border-glass-border pb-2 mb-6">
              Tooltips, Popovers & Tabs
            </h2>
            <Card className="flex flex-col gap-8">
              
              {/* Tooltip & Popover */}
              <div className="flex flex-wrap gap-8 items-center">
                <Tooltip content="We analyze suitability matching via AI models" position="top">
                  <Button variant="outline" leftIcon={Info}>Hover For Tooltip (Top)</Button>
                </Tooltip>
                
                <Tooltip content="System settings override" position="right">
                  <Button variant="outline">Tooltip (Right)</Button>
                </Tooltip>

                <Popover
                  title="Advanced Matching Info"
                  position="bottom"
                  content={
                    <div className="space-y-2">
                      <p className="text-body-sm text-text-muted">
                        Scores over 80% indicate high alignment. Tap badges to review analysis metrics.
                      </p>
                      <Button variant="primary" size="sm" className="w-full">View Breakdown</Button>
                    </div>
                  }
                >
                  <Button variant="outline" leftIcon={Filter}>Interactive Popover</Button>
                </Popover>
              </div>

              {/* Tabs Switchers */}
              <div className="flex flex-col gap-6 pt-4 border-t border-glass-border">
                <div className="flex flex-col gap-2">
                  <span className="text-caption font-bold text-text-muted uppercase tracking-wider">
                    Animated Underline Tabs
                  </span>
                  <Tabs tabs={showcaseTabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-caption font-bold text-text-muted uppercase tracking-wider">
                    Animated Pill Tabs
                  </span>
                  <Tabs tabs={showcaseTabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />
                </div>
              </div>
            </Card>
          </section>

          {/* Skeleton States Section */}
          <section id="skeletonstates" className="scroll-mt-8">
            <h2 className="text-heading-xl font-bold border-b border-glass-border pb-2 mb-6">
              Skeleton Screen Shimmers
            </h2>
            <div className="space-y-6">
              {/* Table skeleton */}
              <TableSkeleton />

              {/* Card & grid skeletons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <CardSkeleton />
                <div className="glass-panel border border-glass-border rounded-xl p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="circular" className="h-12 w-12" />
                    <div className="w-1/2 flex flex-col gap-2">
                      <Skeleton variant="text" />
                      <Skeleton variant="text" className="w-2/3" />
                    </div>
                  </div>
                  <Skeleton variant="rectangular" className="h-24 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </section>

          {/* Empty States Section */}
          <section id="emptystates" className="scroll-mt-8">
            <h2 className="text-heading-xl font-bold border-b border-glass-border pb-2 mb-6">
              Empty State Placeholders
            </h2>
            <div className="space-y-6">
              <EmptyState
                title="No candidates yet"
                description="Start by adding job descriptions to sync matching candidate profiles on this dashboard."
                icon={User}
                actionLabel="Analyze Job Description"
                onActionClick={() => alert("Action triggered")}
              />
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default DesignSystemPreview;
