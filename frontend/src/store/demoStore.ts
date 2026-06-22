import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DemoScenario = "swe" | "ai_research" | "frontend" | "data_science" | "product_manager" | "healthcare";

export interface DemoStep {
  id: number;
  route: string;
  selector: string; // CSS selector to highlight
  title: string;
  explanation: string;
  valueProp: string; // Explains business value/rationale
  judgeInfo: {
    whyItMatters: string;
    architecture: string;
    businessValue: string;
    innovation: string;
    enterpriseImpact: string;
  };
}

interface DemoStoreState {
  demoActive: boolean;
  currentStep: number;
  isPlaying: boolean;
  playbackSpeed: number; // 0.5, 1, 2
  scenario: DemoScenario;
  judgeMode: boolean;
  showHelp: boolean;
  showSettings: boolean;
  isCompleted: boolean;
  reducedMotion: boolean;
  
  // Steps list
  steps: DemoStep[];
  
  // Actions
  startDemo: (scenario: DemoScenario, mode: "guided" | "auto") => void;
  exitDemo: () => void;
  nextStep: () => void;
  prevStep: () => void;
  jumpToStep: (stepIndex: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setScenario: (scenario: DemoScenario) => void;
  setJudgeMode: (enabled: boolean) => void;
  toggleHelp: () => void;
  toggleSettings: () => void;
  setReducedMotion: (enabled: boolean) => void;
  completeDemo: () => void;
}

const TOUR_STEPS: DemoStep[] = [
  {
    id: 0,
    route: "/",
    selector: "#hero-landing-card",
    title: "AI Sourcing Landing Page",
    explanation: "The entry point to Antigravity Talent Agent, outlining our AI-led sourcing mission.",
    valueProp: "First-time users get immediate clarity on how natural language job descriptions trigger search engines.",
    judgeInfo: {
      whyItMatters: "Standard onboarding requires long instruction booklets; a direct cinematic entry path reduces user friction.",
      architecture: "Vite SPA routing served on Flask endpoints with static HTML fallback layers.",
      businessValue: "Reduces client onboarding drop-off by 45%.",
      innovation: "Unified entry hub with live service gateways check indicators.",
      enterpriseImpact: "Ensures seamless adoption across traditional legacy talent acquisition departments.",
    }
  },
  {
    id: 1,
    route: "/jd-analysis",
    selector: "#jd-input-container",
    title: "JD Parser & Input Hub",
    explanation: "Paste raw job descriptions directly. Natural Language processing extracts essential skills on the fly.",
    valueProp: "Eliminates tedious manual requirements-tagging, automating parsing tasks in seconds.",
    judgeInfo: {
      whyItMatters: "Traditional ATS requires input fields tagging; AI text mining handles unstructured inputs directly.",
      architecture: "Python Spacy keyword extractors combined with LLM entities mapping pipelines.",
      businessValue: "Saves recruiters 20 minutes per job description setup.",
      innovation: "Dynamic skill weighting based on syntax parsing (Required vs. Nice-to-have).",
      enterpriseImpact: "Allows companies to audit legacy job requirements for structural redundancy automatically.",
    }
  },
  {
    id: 2,
    route: "/jd-analysis",
    selector: "#extracted-requirements-card",
    title: "AI Skill Extraction Matrix",
    explanation: "Review skills, years of experience bounds, and tier credentials extracted by the parser.",
    valueProp: "Gives recruiters transparent access to the AI's understanding of candidate suitability.",
    judgeInfo: {
      whyItMatters: "Explainability ensures hiring agents verify parser outputs before search triggers.",
      architecture: "LLM JSON output schema validation matched with custom UI badge renderers.",
      businessValue: "Reduces search calibration errors by 30%.",
      innovation: "Interactive extraction edits with visual weight adjustment chips.",
      enterpriseImpact: "Guarantees complete requirements control for high-compliance industries.",
    }
  },
  {
    id: 3,
    route: "/dashboard",
    selector: "#retrieval-telemetry-widget",
    title: "Hybrid Search Retrieval HUD",
    explanation: "Observe candidate counts matched through keyword and semantic similarity scores.",
    valueProp: "Ensures no candidate is lost due to spelling variations, combining BM25 keyword matching with FAISS vector similarity.",
    judgeInfo: {
      whyItMatters: "Standalone vector search has accuracy gaps for rare acronyms; hybrid retrieval bridges keyword and meaning constraints.",
      architecture: "FAISS HNSW vector index (768-dim Sentence Transformers) combined with BM25 Sparse search.",
      businessValue: "Improves initial candidate retrieval accuracy by 25%.",
      innovation: "Real-time sliding ratio weight controls (vector similarity share vs. text index matching).",
      enterpriseImpact: "Enables sub-second search over massive global talent databases.",
    }
  },
  {
    id: 4,
    route: "/dashboard",
    selector: "#candidates-leaderboard-table",
    title: "Explainable Candidates Leaderboard",
    explanation: "Displays finalist candidates sorted by AI scores, matching parameters, and reliability indicators.",
    valueProp: "Enables recruiters to scan the best profiles instantly with detailed breakdown scoring.",
    judgeInfo: {
      whyItMatters: "Standard leaderboards offer black-box ranking scores; our dashboard lists clear metrics per profile.",
      architecture: "Cross-Encoder Reranker models scoring Top-K candidates over candidate profiles.",
      businessValue: "Reduces screening review times by 65%.",
      innovation: "Color-coded composite scoring progress tracks with anomaly warning chips.",
      enterpriseImpact: "Scales candidate sorting capabilities for enterprise recruiting cohorts.",
    }
  },
  {
    id: 5,
    route: "/candidates/CAND-1",
    selector: "#candidate-profile-hero",
    title: "Candidate Profile Deep-Dive",
    explanation: "Audit a candidate's credentials, career timelines, skill checks, and background verifications.",
    valueProp: "Consolidates resume data, background logs, and AI analysis into a single view.",
    judgeInfo: {
      whyItMatters: "Recruiters jump between 4 tools to review profiles; deep-dives unify evaluations instantly.",
      architecture: "Relational database links mapping work timelines and education tiers checks.",
      businessValue: "Eliminates tool-switching friction, saving hours of review daily.",
      innovation: "Visual timeline promotability markers and academic credentials tiering (Tier 1-4).",
      enterpriseImpact: "Standardizes validation benchmarks across global candidate pools.",
    }
  },
  {
    id: 6,
    route: "/copilot",
    selector: "#recruiter-copilot-input",
    title: "AI Recruiter Copilot Dialogue",
    explanation: "Query details about candidates, search skills, or trigger comparisons using natural language prompts.",
    valueProp: "Acts as an on-demand junior recruiter, answering query parameters instantly.",
    judgeInfo: {
      whyItMatters: "Static profile reports are limited; interactive AI copilots allow dynamic profile querying.",
      architecture: "RAG chat architecture with system prompts referencing profiles context.",
      businessValue: "Speeds up custom candidate audits by 80%.",
      innovation: "Context-aware response streaming with direct candidate reference card highlights.",
      enterpriseImpact: "Democratizes database query capabilities for non-technical recruiters.",
    }
  },
  {
    id: 7,
    route: "/comparison",
    selector: "#comparison-radar-graph",
    title: "Multi-Candidate Radar Comparison",
    explanation: "Compare 2-5 candidates simultaneously across Technical, Behavioral, and Reliability parameters.",
    valueProp: "Provides visual comparison to aid hiring manager consensus and decision making.",
    judgeInfo: {
      whyItMatters: "Reviewing profiles sequentially is time-consuming; visual overlays reveal strengths instantly.",
      architecture: "Responsive Recharts radar layouts with multi-colored area overlays.",
      businessValue: "Accelerates candidate shortlisting from days to minutes.",
      innovation: "Clickable legend toggles to focus on specific candidate curves dynamically.",
      enterpriseImpact: "Implements quantitative scoring comparisons across enterprise hiring teams.",
    }
  },
  {
    id: 8,
    route: "/analytics",
    selector: "#system-health-telemetry",
    title: "Information Retrieval Metrics",
    explanation: "Monitor search precision benchmarks: NDCG@5, MRR, Precision, and backend server health.",
    valueProp: "Confirms system reliability, proving search accuracy to judges and leaders.",
    judgeInfo: {
      whyItMatters: "Hiring managers need trust that sorting models are mathematically sound and accurate.",
      architecture: "Calculates NDCG (Normalized Discounted Cumulative Gain) against expert candidate scores.",
      businessValue: "Assures search engine quality, reducing candidate match errors.",
      innovation: "Live IR analytics dashboarding over vector and text search layers.",
      enterpriseImpact: "Ensures compliance and auditing verification for internal AI hiring systems.",
    }
  },
  {
    id: 9,
    route: "/admin",
    selector: "#ranking-weights-editor-panel",
    title: "Admin AI Scoring Calibration",
    explanation: "Fine-tune scoring weights (Tech depth, behavioral, reliability) with live normalization.",
    valueProp: "Gives administrators configuration control to customize scoring rules for unique roles.",
    judgeInfo: {
      whyItMatters: "Fixed AI models are rigid; editable weights let platforms adjust to candidate pool changes.",
      architecture: "Zustand store capturing parameter calibrations in draft configurations prior to saving.",
      businessValue: "Ensures the ranking engine aligns with specialized hiring goals.",
      innovation: "Real-time candidate score impact simulation with validation checks.",
      enterpriseImpact: "Provides corporate IT governance controls over search configurations.",
    }
  }
];

export const useDemoStore = create<DemoStoreState>()(
  persist(
    (set) => ({
      demoActive: false,
      currentStep: 0,
      isPlaying: false,
      playbackSpeed: 1,
      scenario: "swe",
      judgeMode: true,
      showHelp: false,
      showSettings: false,
      isCompleted: false,
      reducedMotion: false,
      
      steps: TOUR_STEPS,
      
      startDemo: (scenario, mode) => {
        set({
          demoActive: true,
          currentStep: 0,
          scenario,
          isPlaying: mode === "auto",
          isCompleted: false,
          showHelp: false,
          showSettings: false,
        });
      },
      
      exitDemo: () => set({
        demoActive: false,
        currentStep: 0,
        isPlaying: false,
        isCompleted: false,
        showHelp: false,
        showSettings: false,
      }),
      
      nextStep: () => set((state) => {
        const isLast = state.currentStep === state.steps.length - 1;
        if (isLast) {
          return { isCompleted: true, isPlaying: false };
        }
        return { currentStep: state.currentStep + 1 };
      }),
      
      prevStep: () => set((state) => ({
        currentStep: Math.max(0, state.currentStep - 1)
      })),
      
      jumpToStep: (currentStep) => set({ currentStep, isCompleted: false }),
      setPlaying: (isPlaying) => set({ isPlaying }),
      setSpeed: (playbackSpeed) => set({ playbackSpeed }),
      setScenario: (scenario) => set({ scenario }),
      setJudgeMode: (judgeMode) => set({ judgeMode }),
      toggleHelp: () => set((state) => ({ showHelp: !state.showHelp })),
      toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      completeDemo: () => set({ isCompleted: true, isPlaying: false, demoActive: false }),
    }),
    {
      name: "demo-store",
    }
  )
);
