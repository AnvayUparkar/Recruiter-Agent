import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobStore } from "../../store/jobStore";
import { useAppStore } from "../../store/appStore";
import { jobService } from "../../services/jobService";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Plus, X, GripVertical, CheckCircle2, ChevronRight, Save } from "lucide-react";

export const JobPostingForm: React.FC = () => {
  const navigate = useNavigate();
  const { jobData, setJobData, initializeFromJD } = useJobStore();
  const { parsedJD } = useAppStore();
  const [newSkill, setNewSkill] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    // If we have a parsed JD in the app store, and we haven't initialized our form yet
    if (parsedJD && !jobData.title && !jobData.company) {
      initializeFromJD(parsedJD);
    }
  }, [parsedJD, initializeFromJD, jobData.title, jobData.company]);

  const handleSave = async (publish = false) => {
    try {
      setIsPublishing(true);
      const dataToSave = { ...jobData, status: publish ? "Published" : "Draft" };
      let savedJob;
      
      if (jobData._id) {
        await jobService.updateJob(jobData._id, dataToSave);
        savedJob = dataToSave;
      } else {
        savedJob = await jobService.createJob(dataToSave);
        setJobData({ _id: savedJob._id });
      }

      if (publish && savedJob._id) {
        await jobService.publishJob(savedJob._id);
        navigate(`/jobs/${savedJob._id}/candidates`);
      } else if (!publish) {
        alert("Draft saved successfully!");
      }
    } catch (error) {
      console.error("Failed to save job:", error);
      alert("Failed to save job posting.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newSkill.trim() !== "") {
      const skill = newSkill.trim();
      if (!jobData.selected_skills.includes(skill)) {
        setJobData({
          selected_skills: [...jobData.selected_skills, skill],
          parsed_skills: [...jobData.parsed_skills, skill]
        });
      }
      setNewSkill("");
      e.preventDefault();
    }
  };

  const removeSkill = (skill: string) => {
    setJobData({
      selected_skills: jobData.selected_skills.filter(s => s !== skill),
      required_skills: jobData.required_skills.filter(s => s !== skill),
      preferred_skills: jobData.preferred_skills.filter(s => s !== skill),
    });
  };

  const toggleSkillCategory = (skill: string, category: 'required' | 'preferred' | 'nice_to_have') => {
    const req = jobData.required_skills.filter(s => s !== skill);
    const pref = jobData.preferred_skills.filter(s => s !== skill);
    const nice = jobData.nice_to_have_skills.filter(s => s !== skill);

    if (category === 'required') req.push(skill);
    if (category === 'preferred') pref.push(skill);
    if (category === 'nice_to_have') nice.push(skill);

    setJobData({ required_skills: req, preferred_skills: pref, nice_to_have_skills: nice });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Create Job Posting</h1>
          <p className="text-sm text-slate-500 mt-2">Review and finalize extracted details before publishing.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => handleSave(false)}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Save size={18} /> Save Draft
          </button>
          <button 
            onClick={() => handleSave(true)}
            disabled={isPublishing}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {isPublishing ? "Publishing..." : "Publish & Match"} <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Basic Info */}
          <section className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Job Title</label>
                <input 
                  type="text" 
                  value={jobData.title} 
                  onChange={e => setJobData({ title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Company Name</label>
                <input 
                  type="text" 
                  value={jobData.company} 
                  onChange={e => setJobData({ company: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Location</label>
                <input 
                  type="text" 
                  value={jobData.location} 
                  onChange={e => setJobData({ location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Work Mode</label>
                <select 
                  value={jobData.work_mode} 
                  onChange={e => setJobData({ work_mode: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option>Remote</option>
                  <option>Hybrid</option>
                  <option>Onsite</option>
                </select>
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Required Skills</h2>
            <div className="space-y-4">
              <input 
                type="text" 
                value={newSkill} 
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="Type a skill and press Enter..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {jobData.selected_skills.map((skill) => (
                    <motion.div
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`flex flex-col rounded-xl overflow-hidden border ${jobData.required_skills.includes(skill) ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'}`}
                    >
                      <div className="px-3 py-1.5 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{skill}</span>
                        <button onClick={() => removeSkill(skill)} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="flex text-[10px] uppercase font-bold divide-x divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800">
                        <button 
                          onClick={() => toggleSkillCategory(skill, 'required')}
                          className={`flex-1 px-2 py-1 ${jobData.required_skills.includes(skill) ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                          Must
                        </button>
                        <button 
                          onClick={() => toggleSkillCategory(skill, 'preferred')}
                          className={`flex-1 px-2 py-1 ${jobData.preferred_skills.includes(skill) ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                          Pref
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* Experience & Education */}
          <section className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Experience & Education</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Min Experience (Years)</label>
                <input 
                  type="number" 
                  value={jobData.experience.min} 
                  onChange={e => setJobData({ experience: { ...jobData.experience, min: Number(e.target.value) } })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Max Experience (Years)</label>
                <input 
                  type="number" 
                  value={jobData.experience.max} 
                  onChange={e => setJobData({ experience: { ...jobData.experience, max: Number(e.target.value) } })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Education Degree</label>
                <input 
                  type="text" 
                  value={jobData.education.degree} 
                  onChange={e => setJobData({ education: { ...jobData.education, degree: e.target.value } })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>
          </section>

        </div>
        
        {/* Sidebar */}
        <div className="space-y-8">
          <section className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Interview Process</h2>
            <Reorder.Group 
              axis="y" 
              values={jobData.interview_process} 
              onReorder={val => setJobData({ interview_process: val })}
              className="space-y-3"
            >
              {jobData.interview_process.map((round, index) => (
                <Reorder.Item 
                  key={round.id} 
                  value={round}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-grab active:cursor-grabbing shadow-sm"
                >
                  <GripVertical size={16} className="text-slate-400 shrink-0" />
                  <div className="flex-1 text-sm font-medium">Round {index + 1}: {round.name}</div>
                  <button onClick={() => setJobData({ interview_process: jobData.interview_process.filter(r => r.id !== round.id) })}>
                    <X size={14} className="text-slate-400 hover:text-rose-500" />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <button 
              onClick={() => setJobData({ interview_process: [...jobData.interview_process, { id: `round-${Date.now()}`, name: "New Round" }] })}
              className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Round
            </button>
          </section>

          <section className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Benefits</h2>
            <div className="flex flex-wrap gap-2">
              {jobData.benefits.map(benefit => (
                <div key={benefit} className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> {benefit}
                  <button onClick={() => setJobData({ benefits: jobData.benefits.filter(b => b !== benefit) })} className="ml-1 opacity-60 hover:opacity-100">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
               <input 
                 type="text"
                 placeholder="Add benefit..."
                 className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none focus:ring-1 focus:ring-blue-500"
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && e.currentTarget.value) {
                     setJobData({ benefits: [...jobData.benefits, e.currentTarget.value] });
                     e.currentTarget.value = "";
                   }
                 }}
               />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
