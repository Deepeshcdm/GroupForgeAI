import { useAuth } from '../contexts';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody, CardHeader, Button, SkillBar } from '../components/ui';
import {
    ClipboardCheck,
    Users,
    ArrowRight,
    Award,
    Target,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StudentProfile } from '../types';

export function DashboardPage() {
    const { userProfile } = useAuth();

    if (userProfile?.role === 'student') {
        return <StudentDashboard profile={userProfile as StudentProfile} />;
    }

    if (userProfile?.role === 'faculty') {
        return <FacultyDashboard />;
    }

    return <AdminDashboard />;
}

function StudentDashboard({ profile }: { profile: StudentProfile }) {
    const hasCompletedAssessment = profile.skills?.leadership?.assessmentCount > 0;

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Welcome Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {profile.displayName?.split(' ')[0]}!
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {hasCompletedAssessment
                            ? 'Here\'s your skill profile and team assignments.'
                            : 'Complete your first assessment to get started.'}
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardBody className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                <ClipboardCheck className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Assessments</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {profile.assessmentHistory?.length || 0}
                                </p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-accent-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Teams</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {profile.teamAssignments?.length || 0}
                                </p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Award className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Skill Level</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {hasCompletedAssessment ? getOverallLevel(profile.skills) : 'N/A'}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Skill Profile */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Your Skill Profile</h2>
                                <Link to="/assessment">
                                    <Button variant="ghost" size="sm">
                                        {hasCompletedAssessment ? 'Retake' : 'Start'} Assessment
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardBody>
                            {hasCompletedAssessment ? (
                                <div className="space-y-4">
                                    <SkillBar
                                        label="Leadership"
                                        score={profile.skills.leadership.score}
                                        confidence={profile.skills.leadership.confidence}
                                    />
                                    <SkillBar
                                        label="Analytical Thinking"
                                        score={profile.skills.analyticalThinking.score}
                                        confidence={profile.skills.analyticalThinking.confidence}
                                    />
                                    <SkillBar
                                        label="Creativity"
                                        score={profile.skills.creativity.score}
                                        confidence={profile.skills.creativity.confidence}
                                    />
                                    <SkillBar
                                        label="Execution Strength"
                                        score={profile.skills.executionStrength.score}
                                        confidence={profile.skills.executionStrength.confidence}
                                    />
                                    <SkillBar
                                        label="Communication"
                                        score={profile.skills.communication.score}
                                        confidence={profile.skills.communication.confidence}
                                    />
                                    <SkillBar
                                        label="Teamwork"
                                        score={profile.skills.teamwork.score}
                                        confidence={profile.skills.teamwork.confidence}
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Target className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="font-medium text-gray-900 mb-2">No assessment completed</h3>
                                    <p className="text-gray-500 text-sm mb-4">
                                        Take your first skill assessment to unlock team matching
                                    </p>
                                    <Link to="/assessment">
                                        <Button>
                                            Start Assessment
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                        </CardHeader>
                        <CardBody className="space-y-3">
                            <Link to="/assessment" className="block">
                                <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                        <ClipboardCheck className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Take Assessment</p>
                                        <p className="text-sm text-gray-500">Evaluate your skills with AI</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </Link>

                            <Link to="/profile" className="block">
                                <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                                    <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-accent-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Upload Resume</p>
                                        <p className="text-sm text-gray-500">Enhance your profile with experience</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </Link>

                            <Link to="/my-teams" className="block">
                                <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">View Teams</p>
                                        <p className="text-sm text-gray-500">See your team assignments</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </Link>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

function FacultyDashboard() {
    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
                    <p className="text-gray-500 mt-1">Manage courses and form student teams</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardBody className="text-center">
                            <div className="text-3xl font-bold text-primary-600">0</div>
                            <p className="text-sm text-gray-500 mt-1">Active Courses</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <div className="text-3xl font-bold text-accent-600">0</div>
                            <p className="text-sm text-gray-500 mt-1">Total Students</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <div className="text-3xl font-bold text-blue-600">0</div>
                            <p className="text-sm text-gray-500 mt-1">Teams Formed</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <div className="text-3xl font-bold text-purple-600">0%</div>
                            <p className="text-sm text-gray-500 mt-1">Assessment Rate</p>
                        </CardBody>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Your Courses</h2>
                                <Button size="sm">+ New Course</Button>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="text-center py-8 text-gray-500">
                                <p>No courses yet. Create your first course to get started.</p>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="text-center py-8 text-gray-500">
                                <p>No recent activity</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

function AdminDashboard() {
    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">Platform administration and analytics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardBody className="text-center">
                            <div className="text-3xl font-bold text-primary-600">0</div>
                            <p className="text-sm text-gray-500 mt-1">Institutions</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <div className="text-3xl font-bold text-accent-600">0</div>
                            <p className="text-sm text-gray-500 mt-1">Total Users</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <div className="text-3xl font-bold text-blue-600">0</div>
                            <p className="text-sm text-gray-500 mt-1">Assessments</p>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="text-center">
                            <div className="text-3xl font-bold text-purple-600">0</div>
                            <p className="text-sm text-gray-500 mt-1">Teams Created</p>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

function getOverallLevel(skills: StudentProfile['skills']): string {
    if (!skills) return 'N/A';

    const avg = (
        skills.leadership.score +
        skills.analyticalThinking.score +
        skills.creativity.score +
        skills.executionStrength.score +
        skills.communication.score +
        skills.teamwork.score
    ) / 6;

    if (avg >= 80) return 'Expert';
    if (avg >= 60) return 'Advanced';
    if (avg >= 40) return 'Intermediate';
    return 'Beginner';
}
