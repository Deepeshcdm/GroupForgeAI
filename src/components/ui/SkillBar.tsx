import { cn } from '../../lib/utils';

interface SkillBarProps {
    label: string;
    score: number;
    confidence: 'low' | 'medium' | 'high';
    showValue?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function SkillBar({ label, score, confidence, showValue = true, size = 'md' }: SkillBarProps) {
    const heights = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
    };

    const getColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-blue-500';
        if (score >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const confidenceStyles = {
        low: 'opacity-60',
        medium: 'opacity-80',
        high: 'opacity-100',
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                {showValue && (
                    <span className="text-sm text-gray-500">
                        {score}
                        <span className="text-xs ml-1 text-gray-400">({confidence})</span>
                    </span>
                )}
            </div>
            <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', heights[size])}>
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500',
                        getColor(score),
                        confidenceStyles[confidence]
                    )}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}

interface SkillRadarProps {
    skills: {
        leadership: number;
        analyticalThinking: number;
        creativity: number;
        executionStrength: number;
        communication?: number;
        teamwork?: number;
    };
}

export function SkillSummaryGrid({ skills }: SkillRadarProps) {
    const skillLabels: Record<string, string> = {
        leadership: 'Leadership',
        analyticalThinking: 'Analytical',
        creativity: 'Creativity',
        executionStrength: 'Execution',
        communication: 'Communication',
        teamwork: 'Teamwork',
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            {Object.entries(skills).map(([key, value]) => (
                <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">{value}</div>
                    <div className="text-xs text-gray-500">{skillLabels[key] || key}</div>
                </div>
            ))}
        </div>
    );
}
