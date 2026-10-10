import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  FolderGit2,
  GraduationCap,
  Briefcase,
  Layers,
  Trash2,
  Check,
  Plus,
  PlayCircle,
  FileCode,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  FileType,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ResumeData, ExtractedTopic } from '../../types';
import { SAMPLE_TECH_RESUME_TEXT } from './sampleResume';

interface ResumeUploadSectionProps {
  onStartPractice?: () => void;
  openAuthModal?: () => void;
}

export const ResumeUploadSection: React.FC<ResumeUploadSectionProps> = ({
  onStartPractice,
  openAuthModal,
}) => {
  const { user, activeResume, setActiveResume, refreshResumes, showToast } = useAuth();
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'paste'>('file');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [resumesList, setResumesList] = useState<ResumeData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load resumes on mount or user change
  useEffect(() => {
    loadResumes();
  }, [user]);

  const loadResumes = async () => {
    try {
      const data = await api.getResumes();
      setResumesList(data.resumes || []);
      if (data.resumes && data.resumes.length > 0 && !activeResume) {
        setActiveResume(data.resumes[0]);
      }
    } catch {
      // Ignored
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('File size exceeds the 15MB limit.', 'error');
      return;
    }

    setUploadedFileName(file.name);
    setUploading(true);
    setUploadProgress('Receiving uploaded document...');

    try {
      setUploadProgress(`Processing ${file.name} with Gemini AI document engine...`);
      const res = await api.uploadResumeFile(file);
      showToast(`Resume "${file.name}" received & interview topics extracted!`, 'success');
      setActiveResume(res.resume);
      await loadResumes();
    } catch (err: any) {
      console.error('File upload error:', err);
      showToast(err.message || 'Failed to process resume file. Please try pasting the text.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTextUpload = async (textToUpload: string, nameToUse: string) => {
    if (!textToUpload || textToUpload.trim().length < 40) {
      showToast('Please paste a detailed resume (minimum 40 characters).', 'error');
      return;
    }

    setUploadedFileName(nameToUse);
    setUploading(true);
    setUploadProgress('Analyzing resume text with Gemini AI...');

    try {
      const res = await api.uploadResumeText(textToUpload, nameToUse || 'Pasted Resume');
      showToast('Resume analyzed successfully!', 'success');
      setActiveResume(res.resume);
      setPasteText('');
      await loadResumes();
    } catch (err: any) {
      console.error('Text resume upload error:', err);
      showToast(err.message || 'Failed to analyze pasted resume.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleLoadSampleResume = () => {
    setUploadMethod('paste');
    setPasteText(SAMPLE_TECH_RESUME_TEXT);
    handleTextUpload(SAMPLE_TECH_RESUME_TEXT, 'Alex_Chen_UCBerkeley_Resume.txt');
  };

  const handleToggleTopic = async (topicId: string) => {
    if (!activeResume) return;
    const currentSelected = activeResume.topics.filter((t) => t.selected).map((t) => t.id);
    const newSelected = currentSelected.includes(topicId)
      ? currentSelected.filter((id) => id !== topicId)
      : [...currentSelected, topicId];

    try {
      const updated = await api.updateTopicSelection(activeResume.id, newSelected);
      setActiveResume(updated.resume);
    } catch (err: any) {
      showToast(err.message || 'Failed to update topic selection.', 'error');
    }
  };

  const handleSelectAllTopics = async (select: boolean) => {
    if (!activeResume) return;
    const newSelected = select ? activeResume.topics.map((t) => t.id) : [];
    try {
      const updated = await api.updateTopicSelection(activeResume.id, newSelected);
      setActiveResume(updated.resume);
    } catch (err: any) {
      showToast(err.message || 'Failed to update topic selection.', 'error');
    }
  };

  const handleRegenerateTopics = async () => {
    if (!activeResume) return;
    setRegenerating(true);
    try {
      const updated = await api.regenerateResumeAnalysis(activeResume.id);
      setActiveResume(updated.resume);
      showToast('Resume topics re-analyzed with Gemini!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to regenerate topics.', 'error');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.deleteResume(resumeId);
      showToast('Resume deleted.', 'info');
      const updatedList = resumesList.filter((r) => r.id !== resumeId);
      setResumesList(updatedList);
      if (activeResume?.id === resumeId) {
        setActiveResume(updatedList[0] || null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete resume.', 'error');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'programming':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'database':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'web':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'system_design':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'ml_ai':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'project':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'behavioral':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Resume Switcher Bar */}
      {resumesList.length > 1 && (
        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap pl-2">
              Analyzed Resumes:
            </span>
            {resumesList.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveResume(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeResume?.id === r.id
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{r.parsedSummary.fullName || r.fileName}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setActiveResume(null)}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload Another
          </button>
        </div>
      )}

      {/* Upload Zone */}
      {(!activeResume || resumesList.length === 0) && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-xs relative overflow-hidden">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Direct Resume Ingestion</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Upload Your Resume to InterVue
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Upload your PDF or DOCX file, or paste text. InterVue extracts your real technologies, projects, and coursework to generate personalized interview questions.
            </p>
          </div>

          {/* Upload Method Switch */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-gray-100 p-1 rounded-2xl">
              <button
                onClick={() => setUploadMethod('file')}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                  uploadMethod === 'file'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Upload File (PDF / DOCX)
              </button>
              <button
                onClick={() => setUploadMethod('paste')}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                  uploadMethod === 'paste'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Paste Plain Text
              </button>
            </div>
          </div>

          {/* Loading Animation during analysis */}
          {uploading ? (
            <div className="py-14 text-center space-y-4 max-w-md mx-auto">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-gray-900">
                  {uploadedFileName ? `Processing ${uploadedFileName}` : 'Analyzing Document'}
                </h4>
                <p className="text-xs text-gray-500">{uploadProgress}</p>
              </div>
            </div>
          ) : uploadMethod === 'file' ? (
            /* File Drag & Drop Zone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
                dragActive
                  ? 'border-blue-600 bg-blue-50/70 scale-[0.99]'
                  : 'border-gray-200 hover:border-blue-300 bg-gray-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <div className="w-16 h-16 bg-blue-100/70 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xs">
                <Upload className="w-8 h-8" />
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-1">
                Drag & drop your resume file here, or click to browse
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                Directly parses PDF, DOCX, and TXT resumes (up to 15MB)
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all"
                >
                  Select File from Computer
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleResume}
                  className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Try Sample CS Resume</span>
                </button>
              </div>
            </div>
          ) : (
            /* Paste Area */
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">
                  Paste Resume Text
                </label>
                <button
                  type="button"
                  onClick={handleLoadSampleResume}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Fill with Sample Resume
                </button>
              </div>
              <textarea
                rows={10}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your education, skills, projects, and work experience here..."
                className="w-full p-4 text-xs font-mono bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleTextUpload(pasteText, 'Pasted Resume')}
                  disabled={!pasteText.trim()}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  Analyze Pasted Resume
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Resume Extracted Details & Topics Selection */}
      {activeResume && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Resume Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-gray-900">
                      {activeResume.parsedSummary.fullName || activeResume.fileName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                      Active Resume
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 max-w-xl">
                    {activeResume.parsedSummary.summary ||
                      `Extracted from ${activeResume.fileName} • ${activeResume.topics.length} topics detected`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerateTopics}
                  disabled={regenerating}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  title="Re-run Gemini analysis"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{regenerating ? 'Analyzing...' : 'Re-Analyze'}</span>
                </button>

                <button
                  onClick={() => {
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload New</span>
                </button>

                <button
                  onClick={() => handleDeleteResume(activeResume.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-xl transition-colors"
                  title="Delete Resume"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Extracted Resume Summary Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Education */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Education</span>
                </div>
                {activeResume.parsedSummary.education && activeResume.parsedSummary.education.length > 0 ? (
                  <div className="space-y-2">
                    {activeResume.parsedSummary.education.map((edu, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                        <div className="font-semibold text-gray-900">{edu.institution}</div>
                        <div className="text-gray-600">{edu.degree}</div>
                        {edu.year && <div className="text-gray-400 text-[11px]">{edu.year}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No formal education section listed.</p>
                )}
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  <span>Extracted Skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {[
                    ...(activeResume.parsedSummary.programmingLanguages || []),
                    ...(activeResume.parsedSummary.frameworksAndTools || []),
                    ...(activeResume.parsedSummary.technicalSkills || []),
                  ].map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg text-[11px] font-medium border border-gray-200/80"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                  <FolderGit2 className="w-4 h-4 text-purple-600" />
                  <span>Detected Projects ({activeResume.parsedSummary.projects?.length || 0})</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeResume.parsedSummary.projects?.map((proj, idx) => (
                    <div key={idx} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                      <div className="font-semibold text-gray-900">{proj.title}</div>
                      <div className="text-gray-500 text-[11px] line-clamp-1">{proj.description}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {proj.techStack?.slice(0, 3).map((t, i) => (
                          <span key={i} className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Topics Selection Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                    Interview Preparation Topics
                  </h3>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                    {activeResume.topics.filter((t) => t.selected).length} of {activeResume.topics.length} Selected
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select which topics to practice in your progressive mock interview session.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllTopics(true)}
                  className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllTopics(false)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Topic Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeResume.topics.map((topic) => {
                const isSelected = topic.selected;
                const catClass = getCategoryColor(topic.category);

                return (
                  <div
                    key={topic.id}
                    onClick={() => handleToggleTopic(topic.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/20 shadow-xs ring-1 ring-blue-500'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${catClass}`}>
                          {topic.category.replace('_', ' ')}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-gray-900 mb-1">{topic.name}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3">
                        {topic.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 bg-gray-50/60 p-2 rounded-xl">
                      <span className="font-semibold text-gray-700">Resume Evidence: </span>
                      <span className="italic line-clamp-2">“{topic.evidence}”</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {onStartPractice && (
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Ready to test your skills? Launch your personalized practice drill.
                </div>
                <button
                  onClick={onStartPractice}
                  disabled={activeResume.topics.filter((t) => t.selected).length === 0}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Start Mock Interview with Selected Topics</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
