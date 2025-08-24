// src/pages/Admin/AdminList.jsx
import { Box, Typography, Avatar } from '@mui/material';
import { useUser } from '../../hooks/UserProvider';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../../config/firebaseConfig';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import CustomIcon from '../../reusables/CustomIcon';
import CustomDataTable from '../../reusables/CustomDataTable';
import CustomButton from '../../reusables/CustomButton';

export default function AdminList() {
  const { user } = useUser();
  const [admins, setAdmins] = useState([]);
  const navigate = useNavigate();
  const db = getDatabase(app);
  
  // State untuk pagination dan sorting
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState('username');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    const adminsRef = ref(db, 'admins');
    onValue(adminsRef, (snapshot) => {
      const data = snapshot.val();
      const adminsArray = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
        : [];
      setAdmins(adminsArray);
    });
  }, [db]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handle limit change
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(0);
  };

  // Handle sorting
  const handleSort = (column) => {
    const isAsc = sortColumn === column && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortColumn(column);
  };

  // Sort data berdasarkan kolom dan arah
  const sortedAdmins = [...admins].sort((a, b) => {
    if ((a[sortColumn] || '') < (b[sortColumn] || '')) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if ((a[sortColumn] || '') > (b[sortColumn] || '')) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Paginate data
  const paginatedAdmins = sortedAdmins.slice(page * limit, page * limit + limit);

  const columns = [
    { 
      key: 'avatar',
      title: '',
      width: 80,
      sortable: false,
      render: (_, row) => (
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          {row.username ? row.username.charAt(0).toUpperCase() : '?'}
        </Avatar>
      ),
    },
    { 
      key: 'username', 
      title: 'Username', 
      flex: 1,
      sortable: true,
      render: (_, row) => (
        <Typography sx={{ color: '#000000', fontWeight: 500 }}>
          {row.username || row.id || '—'}
        </Typography>
      ),
    },
    { 
      key: 'role', 
      title: 'Role', 
      flex: 1,
      sortable: true,
      render: (_, row) => (
        <Typography sx={{ color: '#000000', fontWeight: 500 }}>
          {row.role || '—'}
        </Typography>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 250,
      sortable: false,
      render: (_, row) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <CustomButton
            variant="outlined" 
            size="small"
            startIcon={<CustomIcon icon="heroicons:pencil-solid" />}
            disabled={user?.role !== 'superadmin'}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/edit-admin/${row.id}`);
            }}
            sx={{
              color: 'black',
              borderColor: 'grey.400',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.light',
                color: 'white',
              },
            }}
          >
            Edit
          </CustomButton>
          <CustomButton
            variant="contained" 
            size="small"
            color="secondary"
            startIcon={<CustomIcon icon="heroicons:user-plus-solid" />}
            disabled={user?.role !== 'superadmin'}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/assign-admin/${row.id}`);
            }}
            sx={{
              backgroundColor: '#9c27b0',
              color: 'white',
              '&:hover': {
                backgroundColor: '#7b1fa2',
              },
            }}
          >
            Assign
          </CustomButton>
        </Box>
      ),
    },
  ];

  // Handle row click
  const handleRowClick = (row) => {
    if (user?.role === 'superadmin') {
      navigate(`/edit-admin/${row.id}`);
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        p: 2,
        backgroundColor: 'white',
      }}
    >
      <Box
  sx={{
    display: 'flex',
    justifyContent: 'space-between', // Ini yang penting
    alignItems: 'center',
    p: 2,
    borderRadius: 2,
    backgroundColor: 'white',
    boxShadow: 1,
  }}
>
  {/* Box kosong di sebelah kiri */}
  <Box />
  
  {user?.role === 'superadmin' && (
    <CustomButton
      variant="contained"
      startIcon={<CustomIcon icon="heroicons:plus-solid" />}
      onClick={() => navigate('/create-admin')}
      sx={{
        backgroundColor: 'primary.main',
        color: 'white',
        '&:hover': {
          backgroundColor: 'primary.dark',
        },
      }}
    >
      Create Admin
    </CustomButton>
  )}
</Box>

      <CustomDataTable
        dataSource={paginatedAdmins}
        columns={columns}
        page={page}
        limit={limit}
        totalRecords={admins.length}
        handlePageChange={handlePageChange}
        handleLimitChange={handleLimitChange}
        handleSort={handleSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onRowClick={handleRowClick}
        getRowStyle={(row) => ({
          cursor: user?.role === 'superadmin' ? 'pointer' : 'default',
          '&:hover': {
            backgroundColor:
              user?.role === 'superadmin'
                ? 'rgba(0, 0, 0, 0.04)'
                : 'transparent',
          },
        })}
      />
    </Box>
  );
}
