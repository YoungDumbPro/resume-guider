from pydantic import BaseModel, Field
from typing import List


class ParseTestResponse(BaseModel):
    status: str
    filename: str
    file_size_kb: float
    jd_character_count: int
    resume_character_count: int
    resume_preview: str


class ExperienceItem(BaseModel):
    role: str = Field(description="Job title / role")
    company: str = Field(description="Company or organization name")
    duration: str = Field(description="Dates of employment and location")
    bullets: List[str] = Field(
        description="Reordered and rephrased achievement bullets tailored to match JD keywords"
    )


class ProjectItem(BaseModel):
    title: str = Field(description="Project name or title")
    tech_stack: str = Field(description="Technologies used, if any")
    bullets: List[str] = Field(
        description="Tailored bullet points highlighting relevant aspects of the project"
    )


class LLMResumeOutput(BaseModel):
    candidate_name: str
    contact_info: str = Field(
        description="Email, phone, location, LinkedIn/GitHub formatted cleanly on one or two lines"
    )
    tailored_summary: str = Field(
        description="Rewritten 3-4 sentence professional summary directly aligned with the target JD"
    )
    matched_skills: List[str] = Field(
        description="Skills from the candidate's resume that directly match or align with the JD"
    )
    other_skills: List[str] = Field(
        description="Additional valid skills from the candidate's resume not explicitly mentioned in the JD"
    )
    experience: List[ExperienceItem]
    projects: List[ProjectItem] = Field(
        default=[],
        description="Academic or personal projects from the resume, tailored to the JD (empty list if none)"
    )
    education: List[str] = Field(
        description="Education entries including degree, institution, and dates"
    )
    certifications: List[str] = Field(
        default=[],
        description="Certifications or courses mentioned in the resume (empty list if none)"
    )
    missing_keywords: List[str] = Field(
        description="Important skills, tools, or keywords present in the JD that are missing from the resume"
    )
    match_score: int = Field(
        description="Percentage (0-100) representing how well the original resume matches the JD"
    )
    ats_score: int = Field(
        description="Percentage (0-100) estimating the ATS compatibility of the newly customized resume"
    )
    cover_letter: str = Field(
        description="A tailored, professional 3-paragraph cover letter connecting the candidate's background to the JD"
    )


class CustomizeResumeResponse(BaseModel):
    status: str
    filename: str
    file_size_kb: float
    original_resume_text: str
    customized_data: LLMResumeOutput