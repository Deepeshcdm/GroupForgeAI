import React, { useState } from 'react';
import { Users, Sparkles, Target, TrendingUp, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';
import { Button, Card } from '../components/ui';
import {
    getAllStrategiesComparison,
    saveTeamsToFirestore,
    TeamFormationStrategy
} from '../services/teamFormation';
import { useAuth } from '../contexts/AuthContext';
import { Team } from '../types';

interface StrategyResult {
    teams: Team[];
    unassignedStudents: any[];
    averageBalanceScore: number;
    strategyRationale: string;
}

const TeamFormationPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [teamSize, setTeamSize] = useState<number>(4);
    const [selectedStrategy, setSelectedStrategy] = useState<TeamFormationStrategy | null>(null);
    const [comparisonResults, setComparisonResults] = useState<Record<TeamFormationStrategy, StrategyResult> | null>(null);
    const [selectedResult, setSelectedResult] = useState<StrategyResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const strategyInfo = {
        balanced: {
            name: 'Balanced Distribution',
            icon: TrendingUp,
            description: 'Snake draft ensures each team gets a mix of high, medium, and lower performers',
            color: 'bg-blue-500'
        },
        complementary: {
            name: 'Complementary Skills',
            icon: Target,
            description: 'One specialist from each skill area for comprehensive coverage',
            color: 'bg-purple-500'
        },
        'role-based': {
            name: 'Role-Based Assignment',
            icon: Users,
            description: 'Explicit roles: Leader, Coordinator, Specialists, Contributors',
            color: 'bg-green-500'
        }
    };

    const handleCompareStrategies = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const results = await getAllStrategiesComparison(teamSize, currentUser!.uid);
            setComparisonResults(results);
        } catch (err: any) {
            setError(err.message || 'Failed to generate team formations');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStrategy = (strategy: TeamFormationStrategy) => {
        if (comparisonResults) {
            setSelectedStrategy(strategy);
            setSelectedResult(comparisonResults[strategy]);
        }
    };

    const handleSaveTeams = async () => {
        if (!selectedResult || !selectedResult.teams.length) return;

        setSaving(true);
        setError(null);

        try {
            await saveTeamsToFirestore(selectedResult.teams);
            setSuccess(`Successfully created ${selectedResult.teams.length} teams!`);

            // Reset after 2 seconds
            setTimeout(() => {
                setComparisonResults(null);
                setSelectedResult(null);
                setSelectedStrategy(null);
                setSuccess(null);
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to save teams');
        } finally {
            setSaving(false);
        }
    };

    const getSkillColor = (score: number) => {
        if (score >= 75) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Team Formation</h1>
                <p className="text-gray-600 mt-2">
                    Create balanced teams using AI-powered skill matching
                </p>
            </div>

            {/* Configuration */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Team Size (members per team)
                        </label>
                        <input
                            type="number"
                            min="3"
                            max="8"
                            value={teamSize}
                            onChange={(e) => setTeamSize(parseInt(e.target.value))}
                            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading || !!comparisonResults}
                        />
                    </div>

                    <Button
                        onClick={handleCompareStrategies}
                        disabled={loading || !!comparisonResults}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Analyzing Students...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Generate All Strategies
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {/* Error/Success Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-red-800">Error</h3>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-green-800">Success</h3>
                        <p className="text-green-600 text-sm">{success}</p>
                    </div>
                </div>
            )}

            {/* Strategy Comparison */}
            {comparisonResults && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Compare Strategies</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(Object.keys(strategyInfo) as TeamFormationStrategy[]).map((strategy) => {
                            const info = strategyInfo[strategy];
                            const result = comparisonResults[strategy];
                            const Icon = info.icon;
                            const isSelected = selectedStrategy === strategy;

                            return (
                                <Card
                                    key={strategy}
                                    className={`p-6 cursor-pointer transition-all ${isSelected
                                            ? 'ring-2 ring-blue-500 shadow-lg'
                                            : 'hover:shadow-md'
                                        }`}
                                    onClick={() => handleSelectStrategy(strategy)}
                                >
                                    <div className="flex items-center mb-4">
                                        <div className={`p-3 rounded-lg ${info.color}`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="font-semibold text-gray-900">{info.name}</h3>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-4">{info.description}</p>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Teams:</span>
                                            <span className="font-semibold">{result.teams.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Avg Balance:</span>
                                            <span className="font-semibold">{result.averageBalanceScore.toFixed(1)}/100</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Unassigned:</span>
                                            <span className="font-semibold">{result.unassignedStudents.length}</span>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <span className="text-xs font-semibold text-blue-600 uppercase">Selected</span>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>

                    {/* Selected Strategy Details */}
                    {selectedResult && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Team Preview</h2>
                                <Button
                                    onClick={handleSaveTeams}
                                    disabled={saving}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Confirm & Create Teams
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Strategy:</strong> {selectedResult.strategyRationale}
                                </p>
                            </div>

                            {/* Teams Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {selectedResult.teams.map((team) => (
                                    <Card key={team.id} className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                                            <div className="flex items-center">
                                                <BarChart3 className="w-5 h-5 text-gray-400 mr-2" />
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {team.balanceScore}/100
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {team.members.map((member, memberIdx) => (
                                                <div key={memberIdx} className="border border-gray-200 rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-gray-900">
                                                            {member.displayName}
                                                        </span>
                                                        <span className="text-xs font-semibold text-blue-600 uppercase px-2 py-1 bg-blue-50 rounded">
                                                            {member.role}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        {Object.entries(member.skillSnapshot).map(([skill, score]) => (
                                                            <div key={skill} className="flex items-center">
                                                                <div className={`w-2 h-2 rounded-full ${getSkillColor(score)} mr-2`}></div>
                                                                <span className="text-gray-600 capitalize truncate">
                                                                    {skill.replace(/([A-Z])/g, ' $1').trim()}:
                                                                </span>
                                                                <span className="ml-1 font-semibold">{score}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-xs text-gray-500">{team.aiRationale}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {selectedResult.unassignedStudents.length > 0 && (
                                <Card className="p-6 bg-yellow-50 border-yellow-200">
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                        Unassigned Students ({selectedResult.unassignedStudents.length})
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        These students will not be assigned to teams (not enough for complete team):
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedResult.unassignedStudents.map(student => (
                                            <span key={student.uid} className="px-3 py-1 bg-white border border-yellow-300 rounded-full text-sm">
                                                {student.displayName}
                                            </span>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamFormationPage;
