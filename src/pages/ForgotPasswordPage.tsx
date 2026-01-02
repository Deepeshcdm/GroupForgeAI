import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts';
import { Button, Input, Card, CardBody } from '../components/ui';
import { Users, ArrowLeft, CheckCircle } from 'lucide-react';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send password reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
                    <p className="text-gray-500 mt-1">We'll send you a reset link</p>
                </div>

                <Card>
                    <CardBody className="p-8">
                        {success ? (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Check your email
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    We've sent a password reset link to <strong>{email}</strong>
                                </p>
                                <p className="text-sm text-gray-500 mb-6">
                                    Didn't receive the email? Check your spam folder or try again.
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to login
                                </Link>
                            </div>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" />
                                    Back to login
                                </Link>

                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Forgot your password?</h2>
                                <p className="text-sm text-gray-600 mb-6">
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        label="Email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@university.edu"
                                        required
                                    />

                                    <Button type="submit" className="w-full" isLoading={loading}>
                                        Send reset link
                                    </Button>
                                </form>
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
