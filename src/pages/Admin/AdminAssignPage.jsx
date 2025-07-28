import { Box, Button, Typography, Checkbox, FormControlLabel, Paper } from '@mui/material';
import { useUser } from '../../hooks/UserProvider';
import { getDatabase, ref, get, update } from 'firebase/database';
import { app } from '../../config/firebaseConfig';
import { useNavigate, useParams } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import { useEffect, useState } from 'react';

export default function AdminAssignPage() {
  const { id: adminId } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const message = useAlert();
  const loading = useLoading();
  const db = getDatabase(app);
  const [couples, setCouples] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      loading.start();
      try {
        // Get all couples
        const couplesSnapshot = await get(ref(db, 'couples'));
        const couplesData = couplesSnapshot.val() || {};
        
        // Format data couples dengan status assignment
        const formattedCouples = Object.entries(couplesData).map(([id, data]) => ({
          id,
          name: data.name,
          isAssigned: data.assigned_admins && data.assigned_admins[adminId]
        }));

        setCouples(formattedCouples);
      } catch (error) {
        message(error.message, 'error');
      } finally {
        loading.stop();
      }
    };

    fetchData();
  }, [adminId, db]);

  const handleAssignment = async (coupleId, isAssigned) => {
    try {
      loading.start();
      
      // Update hanya di path couples
      const updates = {
        [`couples/${coupleId}/assigned_admins/${adminId}`]: isAssigned || null
      };
      
      await update(ref(db), updates);

      // Update local state
      setCouples(prev => prev.map(couple => 
        couple.id === coupleId 
          ? { ...couple, isAssigned }
          : couple
      ));
      
      message('Assignment updated!', 'success');
    } catch (error) {
      message(error.message, 'error');
    } finally {
      loading.stop();
    }
  };

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
        Assign Couples to Admin
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        {couples.map(couple => (
          <Box key={couple.id} sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={couple.isAssigned}
                  onChange={(e) => handleAssignment(couple.id, e.target.checked)}
                />
              }
              label={couple.name}
            />
          </Box>
        ))}
      </Paper>
      
      <Button 
        variant="contained" 
        sx={{ mt: 3 }}
        onClick={() => navigate('/admin-management')}
      >
        Back to Admin List
      </Button>
    </Box>
  );
}