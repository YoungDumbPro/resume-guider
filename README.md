# AI Resume Guider Web App

> A full-stack web application that takes a Job Description and a candidate's resume (PDF/DOCX), analyzes it using Google Gemini, and returns an ATS-optimized tailored resume, match score, missing keywords, cover letter, and before-and-after diff view.

- **Live Application URL:** To be updated(to be updated) *(Replace with your Vercel URL)*
- **Backend API Docs:** [to be updated](to be updated) *(Swagger UI)*

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router), Tailwind CSS, Lucide Icons | Responsive split-screen workspace & PDF/TXT export |
| **Backend** | Python 3.12, FastAPI, Pydantic | REST API endpoints, input validation, & file parsing |
| **File Parsing** | PyMuPDF (`fitz`), `python-docx` | Fast text extraction from uploaded PDF & DOCX resumes |
| **LLM Provider**  | Groq | Google Gemini (`gemini-3-flash-preview`) |  Structured output resume tailoring & insight generation |
| **Hosting** | Vercel (Frontend) + Render (Backend) | Public cloud infrastructure |

---

## Architecture

```text
[Next.js Frontend] --(REST API / FormData)--> [FastAPI Backend]
                                                    │
                                           (1. Parse PDF/DOCX)
                                           (2. Validate JD & File)
                                                    │
                                                    ▼
                                           [Groq / Google Gemini API]
                                    (Structured Pydantic JSON Output)
                                                    │
                                                    ▼
[UI Preview / PDF & TXT Download] <--(JSON Response)--┘