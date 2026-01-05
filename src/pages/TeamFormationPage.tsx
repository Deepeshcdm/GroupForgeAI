import React, { useState } from 'react';
import {
    Users, Sparkles, Target, TrendingUp, AlertCircle, CheckCircle, BarChart3,
    Brain, Shield, XCircle, RefreshCw, ArrowRightLeft, Lock, Eye, CheckCircle2
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
import { DashboardLayout } from '../components/layout';
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
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header Section */}
                    <div className="bg-white dark:bg-gray-900/80 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-8 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Team Formation Studio
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                                    AI-powered team building with human oversight
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
                                    <Brain className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mode Selection Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div
                            onClick={() => { setFormationMode('algorithmic'); handleReset(); }}
                            className={`group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer transition-all duration-300 ${formationMode === 'algorithmic'
                                ? 'ring-4 ring-blue-500 scale-105'
                                : 'hover:scale-102 hover:shadow-xl'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-90"></div>
                            <div className="relative p-8 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Target className="w-8 h-8" />
                                    </div>
                                    {formationMode === 'algorithmic' && (
                                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-sm font-semibold">Active</span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Algorithmic Strategies</h3>
                                <p className="text-blue-100 text-sm leading-relaxed">
                                    Compare 3 different formation algorithms: Balanced, Complementary, and Role-Based
                                </p>
                                <div className="mt-6 flex items-center gap-2 text-sm">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Deterministic & Predictable</span>
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => { setFormationMode('ai-powered'); handleReset(); }}
                            className={`group relative overflow-hidden rounded-2xl shadow-lg cursor-pointer transition-all duration-300 ${formationMode === 'ai-powered'
                                ? 'ring-4 ring-purple-500 scale-105'
                                : 'hover:scale-102 hover:shadow-xl'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-90"></div>
                            <div className="relative p-8 text-white">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Brain className="w-8 h-8" />
                                    </div>
                                    {formationMode === 'ai-powered' && (
                                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-sm font-semibold">Active</span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold mb-2">AI-Powered Formation</h3>
                                <p className="text-purple-100 text-sm leading-relaxed">
                                    LLM-optimized team building with validation, reasoning, and faculty approval workflow
                                </p>
                                <div className="mt-6 flex items-center gap-2 text-sm">
                                    <Shield className="w-4 h-4" />
                                    <span>Validated & Approved</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configuration Panel */}
                    <Card className="p-8 shadow-lg border-0 bg-white dark:bg-gray-900/80 rounded-2xl">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Formation Settings</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Configure your team parameters</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Team Size</div>
                                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{teamSize}</div>
                                    </div>
                                    <input
                                        type="range"
                                        min="3"
                                        max="8"
                                        value={teamSize}
                                        onChange={(e) => setTeamSize(parseInt(e.target.value))}
                                        className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        disabled={loading || !!comparisonResults || !!aiResult}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                {formationMode === 'algorithmic' ? (
                                    <Button
                                        onClick={handleCompareStrategies}
                                        disabled={loading || !!comparisonResults}
                                        className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                                Analyzing Student Data...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-6 h-6 mr-3" />
                                                Generate All Strategy Comparisons
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <div className="space-y-4">
                                        <Button
                                            onClick={handleAIFormation}
                                            disabled={loading || !!aiResult}
                                            className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                                    AI is Forming Optimal Teams...
                                                </>
                                            ) : (
                                                <>
                                                    <Brain className="w-6 h-6 mr-3" />
                                                    Generate AI-Optimized Teams
                                                </>
                                            )}
                                        </Button>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                                            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                            <span>AI proposals undergo validation and require your approval before finalizing</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-2xl p-6 shadow-lg animate-in slide-in-from-top">
                            <div className="flex items-start">
                                <div className="p-2 bg-red-500 rounded-xl">
                                    <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="font-bold text-red-900 dark:text-red-300 text-lg">Error Occurred</h3>
                                    <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
                                </div>
                                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300">
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-800 rounded-2xl p-6 shadow-lg animate-in slide-in-from-top">
                            <div className="flex items-start">
                                <div className="p-2 bg-green-500 rounded-xl">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="font-bold text-green-900 dark:text-green-300 text-lg">Success!</h3>
                                    <p className="text-green-700 dark:text-green-400 mt-1">{success}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Formation Results */}
                    {aiResult && (
                        <div className="space-y-6">
                            {/* Validation Status Card */}
                            <Card className={`p-6 shadow-xl rounded-2xl border-2 ${aiResult.validation.valid
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border-green-300 dark:border-green-800'
                                : 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-800'
                                }`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${aiResult.validation.valid ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                            {aiResult.validation.valid ? (
                                                <CheckCircle className="w-7 h-7 text-white" />
                                            ) : (
                                                <AlertCircle className="w-7 h-7 text-white" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-xl">
                                                {aiResult.validation.valid ? '✓ Validation Passed' : '⚠ Validation Issues Found'}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                                                {aiResult.validation.valid
                                                    ? 'All checks passed! Review teams and approve when ready.'
                                                    : 'Some issues detected. Review details and regenerate if needed.'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">AI proposes. You decide.</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowValidation(!showValidation)}
                                        className="text-sm bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        {showValidation ? 'Hide' : 'Show'} Details
                                    </Button>
                                </div>

                                {showValidation && (
                                    <div className="mt-6 pt-6 border-t-2 border-gray-200 space-y-4">
                                        {aiResult.validation.errors.length > 0 && (
                                            <div className="bg-white dark:bg-gray-800/80 rounded-xl p-4 border-2 border-red-200 dark:border-red-800">
                                                <h4 className="text-sm font-bold text-red-800 dark:text-red-300 mb-3 flex items-center">
                                                    <XCircle className="w-5 h-5 mr-2" />
                                                    Errors ({aiResult.validation.errors.length})
                                                </h4>
                                                <ul className="space-y-2">
                                                    {aiResult.validation.errors.map((err, i) => (
                                                        <li key={i} className="flex items-start text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-2 rounded">
                                                            <span className="font-mono mr-2">#{i + 1}</span>
                                                            {err}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {aiResult.validation.warnings.length > 0 && (
                                            <div className="bg-white dark:bg-gray-800/80 rounded-xl p-4 border-2 border-yellow-200 dark:border-yellow-800">
                                                <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center">
                                                    <AlertCircle className="w-5 h-5 mr-2" />
                                                    Warnings ({aiResult.validation.warnings.length})
                                                </h4>
                                                <ul className="space-y-2">
                                                    {aiResult.validation.warnings.map((warn, i) => (
                                                        <li key={i} className="flex items-start text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded">
                                                            <span className="font-mono mr-2">#{i + 1}</span>
                                                            {warn}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {aiResult.validation.errors.length === 0 && aiResult.validation.warnings.length === 0 && (
                                            <div className="text-center py-4">
                                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                                <p className="text-green-700 dark:text-green-400 font-semibold">All validation checks passed perfectly!</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    onClick={handleApproveAITeams}
                                    disabled={saving || !aiResult.validation.valid}
                                    className="flex-1 py-4 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Saving Teams...
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
                                    className={`py-4 px-6 font-semibold border-2 ${swapMode ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-gray-300'}`}
                                >
                                    <ArrowRightLeft className="w-5 h-5 mr-2" />
                                    {swapMode ? 'Cancel Swap' : 'Swap Members'}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={handleAIFormation}
                                    disabled={loading}
                                    className="py-4 px-6 font-semibold border-2 border-gray-300"
                                >
                                    <RefreshCw className="w-5 h-5 mr-2" />
                                    Regenerate
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={handleReset}
                                    className="py-4 px-6 font-semibold text-red-600 hover:bg-red-50"
                                >
                                    <XCircle className="w-5 h-5 mr-2" />
                                    Start Over
                                </Button>
                            </div>

                            {swapMode && (
                                <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/30 border-2 border-purple-300 dark:border-purple-700 rounded-2xl p-6 shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500 rounded-lg">
                                            <ArrowRightLeft className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-purple-900 dark:text-purple-200">Swap Mode Active</p>
                                            <p className="text-sm text-purple-700 dark:text-purple-300">
                                                Click a member to select, then click another team to move them.
                                                {swapFrom && <span className="ml-2 font-semibold">• Selected from {swapFrom.teamId}</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* AI Teams Preview */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between bg-white dark:bg-gray-900/80 rounded-2xl p-6 shadow-lg">
                                    <div>
                                        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                            AI-Generated Teams
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">Review, modify, and approve your team formations</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Average Balance Score</div>
                                        <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                                            {(aiResult.teams.reduce((sum, t) => sum + t.balanceScore, 0) / aiResult.teams.length).toFixed(0)}
                                            <span className="text-2xl text-gray-400 dark:text-gray-500">/100</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {aiResult.teams.map((team, idx) => (
                                        <div
                                            key={team.id}
                                            className={`group relative rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-102 ${swapFrom?.teamId === team.id ? 'ring-4 ring-purple-500 scale-105' : ''}`}
                                        >
                                            {/* Team Header with Gradient */}
                                            <div className={`p-6 bg-gradient-to-br ${idx % 4 === 0 ? 'from-blue-500 to-blue-600' :
                                                idx % 4 === 1 ? 'from-purple-500 to-purple-600' :
                                                    idx % 4 === 2 ? 'from-pink-500 to-pink-600' :
                                                        'from-indigo-500 to-indigo-600'
                                                } text-white`}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-2xl font-bold">{team.name}</h3>
                                                        <p className="text-sm opacity-90 mt-1">{team.members.length} members</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                                                        <BarChart3 className="w-5 h-5" />
                                                        <span className="text-2xl font-bold">{team.balanceScore.toFixed(0)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Team Members */}
                                            <div className="p-6 bg-white dark:bg-gray-900/90 space-y-3">
                                                {team.members.map((member, memberIdx) => (
                                                    <div
                                                        key={memberIdx}
                                                        className={`border-2 rounded-xl p-4 transition-all ${swapMode
                                                            ? 'cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 dark:hover:from-purple-900/30 hover:to-pink-50 dark:hover:to-pink-900/20 hover:border-purple-300 dark:hover:border-purple-700'
                                                            : 'border-gray-200 dark:border-gray-700'
                                                            } ${swapFrom?.studentId === member.userId ? 'bg-purple-100 dark:bg-purple-900/50 border-purple-400 dark:border-purple-600 shadow-lg' : 'bg-gray-50 dark:bg-gray-800/50'}`}
                                                        onClick={() => swapMode && handleSwapMember(team.id, member.userId)}
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${idx % 4 === 0 ? 'bg-blue-500' :
                                                                    idx % 4 === 1 ? 'bg-purple-500' :
                                                                        idx % 4 === 2 ? 'bg-pink-500' :
                                                                            'bg-indigo-500'
                                                                    }`}>
                                                                    {member.displayName.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="font-semibold text-gray-900 dark:text-white">{member.displayName}</span>
                                                            </div>
                                                            <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                                                                {member.role}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2">
                                                            {Object.entries(member.skillSnapshot).map(([skill, score]) => (
                                                                <div key={skill} className="flex items-center justify-between bg-white dark:bg-gray-800/70 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium capitalize">
                                                                        {skill.replace(/([A-Z])/g, ' $1').trim()}
                                                                    </span>
                                                                    <div className="flex items-center gap-1">
                                                                        <div className={`w-2 h-2 rounded-full ${getSkillColor(score)}`}></div>
                                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{score}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* AI Reasoning Footer */}
                                            {team.aiRationale && (
                                                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 border-t-2 border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-start gap-2">
                                                        <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                                                        <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed">{team.aiRationale}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Algorithmic Strategy Comparison */}
                    {comparisonResults && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-900/80 rounded-2xl p-6 shadow-lg">
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                                    Strategy Comparison
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">Compare different algorithmic approaches side by side</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {(Object.keys(strategyInfo) as TeamFormationStrategy[]).map((strategy) => {
                                    const info = strategyInfo[strategy as keyof typeof strategyInfo];
                                    const result = comparisonResults[strategy];
                                    const Icon = info.icon;
                                    const isSelected = selectedStrategy === strategy;

                                    return (
                                        <div
                                            key={strategy}
                                            className={`group relative bg-white dark:bg-gray-900/80 rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 cursor-pointer ${isSelected ? 'ring-4 ring-blue-500 scale-105' : ''}`}
                                            onClick={() => handleSelectStrategy(strategy)}
                                        >
                                            {/* Strategy Header */}
                                            <div className={`p-6 bg-gradient-to-br ${info.color} text-white`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                                        <Icon className="w-8 h-8" />
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm opacity-90">Score</div>
                                                        <div className="text-3xl font-bold">{result.averageBalanceScore.toFixed(0)}</div>
                                                    </div>
                                                </div>
                                                <h3 className="text-2xl font-bold">{info.name}</h3>
                                                <p className="text-sm opacity-90 mt-1">{info.description}</p>
                                            </div>

                                            {/* Strategy Stats */}
                                            <div className="p-6 space-y-4">
                                                {/* Teams Count */}
                                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Teams</span>
                                                    </div>
                                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{result.teams.length}</span>
                                                </div>

                                                {/* Average Balance */}
                                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Balance</span>
                                                    </div>
                                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{result.averageBalanceScore.toFixed(1)}</span>
                                                </div>

                                                {/* Unassigned Students */}
                                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unassigned</span>
                                                    </div>
                                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{result.unassignedStudents.length}</span>
                                                </div>

                                                {isSelected && (
                                                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-900/30 rounded-xl border-2 border-blue-400 dark:border-blue-600 text-center">
                                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase flex items-center justify-center gap-2">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Selected
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Selected Strategy Details */}
                            {selectedResult && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between bg-white dark:bg-gray-900/80 rounded-2xl p-6 shadow-lg">
                                        <div>
                                            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                Team Preview
                                            </h2>
                                            <p className="text-gray-600 dark:text-gray-400 mt-1">Review your final team formations</p>
                                        </div>
                                        <button
                                            onClick={handleSaveTeams}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                    <span>Saving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span>Confirm & Create Teams</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-6 shadow-lg">
                                        <div className="flex items-start gap-3">
                                            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white mb-1">Strategy Rationale</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedResult.strategyRationale}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Teams Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {selectedResult.teams.map((team, idx) => (
                                            <div
                                                key={team.id}
                                                className="group relative rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-102"
                                            >
                                                {/* Team Header with Gradient */}
                                                <div className={`p-6 bg-gradient-to-br ${idx % 4 === 0 ? 'from-blue-500 to-blue-600' :
                                                    idx % 4 === 1 ? 'from-purple-500 to-purple-600' :
                                                        idx % 4 === 2 ? 'from-pink-500 to-pink-600' :
                                                            'from-indigo-500 to-indigo-600'
                                                    } text-white`}>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-2xl font-bold">{team.name}</h3>
                                                            <p className="text-sm opacity-90 mt-1">{team.members.length} members</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                                                            <BarChart3 className="w-5 h-5" />
                                                            <span className="text-2xl font-bold">{team.balanceScore}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Team Members */}
                                                <div className="p-6 bg-white dark:bg-gray-900/80 space-y-3">
                                                    {team.members.map((member, memberIdx) => (
                                                        <div
                                                            key={memberIdx}
                                                            className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50"
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${idx % 4 === 0 ? 'bg-blue-500' :
                                                                        idx % 4 === 1 ? 'bg-purple-500' :
                                                                            idx % 4 === 2 ? 'bg-pink-500' :
                                                                                'bg-indigo-500'
                                                                        }`}>
                                                                        {member.displayName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span className="font-semibold text-gray-900 dark:text-white">{member.displayName}</span>
                                                                </div>
                                                                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                                                                    {member.role}
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2">
                                                                {Object.entries(member.skillSnapshot).map(([skill, score]) => (
                                                                    <div key={skill} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium capitalize">
                                                                            {skill.replace(/([A-Z])/g, ' $1').trim()}
                                                                        </span>
                                                                        <div className="flex items-center gap-1">
                                                                            <div className={`w-2 h-2 rounded-full ${getSkillColor(score)}`}></div>
                                                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{score}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Team Rationale Footer */}
                                                {team.aiRationale && (
                                                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 border-t-2 border-gray-200 dark:border-gray-700">
                                                        <p className="text-xs text-gray-700 dark:text-gray-300 italic">{team.aiRationale}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {selectedResult.unassignedStudents.length > 0 && (
                                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/20 border-2 border-yellow-400 dark:border-yellow-700 rounded-2xl p-6 shadow-lg">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">Unassigned Students ({selectedResult.unassignedStudents.length})</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {selectedResult.unassignedStudents.map((student) => (
                                                            <div key={student.userId} className="bg-white dark:bg-gray-800/80 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
                                                                <div className="font-medium text-gray-900 dark:text-white">{student.displayName}</div>
                                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Manually assign to a team</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TeamFormationPage;
