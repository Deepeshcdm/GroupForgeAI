import { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { DashboardLayout } from '../components/layout';
import { Card, CardBody, CardHeader, Button, Input } from '../components/ui';
import {
    Settings as SettingsIcon,
    Bell,
    Shield,
    User,
    Key,
    Save,
    AlertCircle,
    CheckCircle,
    Eye,
    EyeOff
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface NotificationSettings {
    emailNotifications: boolean;
    teamFormationAlerts: boolean;
    assessmentReminders: boolean;
    courseUpdates: boolean;
    weeklyDigest: boolean;
}

interface PrivacySettings {
    profileVisibility: 'public' | 'students' | 'private';
    showContactInfo: boolean;
    allowStudentMessages: boolean;
}

export function SettingsPage() {
    const { currentUser, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'privacy' | 'security'>('account');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Account settings
    const [displayName, setDisplayName] = useState('');
    const [contactNumber, setContactNumber] = useState('');

    // Notification settings
    const [notifications, setNotifications] = useState<NotificationSettings>({
        emailNotifications: true,
        teamFormationAlerts: true,
        assessmentReminders: true,
        courseUpdates: true,
        weeklyDigest: false
    });

    // Privacy settings
    const [privacy, setPrivacy] = useState<PrivacySettings>({
        profileVisibility: 'students',
        showContactInfo: true,
        allowStudentMessages: true
    });

    // Security settings
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || '');
            if (userProfile.role === 'faculty') {
                const facultyProfile = userProfile as any;
                setContactNumber(facultyProfile.contactNumber || '');
            }
        }
    }, [userProfile]);

    const handleSaveAccount = async () => {
        if (!currentUser) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                displayName,
                ...(userProfile?.role === 'faculty' && { contactNumber }),
                updatedAt: new Date()
            });

            setSuccess('Account settings saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save account settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotifications = async () => {
        if (!currentUser) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                notificationSettings: notifications,
                updatedAt: new Date()
            });

            setSuccess('Notification preferences saved!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save notification settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePrivacy = async () => {
        if (!currentUser) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                privacySettings: privacy,
                updatedAt: new Date()
            });

            setSuccess('Privacy settings saved!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save privacy settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentUser || !currentUser.email) return;

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Reauthenticate user
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Update password
            await updatePassword(currentUser, newPassword);

            setSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            if (err.code === 'auth/wrong-password') {
                setError('Current password is incorrect');
            } else {
                setError(err.message || 'Failed to change password');
            }
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'account' as const, label: 'Account', icon: User },
        { id: 'notifications' as const, label: 'Notifications', icon: Bell },
        { id: 'privacy' as const, label: 'Privacy', icon: Shield },
        { id: 'security' as const, label: 'Security', icon: Key }
    ];

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <SettingsIcon className="w-7 h-7 text-primary-600" />
                        Settings
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your account preferences and settings</p>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {success}
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardBody className="p-4">
                                <nav className="space-y-1">
                                    {tabs.map(tab => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id
                                                        ? 'bg-primary-50 text-primary-700 font-medium'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </nav>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Account Settings */}
                        {activeTab === 'account' && (
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                                    <p className="text-sm text-gray-500 mt-1">Update your personal information</p>
                                </CardHeader>
                                <CardBody className="p-6 space-y-4">
                                    <Input
                                        label="Full Name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Enter your full name"
                                    />
                                    <Input
                                        label="Email"
                                        value={currentUser?.email || ''}
                                        disabled
                                        helperText="Email cannot be changed"
                                    />
                                    {userProfile?.role === 'faculty' && (
                                        <Input
                                            label="Contact Number"
                                            value={contactNumber}
                                            onChange={(e) => setContactNumber(e.target.value)}
                                            placeholder="+1 234 567 8900"
                                        />
                                    )}
                                    <div className="flex justify-end pt-4">
                                        <Button onClick={handleSaveAccount} disabled={loading}>
                                            <Save className="w-4 h-4 mr-2" />
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {/* Notification Settings */}
                        {activeTab === 'notifications' && (
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                                    <p className="text-sm text-gray-500 mt-1">Choose what notifications you want to receive</p>
                                </CardHeader>
                                <CardBody className="p-6 space-y-4">
                                    {[
                                        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                                        { key: 'teamFormationAlerts', label: 'Team Formation Alerts', desc: 'Get notified when teams are formed' },
                                        { key: 'assessmentReminders', label: 'Assessment Reminders', desc: 'Reminders for pending assessments' },
                                        { key: 'courseUpdates', label: 'Course Updates', desc: 'Updates about your courses' },
                                        { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary of activities' }
                                    ].map(item => (
                                        <label key={item.key} className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={notifications[item.key as keyof NotificationSettings]}
                                                onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                                                className="mt-1"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">{item.label}</p>
                                                <p className="text-sm text-gray-500">{item.desc}</p>
                                            </div>
                                        </label>
                                    ))}
                                    <div className="flex justify-end pt-4">
                                        <Button onClick={handleSaveNotifications} disabled={loading}>
                                            <Save className="w-4 h-4 mr-2" />
                                            {loading ? 'Saving...' : 'Save Preferences'}
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {/* Privacy Settings */}
                        {activeTab === 'privacy' && (
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
                                    <p className="text-sm text-gray-500 mt-1">Control your privacy and visibility</p>
                                </CardHeader>
                                <CardBody className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Profile Visibility
                                        </label>
                                        <select
                                            value={privacy.profileVisibility}
                                            onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value as any })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="public">Public - Anyone can view</option>
                                            <option value="students">Students - Only enrolled students</option>
                                            <option value="private">Private - Only you</option>
                                        </select>
                                    </div>

                                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={privacy.showContactInfo}
                                            onChange={(e) => setPrivacy({ ...privacy, showContactInfo: e.target.checked })}
                                            className="mt-1"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">Show Contact Information</p>
                                            <p className="text-sm text-gray-500">Allow students to see your contact details</p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={privacy.allowStudentMessages}
                                            onChange={(e) => setPrivacy({ ...privacy, allowStudentMessages: e.target.checked })}
                                            className="mt-1"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">Allow Student Messages</p>
                                            <p className="text-sm text-gray-500">Students can send you direct messages</p>
                                        </div>
                                    </label>

                                    <div className="flex justify-end pt-4">
                                        <Button onClick={handleSavePrivacy} disabled={loading}>
                                            <Save className="w-4 h-4 mr-2" />
                                            {loading ? 'Saving...' : 'Save Settings'}
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                        {/* Security Settings */}
                        {activeTab === 'security' && (
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                                    <p className="text-sm text-gray-500 mt-1">Update your password to keep your account secure</p>
                                </CardHeader>
                                <CardBody className="p-6 space-y-4">
                                    <div className="relative">
                                        <Input
                                            label="Current Password"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <Input
                                            label="New Password"
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                                        >
                                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <Input
                                            label="Confirm New Password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-900">
                                            <strong>Password Requirements:</strong>
                                            <ul className="list-disc list-inside mt-2 space-y-1">
                                                <li>At least 6 characters long</li>
                                                <li>Use a mix of letters and numbers</li>
                                                <li>Avoid common passwords</li>
                                            </ul>
                                        </p>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button onClick={handleChangePassword} disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
                                            <Key className="w-4 h-4 mr-2" />
                                            {loading ? 'Changing...' : 'Change Password'}
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
