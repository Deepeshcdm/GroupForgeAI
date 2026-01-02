import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AssessmentProvider } from './contexts';
import { ProtectedRoute } from './components/layout';
import {
    LandingPage,
    LoginPage,
    SignupPage,
    ForgotPasswordPage,
    DashboardPage,
    AssessmentPage,
    ProfilePage,
    MyTeamsPage,
    TeamFormationPage
} from './pages';
import './index.css';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AssessmentProvider>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                        {/* Profile route - protected but doesn't require complete profile */}
                        <Route path="/profile" element={
                            <ProtectedRoute requireProfileComplete={false}>
                                <ProfilePage />
                            </ProtectedRoute>
                        } />

                        {/* Protected routes - require complete profile */}
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/assessment" element={
                            <ProtectedRoute>
                                <AssessmentPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/my-teams" element={
                            <ProtectedRoute>
                                <MyTeamsPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/team-formation" element={
                            <ProtectedRoute>
                                <TeamFormationPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/analytics" element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        } />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AssessmentProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
