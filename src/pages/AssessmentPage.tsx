import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody, CardHeader, Button } from '../components/ui';
import { useAuth } from '../contexts';
import { generateWithGroq } from '../config/groq';
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { StudentProfile } from '../types';
import {
    Brain,
    ArrowRight,
    Clock,
    CheckCircle2,
    Loader2,
    Trophy,
    Target,
    AlertCircle,
    RefreshCw
} from 'lucide-react';

interface MCQQuestion {
    id: string;
    skill: string;
    difficulty: 'easy' | 'medium' | 'hard';
    question: string;
    options: string[];
    correctAnswer: number; // Index of correct option (0-3)
    explanation: string;
}

// Default fallback questions for common skills
const DEFAULT_QUESTIONS: Record<string, MCQQuestion[]> = {
    'JavaScript': [
        { id: 'js1', skill: 'JavaScript', difficulty: 'easy', question: 'Which keyword is used to declare a constant in JavaScript?', options: ['var', 'let', 'const', 'define'], correctAnswer: 2, explanation: 'The "const" keyword is used to declare constants that cannot be reassigned.' },
        { id: 'js2', skill: 'JavaScript', difficulty: 'medium', question: 'What does "===" operator check in JavaScript?', options: ['Only value', 'Only type', 'Both value and type', 'Neither'], correctAnswer: 2, explanation: 'The strict equality operator (===) checks both value and type without type coercion.' },
        { id: 'js3', skill: 'JavaScript', difficulty: 'hard', question: 'What will console.log(typeof null) output?', options: ['null', 'undefined', 'object', 'boolean'], correctAnswer: 2, explanation: 'Due to a historical bug in JavaScript, typeof null returns "object".' },
    ],
    'Python': [
        { id: 'py1', skill: 'Python', difficulty: 'easy', question: 'Which of the following is used to define a function in Python?', options: ['function', 'def', 'func', 'define'], correctAnswer: 1, explanation: 'The "def" keyword is used to define functions in Python.' },
        { id: 'py2', skill: 'Python', difficulty: 'medium', question: 'What is the output of list("hello")?', options: ['hello', '["hello"]', '["h", "e", "l", "l", "o"]', 'Error'], correctAnswer: 2, explanation: 'list() converts a string into a list of individual characters.' },
        { id: 'py3', skill: 'Python', difficulty: 'hard', question: 'What is the difference between a list and a tuple?', options: ['Lists are faster', 'Tuples are mutable', 'Lists are mutable, tuples are immutable', 'No difference'], correctAnswer: 2, explanation: 'Lists are mutable (can be changed), while tuples are immutable (cannot be changed after creation).' },
    ],
    'React': [
        { id: 'react1', skill: 'React', difficulty: 'easy', question: 'What hook is used to manage state in a functional component?', options: ['useEffect', 'useState', 'useContext', 'useReducer'], correctAnswer: 1, explanation: 'useState is the primary hook for managing local state in functional components.' },
        { id: 'react2', skill: 'React', difficulty: 'medium', question: 'When does useEffect run by default?', options: ['Only on mount', 'Only on update', 'After every render', 'Never'], correctAnswer: 2, explanation: 'By default, useEffect runs after every render unless you provide a dependency array.' },
        { id: 'react3', skill: 'React', difficulty: 'hard', question: 'What is the purpose of React.memo()?', options: ['To memorize state', 'To prevent unnecessary re-renders', 'To create refs', 'To handle errors'], correctAnswer: 1, explanation: 'React.memo is a higher-order component that memoizes the result to prevent unnecessary re-renders when props haven\'t changed.' },
    ],
    'TypeScript': [
        { id: 'ts1', skill: 'TypeScript', difficulty: 'easy', question: 'How do you define a variable with a specific type in TypeScript?', options: ['let x = number', 'let x: number', 'let number x', 'number let x'], correctAnswer: 1, explanation: 'TypeScript uses colon syntax to define types: let variableName: type.' },
        { id: 'ts2', skill: 'TypeScript', difficulty: 'medium', question: 'What is the difference between "interface" and "type" in TypeScript?', options: ['No difference', 'Interfaces can be extended, types cannot', 'Types can use unions, interfaces cannot easily', 'Interfaces are for objects only'], correctAnswer: 2, explanation: 'While similar, types can easily create unions and intersections, while interfaces are better for object shapes and can be extended.' },
        { id: 'ts3', skill: 'TypeScript', difficulty: 'hard', question: 'What does the "keyof" operator do?', options: ['Gets all keys of an object', 'Creates a union type of all keys', 'Checks if a key exists', 'Removes a key'], correctAnswer: 1, explanation: 'keyof creates a union type consisting of all the property names (keys) of a given type.' },
    ],
    'HTML': [
        { id: 'html1', skill: 'HTML', difficulty: 'easy', question: 'Which tag is used for the largest heading?', options: ['<heading>', '<h6>', '<h1>', '<head>'], correctAnswer: 2, explanation: '<h1> is the largest heading tag, ranging from <h1> (largest) to <h6> (smallest).' },
        { id: 'html2', skill: 'HTML', difficulty: 'medium', question: 'What is the purpose of the "alt" attribute in <img> tags?', options: ['To add a link', 'To provide alternative text for accessibility', 'To set image size', 'To add animation'], correctAnswer: 1, explanation: 'The alt attribute provides alternative text that describes the image for screen readers and when images fail to load.' },
        { id: 'html3', skill: 'HTML', difficulty: 'hard', question: 'What is the difference between <section> and <div>?', options: ['No difference', '<section> is semantic, <div> is not', '<div> is newer', '<section> cannot have classes'], correctAnswer: 1, explanation: '<section> is a semantic HTML5 element that represents a standalone section, while <div> is a generic container with no semantic meaning.' },
    ],
    'CSS': [
        { id: 'css1', skill: 'CSS', difficulty: 'easy', question: 'Which property is used to change text color?', options: ['text-color', 'font-color', 'color', 'foreground'], correctAnswer: 2, explanation: 'The "color" property is used to set the text color in CSS.' },
        { id: 'css2', skill: 'CSS', difficulty: 'medium', question: 'What does "display: flex" do?', options: ['Makes element invisible', 'Creates a flexible container', 'Adds animation', 'Changes font'], correctAnswer: 1, explanation: 'display: flex creates a flex container, enabling flexbox layout for its children.' },
        { id: 'css3', skill: 'CSS', difficulty: 'hard', question: 'What is the specificity order from lowest to highest?', options: ['ID, Class, Element', 'Element, Class, ID', 'Class, ID, Element', 'Element, ID, Class'], correctAnswer: 1, explanation: 'Specificity order: Element selectors (lowest), Class selectors, ID selectors (highest). Inline styles override all.' },
    ],
    'Node.js': [
        { id: 'node1', skill: 'Node.js', difficulty: 'easy', question: 'What is Node.js?', options: ['A browser', 'A JavaScript runtime', 'A database', 'A CSS framework'], correctAnswer: 1, explanation: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine that runs JavaScript outside the browser.' },
        { id: 'node2', skill: 'Node.js', difficulty: 'medium', question: 'What is npm?', options: ['A programming language', 'Node Package Manager', 'A database', 'A text editor'], correctAnswer: 1, explanation: 'npm (Node Package Manager) is the default package manager for Node.js.' },
        { id: 'node3', skill: 'Node.js', difficulty: 'hard', question: 'What is the Event Loop in Node.js?', options: ['A for loop', 'A mechanism for handling async operations', 'A type of array', 'A debugging tool'], correctAnswer: 1, explanation: 'The Event Loop is a mechanism that allows Node.js to perform non-blocking I/O operations despite JavaScript being single-threaded.' },
    ],
    'Git': [
        { id: 'git1', skill: 'Git', difficulty: 'easy', question: 'Which command is used to create a new Git repository?', options: ['git new', 'git create', 'git init', 'git start'], correctAnswer: 2, explanation: 'git init initializes a new Git repository in the current directory.' },
        { id: 'git2', skill: 'Git', difficulty: 'medium', question: 'What does "git pull" do?', options: ['Uploads changes', 'Downloads and merges changes', 'Creates a branch', 'Deletes files'], correctAnswer: 1, explanation: 'git pull fetches changes from a remote repository and merges them into your current branch.' },
        { id: 'git3', skill: 'Git', difficulty: 'hard', question: 'What is the difference between "git merge" and "git rebase"?', options: ['No difference', 'Merge creates a commit, rebase rewrites history', 'Rebase is faster', 'Merge deletes branches'], correctAnswer: 1, explanation: 'Merge creates a new commit combining branches, while rebase rewrites commit history by moving commits to a new base.' },
    ],
    'SQL': [
        { id: 'sql1', skill: 'SQL', difficulty: 'easy', question: 'Which SQL statement is used to retrieve data?', options: ['GET', 'FETCH', 'SELECT', 'RETRIEVE'], correctAnswer: 2, explanation: 'SELECT is used to query and retrieve data from a database.' },
        { id: 'sql2', skill: 'SQL', difficulty: 'medium', question: 'What does JOIN do in SQL?', options: ['Deletes tables', 'Combines rows from multiple tables', 'Creates indexes', 'Backs up data'], correctAnswer: 1, explanation: 'JOIN combines rows from two or more tables based on a related column.' },
        { id: 'sql3', skill: 'SQL', difficulty: 'hard', question: 'What is the difference between WHERE and HAVING?', options: ['No difference', 'WHERE filters rows, HAVING filters groups', 'HAVING is faster', 'WHERE works with NULL'], correctAnswer: 1, explanation: 'WHERE filters individual rows before grouping, while HAVING filters groups after GROUP BY.' },
    ],
    'Docker': [
        { id: 'docker1', skill: 'Docker', difficulty: 'easy', question: 'What is Docker?', options: ['A programming language', 'A containerization platform', 'A database', 'An IDE'], correctAnswer: 1, explanation: 'Docker is a platform for developing, shipping, and running applications in containers.' },
        { id: 'docker2', skill: 'Docker', difficulty: 'medium', question: 'What is a Dockerfile?', options: ['A log file', 'A script to build Docker images', 'A container', 'A network config'], correctAnswer: 1, explanation: 'A Dockerfile is a text file containing instructions to build a Docker image.' },
        { id: 'docker3', skill: 'Docker', difficulty: 'hard', question: 'What is the difference between an image and a container?', options: ['No difference', 'Image is a template, container is a running instance', 'Container is larger', 'Image runs faster'], correctAnswer: 1, explanation: 'An image is a read-only template, while a container is a running instance of an image.' },
    ],
};

// Generic fallback questions for skills not in the default list
const GENERIC_QUESTIONS: MCQQuestion[] = [
    { id: 'gen1', skill: 'General', difficulty: 'easy', question: 'What is the primary purpose of version control systems?', options: ['To write code faster', 'To track and manage changes to code', 'To compile code', 'To design UIs'], correctAnswer: 1, explanation: 'Version control systems like Git help track changes, collaborate with others, and maintain code history.' },
    { id: 'gen2', skill: 'General', difficulty: 'medium', question: 'What does API stand for?', options: ['Application Programming Interface', 'Advanced Program Integration', 'Automated Processing Input', 'Application Process Interaction'], correctAnswer: 0, explanation: 'API stands for Application Programming Interface - a set of protocols for building software applications.' },
    { id: 'gen3', skill: 'General', difficulty: 'medium', question: 'What is the purpose of debugging?', options: ['Writing new features', 'Finding and fixing errors in code', 'Deploying applications', 'Creating documentation'], correctAnswer: 1, explanation: 'Debugging is the process of identifying and removing errors (bugs) from software.' },
    { id: 'gen4', skill: 'General', difficulty: 'hard', question: 'What is Big O notation used for?', options: ['Naming variables', 'Describing algorithm complexity', 'Writing comments', 'Creating loops'], correctAnswer: 1, explanation: 'Big O notation describes the performance or complexity of an algorithm, particularly worst-case scenarios.' },
    { id: 'gen5', skill: 'General', difficulty: 'easy', question: 'What is a variable in programming?', options: ['A fixed value', 'A container for storing data', 'A type of loop', 'A function'], correctAnswer: 1, explanation: 'A variable is a named container that stores data which can be changed during program execution.' },
];

function getDefaultQuestions(skills: string[], count: number): MCQQuestion[] {
    const questions: MCQQuestion[] = [];
    const questionsPerSkill = Math.ceil(count / skills.length);
    
    skills.forEach((skill) => {
        // Find matching skill questions (case-insensitive)
        const skillKey = Object.keys(DEFAULT_QUESTIONS).find(
            key => key.toLowerCase() === skill.toLowerCase()
        );
        
        const skillQuestions = skillKey 
            ? DEFAULT_QUESTIONS[skillKey] 
            : GENERIC_QUESTIONS.map(q => ({ ...q, skill }));
        
        // Add questions for this skill
        for (let i = 0; i < questionsPerSkill && questions.length < count; i++) {
            const q = skillQuestions[i % skillQuestions.length];
            questions.push({
                ...q,
                id: `q${questions.length + 1}`,
                skill: skill,
            });
        }
    });
    
    // Shuffle questions
    return questions.sort(() => Math.random() - 0.5).slice(0, count);
}

interface QuizSession {
    id: string;
    userId: string;
    skills: string[];
    questions: MCQQuestion[];
    answers: number[]; // User's selected answers (indices)
    currentIndex: number;
    score: number;
    startedAt: Date;
    completedAt?: Date;
    status: 'active' | 'completed';
}

interface QuizResults {
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    skillBreakdown: { skill: string; correct: number; total: number; percentage: number }[];
    recommendations: string[];
}

export function AssessmentPage() {
    const { currentUser, userProfile } = useAuth();
    const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [questionCount, setQuestionCount] = useState(10);

    const studentProfile = userProfile as StudentProfile | null;
    const userSkills = studentProfile?.userSkills || [];
    const userTools = studentProfile?.tools || [];
    const allSkillsAndTools = [...userSkills.map(s => s.name), ...userTools];

    useEffect(() => {
        // Pre-select all skills if available
        if (allSkillsAndTools.length > 0 && selectedSkills.length === 0) {
            setSelectedSkills(allSkillsAndTools.slice(0, 5)); // Select first 5 by default
        }
    }, [allSkillsAndTools]);

    const toggleSkillSelection = (skill: string) => {
        setSelectedSkills(prev => 
            prev.includes(skill) 
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const generateQuizQuestions = async (): Promise<MCQQuestion[]> => {
        const skillLevels = userSkills.reduce((acc, skill) => {
            acc[skill.name] = skill.level;
            return acc;
        }, {} as Record<string, string>);

        const prompt = `You are an expert quiz generator. Create ${questionCount} multiple choice questions to test knowledge on the following skills/technologies:

Skills/Technologies to test: ${selectedSkills.join(', ')}

User's skill levels (for reference):
${JSON.stringify(skillLevels, null, 2)}

IMPORTANT REQUIREMENTS:
1. Each question MUST have exactly 4 options
2. Questions should test practical knowledge, not just definitions
3. Mix easy, medium, and hard questions based on user's skill levels
4. Cover different aspects of each skill/technology
5. Make wrong options plausible but clearly incorrect to experts
6. Include code snippets or practical scenarios where appropriate

Return a JSON array with this EXACT structure:
[
  {
    "id": "q1",
    "skill": "JavaScript",
    "difficulty": "medium",
    "question": "What will console.log(typeof null) output in JavaScript?",
    "options": ["null", "undefined", "object", "string"],
    "correctAnswer": 2,
    "explanation": "In JavaScript, typeof null returns 'object' due to a historical bug that was never fixed for backwards compatibility."
  }
]

Generate exactly ${questionCount} questions covering the selected skills evenly.
Return ONLY the JSON array, no other text.`;

        try {
            const text = await generateWithGroq(prompt, {
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                maxTokens: 4096,
            });
            
            // Try to extract JSON array
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const questions = JSON.parse(jsonMatch[0]);
                // Validate questions
                const validQuestions = questions.filter((q: MCQQuestion) => 
                    q.question && 
                    q.options && 
                    q.options.length === 4 &&
                    typeof q.correctAnswer === 'number' &&
                    q.correctAnswer >= 0 && 
                    q.correctAnswer <= 3
                );
                
                if (validQuestions.length > 0) {
                    return validQuestions;
                }
            }
            // If parsing fails, fall back to default questions
            console.warn('Failed to parse AI questions, using defaults');
            return getDefaultQuestions(selectedSkills, questionCount);
        } catch (err) {
            console.error('Error generating questions, using fallback:', err);
            // Return default questions on any error
            return getDefaultQuestions(selectedSkills, questionCount);
        }
    };

    const startQuiz = async () => {
        if (selectedSkills.length === 0) {
            setError('Please select at least one skill to be tested on');
            return;
        }

        setError('');
        setIsGenerating(true);

        try {
            const questions = await generateQuizQuestions();
            
            if (questions.length === 0) {
                throw new Error('No valid questions generated');
            }

            const session: QuizSession = {
                id: `quiz_${Date.now()}`,
                userId: currentUser?.uid || '',
                skills: selectedSkills,
                questions,
                answers: [],
                currentIndex: 0,
                score: 0,
                startedAt: new Date(),
                status: 'active',
            };

            setQuizSession(session);

            // Save to Firestore
            await setDoc(doc(db, 'quizzes', session.id), {
                ...session,
                startedAt: new Date().toISOString(),
            });
        } catch (err: any) {
            setError(err.message || 'Failed to generate quiz. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const submitAnswer = async () => {
        if (!quizSession || selectedAnswer === null) return;

        const currentQuestion = quizSession.questions[quizSession.currentIndex];
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

        const updatedSession: QuizSession = {
            ...quizSession,
            answers: [...quizSession.answers, selectedAnswer],
            score: isCorrect ? quizSession.score + 1 : quizSession.score,
        };

        setQuizSession(updatedSession);
        setShowResult(true);

        // Update in Firestore
        await updateDoc(doc(db, 'quizzes', quizSession.id), {
            answers: updatedSession.answers,
            score: updatedSession.score,
        });
    };

    const nextQuestion = () => {
        if (!quizSession) return;

        if (quizSession.currentIndex >= quizSession.questions.length - 1) {
            // Quiz complete
            completeQuiz();
        } else {
            setQuizSession({
                ...quizSession,
                currentIndex: quizSession.currentIndex + 1,
            });
            setSelectedAnswer(null);
            setShowResult(false);
        }
    };

    const completeQuiz = async () => {
        if (!quizSession || !currentUser) return;

        setIsLoading(true);

        // Calculate results
        const skillBreakdown: { skill: string; correct: number; total: number; percentage: number }[] = [];
        const skillStats: Record<string, { correct: number; total: number }> = {};

        quizSession.questions.forEach((q, i) => {
            if (!skillStats[q.skill]) {
                skillStats[q.skill] = { correct: 0, total: 0 };
            }
            skillStats[q.skill].total++;
            if (quizSession.answers[i] === q.correctAnswer) {
                skillStats[q.skill].correct++;
            }
        });

        Object.entries(skillStats).forEach(([skill, stats]) => {
            skillBreakdown.push({
                skill,
                correct: stats.correct,
                total: stats.total,
                percentage: Math.round((stats.correct / stats.total) * 100),
            });
        });

        const results: QuizResults = {
            totalQuestions: quizSession.questions.length,
            correctAnswers: quizSession.score,
            score: Math.round((quizSession.score / quizSession.questions.length) * 100),
            skillBreakdown,
            recommendations: generateRecommendations(skillBreakdown),
        };

        setQuizResults(results);

        // Update quiz in Firestore
        await updateDoc(doc(db, 'quizzes', quizSession.id), {
            status: 'completed',
            completedAt: new Date().toISOString(),
            results,
        });

        // Update user's assessment history
        await updateDoc(doc(db, 'users', currentUser.uid), {
            assessmentHistory: arrayUnion({
                id: quizSession.id,
                type: 'skill_quiz',
                startedAt: quizSession.startedAt,
                completedAt: new Date(),
                status: 'completed',
                score: results.score,
                skills: quizSession.skills,
            }),
        });

        setQuizSession({
            ...quizSession,
            status: 'completed',
            completedAt: new Date(),
        });

        setIsLoading(false);
    };

    const generateRecommendations = (breakdown: QuizResults['skillBreakdown']): string[] => {
        const recommendations: string[] = [];
        
        breakdown.forEach(skill => {
            if (skill.percentage < 50) {
                recommendations.push(`Consider reviewing fundamentals of ${skill.skill}`);
            } else if (skill.percentage < 75) {
                recommendations.push(`Practice more advanced concepts in ${skill.skill}`);
            }
        });

        if (recommendations.length === 0) {
            recommendations.push('Excellent performance! Consider exploring advanced topics.');
        }

        return recommendations;
    };

    const resetQuiz = () => {
        setQuizSession(null);
        setSelectedAnswer(null);
        setShowResult(false);
        setQuizResults(null);
        setError('');
    };

    // No skills in profile
    if (allSkillsAndTools.length === 0) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardBody className="py-16 text-center">
                            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Skills Found</h2>
                            <p className="text-gray-500 mb-6">
                                Please add skills and tools to your profile first to take a skill assessment quiz.
                            </p>
                            <Button onClick={() => window.location.href = '/profile'}>
                                Go to Profile
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    // Quiz completed - show results
    if (quizSession?.status === 'completed' && quizResults) {
        return (
            <DashboardLayout>
                <div className="max-w-3xl mx-auto space-y-6">
                    <Card>
                        <CardBody className="py-8 text-center">
                            <Trophy className={`w-20 h-20 mx-auto mb-4 ${
                                quizResults.score >= 80 ? 'text-yellow-500' :
                                quizResults.score >= 60 ? 'text-blue-500' :
                                'text-gray-400'
                            }`} />
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
                            <p className="text-gray-500 mb-6">Here's how you performed</p>
                            
                            <div className="flex justify-center gap-8 mb-8">
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-primary-600">{quizResults.score}%</p>
                                    <p className="text-sm text-gray-500">Overall Score</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-gray-900">
                                        {quizResults.correctAnswers}/{quizResults.totalQuestions}
                                    </p>
                                    <p className="text-sm text-gray-500">Correct Answers</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Skill Breakdown */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900">Skill Breakdown</h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {quizResults.skillBreakdown.map(skill => (
                                    <div key={skill.skill}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">{skill.skill}</span>
                                            <span className="text-gray-500">
                                                {skill.correct}/{skill.total} ({skill.percentage}%)
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all ${
                                                    skill.percentage >= 80 ? 'bg-green-500' :
                                                    skill.percentage >= 60 ? 'bg-blue-500' :
                                                    skill.percentage >= 40 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${skill.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-gray-900">Recommendations</h2>
                        </CardHeader>
                        <CardBody>
                            <ul className="space-y-2">
                                {quizResults.recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-2 text-gray-600">
                                        <Target className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </CardBody>
                    </Card>

                    <div className="flex justify-center gap-4">
                        <Button variant="outline" onClick={resetQuiz}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Take Another Quiz
                        </Button>
                        <Button onClick={() => window.location.href = '/dashboard'}>
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Active quiz
    if (quizSession && quizSession.status === 'active') {
        const currentQuestion = quizSession.questions[quizSession.currentIndex];
        const progress = ((quizSession.currentIndex + 1) / quizSession.questions.length) * 100;

        return (
            <DashboardLayout>
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Progress */}
                    <div>
                        <div className="flex justify-between text-sm text-gray-500 mb-2">
                            <span>Question {quizSession.currentIndex + 1} of {quizSession.questions.length}</span>
                            <span>Score: {quizSession.score}/{quizSession.answers.length}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary-600 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Question Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                                    {currentQuestion.skill}
                                </span>
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                    currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                    currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {currentQuestion.difficulty}
                                </span>
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-6">
                            <h2 className="text-lg font-medium text-gray-900 whitespace-pre-wrap">
                                {currentQuestion.question}
                            </h2>

                            {/* Options */}
                            <div className="space-y-3">
                                {currentQuestion.options.map((option, index) => {
                                    const isSelected = selectedAnswer === index;
                                    const isCorrect = index === currentQuestion.correctAnswer;
                                    const showCorrectness = showResult;

                                    let optionClass = 'border-gray-200 hover:border-gray-300';
                                    if (showCorrectness) {
                                        if (isCorrect) {
                                            optionClass = 'border-green-500 bg-green-50';
                                        } else if (isSelected && !isCorrect) {
                                            optionClass = 'border-red-500 bg-red-50';
                                        }
                                    } else if (isSelected) {
                                        optionClass = 'border-primary-500 bg-primary-50';
                                    }

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => !showResult && setSelectedAnswer(index)}
                                            disabled={showResult}
                                            className={`w-full flex items-center gap-4 p-4 border-2 rounded-lg text-left transition-colors ${optionClass}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium ${
                                                showCorrectness && isCorrect ? 'border-green-500 bg-green-500 text-white' :
                                                showCorrectness && isSelected && !isCorrect ? 'border-red-500 bg-red-500 text-white' :
                                                isSelected ? 'border-primary-500 bg-primary-500 text-white' :
                                                'border-gray-300 text-gray-500'
                                            }`}>
                                                {String.fromCharCode(65 + index)}
                                            </div>
                                            <span className={`flex-1 ${
                                                showCorrectness && isCorrect ? 'text-green-700 font-medium' :
                                                showCorrectness && isSelected && !isCorrect ? 'text-red-700' :
                                                'text-gray-700'
                                            }`}>
                                                {option}
                                            </span>
                                            {showCorrectness && isCorrect && (
                                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Explanation (shown after answering) */}
                            {showResult && (
                                <div className={`p-4 rounded-lg ${
                                    selectedAnswer === currentQuestion.correctAnswer
                                        ? 'bg-green-50 border border-green-200'
                                        : 'bg-yellow-50 border border-yellow-200'
                                }`}>
                                    <p className="font-medium text-gray-900 mb-1">
                                        {selectedAnswer === currentQuestion.correctAnswer ? '✓ Correct!' : '✗ Incorrect'}
                                    </p>
                                    <p className="text-sm text-gray-600">{currentQuestion.explanation}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4">
                                {!showResult ? (
                                    <Button 
                                        onClick={submitAnswer}
                                        disabled={selectedAnswer === null}
                                    >
                                        Submit Answer
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button onClick={nextQuestion}>
                                        {quizSession.currentIndex >= quizSession.questions.length - 1 
                                            ? 'Finish Quiz' 
                                            : 'Next Question'}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    // Quiz setup screen
    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Skill Assessment Quiz</h1>
                    <p className="text-gray-500 mt-1">
                        Test your knowledge with AI-generated questions based on your skills
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Select Skills */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-primary-600" />
                            Select Skills to Test
                        </h2>
                    </CardHeader>
                    <CardBody>
                        <p className="text-sm text-gray-500 mb-4">
                            Choose which skills and tools you want to be tested on (select up to 5)
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {allSkillsAndTools.map(skill => {
                                const isSelected = selectedSkills.includes(skill);
                                const userSkill = userSkills.find(s => s.name === skill);
                                
                                return (
                                    <button
                                        key={skill}
                                        onClick={() => toggleSkillSelection(skill)}
                                        disabled={!isSelected && selectedSkills.length >= 5}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                            isSelected 
                                                ? 'bg-primary-600 text-white' 
                                                : selectedSkills.length >= 5
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {skill}
                                        {userSkill && (
                                            <span className="ml-1 opacity-70">
                                                ({userSkill.level.charAt(0).toUpperCase()})
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedSkills.length === 0 && (
                            <p className="text-sm text-red-500 mt-2">Please select at least one skill</p>
                        )}
                    </CardBody>
                </Card>

                {/* Quiz Settings */}
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary-600" />
                            Quiz Settings
                        </h2>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Questions
                                </label>
                                <select
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value={5}>5 Questions (~5 min)</option>
                                    <option value={10}>10 Questions (~10 min)</option>
                                    <option value={15}>15 Questions (~15 min)</option>
                                    <option value={20}>20 Questions (~20 min)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Selected Skills
                                </label>
                                <p className="text-gray-600 py-2">
                                    {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Start Quiz */}
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                        Questions are generated by AI based on your skill levels
                    </p>
                    <Button 
                        onClick={startQuiz} 
                        size="lg"
                        disabled={selectedSkills.length === 0 || isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Generating Quiz...
                            </>
                        ) : (
                            <>
                                Start Quiz
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </Button>
                </div>

                {isGenerating && (
                    <Card>
                        <CardBody className="py-12 text-center">
                            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Your Quiz</h3>
                            <p className="text-gray-500">
                                Our AI is creating personalized questions based on your skills...
                            </p>
                        </CardBody>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
