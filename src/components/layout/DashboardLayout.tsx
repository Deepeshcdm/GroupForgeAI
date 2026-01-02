import { ReactNode } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts';
import { AlertCircle } from 'lucide-react';

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { currentUser, userProfile, loading } = useAuth();
    const location = useLocation();
    const isProfilePage = location.pathname === '/profile';
    const showProfileBanner = !userProfile?.profileCompleted && !isProfilePage;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <main className="ml-64">
                {/* Profile Completion Banner */}
                {showProfileBanner && (
                    <div className="bg-yellow-50 border-b border-yellow-200 px-8 py-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm text-yellow-800">
                                    <strong>Complete your profile</strong> to access all features and team formation capabilities.
                                </p>
                            </div>
                            <Link
                                to="/profile"
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                            >
                                Complete Profile
                            </Link>
                        </div>
                    </div>
                )}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
