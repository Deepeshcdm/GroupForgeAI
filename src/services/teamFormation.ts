// Team formation service with 3 strategies: Balanced, Complementary, Role-Based
import {
    Team
} from '../types';
import { collection, getDocs, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { StudentProfile } from '../types';

interface StudentWithSkills {
    uid: string;
    displayName: string;
    email: string;
    skills: {
        leadership: number;
        analyticalThinking: number;
        creativity: number;
        executionStrength: number;
        communication: number;
        teamwork: number;
    };
    hasTeam: boolean;
}

export type TeamFormationStrategy = 'balanced' | 'complementary' | 'role-based';

interface StrategyResult {
    teams: Team[];
    unassignedStudents: StudentWithSkills[];
    averageBalanceScore: number;
    strategyRationale: string;
}

// ==================== FETCH STUDENTS WITH ASSESSMENTS ====================

export async function getStudentsWithAssessments(): Promise<StudentWithSkills[]> {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const students: StudentWithSkills[] = [];

    // Get all existing team memberships
    const teamsSnapshot = await getDocs(collection(db, 'teams'));
    const studentsInTeams = new Set<string>();

    teamsSnapshot.docs.forEach(teamDoc => {
        const team = teamDoc.data() as Team;
        if (team.status === 'active' || team.status === 'draft') {
            team.members.forEach(member => studentsInTeams.add(member.userId));
        }
    });

    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data() as StudentProfile;

        // Only include students with completed profiles
        if (userData.role !== 'student' || !userData.profileCompleted) {
            continue;
        }

        // Check if student has assessment results
        const assessmentResultsRef = collection(db, 'userProfiles', userData.uid, 'assessmentResults');
        const assessmentSnapshot = await getDocs(assessmentResultsRef);

        if (assessmentSnapshot.empty) {
            continue; // Skip students without assessments
        }

        // Get the latest assessment
        const latestAssessment: any = assessmentSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a: any, b: any) => b.completedAt?.toMillis() - a.completedAt?.toMillis())[0];

        const skills = latestAssessment.results || {};

        students.push({
            uid: userData.uid,
            displayName: userData.displayName,
            email: userData.email,
            skills: {
                leadership: skills.leadership || 50,
                analyticalThinking: skills.analyticalThinking || 50,
                creativity: skills.creativity || 50,
                executionStrength: skills.executionStrength || 50,
                communication: skills.communication || 50,
                teamwork: skills.teamwork || 50,
            },
            hasTeam: studentsInTeams.has(userData.uid) // Check team membership
        });
    }

    return students;
}

// ==================== TEAM BALANCE CALCULATION ====================

function calculateTeamBalance(members: StudentWithSkills[]): number {
    if (members.length === 0) return 0;

    const skills: (keyof StudentWithSkills['skills'])[] = [
        'leadership', 'analyticalThinking', 'creativity',
        'executionStrength', 'communication', 'teamwork'
    ];

    // 1. Skill Coverage (40%): Ensure all skills are represented
    let coverageScore = 0;
    const threshold = 60;
    for (const skill of skills) {
        const maxScore = Math.max(...members.map(m => m.skills[skill]));
        if (maxScore >= threshold) coverageScore++;
    }
    const skillCoverage = (coverageScore / skills.length) * 40;

    // 2. Distribution Evenness (30%): Lower variance is better
    let totalStdDev = 0;
    for (const skill of skills) {
        const scores = members.map(m => m.skills[skill]);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        totalStdDev += stdDev;
    }
    const avgStdDev = totalStdDev / skills.length;
    const distributionScore = Math.max(0, 30 - (avgStdDev / 10));

    // 3. Complementary Pairing (20%): Count high-low combinations
    let complementaryPairs = 0;
    for (const skill of skills) {
        const scores = members.map(m => m.skills[skill]);
        const hasHigh = scores.some(s => s >= 75);
        const hasLow = scores.some(s => s <= 50);
        if (hasHigh && hasLow) complementaryPairs++;
    }
    const complementaryScore = (complementaryPairs / skills.length) * 20;

    // 4. Diversity (10%): Variance in individual profiles
    const individualAverages = members.map(m => {
        const total = Object.values(m.skills).reduce((a, b) => a + b, 0);
        return total / skills.length;
    });
    const avgOfAverages = individualAverages.reduce((a, b) => a + b, 0) / individualAverages.length;
    const profileVariance = individualAverages.reduce((sum, avg) =>
        sum + Math.pow(avg - avgOfAverages, 2), 0) / individualAverages.length;
    const diversityScore = Math.min(10, profileVariance / 10);

    return Math.round(skillCoverage + distributionScore + complementaryScore + diversityScore);
}

