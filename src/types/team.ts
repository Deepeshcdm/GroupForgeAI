// Team types for group formation

export interface Team {
    id: string;
    name: string;
    courseId: string;
    projectId?: string;
    members: TeamMember[];
    formationMethod: 'ai_generated' | 'manual' | 'hybrid';
    createdAt: Date;
    createdBy: string; // Faculty UID
    status: 'draft' | 'active' | 'completed' | 'archived';
    balanceScore: number; // 0-100, how balanced the team is
    aiRationale?: string;
}

export interface TeamMember {
    userId: string;
    displayName: string;
    role: TeamRole;
    skillSnapshot: SkillSummary;
    joinedAt: Date;
    contributionScore?: number;
}

export type TeamRole =
    | 'leader'
    | 'coordinator'
    | 'contributor'
    | 'specialist';

export interface SkillSummary {
    leadership: number;
    analyticalThinking: number;
    creativity: number;
    executionStrength: number;
}

export interface TeamFormationConfig {
    courseId: string;
    minTeamSize: number;
    maxTeamSize: number;
    optimizationGoals: OptimizationGoal[];
    constraints: FormationConstraint[];
    allowManualOverride: boolean;
}

export type OptimizationGoal =
    | 'balance_skills'
    | 'maximize_diversity'
    | 'ensure_leadership'
    | 'mix_experience_levels';

export interface FormationConstraint {
    type: 'must_include' | 'must_exclude' | 'prefer_together' | 'prefer_apart';
    studentIds: string[];
    reason?: string;
}

export interface TeamFormationResult {
    teams: Team[];
    unassignedStudents: string[];
    overallBalanceScore: number;
    formationInsights: string;
    alternativeConfigurations?: Team[][];
}
