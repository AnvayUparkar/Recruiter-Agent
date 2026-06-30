import { create } from "zustand";
import { ParsedJD } from "../types/common";

export interface JobPostingData {
  _id?: string;
  title: string;
  company: string;
  description: string;
  
  parsed_skills: string[];
  selected_skills: string[];
  required_skills: string[];
  preferred_skills: string[];
  nice_to_have_skills: string[];
  
  experience: {
    min: number;
    max: number;
    required_industry: string;
    preferred_industry: string;
    previous_product_company: boolean;
    startup_experience: boolean;
    leadership_experience: boolean;
  };
  
  education: {
    degree: string;
    branch: string;
    min_cgpa: number;
    preferred_colleges: string[];
  };
  
  responsibilities: string[];
  benefits: string[];
  interview_process: { id: string; name: string }[];
  
  employment_type: string;
  location: string;
  work_mode: string;
  salary_range: string;
  openings: number;
  priority: string;
  
  status: string;
}

const defaultJobData: JobPostingData = {
  title: "",
  company: "",
  description: "",
  parsed_skills: [],
  selected_skills: [],
  required_skills: [],
  preferred_skills: [],
  nice_to_have_skills: [],
  experience: {
    min: 0,
    max: 5,
    required_industry: "",
    preferred_industry: "",
    previous_product_company: false,
    startup_experience: false,
    leadership_experience: false,
  },
  education: {
    degree: "",
    branch: "",
    min_cgpa: 0,
    preferred_colleges: [],
  },
  responsibilities: [],
  benefits: ["Health Insurance", "Paid Time Off", "Flexible Working Hours"],
  interview_process: [
    { id: "round-1", name: "Initial HR Screening" },
    { id: "round-2", name: "Technical Interview" }
  ],
  employment_type: "Full-Time",
  location: "Remote",
  work_mode: "Remote",
  salary_range: "",
  openings: 1,
  priority: "Medium",
  status: "Draft",
};

interface JobStore {
  jobData: JobPostingData;
  setJobData: (data: Partial<JobPostingData>) => void;
  initializeFromJD: (jd: ParsedJD) => void;
  resetJobData: () => void;
}

export const useJobStore = create<JobStore>((set) => ({
  jobData: { ...defaultJobData },
  
  setJobData: (data) => set((state) => ({
    jobData: { ...state.jobData, ...data }
  })),
  
  initializeFromJD: (jd) => set((state) => {
    // Extract unique skills
    const reqSkills = jd.must_have?.map(req => req.name) || [];
    const prefSkills = jd.good_to_have?.map(req => req.name) || [];
    const allSkills = Array.from(new Set([...reqSkills, ...prefSkills]));
    
    // Map responsibilities
    let responsibilities = [];
    if (Array.isArray(jd.responsibilities) && jd.responsibilities.length > 0) {
      if (typeof jd.responsibilities[0] === 'object') {
        responsibilities = jd.responsibilities.map((r: any) => r.description || r.name || JSON.stringify(r));
      } else {
        responsibilities = jd.responsibilities;
      }
    }
    
    return {
      jobData: {
        ...state.jobData,
        title: jd.job_title || "",
        company: jd.company_name || "",
        description: jd.raw_text || jd.rawText || "",
        parsed_skills: allSkills,
        selected_skills: allSkills,
        required_skills: reqSkills,
        preferred_skills: prefSkills,
        experience: {
          ...state.jobData.experience,
          min: jd.experience_range?.[0] || 0,
          max: jd.experience_range?.[1] || 5,
        },
        education: {
          ...state.jobData.education,
          degree: jd.degrees?.join(", ") || "",
        },
        responsibilities: responsibilities,
        employment_type: jd.employmentType || "Full-Time",
        location: (jd.location_preferences || []).join(", ") || "Remote",
        work_mode: jd.work_mode || "Remote",
        salary_range: jd.salary_range || "",
      }
    };
  }),
  
  resetJobData: () => set({ jobData: { ...defaultJobData } }),
}));