// ==================== STRATEGY A: BALANCED DISTRIBUTION ====================

function strategyBalancedDistribution(
    students: StudentWithSkills[],
    teamSize: number
): StrategyResult {
    // Filter out students already in teams
    const availableStudents = students.filter(s => !s.hasTeam);

    if (availableStudents.length === 0) {
        return {
            teams: [],
            unassignedStudents: [],
            averageBalanceScore: 0,
            strategyRationale: 'No available students without existing team assignments.'
        };
    }

    const numTeams = Math.floor(availableStudents.length / teamSize);
    const teams: Team[] = [];
    const assigned = new Set<string>();

    // Sort students by overall skill average (high to low)
    const sorted = [...availableStudents].sort((a, b) => {
        const avgA = Object.values(a.skills).reduce((sum, v) => sum + v, 0) / 6;
        const avgB = Object.values(b.skills).reduce((sum, v) => sum + v, 0) / 6;
        return avgB - avgA;
    });

    // Initialize teams
    for (let i = 0; i < numTeams; i++) {
        teams.push({
            id: `team_${Date.now()}_${i}`,
            name: `Team ${i + 1}`,
            courseId: '',
            members: [],
            formationMethod: 'ai_generated',
            createdAt: new Date(),
            createdBy: '',
            status: 'draft',
            balanceScore: 0,
            aiRationale: ''
        });
    }

    // Distribute high performers across teams (snake draft)
    let teamIndex = 0;
    let direction = 1;

    for (const student of sorted) {
        if (teams[teamIndex].members.length < teamSize) {
            teams[teamIndex].members.push({
                userId: student.uid,
                displayName: student.displayName,
                role: 'contributor',
                skillSnapshot: {
                    leadership: student.skills.leadership,
                    analyticalThinking: student.skills.analyticalThinking,
                    creativity: student.skills.creativity,
                    executionStrength: student.skills.executionStrength
                },
                joinedAt: new Date()
            });
            assigned.add(student.uid);
        }

        teamIndex += direction;
        if (teamIndex >= numTeams || teamIndex < 0) {
            direction *= -1;
            teamIndex += direction;
        }
    }

    // Calculate balance scores and assign roles
    let totalBalance = 0;
    for (const team of teams) {
        const membersWithSkills = team.members.map(m => {
            const student = availableStudents.find(s => s.uid === m.userId)!;
            return student;
        });

        team.balanceScore = calculateTeamBalance(membersWithSkills);
        totalBalance += team.balanceScore;

        // Assign leader role to member with highest leadership score
        const leaderIndex = team.members.reduce((maxIdx, member, idx, arr) =>
            member.skillSnapshot.leadership > arr[maxIdx].skillSnapshot.leadership ? idx : maxIdx, 0);
        team.members[leaderIndex].role = 'leader';

        team.aiRationale = `Balanced distribution strategy: Distributed high performers evenly across teams using snake draft. Team balance score: ${team.balanceScore}/100.`;
    }

    const unassigned = availableStudents.filter(s => !assigned.has(s.uid));

    return {
        teams,
        unassignedStudents: unassigned,
        averageBalanceScore: teams.length > 0 ? totalBalance / teams.length : 0,
        strategyRationale: 'Snake draft distribution ensures each team gets a mix of high, medium, and lower performers, creating balanced competition.'
    };
}

// ==================== STRATEGY B: COMPLEMENTARY SKILLS ====================

