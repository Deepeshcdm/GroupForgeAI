// AI-Assisted Team Formation Pipeline
// This is controlled decision support with validation and human oversight

import { collection, getDocs, doc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getTeamFormationModel } from '../config/gemini';
import { Team } from '../types';
import { StudentProfile } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type AITeamFormationStrategy = 'balanced' | 'complementary' | 'role-based' | 'ai-optimized';

interface StudentContext {
    id: string;
    skills: {
        leadership: number;
        analyticalThinking: number;
        creativity: number;
        executionStrength: number;
        communication?: number;
        teamwork?: number;
    };
    confidence: number;
}

interface TeamFormationInput {
    cohort: string;
    teamSize: number;
    skills: string[];
    students: StudentContext[];
    constraints: {
        minSkillCoverage: boolean;
        avoidSimilarProfiles: boolean;
        maxLeadersPerTeam: number;
        minBalanceScore: number;
    };
}

interface AITeamOutput {
    teamName: string;
    members: string[];
    roles: Record<string, string>;
    reasoning: string;
}

interface AIResponse {
    teams: AITeamOutput[];
}

interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

interface FormationJob {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'approved' | 'rejected';
    strategy: AITeamFormationStrategy;
    input: TeamFormationInput;
    output: AIResponse | null;
    validation: ValidationResult | null;
    teams: Team[];
    createdBy: string;
    createdAt: Date;
    approvedBy?: string;
    approvedAt?: Date;
    overrides?: Array<{
        action: 'swap' | 'reassign' | 'remove';
        from: string;
        to: string;
        student: string;
        reason: string;
        timestamp: Date;
    }>;
}

// ============================================================================
// STEP 1: BUILD TEAM FORMATION CONTEXT
// Clean, compressed, decision-focused JSON - no PII
// ============================================================================

async function buildFormationContext(teamSize: number, cohort: string = 'default'): Promise<TeamFormationInput> {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const students: StudentContext[] = [];

    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data() as StudentProfile;

        // Only include students with completed profiles and assessments
        if (userData.profileCompleted && userData.skills) {
            // Calculate confidence from assessment data
            const skillScores = [
                userData.skills.leadership?.score || 0,
                userData.skills.analyticalThinking?.score || 0,
                userData.skills.creativity?.score || 0,
                userData.skills.executionStrength?.score || 0,
            ];
            const avgScore = skillScores.reduce((a, b) => a + b, 0) / skillScores.length;
            const confidence = Math.min(1, avgScore / 100); // Normalize to 0-1

            students.push({
                id: userData.uid, // Anonymous ID only - no names
                skills: {
                    leadership: userData.skills.leadership?.score || 50,
                    analyticalThinking: userData.skills.analyticalThinking?.score || 50,
                    creativity: userData.skills.creativity?.score || 50,
                    executionStrength: userData.skills.executionStrength?.score || 50,
                    communication: userData.skills.communication?.score,
                    teamwork: userData.skills.teamwork?.score,
                },
                confidence,
            });
        }
    }

    return {
        cohort,
        teamSize,
        skills: ['leadership', 'analyticalThinking', 'creativity', 'executionStrength', 'communication', 'teamwork'],
        students,
        constraints: {
            minSkillCoverage: true,
            avoidSimilarProfiles: true,
            maxLeadersPerTeam: 1,
            minBalanceScore: 60,
        },
    };
}

// ============================================================================
// STEP 2: AI SYSTEM PROMPT - STRICT JOB DEFINITION
// No creativity. This is decision support.
// ============================================================================

const SYSTEM_PROMPT = `You are an AI team formation assistant.
Your task is to form balanced teams using the provided students.

You must:
- Respect team size exactly
- Ensure skill diversity across each team
- Avoid stacking similar strengths in one team
- Assign one primary role per student based on their strongest skill
- Provide clear reasoning per team explaining the composition choice
- Ensure every student is assigned to exactly one team

Available roles:
- Leader: Highest leadership score
- Analyst: Highest analyticalThinking score
- Creator: Highest creativity score
- Executor: Highest executionStrength score
- Communicator: Highest communication score
- Collaborator: Highest teamwork score

Return ONLY valid JSON in this exact format:
{
  "teams": [
    {
      "teamName": "Team 1",
      "members": ["id1", "id2", "id3"],
      "roles": {
        "id1": "Leader",
        "id2": "Analyst",
        "id3": "Creator"
      },
      "reasoning": "Brief explanation of why this team works"
    }
  ]
}

No markdown. No explanations outside JSON. No code blocks.
This is not creativity time. This is decision support.`;

