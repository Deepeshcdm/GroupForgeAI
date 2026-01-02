import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import {
    Home,
    ClipboardCheck,
    Users,
    Settings,
    LogOut,
    BookOpen,
    BarChart3,
    User,
    Lock
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function Sidebar() {
    const { userProfile, logout } = useAuth();
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
        { to: '/courses', icon: BookOpen, label: 'Courses', requiresProfile: true },
        { to: '/teams', icon: Users, label: 'Team Formation', requiresProfile: true },
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
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <Link to="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900">GroupForge</h1>
                        <p className="text-xs text-gray-500">AI Team Formation</p>
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
                                <Lock className="w-5 h-5 text-gray-400" />
                                <span className="font-medium text-gray-400">{link.label}</span>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {userProfile?.photoURL ? (
                            <img
                                src={userProfile.photoURL}
                                alt={userProfile.displayName}
                                className="w-10 h-10 rounded-full"
                            />
                        ) : (
                            <User className="w-5 h-5 text-gray-500" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {userProfile?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                            {userProfile?.role || 'student'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign out</span>
                </button>
            </div>
        </aside>
    );
}
