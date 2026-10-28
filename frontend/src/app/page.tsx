"use client";

import React, { useState } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Trash2,
  Loader2,
  Briefcase,
  Award,
  GitCompare,
  Mail,
} from "lucide-react";
import { customizeResume, CustomizeResumeResponse } from "@/lib/api";

type ActiveTab = "resume" | "insights" | "cover_letter" | "diff";

export default function HomePage() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CustomizeResumeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("resume");
  const [copied, setCopied] = useState(false);

  const MIN_JD_CHARS = 50;

  // Handle File Selection & Client-side Validation (Core Feature 2 & 5)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      setError("Invalid file format. Please upload a PDF or DOCX file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit. Please upload a smaller file.");
      return;
    }
    setResumeFile(file);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (jobDescription.trim().length < MIN_JD_CHARS) {
      setError(`Please enter a valid Job Description (at least ${MIN_JD_CHARS} characters).`);
      return;
    }
    if (!resumeFile) {
      setError("Please upload your resume (PDF or DOCX) before customizing.");
      return;
    }

    try {
      setLoading(true);
      const response = await customizeResume(jobDescription, resumeFile);
      setResult(response);
      setActiveTab("resume");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while communicating with the server.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Download as Plain Text (.TXT) (Core Feature 4)
  const handleDownloadTxt = () => {
    if (!result) return;
    const d = result.customized_data;
    const lines = [
      d.candidate_name.toUpperCase(),
      d.contact_info,
      "",
      "PROFESSIONAL SUMMARY",
      "----------------------------------------",
      d.tailored_summary,
      "",
      "MATCHED SKILLS",
      "----------------------------------------",
      d.matched_skills.join(", "),
      ...(d.other_skills.length ? ["", "ADDITIONAL SKILLS", d.other_skills.join(", ")] : []),
      "",
      "EXPERIENCE",
      "----------------------------------------",
      ...d.experience.flatMap((exp) => [
        `${exp.role} | ${exp.company} (${exp.duration})`,
        ...exp.bullets.map((b) => `  • ${b}`),
        "",
      ]),
      ...(d.projects.length
        ? [
            "PROJECTS",
            "----------------------------------------",
            ...d.projects.flatMap((p) => [
              `${p.title} (${p.tech_stack})`,
              ...p.bullets.map((b) => `  • ${b}`),
              "",
            ]),
          ]
        : []),
      "EDUCATION",
      "----------------------------------------",
      ...d.education.map((edu) => `• ${edu}`),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tailored_${d.candidate_name.replace(/\s+/g, "_")}_Resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download as PDF via Native Print View (Core Feature 4)
  const handleDownloadPdf = () => {
    setActiveTab("resume");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCopyCoverLetter = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.customized_data.cover_letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Print-only CSS rules so window.print() exports ONLY the clean resume sheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-resume,
          #printable-resume * {
            visibility: visible;
          }
          #printable-resume {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-900">
                AI Resume Customizer
              </h1>
              <p className="text-xs text-slate-500">
                ATS-Optimized Resume & Cover Letter Tailoring
              </p>
            </div>
          </div>
          <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
            Powered by Google Gemini
          </span>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Inputs (5 cols) */}
        <section className="lg:col-span-5 space-y-6 print:hidden">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              1. Target Job Description
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <textarea
                  rows={9}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full Job Description (responsibilities, required skills, qualifications) here..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
                <div className="flex justify-between items-center mt-1.5 text-xs">
                  <span
                    className={
                      jobDescription.trim().length >= MIN_JD_CHARS
                        ? "text-emerald-600 font-medium"
                        : "text-slate-500"
                    }
                  >
                    {jobDescription.trim().length} characters (min {MIN_JD_CHARS})
                  </span>
                  {jobDescription.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setJobDescription("")}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Resume Upload Section */}
              <div>
                <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  2. Upload Your Resume (PDF or DOCX)
                </h2>

                {!resumeFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-400 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                      <Upload className="w-7 h-7 text-indigo-500 mb-2" />
                      <p className="text-sm font-medium text-slate-700">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports .PDF and .DOCX (Max 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  /* Display File Name and Size after upload (Core Feature 2) */
                  <div className="flex items-center justify-between p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-indigo-600 text-white p-2 rounded-lg shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {resumeFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(resumeFile.size / 1024).toFixed(2)} KB • Ready to parse
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Error Banner (Core Feature 5) */}
              {error && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing JD & Tailoring Resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Customize My Resume
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* RIGHT COLUMN: Output Display (7 cols) */}
        <section className="lg:col-span-7">
          {!result && !loading && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center min-h-[480px]">
              <div className="bg-slate-100 p-4 rounded-full mb-4 text-slate-400">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Your Tailored Resume Will Appear Here
              </h3>
              <p className="text-sm text-slate-500 max-w-md mt-2">
                Paste a target Job Description on the left and upload your current PDF or DOCX
                resume to get an ATS-optimized version, match score, and custom cover letter.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center h-full flex flex-col items-center justify-center min-h-[480px]">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-slate-800">
                Tailoring Your Resume with Gemini AI...
              </h3>
              <p className="text-sm text-slate-500 max-w-md mt-2">
                Extracting resume sections, matching JD keywords, rewriting impact bullets, and
                calculating your ATS compatibility score. This may take 15–45 seconds.
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Top Score Bar + Action Buttons */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-xs text-slate-500 block">Original JD Match</span>
                    <span className="text-xl font-bold text-amber-600">
                      {result.customized_data.match_score}%
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className="text-xs text-slate-500 block">Tailored ATS Score</span>
                    <span className="text-xl font-bold text-emerald-600">
                      {result.customized_data.ats_score}%
                    </span>
                  </div>
                </div>

                {/* Download Buttons (Core Feature 4) */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleDownloadTxt}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download .TXT
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto print:hidden">
                <button
                  onClick={() => setActiveTab("resume")}
                  className={`pb-3 px-3 text-sm font-medium border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "resume"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Tailored Resume
                </button>
                <button
                  onClick={() => setActiveTab("insights")}
                  className={`pb-3 px-3 text-sm font-medium border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "insights"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Missing Keywords ({result.customized_data.missing_keywords.length})
                </button>
                <button
                  onClick={() => setActiveTab("cover_letter")}
                  className={`pb-3 px-3 text-sm font-medium border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "cover_letter"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Cover Letter
                </button>
                <button
                  onClick={() => setActiveTab("diff")}
                  className={`pb-3 px-3 text-sm font-medium border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "diff"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  Before vs After
                </button>
              </div>

              {/* TAB 1: Formatted Tailored Resume View */}
              {activeTab === "resume" && (
                <div
                  id="printable-resume"
                  className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-8 space-y-6 text-slate-800"
                >
                  {/* Candidate Header */}
                  <div className="border-b border-slate-200 pb-4">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {result.customized_data.candidate_name}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      {result.customized_data.contact_info}
                    </p>
                  </div>

                  {/* Tailored Summary */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
                      Professional Summary
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {result.customized_data.tailored_summary}
                    </p>
                  </div>

                  {/* Highlighted Skills */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2.5">
                      Core Competencies & Matched Skills
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {result.customized_data.matched_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 print:hidden" />
                          {skill}
                        </span>
                      ))}
                      {result.customized_data.other_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  {result.customized_data.experience.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3">
                        Professional Experience
                      </h3>
                      <div className="space-y-4">
                        {result.customized_data.experience.map((exp, idx) => (
                          <div key={idx}>
                            <div className="flex flex-wrap justify-between items-baseline">
                              <h4 className="font-semibold text-sm text-slate-900">
                                {exp.role}{" "}
                                <span className="text-slate-600 font-normal">
                                  • {exp.company}
                                </span>
                              </h4>
                              <span className="text-xs text-slate-500">{exp.duration}</span>
                            </div>
                            <ul className="mt-1.5 space-y-1 list-disc list-inside text-sm text-slate-700">
                              {exp.bullets.map((bullet, bIdx) => (
                                <li key={bIdx} className="leading-relaxed">
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {result.customized_data.projects.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3">
                        Key Projects
                      </h3>
                      <div className="space-y-3">
                        {result.customized_data.projects.map((proj, idx) => (
                          <div key={idx}>
                            <div className="flex flex-wrap justify-between items-baseline">
                              <h4 className="font-semibold text-sm text-slate-900">
                                {proj.title}
                              </h4>
                              {proj.tech_stack && (
                                <span className="text-xs font-medium text-indigo-600">
                                  {proj.tech_stack}
                                </span>
                              )}
                            </div>
                            <ul className="mt-1 space-y-1 list-disc list-inside text-sm text-slate-700">
                              {proj.bullets.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education & Certifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
                        Education
                      </h3>
                      <ul className="space-y-1 text-sm text-slate-700">
                        {result.customized_data.education.map((edu, idx) => (
                          <li key={idx}>{edu}</li>
                        ))}
                      </ul>
                    </div>

                    {result.customized_data.certifications.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
                          Certifications
                        </h3>
                        <ul className="space-y-1 text-sm text-slate-700">
                          {result.customized_data.certifications.map((cert, idx) => (
                            <li key={idx}>• {cert}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Missing Keywords & ATS Insights */}
              {activeTab === "insights" && (
                <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">
                      Suggested Missing Keywords from Job Description
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      These high-priority keywords appear in the JD but were not found in your
                      original resume. Consider adding any you have experience with:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {result.customized_data.missing_keywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold"
                        >
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-5">
                    <h3 className="text-base font-semibold text-slate-800">
                      Matched Skills Highlighted ({result.customized_data.matched_skills.length})
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {result.customized_data.matched_skills.map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold"
                        >
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Bonus Cover Letter Generator */}
              {activeTab === "cover_letter" && (
                <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-800">
                      Tailored Cover Letter
                    </h3>
                    <button
                      onClick={handleCopyCoverLetter}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Cover Letter
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {result.customized_data.cover_letter}
                  </div>
                </div>
              )}

              {/* TAB 4: Bonus Side-by-Side Diff View */}
              {activeTab === "diff" && (
                <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Original Extracted Resume ({result.filename})
                      </h4>
                      <pre className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 whitespace-pre-wrap font-sans max-h-[500px] overflow-y-auto leading-relaxed">
                        {result.original_resume_text}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
                        Tailored Summary & Experience Bullets
                      </h4>
                      <div className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs text-slate-800 space-y-3 max-h-[500px] overflow-y-auto leading-relaxed">
                        <div>
                          <strong className="block text-emerald-900 mb-1">New Summary:</strong>
                          <p>{result.customized_data.tailored_summary}</p>
                        </div>
                        <div>
                          <strong className="block text-emerald-900 mb-1">
                            Rephrased Experience:
                          </strong>
                          {result.customized_data.experience.map((e, i) => (
                            <div key={i} className="mb-2">
                              <span className="font-semibold">{e.role}:</span>
                              <ul className="list-disc list-inside pl-1 mt-0.5 space-y-0.5">
                                {e.bullets.map((b, bi) => (
                                  <li key={bi}>{b}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}