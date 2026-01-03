import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import {
    Users,
    Brain,
    Target,
    Sparkles,
    ArrowRight,
    BarChart3,
    Shield
} from 'lucide-react';
import Squares from '../components/Squares';


export function LandingPage() {
    const features = [
        {
            icon: Brain,
            title: 'AI-Powered Assessments',
            description: 'Adaptive skill evaluations using Google Gemini that measure real abilities, not self-reported claims.',
        },
        {
            icon: Target,
            title: 'Intelligent Matching',
            description: 'Form balanced teams based on leadership, creativity, analytical thinking, and execution strength.',
        },
        {
            icon: BarChart3,
            title: 'Data-Driven Insights',
            description: 'Faculty dashboards with analytics on team composition, skill distribution, and formation quality.',
        },
        {
            icon: Shield,
            title: 'Fair & Objective',
            description: 'Eliminate bias and favoritism. Every team member is placed based on verified capabilities.',
        },
    ];

    const problems = [
        'Random or biased team formation',
        'Proxy participation and "free riders"',
        'Uneven workload distribution',
        'High-performers carrying disengaged teammates',
    ];

    return (
        <div className="relative min-h-screen">
            {/* Animated background */}
            <div className="fixed inset-0 z-0 pointer-events-auto">
                <Squares
                    speed={0.5}
                    direction="diagonal"
                    borderColor="#6a85f4ff"
                    hoverFillColor="#000000ff"
                />
            </div>

            {/* Content overlay */}
            <div className="relative z-10 min-h-screen pointer-events-none">
                <div className="pointer-events-auto">
            {/* Header */}
           
            <header className="fixed top-0 left-0 right-0 bg-white/85 backdrop-blur-md z-50 border-b border-white/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-xl text-gray-900">GroupForge AI</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login">
                                <Button variant="ghost">Sign in</Button>
                            </Link>
                            <Link to="/signup">
                                <Button>Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                     
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        Powered by Google Gemini AI
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                        Form Teams That
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600"> Actually Work</span>
                    </h1>

                    <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
                        GroupForge AI uses intelligent skill assessments to create balanced, complementary
                        student teams. No more guesswork, favoritism, or free riders.
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <Link to="/signup">
                            <Button size="lg">
                                Start Free
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg">
                            Watch Demo
                        </Button>
                    </div>

                    {/* Hero Image/Mockup placeholder */}
                    <div className="mt-16 max-w-5xl mx-auto">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 shadow-2xl">
                            <div className="bg-gray-800 rounded-lg p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                                    </div>
                                    <div className="text-gray-400 text-sm">Team Formation Dashboard</div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-gray-700/50 rounded-lg p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 bg-primary-500 rounded-full" />
                                                <div className="text-white font-medium">Team {i}</div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-2 bg-primary-500/30 rounded w-full" />
                                                <div className="h-2 bg-accent-500/30 rounded w-4/5" />
                                                <div className="h-2 bg-blue-500/30 rounded w-3/4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            The Problem with Traditional Group Formation
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Academic group projects often fail not because of the work itself,
                            but because teams are formed poorly.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {problems.map((problem, i) => (
                            <div key={i} className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-white/40">
                                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center mb-4">
                                    <span className="text-xl">✗</span>
                                </div>
                                <p className="text-gray-700 font-medium">{problem}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            How GroupForge AI Works
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Replace guesswork with intelligence, and group chaos with structured collaboration.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {features.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div key={i} className="flex gap-6 p-6 rounded-2xl hover:bg-white/60 hover:backdrop-blur-sm transition-colors">
                                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                        <p className="text-gray-600">{feature.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="py-20 px-4 bg-gray-900/80 backdrop-blur-md text-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Simple 3-Step Process</h2>
                        <p className="text-lg text-primary-200">Get started in minutes</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Students Complete Assessment', desc: 'Short, AI-powered skill evaluation across key dimensions' },
                            { step: '02', title: 'AI Analyzes & Matches', desc: 'Gemini processes skills and forms balanced, complementary teams' },
                            { step: '03', title: 'Teams Get to Work', desc: 'Students see their teams with insights on strengths and roles' },
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="text-5xl font-bold text-primary-400 mb-4">{item.step}</div>
                                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                <p className="text-primary-200">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Ready to Transform Group Work?
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Join institutions that are already using GroupForge AI to create better teams.
                    </p>
                    <Link to="/signup">
                        <Button size="lg">
                            Get Started Free
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900/85 backdrop-blur-md text-gray-400 py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-white">GroupForge AI</span>
                        </div>
                        <p className="text-sm">© 2025 GroupForge AI. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
            </div>
        </div>
    );
}
