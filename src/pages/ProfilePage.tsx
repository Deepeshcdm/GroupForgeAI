import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody, CardHeader, Button, Input } from '../components/ui';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
    User,
    Mail,
    Building2,
    Github,
    Save,
    Edit2,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Briefcase,
    MessageSquare,
    Target,
    Globe,
    BookOpen,
    Clock,
    Users,
    Linkedin
} from 'lucide-react';
import {
    StudentProfile,
    FacultyProfile,
    SkillLevel,
    LearningStyle,
    WorkStyle,
    CommunicationPreference,
    MeetingPreference,
    GoalPreference,
    CommitmentLevel,
    TeamPreference,
    UserSkill
} from '../types';

// Common skills for selection
const COMMON_SKILLS = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask',
    'SQL', 'MongoDB', 'PostgreSQL', 'Firebase', 'AWS', 'Docker', 'Kubernetes',
    'Git', 'Machine Learning', 'Data Analysis', 'UI/UX Design', 'Figma',
    'Project Management', 'Agile', 'Scrum', 'Communication', 'Leadership',
    'Problem Solving', 'Critical Thinking', 'Research', 'Writing', 'Public Speaking'
];

// Common tools for selection
const COMMON_TOOLS = [
    'VS Code', 'IntelliJ', 'PyCharm', 'Jupyter', 'Git', 'GitHub', 'GitLab',
    'Slack', 'Discord', 'Zoom', 'Google Meet', 'Microsoft Teams',
    'Figma', 'Adobe XD', 'Canva', 'Notion', 'Trello', 'Jira', 'Asana',
    'Google Docs', 'Microsoft Office', 'LaTeX', 'Overleaf'
];

interface ProfileFormData {
    // Basic Info
    displayName: string;
    institutionId: string;
    department: string;

    // Student-specific fields
    major: string;
    year: number | undefined;
    enrollmentNumber: string;
    courses: string;
    projectTopics: string;
    preferredGroupSize: number | undefined;

    // Faculty-specific fields
    designation: 'Assistant Professor' | 'Associate Professor' | 'Professor' | '';
    employeeId: string;
    contactNumber: string;

    // Availability
    timezone: string;

    // Skills & Experience
    selectedSkills: UserSkill[];
    tools: string[];
    githubUsername: string;
    portfolioUrl: string;
    linkedinUrl: string;

    // Work & Learning Style (Student-specific)
    learningStyle: LearningStyle | '';
    workStyle: WorkStyle | '';
    communicationPreference: CommunicationPreference | '';
    meetingPreference: MeetingPreference | '';

    // Goals & Preferences (Student-specific)
    goalPreference: GoalPreference | '';
    commitmentLevel: CommitmentLevel | '';
    teamPreference: TeamPreference | '';

    // Optional
    bio: string;
    icebreakerPrompt: string;
    languages: string;
}

const STUDENT_STEPS = [
    { id: 1, title: 'Basic Info', icon: User },
    { id: 2, title: 'Skills & Tools', icon: Briefcase },
    { id: 3, title: 'Work Style', icon: MessageSquare },
    { id: 4, title: 'Goals', icon: Target },
];

const FACULTY_STEPS = [
    { id: 1, title: 'Basic Info', icon: User },
];

