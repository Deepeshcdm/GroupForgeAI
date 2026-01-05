import { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody, CardHeader, Button, SkillBar } from '../components/ui';
import {
    ClipboardCheck,
    Users,
    ArrowRight,
    Award,
    Target,
    Zap,
    TrendingUp,
    BookOpen,
    Calendar,
    Brain,
    Sparkles,
    BarChart3,
    Clock,
    CheckCircle2,
    Star,
    Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StudentProfile } from '../types';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

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
                {/* Welcome Header with Gradient */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 p-8 text-white">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-sm font-medium opacity-90">Welcome back!</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">
                            Hey, {profile.displayName?.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-primary-100 max-w-2xl">
                            {hasCompletedAssessment
                                ? 'Your personalized dashboard is ready. Track your progress, view your skills, and collaborate with your teams.'
                                : 'Let\'s get started! Complete your first assessment to unlock AI-powered team matching.'}
                        </p>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full mr-20 -mb-24"></div>
                </div>

                {/* Enhanced Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="group hover:shadow-lg dark:hover:shadow-primary-500/10 transition-all duration-300 border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800">
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <ClipboardCheck className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/50 px-3 py-1 rounded-full">
                                    Active
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assessments Completed</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {profile.assessmentHistory?.length || 0}
                                </p>
                                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    100%
                                </span>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="group hover:shadow-lg dark:hover:shadow-accent-500/10 transition-all duration-300 border-2 border-transparent hover:border-accent-200 dark:hover:border-accent-800">
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-xs font-medium text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/50 px-3 py-1 rounded-full">
                                    Teams
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Team Assignments</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {profile.teamAssignments?.length || 0}
                                </p>
                                <span className="text-sm text-gray-400">
                                    groups
                                </span>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="group hover:shadow-lg dark:hover:shadow-blue-500/10 transition-all duration-300 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Award className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50 px-3 py-1 rounded-full flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    Level
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Overall Skill Level</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {hasCompletedAssessment ? getOverallLevel(profile.skills) : 'N/A'}
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Enhanced Skill Profile - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <Card className="h-full">
                            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                            Your Skill Profile
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-analyzed competencies and strengths</p>
                                    </div>
                                    <Link to="/assessment">
                                        <Button size="sm" className="gap-2">
                                            <Activity className="w-4 h-4" />
                                            {hasCompletedAssessment ? 'Retake' : 'Start'} Assessment
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardBody className="p-6">
                                {hasCompletedAssessment ? (
                                    <div className="space-y-5">
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
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/50 dark:to-accent-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                            <Target className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Start Your Journey</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                                            Take your first AI-powered skill assessment to unlock personalized team matching and insights
                                        </p>
                                        <Link to="/assessment">
                                            <Button className="gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                Begin Assessment
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </div>

                    {/* Enhanced Quick Actions */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    Quick Actions
                                </h2>
                            </CardHeader>
                            <CardBody className="space-y-3 p-4">
                                <Link to="/assessment" className="block group">
                                    <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gradient-to-r hover:from-primary-50 dark:hover:from-primary-900/30 hover:to-transparent transition-all">
                                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <ClipboardCheck className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">Take Assessment</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered evaluation</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>

                                <Link to="/profile" className="block group">
                                    <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 hover:border-accent-300 dark:hover:border-accent-700 hover:bg-gradient-to-r hover:from-accent-50 dark:hover:from-accent-900/30 hover:to-transparent transition-all">
                                        <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Sparkles className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-accent-700 dark:group-hover:text-accent-400 transition-colors">Complete Profile</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Add skills & resume</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-accent-600 dark:group-hover:text-accent-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>

                                <Link to="/my-teams" className="block group">
                                    <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gradient-to-r hover:from-blue-50 dark:hover:from-blue-900/30 hover:to-transparent transition-all">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">My Teams</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">View assignments</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            </CardBody>
                        </Card>

                        {/* Progress Card */}
                        {hasCompletedAssessment && (
                            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-800">
                                <CardBody className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Great Progress!</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                                You've completed your assessment. Keep building your profile!
                                            </p>
                                            <div className="flex gap-2">
                                                <span className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300 font-medium">
                                                    ✓ Assessment Done
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function FacultyDashboard() {
    const { userProfile } = useAuth();
    const [stats, setStats] = useState({
        activeCourses: 0,
        totalStudents: 0,
        teamsFormed: 0,
        assessmentRate: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile?.uid) return;

        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Fetch courses managed by this faculty
                const coursesRef = collection(db, 'courses');
                const coursesQuery = query(coursesRef, where('facultyId', '==', userProfile.uid));
                const coursesSnapshot = await getDocs(coursesQuery);

                let totalStudentsCount = 0;
                let totalTeamsCount = 0;
                let completedAssessments = 0;

                coursesSnapshot.forEach((doc) => {
                    const courseData = doc.data();
                    const enrolledCount = courseData.enrolledStudents?.length || 0;
                    totalStudentsCount += enrolledCount;
                    totalTeamsCount += courseData.teams?.length || 0;
                });

                // Calculate assessment completion rate
                if (totalStudentsCount > 0) {
                    const usersRef = collection(db, 'users');
                    const studentsQuery = query(usersRef, where('role', '==', 'student'));
                    const studentsSnapshot = await getDocs(studentsQuery);

                    studentsSnapshot.forEach((doc) => {
                        const studentData = doc.data();
                        if (studentData.assessmentHistory?.length > 0) {
                            completedAssessments++;
                        }
                    });
                }

                const assessmentRate = totalStudentsCount > 0
                    ? Math.round((completedAssessments / totalStudentsCount) * 100)
                    : 0;

                setStats({
                    activeCourses: coursesSnapshot.size,
                    totalStudents: totalStudentsCount,
                    teamsFormed: totalTeamsCount,
                    assessmentRate
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();

        // Set up real-time listener for courses
        const coursesRef = collection(db, 'courses');
        const coursesQuery = query(coursesRef, where('facultyId', '==', userProfile.uid));
        const unsubscribe = onSnapshot(coursesQuery, () => {
            fetchDashboardData();
        });

        return () => unsubscribe();
    }, [userProfile]);

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Enhanced Faculty Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-8 text-white">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-5 h-5" />
                            <span className="text-sm font-medium opacity-90">Faculty Portal</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">
                            Welcome to Your Dashboard 🎓
                        </h1>
                        <p className="text-blue-100 max-w-2xl">
                            Manage your courses, form balanced teams, and track student progress all in one place.
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full mr-20 -mb-24"></div>
                </div>

                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="group hover:shadow-lg dark:hover:shadow-purple-500/10 transition-all duration-300 border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800">
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Courses</p>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {loading ? '...' : stats.activeCourses}
                                </div>
                                <span className="text-xs text-gray-400">courses</span>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="group hover:shadow-lg dark:hover:shadow-blue-500/10 transition-all duration-300 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Students</p>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {loading ? '...' : stats.totalStudents}
                                </div>
                                <span className="text-xs text-gray-400">enrolled</span>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="group hover:shadow-lg dark:hover:shadow-green-500/10 transition-all duration-300 border-2 border-transparent hover:border-green-200 dark:hover:border-green-800">
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Target className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Teams Formed</p>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {loading ? '...' : stats.teamsFormed}
                                </div>
                                <span className="text-xs text-gray-400">groups</span>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="group hover:shadow-lg dark:hover:shadow-orange-500/10 transition-all duration-300 border-2 border-transparent hover:border-orange-200 dark:hover:border-orange-800">
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <BarChart3 className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assessment Rate</p>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {loading ? '...' : `${stats.assessmentRate}%`}
                                </div>
                                <span className="text-xs text-gray-400">completed</span>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Courses Section - 2 columns */}
                    <div className="lg:col-span-2">
                        <Card className="h-full">
                            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                            Your Courses
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and create new courses</p>
                                    </div>
                                    <Button className="gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        New Course
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardBody className="p-6">
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                        <BookOpen className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No courses yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                                        Create your first course to start managing students and forming teams
                                    </p>
                                    <Button className="gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Create First Course
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Quick Actions & Recent Activity */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    Quick Actions
                                </h2>
                            </CardHeader>
                            <CardBody className="space-y-3 p-4">
                                <Link to="/team-formation" className="block group">
                                    <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all">
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Users className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 group-hover:text-purple-700">Form Teams</p>
                                            <p className="text-xs text-gray-500">AI-powered matching</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>

                                <Link to="/analytics" className="block group">
                                    <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all">
                                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <BarChart3 className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 group-hover:text-blue-700">View Analytics</p>
                                            <p className="text-xs text-gray-500">Student insights</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>

                                <Link to="/settings" className="block group">
                                    <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all">
                                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Activity className="w-6 h-6 text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">Settings</p>
                                            <p className="text-xs text-gray-500">Preferences</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            </CardBody>
                        </Card>

                        {/* Recent Activity */}
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                            <CardHeader className="border-b border-blue-100">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    Recent Activity
                                </h3>
                            </CardHeader>
                            <CardBody className="p-5">
                                <div className="text-center py-4">
                                    <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">No recent activity</p>
                                    <p className="text-xs text-gray-500 mt-1">Activity will appear here</p>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function AdminDashboard() {
    const [stats, setStats] = useState({
        institutions: 0,
        totalUsers: 0,
        assessments: 0,
        teamsCreated: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                setLoading(true);

                // Fetch all users
                const usersRef = collection(db, 'users');
                const usersSnapshot = await getDocs(usersRef);

                let assessmentCount = 0;
                let institutionSet = new Set();

                usersSnapshot.forEach((doc) => {
                    const userData = doc.data();
                    if (userData.institutionId) {
                        institutionSet.add(userData.institutionId);
                    }
                    if (userData.assessmentHistory?.length > 0) {
                        assessmentCount += userData.assessmentHistory.length;
                    }
                });

                // Fetch all teams
                const teamsRef = collection(db, 'teams');
                const teamsSnapshot = await getDocs(teamsRef);

                setStats({
                    institutions: institutionSet.size,
                    totalUsers: usersSnapshot.size,
                    assessments: assessmentCount,
                    teamsCreated: teamsSnapshot.size
                });
            } catch (error) {
                console.error('Error fetching admin data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();

        // Set up real-time listener
        const usersRef = collection(db, 'users');
        const unsubscribe = onSnapshot(usersRef, () => {
            fetchAdminData();
        });

        return () => unsubscribe();
    }, []);

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Enhanced Admin Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-8 text-white">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-5 h-5" />
                            <span className="text-sm font-medium opacity-90">Admin Control Center</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">
                            Platform Overview ⚡
                        </h1>
                        <p className="text-gray-300 max-w-2xl">
                            Monitor and manage the entire platform. Access analytics, manage users, and oversee all activities.
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full mr-20 -mb-24"></div>
                </div>

                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-primary-200">
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-1">Institutions</p>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-bold text-gray-900">
                                    {loading ? '...' : stats.institutions}
                                </div>
                                <span className="text-xs text-gray-400">registered</span>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-accent-200">
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-1">Total Users</p>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-bold text-gray-900">
                                    {loading ? '...' : stats.totalUsers}
                                </div>
                                <span className="text-xs text-gray-400">active</span>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-200">
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <ClipboardCheck className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-1">Assessments</p>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-bold text-gray-900">
                                    {loading ? '...' : stats.assessments}
                                </div>
                                <span className="text-xs text-gray-400">completed</span>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-200">
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Target className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-1">Teams Created</p>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-bold text-gray-900">
                                    {loading ? '...' : stats.teamsCreated}
                                </div>
                                <span className="text-xs text-gray-400">total</span>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Admin Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="hover:shadow-lg transition-all">
                        <CardHeader className="bg-gradient-to-r from-primary-50 to-white border-b">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary-600" />
                                User Management
                            </h3>
                        </CardHeader>
                        <CardBody className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Manage users, roles, and permissions across the platform
                            </p>
                            <Button variant="outline" className="w-full">View All Users</Button>
                        </CardBody>
                    </Card>

                    <Card className="hover:shadow-lg transition-all">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                Analytics
                            </h3>
                        </CardHeader>
                        <CardBody className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                View detailed analytics and platform insights
                            </p>
                            <Button variant="outline" className="w-full">View Analytics</Button>
                        </CardBody>
                    </Card>

                    <Card className="hover:shadow-lg transition-all">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-600" />
                                System Health
                            </h3>
                        </CardHeader>
                        <CardBody className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Monitor system performance and activity logs
                            </p>
                            <Button variant="outline" className="w-full">Check Status</Button>
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
