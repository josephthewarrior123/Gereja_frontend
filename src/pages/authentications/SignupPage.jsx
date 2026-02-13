import { useFormik } from 'formik';
import { CustomButton, CustomTextInput } from '../../reusables';
import * as Yup from 'yup';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';
import { useEffect } from 'react';
import UserDAO from '../../daos/UserDAO';

export default function SignUpPage() {
    const { user, login, isLoading } = useUser();
    const loading = useLoading();
    const message = useAlert();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (user && !isLoading) {
            navigate('/', { replace: true });
        }
    }, [user, isLoading, navigate]);

    // Form validation schema
    const validationSchema = Yup.object({
        fullName: Yup.string()
            .required('Full name is required!')
            .min(2, 'Full name must be at least 2 characters'),
        username: Yup.string()
            .required('Username is required!')
            .min(4, 'Username must be at least 4 characters')
            .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
        password: Yup.string()
            .required('Password is required!')
            .min(6, 'Password must be at least 6 characters'),
        confirmPassword: Yup.string()
            .required('Please confirm your password!')
            .oneOf([Yup.ref('password'), null], 'Passwords must match'),
    });

    const handleSubmit = async (data) => {
        try {
            loading.start();
            
            // Trim input to avoid whitespace
            const fullName = data.fullName.trim();
            const username = data.username.trim();
            const password = data.password.trim();
            
            // Call backend API through UserDAO
            const result = await UserDAO.signUp({
                fullName: fullName,
                username: username,
                password: password,
                role: 'user' // Default role
            });

            // Check response
            if (!result.success) {
                throw new Error(result.error || 'Sign up failed');
            }

            // Save token to localStorage
            if (result.token) {
                localStorage.setItem('authToken', result.token);
            }

            // Login with user data from backend
            login({
                id: result.user.id,
                username: result.user.username,
                fullName: result.user.fullName,
                role: result.user.role || 'user'
            });

            message('Account created successfully! Welcome aboard! 🎉', 'success');
            navigate('/', { replace: true });
            
        } catch (error) {
            console.error('Sign up error:', error);
            message(error.message || 'Sign up failed. Please try again.', 'error');
        } finally {
            loading.stop();
        }
    };

    const formik = useFormik({
        initialValues: {
            fullName: '',
            username: '',
            password: '',
            confirmPassword: '',
        },
        validationSchema,
        onSubmit: handleSubmit,
        validateOnChange: true,
        validateOnBlur: true,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-project-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-project-primary rounded-2xl shadow-lg mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
                    <p className="text-gray-600">Join us and protect what matters most</p>
                </div>

                {/* Form Card */}
                <form onSubmit={formik.handleSubmit}>
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="space-y-5">
                            {/* Full Name Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <CustomTextInput
                                    name="fullName"
                                    fullWidth
                                    placeholder="John Doe"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.fullName}
                                    error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                                    helperText={formik.touched.fullName && formik.errors.fullName}
                                />
                            </div>

                            {/* Username Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Username
                                </label>
                                <CustomTextInput
                                    name="username"
                                    fullWidth
                                    placeholder="johndoe123"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.username}
                                    error={formik.touched.username && Boolean(formik.errors.username)}
                                    helperText={formik.touched.username && formik.errors.username}
                                />
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password
                                </label>
                                <CustomTextInput
                                    name="password"
                                    fullWidth
                                    placeholder="••••••••"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.password}
                                    error={formik.touched.password && Boolean(formik.errors.password)}
                                    helperText={formik.touched.password && formik.errors.password}
                                    type="password"
                                />
                            </div>

                            {/* Confirm Password Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <CustomTextInput
                                    name="confirmPassword"
                                    fullWidth
                                    placeholder="••••••••"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.confirmPassword}
                                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                                    type="password"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-8">
                            <CustomButton 
                                fullWidth 
                                type="submit"
                                disabled={!formik.isValid || formik.isSubmitting}
                                className="h-12 text-base font-semibold"
                            >
                                {formik.isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </span>
                                ) : (
                                    'Create Account'
                                )}
                            </CustomButton>
                        </div>

                        {/* Privacy Note */}
                        <p className="text-xs text-gray-500 text-center mt-6">
                            By creating an account, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </div>
                </form>

                {/* Login Link */}
                <div className="text-center mt-6">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-project-primary font-semibold hover:underline transition-all"
                        >
                            Sign in
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}