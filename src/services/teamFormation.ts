// Team formation service using AI-powered matching
import {
    Team,
    TeamFormationConfig,
    TeamFormationResult,
    SkillSummary
} from '../types';
import { teamFormationModel } from '../config/gemini';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { StudentProfile } from '../types';

interface StudentWithSkills {
    uid: string;
    displayName: string;
    skills: SkillSummary;
}

// Fetch all students enrolled in a course with their skills
export async function getStudentsForCourse(courseId: string): Promise<StudentWithSkills[]> {
    const courseDoc = await getDocs(query(collection(db, 'courses'), where('id', '==', courseId)));

    if (courseDoc.empty) {
        throw new Error('Course not found');
    }

    const course = courseDoc.docs[0].data();
    const studentIds: string[] = course.enrolledStudents || [];

    const students: StudentWithSkills[] = [];

    for (const studentId of studentIds) {
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', studentId)));
        if (!userDoc.empty) {
            const userData = userDoc.docs[0].data() as StudentProfile;
            students.push({
                uid: userData.uid,
                displayName: userData.displayName,
                skills: {
                    leadership: userData.skills?.leadership?.score || 50,
                    analyticalThinking: userData.skills?.analyticalThinking?.score || 50,
                    creativity: userData.skills?.creativity?.score || 50,
                    executionStrength: userData.skills?.executionStrength?.score || 50,
                },
            });
        }
    }

    return students;
}

// Calculate team balance score (0-100)
function calculateTeamBalance(members: StudentWithSkills[]): number {
    if (members.length === 0) return 0;

    const skills: (keyof SkillSummary)[] = ['leadership', 'analyticalThinking', 'creativity', 'executionStrength'];

    // Calculate average and variance for each skill
    let totalVariance = 0;
    let hasLeader = false;

    for (const skill of skills) {
        const scores = members.map(m => m.skills[skill]);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
        totalVariance += variance;

        if (skill === 'leadership' && Math.max(...scores) >= 70) {
            hasLeader = true;
        }
    }

    // Lower variance = higher balance
    const balanceFromVariance = Math.max(0, 100 - (totalVariance / skills.length) / 10);

    // Bonus for having a leader
    const leaderBonus = hasLeader ? 10 : 0;

    return Math.min(100, balanceFromVariance + leaderBonus);
}

// Basic algorithm: Greedy balanced team formation
function greedyTeamFormation(
    students: StudentWithSkills[],
    config: TeamFormationConfig
): Team[] {
    const { minTeamSize: _minTeamSize, maxTeamSize } = config;
    const numStudents = students.length;
    const numTeams = Math.ceil(numStudents / maxTeamSize);

    // Sort students by leadership (descending) to distribute leaders first
    const sortedStudents = [...students].sort(
        (a, b) => b.skills.leadership - a.skills.leadership
    );

    const teams: Team[] = [];
    const assignedStudents = new Set<string>();

    // Initialize empty teams
    for (let i = 0; i < numTeams; i++) {
        teams.push({
            id: `team_${Date.now()}_${i}`,
            name: `Team ${i + 1}`,
            courseId: config.courseId,
            members: [],
            formationMethod: 'ai_generated',
            createdAt: new Date(),
            createdBy: '',
            status: 'draft',
            balanceScore: 0,
        });
    }

    // Distribute leaders first (one per team)
    for (let i = 0; i < Math.min(numTeams, sortedStudents.length); i++) {
        const student = sortedStudents[i];
        teams[i].members.push({
            userId: student.uid,
            displayName: student.displayName,
            role: 'leader',
            skillSnapshot: student.skills,
            joinedAt: new Date(),
        });
        assignedStudents.add(student.uid);
    }

    // Assign remaining students to teams with lowest current skill coverage
    const remainingStudents = sortedStudents.filter(s => !assignedStudents.has(s.uid));

    for (const student of remainingStudents) {
        // Find team that would benefit most from this student
        let bestTeamIndex = 0;
        let bestImprovement = -Infinity;

        for (let i = 0; i < teams.length; i++) {
            if (teams[i].members.length >= maxTeamSize) continue;

            const currentMembers = teams[i].members.map(m => ({
                uid: m.userId,
                displayName: m.displayName,
                skills: m.skillSnapshot,
            }));

            const withNewMember = [...currentMembers, student];
            const improvement = calculateTeamBalance(withNewMember) - calculateTeamBalance(currentMembers);

            if (improvement > bestImprovement) {
                bestImprovement = improvement;
                bestTeamIndex = i;
            }
        }

        teams[bestTeamIndex].members.push({
            userId: student.uid,
            displayName: student.displayName,
            role: 'contributor',
            skillSnapshot: student.skills,
            joinedAt: new Date(),
        });
    }

    // Calculate final balance scores
    for (const team of teams) {
        const membersWithSkills = team.members.map(m => ({
            uid: m.userId,
            displayName: m.displayName,
            skills: m.skillSnapshot,
        }));
        team.balanceScore = calculateTeamBalance(membersWithSkills);
    }

    return teams;
}

