import { useFormik } from 'formik';
import { CustomButton, CustomTextInput } from '../../reusables';
import * as Yup from 'yup';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '../../config/firebaseConfig';
import { useEffect } from 'react';
import { compare } from 'bcryptjs';

export default function LoginPage() {
    const { user, login, isLoading } = useUser();
    const loading = useLoading();
    const message = useAlert();
    const navigate = useNavigate();
    const db = getDatabase(app);

    // Redirect if already logged in
    useEffect(() => {
        if (user && !isLoading) {
            navigate('/', { replace: true });
        }
    }, [user, isLoading, navigate]);

    // Form validation schema
    const validationSchema = Yup.object({
        username: Yup.string().required('Username is required!'),
        password: Yup.string().required('Password is required!'),
    });

    const handleSubmit = async (data) => {
        try {
            loading.start();
            
            // Trim input untuk hindari whitespace
            const username = data.username.trim();
            const password = data.password.trim();
            
            const adminsRef = ref(db, 'admins');
            const snapshot = await get(adminsRef);
            
            if (!snapshot.exists()) {
                throw new Error('No admin accounts found');
            }
            
            const admins = snapshot.val();
            const adminEntry = Object.entries(admins).find(
                ([_, admin]) => admin.username.trim() === username
            );
            
            if (!adminEntry) {
                throw new Error('Admin not found');
            }
            
            const [adminId, adminData] = adminEntry;
            const storedPassword = adminData.password.trim();
            
            // Debugging info
            console.log('Comparing:', {
                inputPassword: password,
                storedPassword: storedPassword,
                isHashed: storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')
            });
            
            // Verifikasi password
            let passwordValid = false;
            
            if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
                // Password di database sudah di-hash
                passwordValid = await compare(password, storedPassword);
            } else {
                // Password di database plain text
                passwordValid = password === storedPassword;
                
                // Tampilkan warning jika password plain text
                if (passwordValid) {
                    console.warn('Security Warning: Using plain text password for', adminId);
                }
            }
            
            if (!passwordValid) {
                throw new Error('Invalid password');
            }
            
            // Login sukses
            login({
                id: adminId,
                username: adminData.username,
                role: adminData.role || 'admin'
            });
            
        } catch (error) {
            console.error('Login error:', error);
            message(error.message || 'Login failed. Please check credentials.', 'error');
        } finally {
            loading.stop();
        }
    };

    const formik = useFormik({
        initialValues: {
            username: '',
            password: '',
        },
        validationSchema,
        onSubmit: handleSubmit,
        validateOnChange: true,
        validateOnBlur: true,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div>Loading user session...</div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center bg-project-primary w-screen h-screen px-4">
            <form onSubmit={formik.handleSubmit} className="w-full max-w-lg">
                <div className="px-4 py-4 bg-white text-project-black-1 rounded-lg w-full">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Momento Wedding Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-1">Please login to continue</p>
                    </div>
                    
                    <div className="flex flex-col gap-4 mt-6">
                        <CustomTextInput
                            name="username"
                            label={'Username'}
                            fullWidth
                            placeholder={'Enter your username'}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.username && Boolean(formik.errors.username)}
                            helperText={formik.touched.username && formik.errors.username}
                        />
                        <CustomTextInput
                            name="password"
                            label={'Password'}
                            fullWidth
                            placeholder={'Enter your password'}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.password && Boolean(formik.errors.password)}
                            helperText={formik.touched.password && formik.errors.password}
                            type="password"
                        />
                    </div>
                    
                    <div className="mt-8">
                        <CustomButton 
                            fullWidth 
                            type="submit"
                            disabled={!formik.isValid || formik.isSubmitting}
                        >
                            {formik.isSubmitting ? 'Logging in...' : 'Login'}
                        </CustomButton>
                    </div>
                </div>
            </form>
        </div>
    );
}