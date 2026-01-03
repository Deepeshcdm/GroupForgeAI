// GitHub profile analyzer using Gemini and GitHub REST API
import { getResumeAnalysisModel } from '../config/gemini';
import { SkillProfile } from '../types';

interface GitHubProfile {
    username: string;
    name: string;
    bio?: string;
    publicRepos: number;
    followers: number;
    following: number;
    createdAt: string;
}

interface GitHubRepo {
    name: string;
    description?: string;
    language?: string;
    stars: number;
    forks: number;
    topics: string[];
    updatedAt: string;
    size: number;
}

interface GitHubAnalysis {
    profile: GitHubProfile;
    topRepos: GitHubRepo[];
    languages: Record<string, number>;
    totalCommits: number;
    contributionYears: number;
    suggestedSkillProfile: Partial<SkillProfile>;
}

// Fetch GitHub user profile
export async function fetchGitHubProfile(username: string): Promise<GitHubProfile | null> {
    try {
        const response = await fetch(`https://api.github.com/users/${username}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch GitHub profile');
        }

        const data = await response.json();

        return {
            username: data.login,
            name: data.name || data.login,
            bio: data.bio,
            publicRepos: data.public_repos,
            followers: data.followers,
            following: data.following,
            createdAt: data.created_at,
        };
    } catch (error) {
        console.error('GitHub profile fetch error:', error);
        return null;
    }
}

// Fetch user's repositories
export async function fetchGitHubRepos(username: string, limit: number = 10): Promise<GitHubRepo[]> {
    try {
        const response = await fetch(
            `https://api.github.com/users/${username}/repos?sort=updated&per_page=${limit}`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch GitHub repositories');
        }

        const data = await response.json();

        return data.map((repo: any) => ({
            name: repo.name,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            topics: repo.topics || [],
            updatedAt: repo.updated_at,
            size: repo.size,
        }));
    } catch (error) {
        console.error('GitHub repos fetch error:', error);
        return [];
    }
}

// Analyze GitHub profile and repositories using Gemini
export async function analyzeGitHubProfile(username: string): Promise<GitHubAnalysis | null> {
    const profile = await fetchGitHubProfile(username);
    if (!profile) return null;

    const repos = await fetchGitHubRepos(username, 20);

    // Calculate language distribution
    const languages: Record<string, number> = {};
    repos.forEach(repo => {
        if (repo.language) {
            languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
    });

    // Calculate account age in years
    const accountAge = new Date().getFullYear() - new Date(profile.createdAt).getFullYear();

    // Analyze with Gemini
    const prompt = `You are an expert at evaluating software engineering skills based on GitHub profiles.

Analyze this GitHub profile and repositories:

Profile:
- Username: ${profile.username}
- Name: ${profile.name}
- Bio: ${profile.bio || 'N/A'}
- Public Repos: ${profile.publicRepos}
- Followers: ${profile.followers}
- Account Age: ${accountAge} years

Top Repositories:
${repos.slice(0, 10).map(r => `
- ${r.name}: ${r.description || 'No description'}
  Language: ${r.language || 'N/A'}
  Stars: ${r.stars}, Forks: ${r.forks}
  Topics: ${r.topics.join(', ') || 'None'}
`).join('\n')}

Language Distribution:
${Object.entries(languages).map(([lang, count]) => `${lang}: ${count} repos`).join(', ')}

Based on this GitHub activity, evaluate the student's skills for team formation:

Return a JSON object with this structure:
{
  "leadership": { "score": 70, "confidence": "medium", "reason": "Evidence from profile" },
  "analyticalThinking": { "score": 75, "confidence": "high", "reason": "Technical depth shown" },
  "creativity": { "score": 65, "confidence": "medium", "reason": "Project variety" },
  "executionStrength": { "score": 80, "confidence": "high", "reason": "Completion rate" },
  "communication": { "score": 60, "confidence": "low", "reason": "Documentation quality" },
  "teamwork": { "score": 75, "confidence": "medium", "reason": "Collaboration indicators" },
  "technicalSkills": ["Python", "JavaScript", "React"],
  "overallAssessment": "Brief summary of strengths"
}

Scoring criteria:
- Leadership: Popular repos, forks, community engagement, maintainer roles
- Analytical Thinking: Complexity of projects, algorithms, problem-solving repos
- Creativity: Unique projects, diverse technologies, innovative solutions
- Execution Strength: Consistent commits, completed projects, repo maintenance
- Communication: README quality, documentation, issue/PR descriptions
- Teamwork: Contributions to others' repos, collaboration on projects, PR reviews

Return ONLY the JSON object.`;

    try {
        const resumeAnalysisModel = getResumeAnalysisModel();
        const result = await resumeAnalysisModel.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);

            return {
                profile,
                topRepos: repos.slice(0, 10),
                languages,
                totalCommits: 0, // Would need GitHub GraphQL API for accurate commit count
                contributionYears: accountAge,
                suggestedSkillProfile: {
                    leadership: {
                        score: analysis.leadership.score,
                        confidence: analysis.leadership.confidence,
                        assessmentCount: 1,
                    },
                    analyticalThinking: {
                        score: analysis.analyticalThinking.score,
                        confidence: analysis.analyticalThinking.confidence,
                        assessmentCount: 1,
                    },
                    creativity: {
                        score: analysis.creativity.score,
                        confidence: analysis.creativity.confidence,
                        assessmentCount: 1,
                    },
                    executionStrength: {
                        score: analysis.executionStrength.score,
                        confidence: analysis.executionStrength.confidence,
                        assessmentCount: 1,
                    },
                    communication: {
                        score: analysis.communication.score,
                        confidence: analysis.communication.confidence,
                        assessmentCount: 1,
                    },
                    teamwork: {
                        score: analysis.teamwork.score,
                        confidence: analysis.teamwork.confidence,
                        assessmentCount: 1,
                    },
                    lastAssessedAt: new Date(),
                    overallConfidence: 'medium',
                },
            };
        }

        throw new Error('Failed to parse GitHub analysis');
    } catch (error) {
        console.error('GitHub analysis error:', error);
        return null;
    }
}

// Merge GitHub analysis with existing skill profile
export function mergeGitHubSkills(
    existingProfile: SkillProfile,
    githubProfile: Partial<SkillProfile>
): SkillProfile {
    const merged: SkillProfile = { ...existingProfile };
    const skills: (keyof Omit<SkillProfile, 'lastAssessedAt' | 'overallConfidence'>)[] = [
        'leadership', 'analyticalThinking', 'creativity',
        'executionStrength', 'communication', 'teamwork'
    ];

    for (const skill of skills) {
        const existingScore = existingProfile[skill];
        const githubScore = githubProfile[skill];

        if (githubScore && typeof githubScore === 'object' && 'score' in githubScore) {
            // Weight: 50% existing assessment, 50% GitHub analysis
            merged[skill] = {
                score: Math.round((existingScore.score * 0.5) + (githubScore.score * 0.5)),
                confidence: getHigherConfidence(existingScore.confidence, githubScore.confidence),
                assessmentCount: existingScore.assessmentCount + 1,
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
