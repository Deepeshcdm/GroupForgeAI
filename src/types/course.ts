// Course and institution types

export interface Institution {
    id: string;
    name: string;
    domain: string; // e.g., "university.edu"
    type: 'university' | 'college' | 'institute';
    logoUrl?: string;
    settings: InstitutionSettings;
    createdAt: Date;
}

export interface InstitutionSettings {
    allowLinkedInAuth: boolean;
    allowGoogleAuth: boolean;
    requireEmailVerification: boolean;
    defaultAssessmentConfig: AssessmentConfig;
    allowedDomains: string[];
}

export interface AssessmentConfig {
    enabledAssessmentTypes: string[];
    questionTimeLimit: number;
    maxQuestionsPerSession: number;
    adaptiveDifficultyEnabled: boolean;
}

export interface Course {
    id: string;
    institutionId: string;
    name: string;
    code: string;
    department: string;
    semester: string;
    facultyId: string;
    enrolledStudents: string[];
    teams: string[];
    settings: CourseSettings;
    createdAt: Date;
    status: 'active' | 'archived';
}

export interface CourseSettings {
    teamFormationEnabled: boolean;
    assessmentRequired: boolean;
    allowSelfEnrollment: boolean;
    maxTeamSize: number;
    minTeamSize: number;
}

export interface Project {
    id: string;
    courseId: string;
    name: string;
    description: string;
    requiredSkills: string[];
    deadline: Date;
    teams: string[];
    createdAt: Date;
    status: 'upcoming' | 'active' | 'completed';
}
