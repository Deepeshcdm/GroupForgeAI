import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    requireProfileComplete?: boolean;
}

export function ProtectedRoute({ children, requireProfileComplete = true }: ProtectedRouteProps) {
    const { currentUser, userProfile, loading } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if profile is complete (skip for /profile route)
    if (requireProfileComplete && location.pathname !== '/profile') {
        const isProfileComplete = userProfile?.profileCompleted === true;

        if (!isProfileComplete) {
            return <Navigate to="/profile" state={{ from: location }} replace />;
        }
    }

    return <>{children}</>;
}
