// User types and interfaces for GroupForge AI

import { SkillProfile, AssessmentRecord } from './assessment';

export type UserRole = 'student' | 'faculty' | 'admin';

// Skill level options
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

// Learning style options
export type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic';

// Work style options
export type WorkStyle = 'planner' | 'flexible' | 'mixed';

// Communication preference options
export type CommunicationPreference = 'chat' | 'voice' | 'video' | 'in-person';

// Meeting preference options
export type MeetingPreference = 'online' | 'in-person' | 'hybrid';

// Goal preference options
export type GoalPreference = 'grade' | 'learning' | 'speed' | 'balanced';

// Commitment level options
export type CommitmentLevel = 'low' | 'medium' | 'high';

// Team preference options
export type TeamPreference = 'mixed-skills' | 'similar-skills' | 'no-preference';

// Availability time slots
export interface TimeSlot {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
}

// User skill with level
export interface UserSkill {
    name: string;
    level: SkillLevel;
}

export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    institutionId: string;
    profileCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface StudentProfile extends User {
    role: 'student';

    // Basic Info
    enrollmentNumber?: string;
    department?: string;
    major?: string;
    year?: number;

    // Course & Project
    courses?: string[];
    projectTopics?: string[];
    preferredGroupSize?: number;

    // Availability
    availability?: TimeSlot[];
    timezone?: string;

    // Skills & Experience
    userSkills?: UserSkill[];
    tools?: string[];

    // Work & Learning Style
    learningStyle?: LearningStyle;
    workStyle?: WorkStyle;
    communicationPreference?: CommunicationPreference;
    meetingPreference?: MeetingPreference;

    // Goals & Preferences
    goalPreference?: GoalPreference;
    commitmentLevel?: CommitmentLevel;
    teamPreference?: TeamPreference;

    // Optional Info
    bio?: string;
    icebreakerPrompt?: string;
    portfolioUrl?: string;
    linkedinUrl?: string;
    languages?: string[];

    // Assessment Data
    skills: SkillProfile;
    assessmentHistory: AssessmentRecord[];
    githubConnected: boolean;
    githubUsername?: string;
    resumeUploaded: boolean;
    teamAssignments: string[]; // Team IDs
}

export interface FacultyProfile extends User {
    role: 'faculty';
    designation?: 'Assistant Professor' | 'Associate Professor' | 'Professor';
    department?: string;
    employeeId?: string;
    contactNumber?: string;
    coursesManaged: string[]; // Course IDs
}

export interface AdminProfile extends User {
    role: 'admin';
    permissions: AdminPermission[];
}

export type AdminPermission =
    | 'manage_users'
    | 'manage_courses'
    | 'manage_institutions'
    | 'view_analytics'
    | 'configure_assessments';