function strategyComplementarySkills(
    students: StudentWithSkills[],
    teamSize: number
): StrategyResult {
    const availableStudents = students.filter(s => !s.hasTeam);

    if (availableStudents.length === 0) {
        return {
            teams: [],
            unassignedStudents: [],
            averageBalanceScore: 0,
            strategyRationale: 'No available students without existing team assignments.'
        };
    }

    const numTeams = Math.floor(availableStudents.length / teamSize);
    const teams: Team[] = [];
    const assigned = new Set<string>();

    // Identify primary strength for each student
    const studentsWithPrimarySkill = availableStudents.map(student => {
        const skills = student.skills;
        const entries = Object.entries(skills) as [string, number][];
        const primary = entries.reduce((max, curr) => curr[1] > max[1] ? curr : max);
        return {
            ...student,
            primarySkill: primary[0],
            primaryScore: primary[1]
        };
    });

    // Group by primary skill
    const skillGroups: Record<string, typeof studentsWithPrimarySkill> = {
        leadership: [],
        analyticalThinking: [],
        creativity: [],
        executionStrength: [],
        communication: [],
        teamwork: []
    };

    studentsWithPrimarySkill.forEach(s => {
        skillGroups[s.primarySkill].push(s);
    });

    // Sort each group by score (descending)
    Object.values(skillGroups).forEach(group => {
        group.sort((a, b) => b.primaryScore - a.primaryScore);
    });

    // Initialize teams
    for (let i = 0; i < numTeams; i++) {
        teams.push({
            id: `team_${Date.now()}_${i}`,
            name: `Team ${i + 1}`,
            courseId: '',
            members: [],
            formationMethod: 'ai_generated',
            createdAt: new Date(),
            createdBy: '',
            status: 'draft',
            balanceScore: 0,
            aiRationale: ''
        });
    }

    // Round-robin assignment from each skill group
    const skillOrder = ['leadership', 'analyticalThinking', 'creativity', 'executionStrength', 'communication', 'teamwork'];
    let teamIdx = 0;

    while (assigned.size < Math.min(numTeams * teamSize, availableStudents.length)) {
        for (const skill of skillOrder) {
            if (skillGroups[skill].length > 0 && teams[teamIdx].members.length < teamSize) {
                const student = skillGroups[skill].shift()!;

                teams[teamIdx].members.push({
                    userId: student.uid,
                    displayName: student.displayName,
                    role: 'contributor',
                    skillSnapshot: {
                        leadership: student.skills.leadership,
                        analyticalThinking: student.skills.analyticalThinking,
                        creativity: student.skills.creativity,
                        executionStrength: student.skills.executionStrength
                    },
                    joinedAt: new Date()
                });
                assigned.add(student.uid);

                teamIdx = (teamIdx + 1) % numTeams;
            }
        }
    }

    // Calculate balance scores and assign roles
    let totalBalance = 0;
    for (const team of teams) {
        const membersWithSkills = team.members.map(m => {
            const student = availableStudents.find(s => s.uid === m.userId)!;
            return student;
        });

        team.balanceScore = calculateTeamBalance(membersWithSkills);
        totalBalance += team.balanceScore;

        // Assign roles based on strengths
        team.members.forEach(member => {
            const student = availableStudents.find(s => s.uid === member.userId)!;
            const primarySkillEntry = Object.entries(student.skills)
                .reduce((max, curr) => curr[1] > max[1] ? curr : max);

            if (primarySkillEntry[0] === 'leadership') member.role = 'leader';
            else if (primarySkillEntry[0] === 'communication') member.role = 'coordinator';
            else member.role = 'specialist';
        });

        team.aiRationale = `Complementary skills strategy: Each team has members with different primary strengths for maximum skill coverage. Team balance score: ${team.balanceScore}/100.`;
    }

    const unassigned = availableStudents.filter(s => !assigned.has(s.uid));

    return {
        teams,
        unassignedStudents: unassigned,
        averageBalanceScore: teams.length > 0 ? totalBalance / teams.length : 0,
        strategyRationale: 'Teams built with one specialist from each skill area, ensuring comprehensive skill coverage and complementary strengths.'
    };
}

// ==================== STRATEGY C: ROLE-BASED ASSIGNMENT ====================