export function ProfilePage() {
    const { currentUser, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isEditing, setIsEditing] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState<ProfileFormData>({
        displayName: '',
        institutionId: '',
        department: '',
        major: '',
        year: undefined,
        enrollmentNumber: '',
        courses: '',
        projectTopics: '',
        preferredGroupSize: undefined,
        designation: '',
        employeeId: '',
        contactNumber: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        selectedSkills: [],
        tools: [],
        githubUsername: '',
        portfolioUrl: '',
        linkedinUrl: '',
        learningStyle: '',
        workStyle: '',
        communicationPreference: '',
        meetingPreference: '',
        goalPreference: '',
        commitmentLevel: '',
        teamPreference: '',
        bio: '',
        icebreakerPrompt: '',
        languages: '',
    });

    useEffect(() => {
        if (authLoading) return;

        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (userProfile) {
            const isNew = !userProfile.profileCompleted;
            setIsNewUser(isNew);
            setIsEditing(isNew);

            if (userProfile.role === 'student') {
                const studentProfile = userProfile as StudentProfile;
                setFormData({
                    displayName: userProfile.displayName || '',
                    institutionId: userProfile.institutionId || '',
                    department: studentProfile.department || '',
                    major: studentProfile.major || '',
                    year: studentProfile.year,
                    enrollmentNumber: studentProfile.enrollmentNumber || '',
                    designation: '',
                    employeeId: '',
                    contactNumber: '',
                    courses: studentProfile.courses?.join(', ') || '',
                    projectTopics: studentProfile.projectTopics?.join(', ') || '',
                    preferredGroupSize: studentProfile.preferredGroupSize,
                    timezone: studentProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                    selectedSkills: studentProfile.userSkills || [],
                    tools: studentProfile.tools || [],
                    githubUsername: studentProfile.githubUsername || '',
                    portfolioUrl: studentProfile.portfolioUrl || '',
                    linkedinUrl: studentProfile.linkedinUrl || '',
                    learningStyle: studentProfile.learningStyle || '',
                    workStyle: studentProfile.workStyle || '',
                    communicationPreference: studentProfile.communicationPreference || '',
                    meetingPreference: studentProfile.meetingPreference || '',
                    goalPreference: studentProfile.goalPreference || '',
                    commitmentLevel: studentProfile.commitmentLevel || '',
                    teamPreference: studentProfile.teamPreference || '',
                    bio: studentProfile.bio || '',
                    icebreakerPrompt: studentProfile.icebreakerPrompt || '',
                    languages: studentProfile.languages?.join(', ') || '',
                });
            } else if (userProfile.role === 'faculty') {
                const facultyProfile = userProfile as FacultyProfile;
                setFormData({
                    displayName: userProfile.displayName || '',
                    institutionId: userProfile.institutionId || '',
                    department: facultyProfile.department || '',
                    designation: facultyProfile.designation || '',
                    employeeId: facultyProfile.employeeId || '',
                    contactNumber: facultyProfile.contactNumber || '',
                    major: '',
                    year: undefined,
                    enrollmentNumber: '',
                    courses: '',
                    projectTopics: '',
                    preferredGroupSize: undefined,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    selectedSkills: [],
                    tools: [],
                    githubUsername: '',
                    portfolioUrl: '',
                    linkedinUrl: '',
                    learningStyle: '',
                    workStyle: '',
                    communicationPreference: '',
                    meetingPreference: '',
                    goalPreference: '',
                    commitmentLevel: '',
                    teamPreference: '',
                    bio: '',
                    icebreakerPrompt: '',
                    languages: '',
                });
            }
        } else if (currentUser) {
            setIsNewUser(true);
            setIsEditing(true);
            setFormData(prev => ({
                ...prev,
                displayName: currentUser.displayName || '',
            }));
        }
    }, [currentUser, userProfile, navigate, authLoading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'year' || name === 'preferredGroupSize'
                ? (value ? parseInt(value) : undefined)
                : value
        }));
    };

    const toggleSkill = (skillName: string) => {
        setFormData(prev => {
            const existingSkill = prev.selectedSkills.find(s => s.name === skillName);
            if (existingSkill) {
                return {
                    ...prev,
                    selectedSkills: prev.selectedSkills.filter(s => s.name !== skillName)
                };
            } else {
                return {
                    ...prev,
                    selectedSkills: [...prev.selectedSkills, { name: skillName, level: 'intermediate' as SkillLevel }]
                };
            }
        });
    };

    const updateSkillLevel = (skillName: string, level: SkillLevel) => {
        setFormData(prev => ({
            ...prev,
            selectedSkills: prev.selectedSkills.map(s =>
                s.name === skillName ? { ...s, level } : s
            )
        }));
    };

    const toggleTool = (tool: string) => {
        setFormData(prev => ({
            ...prev,
            tools: prev.tools.includes(tool)
                ? prev.tools.filter(t => t !== tool)
                : [...prev.tools, tool]
        }));
    };

    const isFacultyUser = userProfile?.role === 'faculty';
    const steps = isFacultyUser ? FACULTY_STEPS : STUDENT_STEPS;

    const validateStep = (step: number): boolean => {
        setError('');
        const isFaculty = userProfile?.role === 'faculty';

        switch (step) {
            case 1:
                if (!formData.displayName.trim()) {
                    setError('Full name is required');
                    return false;
                }
                if (!formData.institutionId.trim()) {
                    setError('University/Campus is required');
                    return false;
                }
                if (!formData.department.trim()) {
                    setError('Department is required');
                    return false;
                }
                if (isFaculty) {
                    if (!formData.designation) {
                        setError('Designation is required');
                        return false;
                    }
                    if (!formData.employeeId.trim()) {
                        setError('Employee ID is required');
                        return false;
                    }
                } else {
                    if (!formData.major.trim()) {
                        setError('Major/Program is required');
                        return false;
                    }
                    if (!formData.year) {
                        setError('Year of study is required');
                        return false;
                    }
                }
                return true;
            case 2:
                // Skills validation only for students
                if (formData.selectedSkills.length === 0) {
                    setError('Please select at least one skill');
                    return false;
                }
                return true;
            case 3:
                // Step 3 only exists for students
                if (!formData.learningStyle) {
                    setError('Please select your learning style');
                    return false;
                }
                if (!formData.workStyle) {
                    setError('Please select your work style');
                    return false;
                }
                if (!formData.communicationPreference) {
                    setError('Please select your communication preference');
                    return false;
                }
                return true;
            case 4:
                // Step 4 only exists for students
                if (!formData.goalPreference) {
                    setError('Please select your primary goal');
                    return false;
                }
                if (!formData.commitmentLevel) {
                    setError('Please select your commitment level');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setError('');
    };

    const handleSave = async () => {
        if (!currentUser || !userProfile) return;
        if (!validateStep(currentStep)) return;

        setError('');
        setSaving(true);

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const now = new Date();

            if (userProfile.role === 'student') {
                // Build the complete student profile data
                const profileData: Partial<StudentProfile> = {
                    uid: currentUser.uid,
                    email: currentUser.email || '',
                    displayName: formData.displayName,
                    role: 'student',
                    institutionId: formData.institutionId,
                    profileCompleted: true,
                    updatedAt: now,

                    // Basic Info
                    department: formData.department,
                    major: formData.major,
                    year: formData.year,
                    enrollmentNumber: formData.enrollmentNumber || undefined,

                    // Course & Project
                    courses: formData.courses ? formData.courses.split(',').map(s => s.trim()).filter(Boolean) : [],
                    projectTopics: formData.projectTopics ? formData.projectTopics.split(',').map(s => s.trim()).filter(Boolean) : [],
                    preferredGroupSize: formData.preferredGroupSize,

                    // Availability
                    timezone: formData.timezone,

                    // Skills & Experience
                    userSkills: formData.selectedSkills,
                    tools: formData.tools,
                    githubUsername: formData.githubUsername || undefined,
                    githubConnected: !!formData.githubUsername,
                    portfolioUrl: formData.portfolioUrl || undefined,
                    linkedinUrl: formData.linkedinUrl || undefined,

                    // Work & Learning Style
                    learningStyle: formData.learningStyle || undefined,
                    workStyle: formData.workStyle || undefined,
                    communicationPreference: formData.communicationPreference || undefined,
                    meetingPreference: formData.meetingPreference || undefined,

                    // Goals & Preferences
                    goalPreference: formData.goalPreference || undefined,
                    commitmentLevel: formData.commitmentLevel || undefined,
                    teamPreference: formData.teamPreference || undefined,

                    // Optional
                    bio: formData.bio || undefined,
                    icebreakerPrompt: formData.icebreakerPrompt || undefined,
                    languages: formData.languages ? formData.languages.split(',').map(s => s.trim()).filter(Boolean) : [],
                };

                // Remove undefined values to avoid Firebase errors
                const cleanData = Object.fromEntries(
                    Object.entries(profileData).filter(([_, v]) => v !== undefined)
                );

                if (isNewUser) {
                    await setDoc(userRef, cleanData, { merge: true });
                } else {
                    await updateDoc(userRef, cleanData);
                }
            } else if (userProfile.role === 'faculty') {
                // Build the complete faculty profile data
                const profileData: Partial<FacultyProfile> = {
                    uid: currentUser.uid,
                    email: currentUser.email || '',
                    displayName: formData.displayName,
                    role: 'faculty',
                    institutionId: formData.institutionId,
                    profileCompleted: true,
                    updatedAt: now,

                    // Faculty-specific fields
                    department: formData.department,
                    designation: formData.designation || undefined,
                    employeeId: formData.employeeId || undefined,
                    contactNumber: formData.contactNumber || undefined,
                };

                // Remove undefined values to avoid Firebase errors
                const cleanData = Object.fromEntries(
                    Object.entries(profileData).filter(([_, v]) => v !== undefined)
                );

                if (isNewUser) {
                    await setDoc(userRef, cleanData, { merge: true });
                } else {
                    await updateDoc(userRef, cleanData);
                }
            }

            setSuccess(true);
            setIsEditing(false);
            setIsNewUser(false);

            // Refresh the user profile in AuthContext to update profileCompleted status
            await refreshUserProfile();

            setTimeout(() => {
                setSuccess(false);
                navigate('/dashboard');
            }, 1500);
        } catch (err: any) {
            console.error('Error saving profile:', err);
            setError(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    // View mode for existing users
    if (!isEditing && !isNewUser) {
        return <ProfileViewMode
            userProfile={userProfile as StudentProfile | FacultyProfile | null}
            onEdit={() => setIsEditing(true)}
        />;
    }

    const isFaculty = userProfile?.role === 'faculty';

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isNewUser ? 'Complete Your Profile' : 'Edit Profile'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {isNewUser
                            ? isFaculty
                                ? 'Tell us about yourself so you can manage courses and teams effectively'
                                : 'Tell us about yourself so we can match you with the perfect team'
                            : 'Update your profile information'}
                    </p>
                    {isNewUser && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium">Complete all steps to unlock features</p>
                                <p className="mt-1 text-blue-700 dark:text-blue-300">
                                    {isFaculty
                                        ? 'After completing your profile, you\'ll be able to create courses and manage teams.'
                                        : 'After completing your profile, you\'ll be able to access the dashboard, take assessments, and join teams.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <div key={step.id} className="flex items-center">
                                    <div className="flex flex-col items-center">
                                        <div className={`
                                            w-12 h-12 rounded-full flex items-center justify-center transition-colors
                                            ${isActive ? 'bg-primary-600 text-white' :
                                                isCompleted ? 'bg-green-500 text-white' :
                                                    'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
                                        `}>
                                            {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                                        </div>
                                        <span className={`mt-2 text-sm font-medium ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {step.title}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`w-full h-1 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                                            style={{ minWidth: '60px' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Profile saved successfully! Redirecting to dashboard...
                    </div>
                )}

                {/* Step Content */}
                <Card>
                    <CardBody className="p-8">
                        {currentStep === 1 && (
                            isFaculty ? (
                                <Step1BasicInfoFaculty
                                    formData={formData}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                <Step1BasicInfo
                                    formData={formData}
                                    onChange={handleInputChange}
                                />
                            )
                        )}
                        {!isFaculty && currentStep === 2 && (
                            <Step2SkillsTools
                                formData={formData}
                                onChange={handleInputChange}
                                toggleSkill={toggleSkill}
                                updateSkillLevel={updateSkillLevel}
                                toggleTool={toggleTool}
                                isFaculty={isFaculty}
                            />
                        )}
                        {!isFaculty && currentStep === 3 && (
                            <Step3WorkStyle
                                formData={formData}
                                onChange={handleInputChange}
                            />
                        )}
                        {!isFaculty && currentStep === 4 && (
                            <Step4Goals
                                formData={formData}
                                onChange={handleInputChange}
                            />
                        )}
                    </CardBody>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={currentStep === 1}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                    </Button>

                    {currentStep === steps.length ? (
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    Saving...
                                </span>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {isNewUser ? 'Complete Profile' : 'Save Changes'}
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button onClick={handleNext}>
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

// Step 1: Basic Information
function Step1BasicInfo({ formData, onChange }: {
    formData: ProfileFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tell us about yourself and your academic background</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Full Name *"
                    name="displayName"
                    value={formData.displayName}
                    onChange={onChange}
                    placeholder="John Doe"
                    required
                />
                <Input
                    label="University / Campus *"
                    name="institutionId"
                    value={formData.institutionId}
                    onChange={onChange}
                    placeholder="e.g., Stanford University"
                    required
                />
                <Input
                    label="Department *"
                    name="department"
                    value={formData.department}
                    onChange={onChange}
                    placeholder="e.g., Computer Science"
                    required
                />
                <Input
                    label="Major / Program *"
                    name="major"
                    value={formData.major}
                    onChange={onChange}
                    placeholder="e.g., B.Tech Computer Science"
                    required
                />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Year of Study *
                    </label>
                    <select
                        name="year"
                        value={formData.year || ''}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        required
                    >
                        <option value="">Select year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="5">5th Year (Masters/PhD)</option>
                    </select>
                </div>
                <Input
                    label="Enrollment Number"
                    name="enrollmentNumber"
                    value={formData.enrollmentNumber}
                    onChange={onChange}
                    placeholder="e.g., 2024CS001"
                />
            </div>

            <div className="border-t dark:border-gray-700 pt-4 mt-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Courses & Projects
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Current Courses"
                        name="courses"
                        value={formData.courses}
                        onChange={onChange}
                        placeholder="e.g., Data Structures, ML (comma separated)"
                        helperText="Separate multiple courses with commas"
                    />
                    <Input
                        label="Project Topics of Interest"
                        name="projectTopics"
                        value={formData.projectTopics}
                        onChange={onChange}
                        placeholder="e.g., AI, Web Dev (comma separated)"
                        helperText="Topics you'd like to work on"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Preferred Group Size
                        </label>
                        <select
                            name="preferredGroupSize"
                            value={formData.preferredGroupSize || ''}
                            onChange={onChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="">No preference</option>
                            <option value="2">2 members</option>
                            <option value="3">3 members</option>
                            <option value="4">4 members</option>
                            <option value="5">5 members</option>
                            <option value="6">6+ members</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Timezone
                        </label>
                        <select
                            name="timezone"
                            value={formData.timezone}
                            onChange={onChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="Europe/Paris">Europe/Paris (CET)</option>
                            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                            <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Step 1: Basic Information for Faculty
function Step1BasicInfoFaculty({ formData, onChange }: {
    formData: ProfileFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tell us about yourself and your professional background</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Full Name *"
                    name="displayName"
                    value={formData.displayName}
                    onChange={onChange}
                    placeholder="Dr. Jane Smith"
                    required
                />
                <Input
                    label="University / Campus *"
                    name="institutionId"
                    value={formData.institutionId}
                    onChange={onChange}
                    placeholder="e.g., Stanford University"
                    required
                />
                <Input
                    label="Department *"
                    name="department"
                    value={formData.department}
                    onChange={onChange}
                    placeholder="e.g., Computer Science"
                    required
                />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Designation *
                    </label>
                    <select
                        name="designation"
                        value={formData.designation}
                        onChange={onChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        required
                    >
                        <option value="">Select designation</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                    </select>
                </div>
                <Input
                    label="Employee ID *"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={onChange}
                    placeholder="e.g., EMP2024001"
                    required
                />
                <Input
                    label="Contact Number"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={onChange}
                    placeholder="+1 234 567 8900"
                />
            </div>

            <div className="border-t dark:border-gray-700 pt-4 mt-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Timezone
                        </label>
                        <select
                            name="timezone"
                            value={formData.timezone}
                            onChange={onChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="Europe/Paris">Europe/Paris (CET)</option>
                            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                            <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Step 2: Skills & Tools
function Step2SkillsTools({ formData, onChange, toggleSkill, updateSkillLevel, toggleTool, isFaculty }: {
    formData: ProfileFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    toggleSkill: (skill: string) => void;
    updateSkillLevel: (skill: string, level: SkillLevel) => void;
    toggleTool: (tool: string) => void;
    isFaculty?: boolean;
}) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Skills & Experience</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Select your skills and rate your proficiency</p>
                </div>
            </div>

            {/* Skills Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Skills {!isFaculty && '* (Select at least one)'}
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                    {COMMON_SKILLS.map(skill => {
                        const isSelected = formData.selectedSkills.some(s => s.name === skill);
                        return (
                            <button
                                key={skill}
                                type="button"
                                onClick={() => toggleSkill(skill)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isSelected
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {skill}
                            </button>
                        );
                    })}
                </div>

                {/* Selected Skills with Levels */}
                {formData.selectedSkills.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Rate your proficiency:</p>
                        <div className="space-y-3">
                            {formData.selectedSkills.map(skill => (
                                <div key={skill.name} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-900 dark:text-white">{skill.name}</span>
                                    <div className="flex gap-2">
                                        {(['beginner', 'intermediate', 'advanced'] as SkillLevel[]).map(level => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => updateSkillLevel(skill.name, level)}
                                                className={`px-3 py-1 rounded text-xs font-medium capitalize ${skill.level === level
                                                    ? level === 'beginner' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                                                        level === 'intermediate' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' :
                                                            'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Tools Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Tools & Technologies
                </label>
                <div className="flex flex-wrap gap-2">
                    {COMMON_TOOLS.map(tool => {
                        const isSelected = formData.tools.includes(tool);
                        return (
                            <button
                                key={tool}
                                type="button"
                                onClick={() => toggleTool(tool)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isSelected
                                    ? 'bg-accent-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {tool}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Links */}
            <div className="border-t dark:border-gray-700 pt-4 mt-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Portfolio & Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <Github className="w-4 h-4 inline mr-1" />
                            GitHub Username
                        </label>
                        <Input
                            name="githubUsername"
                            value={formData.githubUsername}
                            onChange={onChange}
                            placeholder="johndoe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <Globe className="w-4 h-4 inline mr-1" />
                            Portfolio URL
                        </label>
                        <Input
                            name="portfolioUrl"
                            value={formData.portfolioUrl}
                            onChange={onChange}
                            placeholder="https://yourportfolio.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <Linkedin className="w-4 h-4 inline mr-1" />
                            LinkedIn URL
                        </label>
                        <Input
                            name="linkedinUrl"
                            value={formData.linkedinUrl}
                            onChange={onChange}
                            placeholder="https://linkedin.com/in/..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Step 3: Work & Learning Style
function Step3WorkStyle({ formData, onChange }: {
    formData: ProfileFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}) {
    const styleOptions = {
        learningStyle: [
            { value: 'visual', label: 'Visual', desc: 'Learn best through diagrams, videos, charts' },
            { value: 'auditory', label: 'Auditory', desc: 'Learn best through discussions and lectures' },
            { value: 'reading', label: 'Reading/Writing', desc: 'Learn best through documentation and notes' },
            { value: 'kinesthetic', label: 'Hands-on', desc: 'Learn best by doing and experimenting' },
        ],
        workStyle: [
            { value: 'planner', label: 'Planner', desc: 'Prefer structured schedules and clear deadlines' },
            { value: 'flexible', label: 'Flexible', desc: 'Prefer adaptable timelines and spontaneous work' },
            { value: 'mixed', label: 'Mixed', desc: 'Comfortable with both structured and flexible approaches' },
        ],
        communicationPreference: [
            { value: 'chat', label: 'Text/Chat', desc: 'Prefer async communication via messages' },
            { value: 'voice', label: 'Voice Calls', desc: 'Prefer audio calls for discussions' },
            { value: 'video', label: 'Video Calls', desc: 'Prefer face-to-face video meetings' },
            { value: 'in-person', label: 'In-Person', desc: 'Prefer meeting in person when possible' },
        ],
        meetingPreference: [
            { value: 'online', label: 'Online Only', desc: 'Prefer virtual meetings exclusively' },
            { value: 'in-person', label: 'In-Person Only', desc: 'Prefer physical meetings exclusively' },
            { value: 'hybrid', label: 'Hybrid', desc: 'Comfortable with both online and in-person' },
        ],
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Work & Learning Style</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Help us understand how you work best</p>
                </div>
            </div>

            {/* Learning Style */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    How do you learn best? *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {styleOptions.learningStyle.map(option => (
                        <label
                            key={option.value}
                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.learningStyle === option.value
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <input
                                type="radio"
                                name="learningStyle"
                                value={option.value}
                                checked={formData.learningStyle === option.value}
                                onChange={onChange}
                                className="mt-1"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{option.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Work Style */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    What's your work style? *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {styleOptions.workStyle.map(option => (
                        <label
                            key={option.value}
                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.workStyle === option.value
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <input
                                type="radio"
                                name="workStyle"
                                value={option.value}
                                checked={formData.workStyle === option.value}
                                onChange={onChange}
                                className="mt-1"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{option.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Communication Preference */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    How do you prefer to communicate? *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {styleOptions.communicationPreference.map(option => (
                        <label
                            key={option.value}
                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.communicationPreference === option.value
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <input
                                type="radio"
                                name="communicationPreference"
                                value={option.value}
                                checked={formData.communicationPreference === option.value}
                                onChange={onChange}
                                className="mt-1"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{option.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Meeting Preference */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Meeting preference
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {styleOptions.meetingPreference.map(option => (
                        <label
                            key={option.value}
                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.meetingPreference === option.value
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <input
                                type="radio"
                                name="meetingPreference"
                                value={option.value}
                                checked={formData.meetingPreference === option.value}
                                onChange={onChange}
                                className="mt-1"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{option.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Step 4: Goals & Preferences
function Step4Goals({ formData, onChange }: {
    formData: ProfileFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}) {
    const goalOptions = {
        goalPreference: [
            { value: 'grade', label: 'Best Grade', desc: 'Priority is achieving the highest possible grade' },
            { value: 'learning', label: 'Deep Learning', desc: 'Priority is learning and understanding deeply' },
            { value: 'speed', label: 'Quick Completion', desc: 'Priority is finishing efficiently' },
            { value: 'balanced', label: 'Balanced', desc: 'Balance between grades, learning, and efficiency' },
        ],
        commitmentLevel: [
            { value: 'low', label: 'Casual', desc: '5-10 hours/week - Other commitments take priority' },
            { value: 'medium', label: 'Moderate', desc: '10-20 hours/week - Balanced with other activities' },
            { value: 'high', label: 'Dedicated', desc: '20+ hours/week - This is a top priority' },
        ],
        teamPreference: [
            { value: 'mixed-skills', label: 'Mixed Skills', desc: 'Prefer teams with diverse skill sets' },
            { value: 'similar-skills', label: 'Similar Skills', desc: 'Prefer teams with similar expertise' },
            { value: 'no-preference', label: 'No Preference', desc: 'Open to any team composition' },
        ],
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Goals & Preferences</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tell us about your goals and team preferences</p>
                </div>
            </div>

            {/* Goal Preference */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    What's your primary goal for group projects? *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {goalOptions.goalPreference.map(option => (
                        <label
                            key={option.value}
                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.goalPreference === option.value
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <input
                                type="radio"
                                name="goalPreference"
                                value={option.value}
                                checked={formData.goalPreference === option.value}
                                onChange={onChange}
                                className="mt-1"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{option.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Commitment Level */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    How much time can you commit? *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {goalOptions.commitmentLevel.map(option => (
                        <label
                            key={option.value}
                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.commitmentLevel === option.value
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <input
                                type="radio"
                                name="commitmentLevel"
                                value={option.value}
                                checked={formData.commitmentLevel === option.value}
                                onChange={onChange}
                                className="mt-1"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{option.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Team Preference */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Team composition preference
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {goalOptions.teamPreference.map(option => (
                        <label
                            key={option.value}
                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.teamPreference === option.value
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <input
                                type="radio"
                                name="teamPreference"
                                value={option.value}
                                checked={formData.teamPreference === option.value}
                                onChange={onChange}
                                className="mt-1"
                            />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{option.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Optional Info */}
            <div className="border-t dark:border-gray-700 pt-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Optional: About You
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Short Bio
                        </label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={onChange}
                            placeholder="Tell potential teammates a bit about yourself..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Icebreaker
                        </label>
                        <Input
                            name="icebreakerPrompt"
                            value={formData.icebreakerPrompt}
                            onChange={onChange}
                            placeholder="e.g., What's your favorite programming language and why?"
                            helperText="A fun fact or question to help break the ice"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Languages Spoken
                        </label>
                        <Input
                            name="languages"
                            value={formData.languages}
                            onChange={onChange}
                            placeholder="e.g., English, Spanish, Mandarin"
                            helperText="Separate multiple languages with commas"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// View Mode Component for existing users
function ProfileViewMode({ userProfile, onEdit }: {
    userProfile: StudentProfile | FacultyProfile | null;
    onEdit: () => void;
}) {
    if (!userProfile) return null;

    const isFaculty = userProfile.role === 'faculty';
    const studentProfile = userProfile as StudentProfile;
    const facultyProfile = userProfile as FacultyProfile;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage your profile information</p>
                    </div>
                    <Button onClick={onEdit} variant="outline">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                    </Button>
                </div>

                {/* Basic Info Card */}
                <Card>
                    <CardBody className="p-6">
                        <div className="flex items-start gap-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                {userProfile?.photoURL ? (
                                    <img src={userProfile.photoURL} alt={userProfile.displayName} className="w-24 h-24 rounded-2xl object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-white" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{userProfile?.displayName}</h2>
                                {isFaculty ? (
                                    <p className="text-gray-500 dark:text-gray-400">{facultyProfile?.designation} • {userProfile?.department}</p>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">{studentProfile?.major} • {studentProfile?.year && `Year ${studentProfile.year}`}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        {userProfile?.email}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Building2 className="w-4 h-4" />
                                        {userProfile?.institutionId}
                                    </span>
                                </div>
                                {isFaculty && facultyProfile?.employeeId && (
                                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        Employee ID: {facultyProfile.employeeId}
                                    </div>
                                )}
                                {isFaculty && facultyProfile?.contactNumber && (
                                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Contact: {facultyProfile.contactNumber}
                                    </div>
                                )}
                                {!isFaculty && studentProfile?.bio && (
                                    <p className="mt-3 text-gray-600 dark:text-gray-300">{studentProfile.bio}</p>
                                )}
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Skills - show only if available */}
                {!isFaculty && studentProfile?.userSkills && studentProfile.userSkills.length > 0 && (
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                Skills
                            </h3>
                        </CardHeader>
                        <CardBody className="p-6">
                            <div className="flex flex-wrap gap-2">
                                {studentProfile.userSkills.map(skill => (
                                    <span
                                        key={skill.name}
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${skill.level === 'advanced' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                                            skill.level === 'intermediate' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' :
                                                'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                                            }`}
                                    >
                                        {skill.name} ({skill.level})
                                    </span>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Work Style - only for students */}
                {!isFaculty && (
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                Work & Communication Style
                            </h3>
                        </CardHeader>
                        <CardBody className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Learning Style</p>
                                    <p className="font-medium text-gray-900 dark:text-white capitalize">{studentProfile?.learningStyle || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Work Style</p>
                                    <p className="font-medium text-gray-900 dark:text-white capitalize">{studentProfile?.workStyle || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Communication</p>
                                    <p className="font-medium text-gray-900 dark:text-white capitalize">{studentProfile?.communicationPreference || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Meetings</p>
                                    <p className="font-medium text-gray-900 dark:text-white capitalize">{studentProfile?.meetingPreference || 'Not set'}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Goals - only for students */}
                {!isFaculty && (
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                Goals & Preferences
                            </h3>
                        </CardHeader>
                        <CardBody className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Primary Goal</p>
                                    <p className="font-medium text-gray-900 dark:text-white capitalize">{studentProfile?.goalPreference || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Commitment Level</p>
                                    <p className="font-medium text-gray-900 dark:text-white capitalize">{studentProfile?.commitmentLevel || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Team Preference</p>
                                    <p className="font-medium text-gray-900 dark:text-white capitalize">{studentProfile?.teamPreference?.replace('-', ' ') || 'Not set'}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Links */}
                {!isFaculty && (studentProfile?.githubUsername || studentProfile?.portfolioUrl || studentProfile?.linkedinUrl) && (
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Globe className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                Links
                            </h3>
                        </CardHeader>
                        <CardBody className="p-6">
                            <div className="flex flex-wrap gap-4">
                                {studentProfile?.githubUsername && (
                                    <a
                                        href={`https://github.com/${studentProfile.githubUsername}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                                    >
                                        <Github className="w-5 h-5" />
                                        {studentProfile.githubUsername}
                                    </a>
                                )}
                                {studentProfile?.linkedinUrl && (
                                    <a
                                        href={studentProfile.linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                                    >
                                        <Linkedin className="w-5 h-5" />
                                        LinkedIn
                                    </a>
                                )}
                                {studentProfile?.portfolioUrl && (
                                    <a
                                        href={studentProfile.portfolioUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                                    >
                                        <Globe className="w-5 h-5" />
                                        Portfolio
                                    </a>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
