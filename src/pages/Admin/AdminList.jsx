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
  const navigate = useNavigate();
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
      ),
      sortable: false,
      filterable: false
    },
    { field: 'username', headerName: 'Username', flex: 1 },
    { field: 'role', headerName: 'Role', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      filterable: false,
      disableClickEventBubbling: true, // Ini yang memperbaiki issue click
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<CustomIcon icon="heroicons:pencil-solid" />}
            disabled={user?.role !== 'superadmin'}
            onClick={() => navigate(`/edit-admin/${params.id}`)}
          >
            Edit
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            color="secondary"
            startIcon={<CustomIcon icon="heroicons:user-plus-solid" />}
            disabled={user?.role !== 'superadmin'}
            onClick={() => navigate(`/assign-admin/${params.id}`)}
          >
            Assign
          </Button>
        </Box>
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
            onClick={() => navigate('/create-admin')}
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
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none'
            }
          }}
          componentsProps={{
            row: {
              onDoubleClick: (params) => {
                if (user?.role === 'superadmin') {
                  navigate(`/edit-admin/${params.id}`);
                }
              }
            }
          }}
        />
      </Paper>
    </Box>
  );
}