function strategyRoleBased(
    students: StudentWithSkills[],
    teamSize: number
): StrategyResult {
    const availableStudents = students.filter(s => !s.hasTeam);

    if (availableStudents.length === 0) {
        return {
            teams: [],
            unassignedStudents: [],
            averageBalanceScore: 0,
            strategyRationale: 'No available students without existing team assignments.'
        };
    }

    const numTeams = Math.floor(availableStudents.length / teamSize);
    const teams: Team[] = [];
    const assigned = new Set<string>();

    // Define role requirements and criteria
    type RoleType = 'leader' | 'coordinator' | 'contributor' | 'specialist';

    const roleSelectors: Record<RoleType, (s: StudentWithSkills) => number> = {
        leader: (s) => (s.skills.leadership * 0.6 + s.skills.communication * 0.4),
        coordinator: (s) => (s.skills.communication * 0.5 + s.skills.teamwork * 0.5),
        specialist: (s) => Math.max(s.skills.analyticalThinking, s.skills.creativity, s.skills.executionStrength),
        contributor: (s) => Object.values(s.skills).reduce((a, b) => a + b, 0) / 6
    };

    // Initialize teams
    for (let i = 0; i < numTeams; i++) {
        teams.push({
            id: `team_${Date.now()}_${i}`,
            name: `Team ${i + 1}`,
            courseId: '',
            members: [],
            formationMethod: 'ai_generated',
            createdAt: new Date(),
            createdBy: '',
            status: 'draft',
            balanceScore: 0,
            aiRationale: ''
        });
    }

    // Assign roles in order: Leader -> Coordinator -> Specialists -> Contributors
    const roleOrder: RoleType[] = ['leader', 'coordinator', 'specialist', 'contributor'];

    for (const role of roleOrder) {
        const remaining = availableStudents.filter(s => !assigned.has(s.uid));
        const sorted = [...remaining].sort((a, b) => roleSelectors[role](b) - roleSelectors[role](a));

        for (let i = 0; i < numTeams && i < sorted.length; i++) {
            if (teams[i].members.length < teamSize) {
                const student = sorted[i];
                teams[i].members.push({
                    userId: student.uid,
                    displayName: student.displayName,
                    role: role,
                    skillSnapshot: {
                        leadership: student.skills.leadership,
                        analyticalThinking: student.skills.analyticalThinking,
                        creativity: student.skills.creativity,
                        executionStrength: student.skills.executionStrength
                    },
                    joinedAt: new Date()
                });
                assigned.add(student.uid);
            }
        }
    }

    // Fill remaining slots
    const stillRemaining = availableStudents.filter(s => !assigned.has(s.uid));
    let teamIdx = 0;
    for (const student of stillRemaining) {
        while (teams[teamIdx].members.length >= teamSize) {
            teamIdx++;
            if (teamIdx >= teams.length) break;
        }
        if (teamIdx >= teams.length) break;

        teams[teamIdx].members.push({
            userId: student.uid,
            displayName: student.displayName,
            role: 'contributor',
            skillSnapshot: {
                leadership: student.skills.leadership,
                analyticalThinking: student.skills.analyticalThinking,
                creativity: student.skills.creativity,
                executionStrength: student.skills.executionStrength
            },
            joinedAt: new Date()
        });
        assigned.add(student.uid);
    }

    // Calculate balance scores
    let totalBalance = 0;
    for (const team of teams) {
        const membersWithSkills = team.members.map(m => {
            const student = availableStudents.find(s => s.uid === m.userId)!;
            return student;
        });

        team.balanceScore = calculateTeamBalance(membersWithSkills);
        totalBalance += team.balanceScore;

        const roleDistribution = team.members.map(m => m.role).join(', ');
        team.aiRationale = `Role-based strategy: Team structured with defined roles (${roleDistribution}). Each member assigned based on their strongest competencies. Team balance score: ${team.balanceScore}/100.`;
    }

    const unassigned = availableStudents.filter(s => !assigned.has(s.uid));

    return {
        teams,
        unassignedStudents: unassigned,
        averageBalanceScore: teams.length > 0 ? totalBalance / teams.length : 0,
        strategyRationale: 'Teams formed with explicit role assignments: Leader for direction, Coordinator for communication, Specialists for technical depth, Contributors for execution.'
    };
}

// ==================== MAIN TEAM FORMATION FUNCTION ====================

export async function formTeams(
    strategy: TeamFormationStrategy,
    teamSize: number,
    facultyId: string,
    courseId: string = 'default'
): Promise<StrategyResult> {
    const students = await getStudentsWithAssessments();

    if (students.filter(s => !s.hasTeam).length < teamSize) {
        throw new Error('Not enough available students to form teams');
    }

    let result: StrategyResult;

    switch (strategy) {
        case 'balanced':
            result = strategyBalancedDistribution(students, teamSize);
            break;
        case 'complementary':
            result = strategyComplementarySkills(students, teamSize);
            break;
        case 'role-based':
            result = strategyRoleBased(students, teamSize);
            break;
        default:
            throw new Error('Invalid strategy');
    }

    // Update courseId and createdBy for all teams
    result.teams.forEach(team => {
        team.courseId = courseId;
        team.createdBy = facultyId;
    });

    return result;
}

// ==================== SAVE TEAMS TO FIRESTORE ====================

export async function saveTeamsToFirestore(teams: Team[]): Promise<void> {
    const batch = writeBatch(db);

    for (const team of teams) {
        const teamRef = doc(collection(db, 'teams'));
        team.id = teamRef.id;
        team.status = 'active'; // Make teams active when saved

        batch.set(teamRef, {
            ...team,
            createdAt: Timestamp.fromDate(team.createdAt),
            members: team.members.map(m => ({
                ...m,
                joinedAt: Timestamp.fromDate(m.joinedAt)
            }))
        });
    }

    await batch.commit();
}

// ==================== GET ALL STRATEGIES FOR COMPARISON ====================

export async function getAllStrategiesComparison(
    teamSize: number,
    facultyId: string,
    courseId: string = 'default'
): Promise<Record<TeamFormationStrategy, StrategyResult>> {
    const strategies: TeamFormationStrategy[] = ['balanced', 'complementary', 'role-based'];
    const results: Record<TeamFormationStrategy, StrategyResult> = {} as any;

    for (const strategy of strategies) {
        results[strategy] = await formTeams(strategy, teamSize, facultyId, courseId);
    }

    return results;
}
