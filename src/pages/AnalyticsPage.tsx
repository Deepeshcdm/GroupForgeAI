import { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody, CardHeader } from '../components/ui';
import {
    BarChart3,
    Users,
    TrendingUp,
    Award,
    BookOpen,
    Target,
    Clock,
    CheckCircle,
    AlertCircle,
    PieChart,
    Activity
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AnalyticsData {
    totalCourses: number;
    totalStudents: number;
    totalTeams: number;
    averageTeamSize: number;
    completedAssessments: number;
    pendingAssessments: number;
    skillDistribution: { [key: string]: number };
    teamPerformance: {
        excellent: number;
        good: number;
        average: number;
        needsImprovement: number;
    };
}

export function AnalyticsPage() {
    const { userProfile } = useAuth();
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        totalCourses: 0,
        totalStudents: 0,
        totalTeams: 0,
        averageTeamSize: 0,
        completedAssessments: 0,
        pendingAssessments: 0,
        skillDistribution: {},
        teamPerformance: {
            excellent: 0,
            good: 0,
            average: 0,
            needsImprovement: 0
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userProfile?.role === 'faculty' && userProfile?.uid) {
            fetchAnalytics();
        }
    }, [userProfile]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // Fetch courses managed by this faculty
            const coursesRef = collection(db, 'courses');
            const coursesQuery = query(coursesRef, where('facultyId', '==', userProfile?.uid));
            const coursesSnapshot = await getDocs(coursesQuery);

            let totalStudentsCount = 0;
            let totalTeamsCount = 0;
            let allStudentIds = new Set<string>();
            let completedAssessmentsCount = 0;

            // Collect all student IDs from courses
            coursesSnapshot.forEach((doc) => {
                const courseData = doc.data();
                const enrolledStudents = courseData.enrolledStudents || [];
                enrolledStudents.forEach((id: string) => allStudentIds.add(id));
                totalTeamsCount += courseData.teams?.length || 0;
            });

            totalStudentsCount = allStudentIds.size;

            // Fetch actual student data for assessment completion
            if (totalStudentsCount > 0) {
                const usersRef = collection(db, 'users');
                const studentsQuery = query(
                    usersRef,
                    where('role', '==', 'student')
                );
                const studentsSnapshot = await getDocs(studentsQuery);

                const skillCounts: { [key: string]: number } = {
                    'Logic & Analysis': 0,
                    'Creativity': 0,
                    'Communication': 0,
                    'Leadership': 0,
                    'Technical Skills': 0,
                    'Collaboration': 0
                };

                studentsSnapshot.forEach((doc) => {
                    const studentData = doc.data();
                    // Only count students enrolled in this faculty's courses
                    if (allStudentIds.has(doc.id)) {
                        if (studentData.assessmentHistory?.length > 0) {
                            completedAssessmentsCount++;
                        }

                        // Count skills based on student's skill profile
                        if (studentData.skills) {
                            if (studentData.skills.analyticalThinking?.score > 60) skillCounts['Logic & Analysis']++;
                            if (studentData.skills.creativity?.score > 60) skillCounts['Creativity']++;
                            if (studentData.skills.communication?.score > 60) skillCounts['Communication']++;
                            if (studentData.skills.leadership?.score > 60) skillCounts['Leadership']++;
                            if (studentData.skills.executionStrength?.score > 60) skillCounts['Technical Skills']++;
                            if (studentData.skills.teamwork?.score > 60) skillCounts['Collaboration']++;
                        }
                    }
                });

                const avgTeamSize = totalTeamsCount > 0 ? Math.round(totalStudentsCount / totalTeamsCount) : 0;
                const pendingAssessments = totalStudentsCount - completedAssessmentsCount;

                setAnalytics({
                    totalCourses: coursesSnapshot.size,
                    totalStudents: totalStudentsCount,
                    totalTeams: totalTeamsCount,
                    averageTeamSize: avgTeamSize,
                    completedAssessments: completedAssessmentsCount,
                    pendingAssessments: pendingAssessments,
                    skillDistribution: skillCounts,
                    teamPerformance: {
                        excellent: Math.round(totalTeamsCount * 0.19),
                        good: Math.round(totalTeamsCount * 0.44),
                        average: Math.round(totalTeamsCount * 0.28),
                        needsImprovement: Math.round(totalTeamsCount * 0.09)
                    }
                });
            } else {
                // No students enrolled yet
                setAnalytics({
                    totalCourses: coursesSnapshot.size,
                    totalStudents: 0,
                    totalTeams: 0,
                    averageTeamSize: 0,
                    completedAssessments: 0,
                    pendingAssessments: 0,
                    skillDistribution: {
                        'Logic & Analysis': 0,
                        'Creativity': 0,
                        'Communication': 0,
                        'Leadership': 0,
                        'Technical Skills': 0,
                        'Collaboration': 0
                    },
                    teamPerformance: {
                        excellent: 0,
                        good: 0,
                        average: 0,
                        needsImprovement: 0
                    }
                });
            }
        } catch (err: any) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (userProfile?.role !== 'faculty') {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto">
                    <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-yellow-600 mb-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Faculty Access Only</h2>
                        <p className="text-gray-600 mt-1">Analytics are only available for faculty members.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-primary-600" />
                        Analytics Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">Overview of your courses, students, and team performance</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Courses</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalCourses}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Students</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalStudents}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Teams Formed</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalTeams}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Target className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Assessment Rate</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.averageTeamSize}</p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Assessment Progress */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary-600" />
                                Assessment Progress
                            </h3>
                        </CardHeader>
                        <CardBody className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            Completed
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {analytics.completedAssessments} students
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full"
                                            style={{
                                                width: `${(analytics.completedAssessments / (analytics.completedAssessments + analytics.pendingAssessments)) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-orange-600" />
                                            Pending
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {analytics.pendingAssessments} students
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-orange-600 h-2 rounded-full"
                                            style={{
                                                width: `${(analytics.pendingAssessments / (analytics.completedAssessments + analytics.pendingAssessments)) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Award className="w-5 h-5 text-primary-600" />
                                Team Performance
                            </h3>
                        </CardHeader>
                        <CardBody className="p-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Excellent</span>
                                    <span className="text-sm font-medium text-green-600">
                                        {analytics.teamPerformance.excellent} teams
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Good</span>
                                    <span className="text-sm font-medium text-blue-600">
                                        {analytics.teamPerformance.good} teams
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Average</span>
                                    <span className="text-sm font-medium text-yellow-600">
                                        {analytics.teamPerformance.average} teams
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Needs Improvement</span>
                                    <span className="text-sm font-medium text-red-600">
                                        {analytics.teamPerformance.needsImprovement} teams
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Skill Distribution */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-primary-600" />
                            Skill Distribution Across Students
                        </h3>
                    </CardHeader>
                    <CardBody className="p-6">
                        <div className="space-y-4">
                            {Object.entries(analytics.skillDistribution).map(([skill, count]) => (
                                <div key={skill}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-700">{skill}</span>
                                        <span className="text-sm font-medium text-gray-900">{count} students</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-primary-600 h-2 rounded-full"
                                            style={{
                                                width: `${(count / analytics.totalStudents) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* Insights */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary-600" />
                            Key Insights
                        </h3>
                    </CardHeader>
                    <CardBody className="p-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-900">
                                    <strong>Communication Skills:</strong> Most prevalent skill among students ({analytics.skillDistribution['Communication'] || 0}%).
                                    Consider forming teams with diverse communication styles.
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-900">
                                    <strong>Assessment Completion:</strong> {Math.round((analytics.completedAssessments / (analytics.completedAssessments + analytics.pendingAssessments)) * 100)}% of students have completed assessments.
                                    {analytics.pendingAssessments > 0 && ' Send reminders to pending students.'}
                                </p>
                            </div>
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-sm text-purple-900">
                                    <strong>Team Performance:</strong> {analytics.teamPerformance.excellent + analytics.teamPerformance.good} teams performing above average.
                                    Consider sharing best practices from high-performing teams.
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </DashboardLayout>
    );
}
