import { Box, Button, TextField, Typography, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useUser } from '../../hooks/UserProvider';
import { getDatabase, ref, set } from 'firebase/database';
import { app } from '../../config/firebaseConfig';
import { useNavigate } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import { hash } from 'bcryptjs';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  role: Yup.string().oneOf(['superadmin', 'admin']).required('Role is required')
});

export default function CreateAdmin() {
  const { user } = useUser();
  const navigate = useNavigate();
  const message = useAlert();
  const loading = useLoading();
  const db = getDatabase(app);

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      role: 'admin' // Default to admin role
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        loading.start();
        
        // Hash password before saving
        const hashedPassword = await hash(values.password, 10);
        
        // Save to Firebase
        await set(ref(db, `admins/${values.username}`), {
          username: values.username,
          password: hashedPassword,
          role: values.role
        });
        
        message('Admin created successfully!', 'success');
        navigate('/admin-management');
      } catch (error) {
        message(error.message, 'error');
      } finally {
        loading.stop();
      }
    }
  });

  // Only superadmin can access this page
  if (user?.role !== 'superadmin') {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" color="error">
          Only superadmins can access this page
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Create New Admin
      </Typography>
      
      <Box component="form" onSubmit={formik.handleSubmit} sx={{ maxWidth: 500 }}>
        <TextField
          fullWidth
          margin="normal"
          label="Username"
          name="username"
          value={formik.values.username}
          onChange={formik.handleChange}
          error={formik.touched.username && Boolean(formik.errors.username)}
          helperText={formik.touched.username && formik.errors.username}
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          name="password"
          type="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select
            name="role"
            value={formik.values.role}
            label="Role"
            onChange={formik.handleChange}
          >
            <MenuItem value="superadmin">Superadmin</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
        
        <Button 
          type="submit" 
          variant="contained" 
          sx={{ mt: 3 }}
        >
          Create Admin
        </Button>
      </Box>
    </Box>
  );
}