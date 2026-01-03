// Assessment types for skill evaluation

export interface SkillProfile {
    leadership: SkillScore;
    analyticalThinking: SkillScore;
    creativity: SkillScore;
    executionStrength: SkillScore;
    communication: SkillScore;
    teamwork: SkillScore;
    lastAssessedAt: Date;
    overallConfidence: 'low' | 'medium' | 'high';
}

export interface SkillScore {
    score: number; // 1-100
    confidence: 'low' | 'medium' | 'high';
    assessmentCount: number;
}

export interface AssessmentRecord {
    id: string;
    type: AssessmentType;
    startedAt: Date;
    completedAt?: Date;
    status: 'in_progress' | 'completed' | 'abandoned';
    results?: AssessmentResults;
}

export type AssessmentType =
    | 'initial_screening'
    | 'leadership_deep_dive'
    | 'technical_evaluation'
    | 'creativity_assessment'
    | 'problem_solving';

export interface AssessmentResults {
    skillsEvaluated: Partial<SkillProfile>;
    questionsAsked: number;
    responseQuality: 'poor' | 'fair' | 'good' | 'excellent';
    aiInsights: string;
    recommendations: string[];
}

export interface AssessmentQuestion {
    id: string;
    type: 'multiple_choice' | 'open_ended' | 'scenario' | 'ranking';
    skillTargeted: keyof Omit<SkillProfile, 'lastAssessedAt' | 'overallConfidence'>;
    difficulty: 'easy' | 'medium' | 'hard';
    question: string;
    options?: string[];
    timeLimit?: number; // seconds
    context?: string;
}

export interface AssessmentResponse {
    questionId: string;
    response: string | string[];
    timeTaken: number; // seconds
    timestamp: Date;
}

export interface AssessmentSession {
    id: string;
    userId: string;
    type: AssessmentType;
    questions: AssessmentQuestion[];
    responses: AssessmentResponse[];
    currentQuestionIndex: number;
    startedAt: Date;
    status: 'active' | 'paused' | 'completed';
}
