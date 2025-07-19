import { useFormik } from 'formik';
import { CustomButton, CustomTextInput } from '../../reusables';
import * as Yup from 'yup';
import { useAlert } from '../../hooks/SnackbarProvider';
import UserDAO from '../../daos/UserDAO';
import { Navigate, useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useUser } from '../../hooks/UserProvider';

export default function LoginPage() {
    const user = useUser();
    const loading = useLoading();
    const message = useAlert();
    const navigate = useNavigate();

    const validationSchema = Yup.object({
        username: Yup.string().required('Username is required!'),
        password: Yup.string().required('Password is required!'),
    });

    const handleSubmit = async (data) => {
        try {
            loading.start();
            const result = await UserDAO.login(data);
            user.login(result?.token);
            navigate('/studios');
        } catch (error) {
            console.error(error);
            message(error?.error_message, 'error');
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

    if (user?.token) return <Navigate to='/studios' />

    return (
        <div className="flex justify-center items-center bg-project-primary w-screen h-screen px-4">
            <form onSubmit={formik.handleSubmit} className="w-full max-w-lg">
                <div className="px-4 py-4 bg-white text-project-black-1 rounded-lg w-full">
                    <div className="text-center">
                        <h1>Movie Premiere Dashboard</h1>
                    </div>
                    <div className="flex flex-col gap-4 mt-6">
                        <CustomTextInput
                            name="username"
                            label={'Username'}
                            fullWidth
                            placeholder={'Enter your username'}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                                formik.touched.username &&
                                Boolean(formik.errors.username)
                            }
                            helperText={
                                formik.touched.username &&
                                formik.errors.username
                            }
                        />
                        <CustomTextInput
                            name="password"
                            label={'Password'}
                            fullWidth
                            placeholder={'Enter your password'}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                                formik.touched.password &&
                                Boolean(formik.errors.password)
                            }
                            helperText={
                                formik.touched.password &&
                                formik.errors.password
                            }
                            type="password"
                        />
                    </div>
                    <div className="mt-8">
                        <CustomButton fullWidth type="submit">
                            Login
                        </CustomButton>
                    </div>
                </div>
            </form>
        </div>
    );
}
