import { Link, useLocation } from 'react-router-dom';
import { useAuth, useTheme } from '../../contexts';
import {
    Home,
    ClipboardCheck,
    Users,
    Settings,
    LogOut,
    BookOpen,
    BarChart3,
    User,
    Lock,
    Moon,
    Sun
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function Sidebar() {
    const { userProfile, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const isProfileComplete = userProfile?.profileCompleted === true;

    const studentLinks = [
        { to: '/dashboard', icon: Home, label: 'Dashboard', requiresProfile: true },
        { to: '/assessment', icon: ClipboardCheck, label: 'Assessment', requiresProfile: true },
        { to: '/my-teams', icon: Users, label: 'My Teams', requiresProfile: true },
        { to: '/profile', icon: User, label: 'Profile', requiresProfile: false },
    ];

    const facultyLinks = [
        { to: '/dashboard', icon: Home, label: 'Dashboard', requiresProfile: true },
        { to: '/team-formation', icon: Users, label: 'Team Formation', requiresProfile: true },
        { to: '/analytics', icon: BarChart3, label: 'Analytics', requiresProfile: true },
        { to: '/settings', icon: Settings, label: 'Settings', requiresProfile: true },
    ];

    const adminLinks = [
        { to: '/dashboard', icon: Home, label: 'Dashboard', requiresProfile: true },
        { to: '/institutions', icon: BookOpen, label: 'Institutions', requiresProfile: true },
        { to: '/users', icon: Users, label: 'Users', requiresProfile: true },
        { to: '/analytics', icon: BarChart3, label: 'Analytics', requiresProfile: true },
        { to: '/settings', icon: Settings, label: 'Settings', requiresProfile: true },
    ];

    const links = userProfile?.role === 'faculty'
        ? facultyLinks
        : userProfile?.role === 'admin'
            ? adminLinks
            : studentLinks;

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800/50 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800/50">
                <Link to="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 dark:text-white">GroupForge</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">AI Team Formation</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.to;
                    const isLocked = link.requiresProfile && !isProfileComplete;

                    if (isLocked) {
                        return (
                            <div
                                key={link.to}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg opacity-50 cursor-not-allowed"
                                title="Complete your profile to access this section"
                            >
                                <Lock className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                                <span className="font-medium text-gray-400 dark:text-gray-600">{link.label}</span>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                                isActive
                                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70'
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800/50 space-y-3">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    {theme === 'dark' ? (
                        <>
                            <Sun className="w-4 h-4" />
                            <span className="text-sm font-medium">Light Mode</span>
                        </>
                    ) : (
                        <>
                            <Moon className="w-4 h-4" />
                            <span className="text-sm font-medium">Dark Mode</span>
                        </>
                    )}
                </button>
                
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center ring-2 ring-gray-100 dark:ring-gray-700">
                        {userProfile?.photoURL ? (
                            <img
                                src={userProfile.photoURL}
                                alt={userProfile.displayName}
                                className="w-10 h-10 rounded-full"
                            />
                        ) : (
                            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {userProfile?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {userProfile?.role || 'student'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign out</span>
                </button>
            </div>
        </aside>
    );
}
