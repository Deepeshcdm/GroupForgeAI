// Authentication context and hooks
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User as FirebaseUser,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '../config/firebase';
import { User, UserRole } from '../types';
import { incrementUserCount } from '../services/metaService';

interface AuthContextType {
    currentUser: FirebaseUser | null;
    userProfile: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>; signInWithGitHub: () => Promise<void>; signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, role: UserRole, displayName: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from Firestore
    async function fetchUserProfile(uid: string): Promise<User | null> {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return userDoc.data() as User;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    }

    // Create initial user profile in Firestore
    async function createUserProfile(
        user: FirebaseUser,
        role: UserRole,
        displayName: string
    ): Promise<void> {
        const now = new Date();
        const baseProfile: Partial<User> = {
            uid: user.uid,
            email: user.email || '',
            displayName: displayName || user.displayName || 'User',
            role,
            institutionId: '', // Set during onboarding
            profileCompleted: false, // New users need to complete their profile
            createdAt: now,
            updatedAt: now,
        };

        // Only add photoURL if it exists (Firebase doesn't accept undefined)
        if (user.photoURL) {
            baseProfile.photoURL = user.photoURL;
        }

        let profile: any;

        if (role === 'student') {
            profile = {
                ...baseProfile,
                skills: {
                    leadership: { score: 0, confidence: 'low', assessmentCount: 0 },
                    analyticalThinking: { score: 0, confidence: 'low', assessmentCount: 0 },
                    creativity: { score: 0, confidence: 'low', assessmentCount: 0 },
                    executionStrength: { score: 0, confidence: 'low', assessmentCount: 0 },
                    communication: { score: 0, confidence: 'low', assessmentCount: 0 },
                    teamwork: { score: 0, confidence: 'low', assessmentCount: 0 },
                    lastAssessedAt: now,
                    overallConfidence: 'low',
                },
                assessmentHistory: [],
                githubConnected: false,
                resumeUploaded: false,
                teamAssignments: [],
            };
        } else if (role === 'faculty') {
            profile = {
                ...baseProfile,
                coursesManaged: [],
            };
        } else {
            profile = baseProfile;
        }

        await setDoc(doc(db, 'users', user.uid), profile);
    }

    // Sign in with Google
    async function signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const existingProfile = await fetchUserProfile(result.user.uid);

            if (!existingProfile) {
                // New user - redirect to role selection
                // For now, default to student
                await createUserProfile(result.user, 'student', result.user.displayName || 'User');
                // Increment user count in meta collection
                await incrementUserCount();
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    }

    // Sign in with GitHub
    async function signInWithGitHub() {
        try {
            githubProvider.addScope('read:user');
            githubProvider.addScope('user:email');
            const result = await signInWithPopup(auth, githubProvider);
            const existingProfile = await fetchUserProfile(result.user.uid);

            if (!existingProfile) {
                // New user - default to student
                await createUserProfile(result.user, 'student', result.user.displayName || 'User');
                // Increment user count in meta collection
                await incrementUserCount();
            }
        } catch (error) {
            console.error('GitHub sign-in error:', error);
            throw error;
        }
    }

    // Sign in with email/password
    async function signInWithEmail(email: string, password: string) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Email sign-in error:', error);
            throw error;
        }
    }

    // Sign up with email/password
    async function signUpWithEmail(
        email: string,
        password: string,
        role: UserRole,
        displayName: string
    ) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await createUserProfile(result.user, role, displayName);
            // Increment user count in meta collection
            await incrementUserCount();
        } catch (error) {
            console.error('Email sign-up error:', error);
            throw error;
        }
    }

    // Logout
    async function logout() {
        try {
            await signOut(auth);
            setUserProfile(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    // Reset password
    async function resetPassword(email: string) {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }

    // Refresh user profile
    async function refreshUserProfile() {
        if (currentUser) {
            const profile = await fetchUserProfile(currentUser.uid);
            setUserProfile(profile);
        }
    }

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                const profile = await fetchUserProfile(user.uid);
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value: AuthContextType = {
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        signInWithGitHub,
        signInWithEmail,
        signUpWithEmail,
        logout,
        resetPassword,
        refreshUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
