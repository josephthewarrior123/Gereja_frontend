import { Box, Button, TextField, Typography, MenuItem, Select, FormControl, InputLabel, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useUser } from '../../hooks/UserProvider';
import { getDatabase, ref, set, get } from 'firebase/database';
import { app } from '../../config/firebaseConfig';
import { useNavigate, useParams } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import { useEffect } from 'react';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  role: Yup.string().oneOf(['superadmin', 'admin']).required('Role is required'),
  newPassword: Yup.string().min(6, 'Password must be at least 6 characters').optional()
});

export default function AdminEdit() {
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const message = useAlert();
  const loading = useLoading();
  const db = getDatabase(app);

  const formik = useFormik({
    initialValues: {
      username: '',
      role: 'admin',
      newPassword: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        loading.start();
        
        const updates = {
          username: values.username,
          role: values.role
        };

        if (values.newPassword) {
          const hashedPassword = await hash(values.newPassword, 10);
          updates.password = hashedPassword;
        }

        await set(ref(db, `admins/${id}`), updates);
        
        message('Admin updated successfully!', 'success');
        navigate('/admin-management');
      } catch (error) {
        message(error.message, 'error');
      } finally {
        loading.stop();
      }
    }
  });

  useEffect(() => {
    const fetchAdmin = async () => {
      const snapshot = await get(ref(db, `admins/${id}`));
      if (snapshot.exists()) {
        const adminData = snapshot.val();
        formik.setValues({
          username: adminData.username,
          role: adminData.role,
          newPassword: ''
        });
      }
    };

    fetchAdmin();
  }, [id, db]);

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
      {/* Icon Back */}
      <IconButton onClick={() => navigate('/admin-management')} sx={{ mb: 2 }}>
        <ArrowBackIcon />
      </IconButton>

      <Typography variant="h5" gutterBottom>
        Edit Admin
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
          label="New Password (leave empty to keep current)"
          name="newPassword"
          type="password"
          value={formik.values.newPassword}
          onChange={formik.handleChange}
          error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
          helperText={formik.touched.newPassword && formik.errors.newPassword}
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
          Update Admin
        </Button>
      </Box>
    </Box>
  );
}
