import React, { useState } from 'react';
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  ArrowRight,
  FileCheck,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { JobDescriptionData } from '../../types';

interface JobDescriptionSectionProps {
  onStartJobInterview?: (jdId: string) => void;
}

export const JobDescriptionSection: React.FC<JobDescriptionSectionProps> = ({
  onStartJobInterview,
}) => {
  const { user, activeResume, showToast } = useAuth();
  const [jdText, setJdText] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [savedJDs, setSavedJDs] = useState<JobDescriptionData[]>([]);
  const [activeJD, setActiveJD] = useState<JobDescriptionData | null>(null);

  React.useEffect(() => {
    if (user) {
      loadSavedJDs();
    }
  }, [user]);

  const loadSavedJDs = async () => {
    try {
      const res = await api.getJobDescriptions();
      setSavedJDs(res.jobDescriptions);
      if (res.jobDescriptions.length > 0 && !activeJD) {
        setActiveJD(res.jobDescriptions[0]);
      }
    } catch {
      // Ignored
    }
  };

  const handleAnalyzeJD = async () => {
    if (!jdText.trim() || jdText.trim().length < 30) {
      showToast('Please provide a complete job description text (minimum 30 characters).', 'error');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await api.createJobDescription({
        rawText: jdText,
        title: jobTitle.trim() || undefined,
        company: company.trim() || undefined,
        resumeId: activeResume?.id,
      });

      showToast('Job description analyzed and compared against your resume!', 'success');
      setActiveJD(res.jobDescription);
      setSavedJDs((prev) => [res.jobDescription, ...prev]);
      setJdText('');
      setJobTitle('');
      setCompany('');
    } catch (err: any) {
      showToast(err.message || 'Failed to analyze job description.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteJD = async (id: string) => {
    try {
      await api.deleteJobDescription(id);
      showToast('Job description removed.', 'info');
      const updated = savedJDs.filter((j) => j.id !== id);
      setSavedJDs(updated);
      if (activeJD?.id === id) {
        setActiveJD(updated[0] || null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete job description.', 'error');
    }
  };

  const sampleJD = `Senior Software Engineer (Full Stack) - TechCorp
Location: San Francisco, CA / Remote

About The Role:
We are seeking a Full Stack Software Engineer to build scalable microservices and intuitive web interfaces. You will work on real-time data pipelines and customer-facing dashboards.

Key Responsibilities:
- Design, build, and maintain RESTful and GraphQL APIs in Python or Node.js.
- Build high-performance frontend interfaces using React, Next.js, and TypeScript.
- Optimize database queries and schema designs in PostgreSQL and Redis.
- Collaborate with DevOps to containerize applications using Docker and deploy via Kubernetes.
- Participate in code reviews, architectural design sessions, and agile sprint planning.

Requirements:
- 2+ years of professional or strong academic project experience in full-stack development.
- Strong proficiency in Python, TypeScript, and modern React.
- Solid understanding of relational databases (PostgreSQL) and caching strategies (Redis).
- Experience with cloud services (AWS or GCP) and Docker containerization.
- Excellent communication and problem-solving skills.`;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Briefcase className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              Target Job Description Matcher
            </h3>
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              Optional
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Compare your resume directly with a specific job posting to uncover matching skills, missing requirements, and role-specific interview questions.
          </p>
        </div>

        {savedJDs.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto">
            {savedJDs.map((jd) => (
              <button
                key={jd.id}
                onClick={() => setActiveJD(jd)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeJD?.id === jd.id
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {jd.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="bg-gray-50/70 p-4 sm:p-6 rounded-2xl border border-gray-200/80 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Target Job Title (Optional)
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Software Engineer, Backend Developer"
              className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Company Name (Optional)
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google, Stripe, CloudScale"
              className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-purple-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-700">
              Job Description Text
            </label>
            <button
              type="button"
              onClick={() => {
                setJdText(sampleJD);
                setJobTitle('Full Stack Software Engineer');
                setCompany('TechCorp');
              }}
              className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Load Sample Job Description
            </button>
          </div>
          <textarea
            rows={5}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the target job description requirements and responsibilities here..."
            className="w-full p-3 text-xs font-mono bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-purple-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAnalyzeJD}
            disabled={analyzing || !jdText.trim()}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze & Match with Resume</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active JD Analysis Result */}
      {activeJD && (
        <div className="p-5 rounded-2xl border border-purple-100 bg-purple-50/20 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-gray-900">{activeJD.title}</h4>
                {activeJD.company && (
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    at <Building className="w-3 h-3 text-gray-400" /> {activeJD.company}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Analyzed and mapped to resume competencies.
              </p>
            </div>
            <button
              onClick={() => handleDeleteJD(activeJD.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
              title="Delete this JD"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matching Skills */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Matching Skills on Resume</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeJD.analysis.matchingSkillsWithResume &&
                activeJD.analysis.matchingSkillsWithResume.length > 0 ? (
                  activeJD.analysis.matchingSkillsWithResume.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[11px] font-medium border border-emerald-200"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No direct matching skills detected yet.</p>
                )}
              </div>
            </div>

            {/* Missing or Unverified Skills */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Not Explicitly Mentioned on Resume</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeJD.analysis.missingSkillsNotOnResume &&
                activeJD.analysis.missingSkillsNotOnResume.length > 0 ? (
                  activeJD.analysis.missingSkillsNotOnResume.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-amber-50 text-amber-800 rounded-md text-[11px] font-medium border border-amber-200"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">All key JD skills appear in your resume!</p>
                )}
              </div>
            </div>
          </div>

          {/* Suggested Preparation Topics */}
          {activeJD.analysis.suggestedTopics && activeJD.analysis.suggestedTopics.length > 0 && (
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2">
                Role-Specific Focus Topics
              </span>
              <div className="flex flex-wrap gap-2">
                {activeJD.analysis.suggestedTopics.map((top, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200"
                  >
                    {top}
                  </span>
                ))}
              </div>
            </div>
          )}

          {onStartJobInterview && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onStartJobInterview(activeJD.id)}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
              >
                <span>Launch Mock Interview Tailored to This Job</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
