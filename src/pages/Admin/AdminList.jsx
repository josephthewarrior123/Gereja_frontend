// src/pages/Admin/AdminList.jsx
import { Box, Button, Typography, Avatar, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useUser } from '../../hooks/UserProvider';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../../config/firebaseConfig';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import CustomIcon from '../../reusables/CustomIcon';

export default function AdminList() {
  const { user } = useUser();
  const [admins, setAdmins] = useState([]);
  const db = getDatabase(app);

  useEffect(() => {
    const adminsRef = ref(db, 'admins');
    onValue(adminsRef, (snapshot) => {
      const data = snapshot.val();
      const adminsArray = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      setAdmins(adminsArray);
    });
  }, [db]);

  const columns = [
    { 
      field: 'avatar', 
      headerName: '', 
      width: 80,
      renderCell: (params) => (
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {params.row.username.charAt(0).toUpperCase()}
        </Avatar>
      )
    },
    { field: 'username', headerName: 'Username', flex: 1 },
    { field: 'role', headerName: 'Role', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Button 
          variant="outlined" 
          size="small"
          startIcon={<CustomIcon icon="heroicons:pencil-solid" />}
          disabled={user?.role !== 'superadmin'}
        >
          Edit
        </Button>
      )
    }
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5">Admin Management</Typography>
        {user?.role === 'superadmin' && (
          <Button 
          variant="contained"
          startIcon={<CustomIcon icon="heroicons:plus-solid" />}
          onClick={() => window.location.href = '/create-admin'}

        >
          Create Admin
        </Button>
        )}
      </Box>

      <Paper elevation={3} sx={{ flex: 1 }}>
        <DataGrid
          rows={admins}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': {
              borderBottom: 'none'
            }
          }}
        />
      </Paper>
    </Box>
  );
}