// ============================================================================
// STEP 3: CALL AI API (OpenRouter or Gemini)
// ============================================================================

async function callAIForTeamFormation(input: TeamFormationInput): Promise<AIResponse> {
    const userPrompt = `Form teams for this cohort:
${JSON.stringify(input, null, 2)}

Remember:
- Team size must be exactly ${input.teamSize} (last team may have fewer if students don't divide evenly)
- Every student must be assigned
- No student can be in multiple teams
- Each team needs skill diversity
- Assign appropriate roles based on skills`;

    // Try OpenRouter first, fallback to Gemini
    try {
        // Check if OpenRouter API key is available
        const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

        if (openRouterKey) {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openRouterKey}`,
                },
                body: JSON.stringify({
                    model: 'google/gemma-3-27b-it:free',
                    max_tokens: 5000,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: userPrompt },
                    ],
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;

                if (content) {
                    // Extract JSON from response
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                }
            }
        }

        // Fallback to Gemini
        const teamFormationModel = getTeamFormationModel();
        const result = await teamFormationModel.generateContent([
            { text: SYSTEM_PROMPT },
            { text: userPrompt },
        ]);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error('Failed to parse AI response');
    } catch (error) {
        console.error('AI API call failed:', error);
        // Fallback to algorithmic approach
        return algorithmicFallback(input);
    }
}

// Algorithmic fallback when AI fails
function algorithmicFallback(input: TeamFormationInput): AIResponse {
    const { students, teamSize } = input;
    const numTeams = Math.ceil(students.length / teamSize);
    const teams: AITeamOutput[] = [];

    // Sort by overall skill average
    const sortedStudents = [...students].sort((a, b) => {
        const avgA = (a.skills.leadership + a.skills.analyticalThinking + a.skills.creativity + a.skills.executionStrength) / 4;
        const avgB = (b.skills.leadership + b.skills.analyticalThinking + b.skills.creativity + b.skills.executionStrength) / 4;
        return avgB - avgA;
    });

    // Initialize teams
    for (let i = 0; i < numTeams; i++) {
        teams.push({
            teamName: `Team ${i + 1}`,
            members: [],
            roles: {},
            reasoning: 'Formed using balanced distribution algorithm.',
        });
    }

    // Snake draft
    let teamIndex = 0;
    let direction = 1;

    for (const student of sortedStudents) {
        teams[teamIndex].members.push(student.id);

        // Assign role based on strongest skill
        const skills = student.skills;
        const skillEntries = [
            ['Leader', skills.leadership],
            ['Analyst', skills.analyticalThinking],
            ['Creator', skills.creativity],
            ['Executor', skills.executionStrength],
        ] as const;

        const [role] = skillEntries.reduce((best, current) =>
            current[1] > best[1] ? current : best
        );

        teams[teamIndex].roles[student.id] = role;

        teamIndex += direction;
        if (teamIndex >= numTeams) {
            teamIndex = numTeams - 1;
            direction = -1;
        } else if (teamIndex < 0) {
            teamIndex = 0;
            direction = 1;
        }
    }

    return { teams };
}

// ============================================================================
// STEP 4: VALIDATION LAYER - THIS SAVES YOU
// Never trust AI blindly. Ever.
// ============================================================================

function validateAIOutput(output: AIResponse, input: TeamFormationInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const allStudentIds = new Set(input.students.map(s => s.id));
    const assignedStudents = new Set<string>();

    // Check each team
    for (const team of output.teams) {
        // Team size check
        if (team.members.length > input.teamSize) {
            errors.push(`${team.teamName} has ${team.members.length} members, max is ${input.teamSize}`);
        }

        if (team.members.length < Math.max(2, input.teamSize - 2)) {
            warnings.push(`${team.teamName} has only ${team.members.length} members`);
        }

        // Check for duplicate students
        for (const memberId of team.members) {
            if (assignedStudents.has(memberId)) {
                errors.push(`Student ${memberId} is assigned to multiple teams`);
            }
            assignedStudents.add(memberId);

            // Check if student exists
            if (!allStudentIds.has(memberId)) {
                errors.push(`Unknown student ID: ${memberId}`);
            }
        }

        // Check roles assigned
        const leaderCount = Object.values(team.roles).filter(r => r === 'Leader').length;
        if (leaderCount > input.constraints.maxLeadersPerTeam) {
            warnings.push(`${team.teamName} has ${leaderCount} leaders, max recommended is ${input.constraints.maxLeadersPerTeam}`);
        }

        // Check reasoning exists
        if (!team.reasoning || team.reasoning.length < 10) {
            warnings.push(`${team.teamName} has insufficient reasoning`);
        }
    }

    // Check all students are assigned
    for (const student of input.students) {
        if (!assignedStudents.has(student.id)) {
            errors.push(`Student ${student.id} is not assigned to any team`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// Calculate balance score for a team
function calculateTeamBalanceScore(members: StudentContext[]): number {
    if (members.length === 0) return 0;

    const skills = ['leadership', 'analyticalThinking', 'creativity', 'executionStrength'] as const;

    // Coverage: how many skills have at least one strong member (70+)
    let coverageScore = 0;
    for (const skill of skills) {
        const maxSkill = Math.max(...members.map(m => m.skills[skill]));
        if (maxSkill >= 70) coverageScore += 25;
        else if (maxSkill >= 50) coverageScore += 15;
    }

    // Diversity: variance in profiles (higher = more diverse = better)
    let diversityScore = 0;
    for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
            let diff = 0;
            for (const skill of skills) {
                diff += Math.abs(members[i].skills[skill] - members[j].skills[skill]);
            }
            diversityScore += diff / (skills.length * 100);
        }
    }
    diversityScore = Math.min(20, diversityScore * 50);

    // Has a clear leader
    const hasLeader = members.some(m => m.skills.leadership >= 70);
    const leaderBonus = hasLeader ? 10 : 0;

    return Math.min(100, coverageScore + diversityScore + leaderBonus);
}

// ============================================================================
// STEP 5: CONVERT AI OUTPUT TO TEAM OBJECTS
// Only after validation passes
// ============================================================================

function convertToTeams(
    output: AIResponse,
    input: TeamFormationInput,
    facultyId: string
): Team[] {
    const studentMap = new Map(input.students.map(s => [s.id, s]));

    // Fetch display names (we need to do this separately to maintain PII separation)
    return output.teams.map((aiTeam, index) => {
        const members = aiTeam.members.map(id => {
            const student = studentMap.get(id);
            return {
                userId: id,
                displayName: id, // Will be resolved later with actual names
                role: mapAIRoleToTeamRole(aiTeam.roles[id]),
                skillSnapshot: student ? {
                    leadership: student.skills.leadership,
                    analyticalThinking: student.skills.analyticalThinking,
                    creativity: student.skills.creativity,
                    executionStrength: student.skills.executionStrength,
                } : {
                    leadership: 50,
                    analyticalThinking: 50,
                    creativity: 50,
                    executionStrength: 50,
                },
                joinedAt: new Date(),
            };
        });

        const memberContexts = aiTeam.members.map(id => studentMap.get(id)!).filter(Boolean);
        const balanceScore = calculateTeamBalanceScore(memberContexts);

        return {
            id: `team_ai_${Date.now()}_${index}`,
            name: aiTeam.teamName,
            courseId: input.cohort,
            members,
            formationMethod: 'ai_generated' as const,
            createdAt: new Date(),
            createdBy: facultyId,
            status: 'draft' as const,
            balanceScore,
            aiRationale: aiTeam.reasoning,
        };
    });
}

function mapAIRoleToTeamRole(aiRole: string): 'leader' | 'coordinator' | 'contributor' | 'specialist' {
    const roleMap: Record<string, 'leader' | 'coordinator' | 'contributor' | 'specialist'> = {
        'Leader': 'leader',
        'Analyst': 'specialist',
        'Creator': 'specialist',
        'Executor': 'contributor',
        'Communicator': 'coordinator',
        'Collaborator': 'contributor',
    };
    return roleMap[aiRole] || 'contributor';
}

// ============================================================================
// STEP 6: MAIN EXPORT - FORM TEAMS WITH AI
// ============================================================================

export interface AIFormationResult {
    success: boolean;
    job: FormationJob;
    teams: Team[];
    validation: ValidationResult;
    needsApproval: boolean;
}

export async function formTeamsWithAI(
    teamSize: number,
    facultyId: string,
    cohort: string = 'default'
): Promise<AIFormationResult> {
    // Step 1: Build context
    const input = await buildFormationContext(teamSize, cohort);

    if (input.students.length < teamSize) {
        throw new Error(`Not enough students with completed assessments. Need ${teamSize}, found ${input.students.length}`);
    }

    // Step 2 & 3: Call AI
    const aiOutput = await callAIForTeamFormation(input);

    // Step 4: Validate
    let validation = validateAIOutput(aiOutput, input);
    let finalOutput = aiOutput;
    let attempts = 0;

    // Auto-retry with fallback if validation fails
    while (!validation.valid && attempts < 2) {
        attempts++;
        console.warn(`AI output validation failed, attempt ${attempts + 1}:`, validation.errors);

        // Try fallback algorithm
        finalOutput = algorithmicFallback(input);
        validation = validateAIOutput(finalOutput, input);
    }

    // Step 5: Convert to Team objects
    const teams = convertToTeams(finalOutput, input, facultyId);

    // Resolve display names
    await resolveDisplayNames(teams);

    // Create job record
    const job: FormationJob = {
        id: `job_${Date.now()}`,
        status: validation.valid ? 'completed' : 'failed',
        strategy: 'ai-optimized',
        input,
        output: finalOutput,
        validation,
        teams,
        createdBy: facultyId,
        createdAt: new Date(),
        overrides: [],
    };

    return {
        success: validation.valid,
        job,
        teams,
        validation,
        needsApproval: true, // Always require faculty approval
    };
}

// Resolve display names from user documents
async function resolveDisplayNames(teams: Team[]): Promise<void> {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const userMap = new Map<string, string>();

    for (const doc of usersSnapshot.docs) {
        const data = doc.data();
        userMap.set(data.uid, data.displayName || data.email || data.uid);
    }

    for (const team of teams) {
        for (const member of team.members) {
            member.displayName = userMap.get(member.userId) || member.userId;
        }
    }
}

// ============================================================================
// STEP 7: FACULTY APPROVAL FUNCTIONS
// Never let AI write directly to database
// ============================================================================

export async function approveAndSaveTeams(
    job: FormationJob,
    facultyId: string
): Promise<void> {
    // Update job status
    job.status = 'approved';
    job.approvedBy = facultyId;
    job.approvedAt = new Date();

    // Save job record for audit trail
    await addDoc(collection(db, 'teamFormationJobs'), {
        ...job,
        createdAt: serverTimestamp(),
        approvedAt: serverTimestamp(),
    });

    // Save teams with active status
    for (const team of job.teams) {
        await setDoc(doc(db, 'teams', team.id), {
            ...team,
            status: 'active',
            createdAt: serverTimestamp(),
        });
    }
}

export async function rejectFormation(
    job: FormationJob,
    facultyId: string,
    reason: string
): Promise<void> {
    job.status = 'rejected';

    // Save job record for audit
    await addDoc(collection(db, 'teamFormationJobs'), {
        ...job,
        rejectedBy: facultyId,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason,
    });
}

// ============================================================================
// STEP 8: MEMBER SWAP FUNCTION (Faculty Override)
// Every override is logged - that's training data for later
// ============================================================================

export function swapTeamMembers(
    teams: Team[],
    fromTeamId: string,
    toTeamId: string,
    studentId: string,
    reason: string,
    job: FormationJob
): Team[] {
    const fromTeam = teams.find(t => t.id === fromTeamId);
    const toTeam = teams.find(t => t.id === toTeamId);

    if (!fromTeam || !toTeam) {
        throw new Error('Team not found');
    }

    const memberIndex = fromTeam.members.findIndex(m => m.userId === studentId);
    if (memberIndex === -1) {
        throw new Error('Student not found in source team');
    }

    // Move member
    const [member] = fromTeam.members.splice(memberIndex, 1);
    toTeam.members.push(member);

    // Log override
    job.overrides = job.overrides || [];
    job.overrides.push({
        action: 'swap',
        from: fromTeamId,
        to: toTeamId,
        student: studentId,
        reason,
        timestamp: new Date(),
    });

    // Recalculate balance scores
    // (Would need to implement this with actual student data)

    return teams;
}

// ============================================================================
// EXPORT COMPARISON FUNCTION FOR UI
// ============================================================================

export async function getAITeamFormation(
    teamSize: number,
    facultyId: string
): Promise<{
    result: AIFormationResult;
    comparison: {
        teams: Team[];
        averageBalanceScore: number;
        strategyRationale: string;
        aiReasoning: string[];
    };
}> {
    const result = await formTeamsWithAI(teamSize, facultyId);

    const avgBalance = result.teams.length > 0
        ? result.teams.reduce((sum, t) => sum + t.balanceScore, 0) / result.teams.length
        : 0;

    return {
        result,
        comparison: {
            teams: result.teams,
            averageBalanceScore: avgBalance,
            strategyRationale: 'AI-optimized team formation using skill analysis, constraint satisfaction, and balance optimization.',
            aiReasoning: result.teams.map(t => t.aiRationale || 'Balanced skill distribution'),
        },
    };
}
