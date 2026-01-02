import React, { useState } from 'react';
import { 
    Users, Sparkles, Target, TrendingUp, AlertCircle, CheckCircle, BarChart3, 
    Brain, Shield, XCircle, RefreshCw, ArrowRightLeft, Lock, Eye
} from 'lucide-react';
import { Button, Card } from '../components/ui';
import {
    getAllStrategiesComparison,
    saveTeamsToFirestore,
    TeamFormationStrategy
} from '../services/teamFormation';
import {
    formTeamsWithAI,
    approveAndSaveTeams,
    swapTeamMembers,
    AIFormationResult,
} from '../services/aiTeamFormation';
import { useAuth } from '../contexts/AuthContext';
import { Team } from '../types';

interface StrategyResult {
    teams: Team[];
    unassignedStudents: any[];
    averageBalanceScore: number;
    strategyRationale: string;
}

type FormationMode = 'algorithmic' | 'ai-powered';

const TeamFormationPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [teamSize, setTeamSize] = useState<number>(4);
    const [formationMode, setFormationMode] = useState<FormationMode>('algorithmic');
    const [selectedStrategy, setSelectedStrategy] = useState<TeamFormationStrategy | null>(null);
    const [comparisonResults, setComparisonResults] = useState<Record<TeamFormationStrategy, StrategyResult> | null>(null);
    const [selectedResult, setSelectedResult] = useState<StrategyResult | null>(null);
    
    // AI Formation State
    const [aiResult, setAiResult] = useState<AIFormationResult | null>(null);
    const [showValidation, setShowValidation] = useState(false);
    const [swapMode, setSwapMode] = useState(false);
    const [swapFrom, setSwapFrom] = useState<{ teamId: string; studentId: string } | null>(null);
    
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

    // AI-Powered Formation
    const handleAIFormation = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        setAiResult(null);

        try {
            const result = await formTeamsWithAI(teamSize, currentUser!.uid);
            setAiResult(result);
            
            if (!result.success) {
                setError('AI formation had validation issues. Review and approve or regenerate.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate AI team formation');
        } finally {
            setLoading(false);
        }
    };

    // Approve AI Formation
    const handleApproveAITeams = async () => {
        if (!aiResult) return;

        setSaving(true);
        setError(null);

        try {
            await approveAndSaveTeams(aiResult.job, currentUser!.uid);
            setSuccess(`Successfully created ${aiResult.teams.length} teams! Formation logged for audit.`);

            setTimeout(() => {
                setAiResult(null);
                setSuccess(null);
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to approve and save teams');
        } finally {
            setSaving(false);
        }
    };

    // Handle member swap
    const handleSwapMember = (teamId: string, studentId: string) => {
        if (!swapMode || !aiResult) return;

        if (!swapFrom) {
            setSwapFrom({ teamId, studentId });
        } else {
            // Perform swap
            try {
                const updatedTeams = swapTeamMembers(
                    aiResult.teams,
                    swapFrom.teamId,
                    teamId,
                    swapFrom.studentId,
                    'Faculty override - manual swap',
                    aiResult.job
                );
                setAiResult({
                    ...aiResult,
                    teams: updatedTeams,
                });
                setSwapFrom(null);
                setSwapMode(false);
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    // Reset all state
    const handleReset = () => {
        setComparisonResults(null);
        setSelectedResult(null);
        setSelectedStrategy(null);
        setAiResult(null);
        setSwapMode(false);
        setSwapFrom(null);
        setError(null);
        setSuccess(null);
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
                    Form your project teams using AI-powered skill matching algorithms
                </p>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                    className={`p-6 cursor-pointer transition-all ${formationMode === 'algorithmic' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
                    onClick={() => { setFormationMode('algorithmic'); handleReset(); }}
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-blue-500">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <div className="ml-4">
                            <h3 className="font-semibold text-gray-900">Algorithmic Strategies</h3>
                            <p className="text-sm text-gray-600">Compare 3 different formation algorithms</p>
                        </div>
                    </div>
                </Card>

                <Card 
                    className={`p-6 cursor-pointer transition-all ${formationMode === 'ai-powered' ? 'ring-2 ring-purple-500' : 'hover:shadow-md'}`}
                    onClick={() => { setFormationMode('ai-powered'); handleReset(); }}
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-purple-500">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div className="ml-4">
                            <h3 className="font-semibold text-gray-900">AI-Powered Formation</h3>
                            <p className="text-sm text-gray-600">LLM-optimized with validation & approval</p>
                        </div>
                    </div>
                </Card>
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
                            disabled={loading || !!comparisonResults || !!aiResult}
                        />
                    </div>

                    {formationMode === 'algorithmic' ? (
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
                    ) : (
                        <div className="space-y-3">
                            <Button
                                onClick={handleAIFormation}
                                disabled={loading || !!aiResult}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        AI is Forming Teams...
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-5 h-5 mr-2" />
                                        Generate AI-Optimized Teams
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-gray-500 flex items-center">
                                <Shield className="w-4 h-4 mr-1" />
                                AI proposals are validated and require faculty approval before saving
                            </p>
                        </div>
                    )}
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

            {/* AI Formation Results */}
            {aiResult && (
                <div className="space-y-6">
                    {/* Validation Status */}
                    <Card className={`p-6 ${aiResult.validation.valid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-start">
                                {aiResult.validation.valid ? (
                                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                                ) : (
                                    <AlertCircle className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" />
                                )}
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        {aiResult.validation.valid ? 'Validation Passed' : 'Validation Issues Found'}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        AI proposes. You decide. Review and approve when ready.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => setShowValidation(!showValidation)}
                                className="text-sm"
                            >
                                <Eye className="w-4 h-4 mr-1" />
                                {showValidation ? 'Hide' : 'Show'} Details
                            </Button>
                        </div>

                        {showValidation && (
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                                {aiResult.validation.errors.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-red-700 mb-2">Errors:</h4>
                                        <ul className="text-sm text-red-600 space-y-1">
                                            {aiResult.validation.errors.map((err, i) => (
                                                <li key={i} className="flex items-start">
                                                    <XCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                                                    {err}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {aiResult.validation.warnings.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-yellow-700 mb-2">Warnings:</h4>
                                        <ul className="text-sm text-yellow-600 space-y-1">
                                            {aiResult.validation.warnings.map((warn, i) => (
                                                <li key={i} className="flex items-start">
                                                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                                                    {warn}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {aiResult.validation.errors.length === 0 && aiResult.validation.warnings.length === 0 && (
                                    <p className="text-sm text-green-600">All validation checks passed!</p>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4">
                        <Button
                            onClick={handleApproveAITeams}
                            disabled={saving || !aiResult.validation.valid}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5 mr-2" />
                                    Approve & Lock Teams
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setSwapMode(!swapMode)}
                            className={swapMode ? 'ring-2 ring-purple-500' : ''}
                        >
                            <ArrowRightLeft className="w-5 h-5 mr-2" />
                            {swapMode ? 'Cancel Swap' : 'Swap Members'}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleAIFormation}
                            disabled={loading}
                        >
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Regenerate
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={handleReset}
                        >
                            <XCircle className="w-5 h-5 mr-2" />
                            Start Over
                        </Button>
                    </div>

                    {swapMode && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <p className="text-sm text-purple-800">
                                <strong>Swap Mode Active:</strong> Click a member to select, then click another team to move them. 
                                {swapFrom && <span className="ml-2">Selected: Member from {swapFrom.teamId}</span>}
                            </p>
                        </div>
                    )}

                    {/* AI Teams Preview */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">AI-Generated Teams</h2>
                            <div className="text-sm text-gray-600">
                                Average Balance: <span className="font-semibold">
                                    {(aiResult.teams.reduce((sum, t) => sum + t.balanceScore, 0) / aiResult.teams.length).toFixed(1)}/100
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {aiResult.teams.map((team) => (
                                <Card key={team.id} className={`p-6 ${swapFrom?.teamId === team.id ? 'ring-2 ring-purple-500' : ''}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                                        <div className="flex items-center">
                                            <BarChart3 className="w-5 h-5 text-gray-400 mr-2" />
                                            <span className="text-sm font-semibold text-gray-700">
                                                {team.balanceScore.toFixed(0)}/100
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {team.members.map((member, memberIdx) => (
                                            <div 
                                                key={memberIdx} 
                                                className={`border border-gray-200 rounded-lg p-3 ${swapMode ? 'cursor-pointer hover:bg-gray-50' : ''} ${swapFrom?.studentId === member.userId ? 'bg-purple-100 border-purple-300' : ''}`}
                                                onClick={() => swapMode && handleSwapMember(team.id, member.userId)}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-gray-900">
                                                        {member.displayName}
                                                    </span>
                                                    <span className="text-xs font-semibold text-purple-600 uppercase px-2 py-1 bg-purple-50 rounded">
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

                                    {team.aiRationale && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-xs text-gray-500 italic">
                                                <Brain className="w-3 h-3 inline mr-1" />
                                                {team.aiRationale}
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Strategy Comparison */}
            {comparisonResults && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Compare Strategies</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(Object.keys(strategyInfo) as TeamFormationStrategy[]).map((strategy) => {
                            const info = strategyInfo[strategy as keyof typeof strategyInfo];
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
