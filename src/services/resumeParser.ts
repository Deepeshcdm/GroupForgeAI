// Resume parsing service using Gemini
import { resumeAnalysisModel } from '../config/gemini';
import { SkillProfile } from '../types';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ParsedResume {
    name: string;
    email?: string;
    education: Education[];
    experience: Experience[];
    skills: string[];
    projects: Project[];
    certifications: string[];
    suggestedSkillProfile: Partial<SkillProfile>;
}

interface Education {
    institution: string;
    degree: string;
    field: string;
    year?: string;
    gpa?: string;
}

interface Experience {
    company: string;
    role: string;
    duration: string;
    description: string;
    skills: string[];
}

interface Project {
    name: string;
    description: string;
    technologies: string[];
    role?: string;
}

// Upload resume to Firebase Storage
export async function uploadResume(file: File, userId: string): Promise<string> {
    const fileRef = ref(storage, `resumes/${userId}/${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
}

// Parse resume text using Gemini
export async function parseResumeText(resumeText: string): Promise<ParsedResume> {
    const prompt = `You are an expert resume parser and skill evaluator.

Parse the following resume text and extract structured information:

${resumeText}

Return a JSON object with this structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "education": [
    {
      "institution": "University Name",
      "degree": "B.Tech",
      "field": "Computer Science",
      "year": "2024",
      "gpa": "8.5"
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Role Title",
      "duration": "6 months",
      "description": "What they did",
      "skills": ["skill1", "skill2"]
    }
  ],
  "skills": ["Python", "React", "Machine Learning"],
  "projects": [
    {
      "name": "Project Name",
      "description": "What it does",
      "technologies": ["tech1", "tech2"],
      "role": "Team Lead"
    }
  ],
  "certifications": ["Cert 1", "Cert 2"],
  "suggestedSkillProfile": {
    "leadership": { "score": 70, "confidence": "medium", "reason": "Led 2 projects" },
    "analyticalThinking": { "score": 75, "confidence": "high", "reason": "Strong technical projects" },
    "creativity": { "score": 65, "confidence": "low", "reason": "Limited creative work shown" },
    "executionStrength": { "score": 80, "confidence": "high", "reason": "Multiple completed projects" },
    "communication": { "score": 60, "confidence": "low", "reason": "No public speaking mentioned" },
    "teamwork": { "score": 75, "confidence": "medium", "reason": "Team projects mentioned" }
  }
}

Base skill scores on:
- Leadership: Team lead roles, organizing events, mentoring
- Analytical Thinking: Technical depth, problem-solving projects, research
- Creativity: Innovative projects, design work, unique approaches
- Execution Strength: Completed projects, internships, certifications
- Communication: Writing, presentations, documentation
- Teamwork: Collaborative projects, team size, cross-functional work

Return ONLY the JSON object.`;

    try {
        const result = await resumeAnalysisModel.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Failed to parse resume');
    } catch (error) {
        console.error('Resume parsing error:', error);
        throw error;
    }
}

// Combine resume analysis with assessment scores
export function mergeSkillProfiles(
    assessmentProfile: SkillProfile,
    resumeProfile: Partial<SkillProfile>
): SkillProfile {
    const merged: SkillProfile = { ...assessmentProfile };
    const skills: (keyof Omit<SkillProfile, 'lastAssessedAt' | 'overallConfidence'>)[] = [
        'leadership', 'analyticalThinking', 'creativity',
        'executionStrength', 'communication', 'teamwork'
    ];

    for (const skill of skills) {
        const assessmentScore = assessmentProfile[skill];
        const resumeScore = resumeProfile[skill];

        if (resumeScore && typeof resumeScore === 'object' && 'score' in resumeScore) {
            // Weight: 60% assessment, 40% resume
            merged[skill] = {
                score: Math.round(assessmentScore.score * 0.6 + resumeScore.score * 0.4),
                confidence: getHigherConfidence(assessmentScore.confidence, resumeScore.confidence),
                assessmentCount: assessmentScore.assessmentCount + 1,
            };
        }
    }

    merged.lastAssessedAt = new Date();
    return merged;
}

function getHigherConfidence(a: string, b: string): 'low' | 'medium' | 'high' {
    const order = { low: 0, medium: 1, high: 2 };
    const aVal = order[a as keyof typeof order] || 0;
    const bVal = order[b as keyof typeof order] || 0;
    const result = Math.max(aVal, bVal);
    return result === 2 ? 'high' : result === 1 ? 'medium' : 'low';
}
