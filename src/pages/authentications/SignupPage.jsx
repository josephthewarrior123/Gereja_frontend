import { useFormik } from 'formik';
import { CustomButton, CustomTextInput } from '../../reusables';
import * as Yup from 'yup';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';
import { useEffect, useState } from 'react';
import UserDAO from '../../daos/UserDAO';
import GroupDAO from '../../daos/GroupDao';

export default function SignUpPage() {
    const { user, login, isLoading } = useUser();
    const loading = useLoading();
    const message = useAlert();
    const navigate = useNavigate();

    const [groupOptions, setGroupOptions] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(true);

    // Fetch groups on mount (public endpoint, no auth needed)
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setGroupsLoading(true);
                const result = await GroupDAO.listGroups();
                if (result.success) {
                    // Only show active groups
                    const activeGroups = result.groups.filter((g) => g.isActive !== false);
                    setGroupOptions(activeGroups);
                }
            } catch (error) {
                console.error('Failed to fetch groups:', error);
            } finally {
                setGroupsLoading(false);
            }
        };
        fetchGroups();
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        if (user && !isLoading) {
            navigate('/', { replace: true });
        }
    }, [user, isLoading, navigate]);

    const validationSchema = Yup.object({
        fullName: Yup.string()
            .required('Full name is required!')
            .min(2, 'Full name must be at least 2 characters'),
        username: Yup.string()
            .required('Username is required!')
            .min(4, 'Username must be at least 4 characters')
            .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
        email: Yup.string()
            .email('Invalid email format')
            .required('Email is required!'),
        password: Yup.string()
            .required('Password is required!')
            .min(6, 'Password must be at least 6 characters'),
        confirmPassword: Yup.string()
            .required('Please confirm your password!')
            .oneOf([Yup.ref('password'), null], 'Passwords must match'),
        groups: Yup.array()
            .min(1, 'Pilih minimal 1 grup'),
    });

    const handleSubmit = async (data) => {
        try {
            loading.start();

            const result = await UserDAO.signUp({
                fullName: data.fullName.trim(),
                username: data.username.trim(),
                email: data.email.trim().toLowerCase(),
                password: data.password.trim(),
                role: 'user',
                groups: data.groups,
            });

            if (!result.success) {
                throw new Error(result.error || 'Sign up failed');
            }

            if (result.token) {
                localStorage.setItem('authToken', result.token);
            }

            login({
                id: result.user.id,
                username: result.user.username,
                fullName: result.user.fullName,
                role: result.user.role || 'user',
                email: result.user.email || '',
                groups: result.user.groups || [],
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
            email: '',
            password: '',
            confirmPassword: '',
            groups: [],
        },
        validationSchema,
        onSubmit: handleSubmit,
        validateOnChange: true,
        validateOnBlur: true,
    });

    // Toggle group selection
    const toggleGroup = (groupId) => {
        const current = formik.values.groups;
        const next = current.includes(groupId)
            ? current.filter((g) => g !== groupId)
            : [...current, groupId];
        formik.setFieldValue('groups', next);
    };

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
                {/* Header */}
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

                            {/* Full Name */}
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

                            {/* Username */}
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

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email
                                </label>
                                <CustomTextInput
                                    name="email"
                                    fullWidth
                                    placeholder="john@example.com"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.email}
                                    error={formik.touched.email && Boolean(formik.errors.email)}
                                    helperText={formik.touched.email && formik.errors.email}
                                    type="email"
                                />
                            </div>

                            {/* Password */}
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

                            {/* Confirm Password */}
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

                            {/* Group Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Pilih Grup
                                </label>

                                {groupsLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-project-primary"></div>
                                        Memuat daftar grup...
                                    </div>
                                ) : groupOptions.length === 0 ? (
                                    <p className="text-sm text-gray-400 py-3">
                                        Belum ada grup tersedia. Hubungi admin.
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {groupOptions.map((group) => {
                                            const isSelected = formik.values.groups.includes(group.id);
                                            return (
                                                <button
                                                    key={group.id}
                                                    type="button"
                                                    onClick={() => toggleGroup(group.id)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150
                                                        ${isSelected
                                                            ? 'bg-project-primary text-white border-project-primary shadow-sm'
                                                            : 'bg-white text-gray-600 border-gray-300 hover:border-project-primary hover:text-project-primary'
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <span className="mr-1">✓</span>
                                                    )}
                                                    {group.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Error message for groups */}
                                {formik.touched.groups && formik.errors.groups && (
                                    <p className="text-xs text-red-500 mt-1">{formik.errors.groups}</p>
                                )}
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