import os
import asyncio
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.parser import extract_text_from_resume
from app.schemas import ParseTestResponse, CustomizeResumeResponse
from app.llm_service import customize_resume_with_llm

load_dotenv(override=True)

app = FastAPI(
    title="AI Resume Customizer API",
    description="Backend API for parsing resumes and tailoring them to Job Descriptions using LLMs.",
    version="1.0.0",
)

# Configure CORS for Next.js Frontend
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MIN_JD_LENGTH = 50


def validate_job_description(jd: str) -> str:
    cleaned_jd = jd.strip()
    if not cleaned_jd:
        raise HTTPException(status_code=400, detail="Job Description cannot be empty.")
    if len(cleaned_jd) < MIN_JD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Job Description is too short ({len(cleaned_jd)} chars). Please provide at least {MIN_JD_LENGTH} characters."
        )
    return cleaned_jd


@app.get("/health")
async def health_check():
    """Health check endpoint for Render/Railway deployment monitoring."""
    return {"status": "healthy", "service": "resume-customizer-backend"}


@app.post("/api/v1/parse-resume", response_model=ParseTestResponse)
async def parse_resume_endpoint(
    job_description: str = Form(..., description="Paste the full Job Description text"),
    resume_file: UploadFile = File(..., description="Upload resume in PDF or DOCX format"),
):
    """
    Validates the Job Description and extracts text from the uploaded resume without calling the LLM.
    """
    cleaned_jd = validate_job_description(job_description)
    parsed_data = await extract_text_from_resume(resume_file)
    extracted_text = parsed_data["extracted_text"]

    return ParseTestResponse(
        status="success",
        filename=parsed_data["filename"],
        file_size_kb=parsed_data["file_size_kb"],
        jd_character_count=len(cleaned_jd),
        resume_character_count=len(extracted_text),
        resume_preview=extracted_text[:500] + ("..." if len(extracted_text) > 500 else ""),
    )


@app.post("/api/v1/customize-resume", response_model=CustomizeResumeResponse)
async def customize_resume_endpoint(
    job_description: str = Form(..., description="Paste the full Job Description text"),
    resume_file: UploadFile = File(..., description="Upload resume in PDF or DOCX format"),
):
    """
    End-to-End Endpoint: Parses the uploaded resume, analyzes the JD, and returns an LLM-tailored resume.
    """
    # 1. Validate JD Input (Core Feature 1)
    cleaned_jd = validate_job_description(job_description)

    # 2. Extract Text from PDF/DOCX (Core Feature 2)
    parsed_data = await extract_text_from_resume(resume_file)
    extracted_text = parsed_data["extracted_text"]

    # 3. Customize via Gemini LLM in a non-blocking thread (Fix 2)
    customized_output = await asyncio.to_thread(
        customize_resume_with_llm,
        cleaned_jd,
        extracted_text,
    )

    return CustomizeResumeResponse(
        status="success",
        filename=parsed_data["filename"],
        file_size_kb=parsed_data["file_size_kb"],
        original_resume_text=extracted_text,
        customized_data=customized_output,
    )