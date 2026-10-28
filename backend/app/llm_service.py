import os
import json
from groq import Groq
from google import genai
from google.genai import types
from fastapi import HTTPException
from dotenv import load_dotenv

from app.schemas import LLMResumeOutput

load_dotenv(override=True)

SCHEMA_JSON_STR = json.dumps(LLMResumeOutput.model_json_schema(), indent=2)

SYSTEM_PROMPT = f"""You are an elite Executive Technical Recruiter and ATS (Applicant Tracking System) Optimization Specialist.
Your task is to analyze a target Job Description (JD) and a candidate's Original Resume, and produce a tailored, high-impact version of the resume.

STRICT RULES & GUIDELINES:
1. TRUTHFULNESS FIRST: Never invent fake companies, degrees, dates, or certifications. Work strictly with the candidate's real history.
2. TAILORED SUMMARY: Rewrite the professional summary/objective (3-4 sentences) so it directly pitches the candidate for the specific role and keywords in the JD.
3. SKILLS CATEGORIZATION:
   - Place skills the candidate possesses that match or closely align with the JD into `matched_skills`.
   - Place the candidate's remaining skills into `other_skills`.
4. EXPERIENCE & PROJECTS OPTIMIZATION:
   - Reorder bullet points within each role so the most relevant achievements appear first.
   - Rephrase bullet points using strong action verbs and naturally weave in terminology/keywords from the JD where truthful.
5. MISSING KEYWORDS: Identify 4 to 8 high-priority keywords, tools, or competencies required by the JD that are completely absent from the original resume so the candidate knows what to add.
6. SCORING:
   - `match_score`: Realistic 0-100 integer score of the original resume against the JD before customization.
   - `ats_score`: Realistic 0-100 integer score of the tailored resume's keyword alignment and structure after optimization.
7. COVER LETTER: Write a concise, compelling 3-paragraph cover letter tailored to the role and company in the JD.

OUTPUT FORMAT:
You MUST return ONLY a valid JSON object matching this exact JSON Schema:
{SCHEMA_JSON_STR}
"""


def customize_resume_with_llm(job_description: str, resume_text: str) -> LLMResumeOutput:
    """
    Uses Groq (llama-3.3-70b-versatile) for 2-second JSON generation,
    or falls back to Gemini if GROQ_API_KEY is not set.
    """
    groq_api_key = (os.getenv("GROQ_API_KEY") or "").strip().strip('"').strip("'")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    user_prompt = f"""=== TARGET JOB DESCRIPTION ===
{job_description}

=== CANDIDATE ORIGINAL RESUME ===
{resume_text}

Return the customized resume strictly as a valid JSON object matching the required schema."""

    # 1. Primary Fast Path: Groq API (~2 seconds)
    if groq_api_key and groq_api_key != "your_groq_api_key_here":
        try:
            print("[LLM] Sending request to Groq (llama-3.3-70b-versatile)...")
            client = Groq(api_key=groq_api_key, timeout=30.0)
            completion = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                max_tokens=4096,
                temperature=0.3,
            )
            raw_json = completion.choices[0].message.content or ""
            print("[LLM] Groq response received in seconds!")
            return LLMResumeOutput.model_validate_json(raw_json)
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"Groq LLM Error: {str(e)}"
            )

    # 2. Fallback Path: Gemini API (with 90s timeout for congested free tier)
    if not gemini_api_key or gemini_api_key == "your_gemini_api_key_here":
        raise HTTPException(
            status_code=500,
            detail="Neither GROQ_API_KEY nor GEMINI_API_KEY is configured in .env."
        )

    try:
        print("[LLM] Sending request to Gemini...")
        client = genai.Client(
            api_key=gemini_api_key,
            http_options=types.HttpOptions(timeout=90000),
        )
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )
        raw_json = (response.text or "").strip()
        if raw_json.startswith("```"):
            raw_json = raw_json.strip("`").removeprefix("json").strip()
        return LLMResumeOutput.model_validate_json(raw_json)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini LLM Error: {str(e)}"
        )