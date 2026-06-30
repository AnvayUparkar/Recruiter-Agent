export interface JobPosting {
  _id?: string;
  title: string;
  company: string;
  location: string;
  work_mode: string;
  experience_range?: { min: number; max: number };
  employment_type: string;
  description: string;
  skills?: (string | { name: string })[];
  applications_count?: number;
}
