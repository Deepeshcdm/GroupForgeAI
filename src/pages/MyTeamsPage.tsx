import { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody, CardHeader, Button, SkillBar } from '../components/ui';
import {
    Users,
    Mail,
    MessageSquare,
    Video,
    ExternalLink,
    Sparkles,
    Award,
    TrendingUp
} from 'lucide-react';
import { StudentProfile, Team, TeamMember } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getStudentTeam } from '../services';

interface TeamWithDetails extends Team {
    memberProfiles: StudentProfile[];
}

export function MyTeamsPage() {
    const { userProfile } = useAuth();
    const [teams, setTeams] = useState<TeamWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTeams() {
            if (!userProfile?.uid) {
                setLoading(false);
                return;
            }

            try {
                // Use the getStudentTeam function to fetch the student's team
                const result = await getStudentTeam(userProfile.uid);

                // Check if student is assigned to a team
                if ('status' in result && result.status === 'not_assigned') {
                    setTeams([]);
                    setLoading(false);
                    return;
                }

                // Student has a team - fetch member profiles
                const teamData = result as Team;
                const memberProfiles = await Promise.all(
                    teamData.members.map(async (member) => {
                        const userDoc = await getDoc(doc(db, 'users', member.userId));
                        return userDoc.exists() ? userDoc.data() as StudentProfile : null;
                    })
                );

                const teamWithDetails: TeamWithDetails = {
                    ...teamData,
                    memberProfiles: memberProfiles.filter((p): p is StudentProfile => p !== null)
                };

                setTeams([teamWithDetails]);
            } catch (error) {
                console.error('Error fetching teams:', error);
                setTeams([]);
            } finally {
                setLoading(false);
            }
        }

        fetchTeams();
    }, [userProfile]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-950 rounded-2xl">
                    <div className="animate-spin rounded-full h-9 w-9 border-3 border-primary-500 border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

    // Empty state
    if (teams.length === 0) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-indigo-600 to-accent-500 text-white p-6 shadow-lg">
                        <div className="relative z-10 flex flex-col gap-2">
                            <div className="inline-flex items-center gap-2 text-sm font-semibold bg-white/10 px-3 py-1 rounded-full w-fit">
                                <Users className="w-4 h-4" />
                                My Teams
                            </div>
                            <h1 className="text-3xl font-bold leading-tight">No Team Yet</h1>
                            <p className="text-white/85 text-sm max-w-2xl">
                                Complete your profile and assessment to get matched with a balanced team. Your readiness boosts matching priority.
                            </p>
                        </div>
                        <div className="absolute right-4 bottom-4 w-28 h-28 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -left-8 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                    </div>

                    <Card className="border-0 shadow-xl bg-white dark:bg-gray-900">
                        <CardBody className="p-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                                <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                No Teams Yet
                            </h3>
                            <p className="text-gray-500 dark:text-gray-300 max-w-md mx-auto">
                                You haven't been assigned to any teams yet. Complete your profile and assessments to help faculty match you with the perfect team.
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                {!userProfile?.profileCompleted && (
                                    <Button variant="primary" onClick={() => window.location.href = '/profile'}>
                                        Complete Profile
                                    </Button>
                                )}
                                {(userProfile as StudentProfile)?.assessmentHistory?.length === 0 && (
                                    <Button
                                        variant={userProfile?.profileCompleted ? "primary" : "outline"}
                                        onClick={() => window.location.href = '/assessment'}
                                    >
                                        Take Assessment
                                    </Button>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    // Teams view
    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-indigo-600 to-accent-500 text-white p-6 shadow-lg">
                    <div className="relative z-10 flex flex-col gap-1">
                        <div className="inline-flex items-center gap-2 text-sm font-semibold bg-white/10 px-3 py-1 rounded-full w-fit">
                            <Users className="w-4 h-4" />
                            Team Workspace
                        </div>
                        <h1 className="text-3xl font-bold leading-tight">My Teams</h1>
                        <p className="text-white/85 text-sm max-w-2xl">
                            Collaborate, meet, and track balance scores across your assigned teams.
                        </p>
                    </div>
                    <div className="absolute right-4 bottom-4 w-28 h-28 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -left-8 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                </div>

                <div className="space-y-6">
                    {teams.map((team) => (
                        <TeamCard key={team.id} team={team} currentUserId={userProfile?.uid || ''} />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

function TeamCard({ team, currentUserId }: { team: TeamWithDetails; currentUserId: string }) {
    const [expanded, setExpanded] = useState(false);

    // Calculate team skill averages
    const skillAverages = calculateTeamSkillAverages(team.memberProfiles);
    const memberCount = team.members.length;

    return (
        <Card className="border-0 shadow-xl bg-white dark:bg-gray-900">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                            <div className="flex items-center gap-4 mt-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                                </p>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100 rounded text-xs font-medium">
                                    <Award className="w-3 h-3" />
                                    Balance Score: {Math.round(team.balanceScore)}
                                </span>
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${team.status === 'active' ? 'bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-100' :
                                    team.status === 'draft' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-100' :
                                        'bg-gray-50 text-gray-700 dark:bg-gray-700/60 dark:text-gray-200'
                                    }`}>
                                    {team.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Show Less' : 'Show More'}
                    </Button>
                </div>
            </CardHeader>

            <CardBody className="p-6 space-y-6">
                {/* Team Skill Distribution */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary-600" />
                        Team Skill Distribution
                    </h4>
                    <div className="space-y-3">
                        <SkillBar
                            label="Leadership"
                            score={skillAverages.leadership}
                            confidence="medium"
                        />
                        <SkillBar
                            label="Analytical Thinking"
                            score={skillAverages.analyticalThinking}
                            confidence="medium"
                        />
                        <SkillBar
                            label="Creativity"
                            score={skillAverages.creativity}
                            confidence="medium"
                        />
                        <SkillBar
                            label="Execution Strength"
                            score={skillAverages.executionStrength}
                            confidence="medium"
                        />
                        <SkillBar
                            label="Communication"
                            score={skillAverages.communication}
                            confidence="medium"
                        />
                        <SkillBar
                            label="Teamwork"
                            score={skillAverages.teamwork}
                            confidence="medium"
                        />
                    </div>
                </div>

                {/* Communication & Collaboration */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary-600" />
                        Communication & Collaboration
                    </h4>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const emails = team.memberProfiles.map(p => p.email).join(',');
                                window.location.href = `mailto:${emails}`;
                            }}
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Email Team
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('https://discord.com', '_blank')}
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Discord
                            <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('https://meet.google.com', '_blank')}
                        >
                            <Video className="w-4 h-4 mr-2" />
                            Google Meet
                            <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('https://slack.com', '_blank')}
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Slack
                            <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                </div>

                {/* Team Members - Expanded View */}
                {expanded && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary-600" />
                            Team Members
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {team.memberProfiles.map((member) => (
                                <MemberCard
                                    key={member.uid}
                                    member={member}
                                    teamMember={team.members.find(m => m.userId === member.uid)!}
                                    isCurrentUser={member.uid === currentUserId}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Formation Insight */}
                {team.aiRationale && (
                    <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-500/10 dark:to-accent-500/10 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                    AI Team Formation Insight
                                </h4>
                                <p className="text-sm text-gray-700 dark:text-gray-200">
                                    {team.aiRationale}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}

function MemberCard({
    member,
    teamMember,
    isCurrentUser
}: {
    member: StudentProfile;
    teamMember: TeamMember;
    isCurrentUser: boolean;
}) {
    return (
        <div className={`p-4 rounded-lg border-2 ${isCurrentUser
            ? 'border-primary-300 bg-primary-50 dark:bg-primary-500/10 dark:border-primary-500'
            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            }`}>
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                    {member.photoURL ? (
                        <img
                            src={member.photoURL}
                            alt={member.displayName}
                            className="w-10 h-10 rounded-full"
                        />
                    ) : (
                        <span className="text-white font-semibold text-sm">
                            {member.displayName?.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h5 className="font-medium text-gray-900 dark:text-white truncate">
                            {member.displayName}
                            {isCurrentUser && (
                                <span className="ml-2 text-xs text-primary-600 font-normal">(You)</span>
                            )}
                        </h5>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">
                        {teamMember.role}
                    </p>

                    {/* Member Skills */}
                    <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-16">Leadership</span>
                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${member.skills?.leadership?.score || 0}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300 w-8 text-right">
                                {member.skills?.leadership?.score || 0}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-16">Analytical</span>
                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full"
                                    style={{ width: `${member.skills?.analyticalThinking?.score || 0}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300 w-8 text-right">
                                {member.skills?.analyticalThinking?.score || 0}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-16">Creativity</span>
                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-pink-500 rounded-full"
                                    style={{ width: `${member.skills?.creativity?.score || 0}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300 w-8 text-right">
                                {member.skills?.creativity?.score || 0}
                            </span>
                        </div>
                    </div>

                    {/* Contact */}
                    {member.email && (
                        <a
                            href={`mailto:${member.email}`}
                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-200 mt-2 inline-flex items-center gap-1"
                        >
                            <Mail className="w-3 h-3" />
                            Contact
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

function calculateTeamSkillAverages(members: StudentProfile[]) {
    if (members.length === 0) {
        return {
            leadership: 0,
            analyticalThinking: 0,
            creativity: 0,
            executionStrength: 0,
            communication: 0,
            teamwork: 0
        };
    }

    const totals = members.reduce((acc, member) => {
        return {
            leadership: acc.leadership + (member.skills?.leadership?.score || 0),
            analyticalThinking: acc.analyticalThinking + (member.skills?.analyticalThinking?.score || 0),
            creativity: acc.creativity + (member.skills?.creativity?.score || 0),
            executionStrength: acc.executionStrength + (member.skills?.executionStrength?.score || 0),
            communication: acc.communication + (member.skills?.communication?.score || 0),
            teamwork: acc.teamwork + (member.skills?.teamwork?.score || 0)
        };
    }, {
        leadership: 0,
        analyticalThinking: 0,
        creativity: 0,
        executionStrength: 0,
        communication: 0,
        teamwork: 0
    });

    return {
        leadership: Math.round(totals.leadership / members.length),
        analyticalThinking: Math.round(totals.analyticalThinking / members.length),
        creativity: Math.round(totals.creativity / members.length),
        executionStrength: Math.round(totals.executionStrength / members.length),
        communication: Math.round(totals.communication / members.length),
        teamwork: Math.round(totals.teamwork / members.length)
    };
}