// AI-enhanced team formation using Gemini
export async function formTeamsWithAI(
    config: TeamFormationConfig,
    facultyId: string
): Promise<TeamFormationResult> {
    const students = await getStudentsForCourse(config.courseId);

    if (students.length < config.minTeamSize) {
        throw new Error('Not enough students to form teams');
    }

    // First, use greedy algorithm for initial formation
    const initialTeams = greedyTeamFormation(students, config);

    // Then, use Gemini to analyze and suggest improvements
    const prompt = `You are an expert in team dynamics and group formation for academic projects.

Current team configuration:
${JSON.stringify(initialTeams.map(t => ({
        name: t.name,
        members: t.members.map(m => ({
            name: m.displayName,
            skills: m.skillSnapshot,
        })),
        balanceScore: t.balanceScore,
    })), null, 2)}

Optimization goals: ${config.optimizationGoals.join(', ')}
Min team size: ${config.minTeamSize}
Max team size: ${config.maxTeamSize}

Analyze these teams and provide:
1. Overall assessment of the formation quality
2. Specific swap recommendations to improve balance (if any)
3. Rationale for each team composition

Return a JSON object:
{
  "overallScore": 85,
  "insights": "Summary of team formation quality",
  "swapRecommendations": [
    { "from": "Team 1", "to": "Team 2", "student": "name", "reason": "why" }
  ],
  "teamRationales": {
    "Team 1": "Why this team composition works",
    "Team 2": "..."
  }
}

Return ONLY the JSON object.`;

    try {
        const result = await teamFormationModel.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const aiAnalysis = JSON.parse(jsonMatch[0]);

            // Apply swap recommendations if beneficial
            // For now, just attach the AI rationale
            for (const team of initialTeams) {
                team.aiRationale = aiAnalysis.teamRationales?.[team.name] || '';
                team.createdBy = facultyId;
            }

            return {
                teams: initialTeams,
                unassignedStudents: [],
                overallBalanceScore: aiAnalysis.overallScore ||
                    initialTeams.reduce((sum, t) => sum + t.balanceScore, 0) / initialTeams.length,
                formationInsights: aiAnalysis.insights || 'Teams formed using AI-assisted matching.',
            };
        }
    } catch (error) {
        console.error('AI analysis failed, using base algorithm:', error);
    }

    // Fallback to basic algorithm results
    return {
        teams: initialTeams,
        unassignedStudents: [],
        overallBalanceScore: initialTeams.reduce((sum, t) => sum + t.balanceScore, 0) / initialTeams.length,
        formationInsights: 'Teams formed using balanced skill distribution algorithm.',
    };
}

// Save teams to Firestore
export async function saveTeams(teams: Team[]): Promise<void> {
    for (const team of teams) {
        await setDoc(doc(db, 'teams', team.id), {
            ...team,
            status: 'active',
        });
    }
}

// Get teams for a course
export async function getTeamsForCourse(courseId: string): Promise<Team[]> {
    const teamsQuery = query(collection(db, 'teams'), where('courseId', '==', courseId));
    const snapshot = await getDocs(teamsQuery);
    return snapshot.docs.map(doc => doc.data() as Team);
}
