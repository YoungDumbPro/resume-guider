export interface ExperienceItem {
  role: string;
  company: string;
  duration: string;
  bullets: string[];
}

export interface ProjectItem {
  title: string;
  tech_stack: string;
  bullets: string[];
}

export interface LLMResumeOutput {
  candidate_name: string;
  contact_info: string;
  tailored_summary: string;
  matched_skills: string[];
  other_skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: string[];
  certifications: string[];
  missing_keywords: string[];
  match_score: number;
  ats_score: number;
  cover_letter: string;
}

export interface CustomizeResumeResponse {
  status: string;
  filename: string;
  file_size_kb: number;
  original_resume_text: string;
  customized_data: LLMResumeOutput;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function customizeResume(
  jobDescription: string,
  resumeFile: File
): Promise<CustomizeResumeResponse> {
  const formData = new FormData();
  formData.append("job_description", jobDescription);
  formData.append("resume_file", resumeFile);

  const response = await fetch(`${API_BASE_URL}/api/v1/customize-resume`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = "Failed to customize resume. Please try again.";
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map((e: { msg: string }) => e.msg).join(", ");
      }
    } catch {
      errorMessage = `Server Error (${response.status}): ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}