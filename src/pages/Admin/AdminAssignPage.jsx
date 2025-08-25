import { 
  Box, 
  Button, 
  Typography, 
  Checkbox,
  TextField,
  InputAdornment
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useUser } from '../../hooks/UserProvider';
import { getDatabase, ref, get, update } from 'firebase/database';
import { app } from '../../config/firebaseConfig';
import { useNavigate, useParams } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import { useEffect, useState, useMemo } from 'react';
import CustomDatatable from '../../reusables/CustomDataTable';

export default function AdminAssignPage() {
  const { id: adminId } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const message = useAlert();
  const loading = useLoading();
  const db = getDatabase(app);
  const [couples, setCouples] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(5);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    const fetchData = async () => {
      loading.start();
      try {
        const couplesSnapshot = await get(ref(db, 'couples'));
        const couplesData = couplesSnapshot.val() || {};
        
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

  const filteredCouples = useMemo(() => {
    let result = [...couples];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(couple => 
        couple.name.toLowerCase().includes(query) ||
        couple.id.toLowerCase().includes(query)
      );
    }
    
    result.sort((a, b) => {
      if (sortColumn === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      return 0;
    });
    
    return result;
  }, [couples, searchQuery, sortColumn, sortDirection]);

  const handleAssignment = async (coupleId, isAssigned) => {
    try {
      loading.start();
      const updates = {
        [`couples/${coupleId}/assigned_admins/${adminId}`]: isAssigned || null
      };
      
      await update(ref(db), updates);

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

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(0);
  };

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const columns = [
    {
      key: 'select',
      title: 'Assign',
      width: '10%',
      render: (value, row) => (
        <Checkbox
          checked={row.isAssigned || false}
          onChange={(e) => handleAssignment(row.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
    {
      key: 'name',
      title: 'Couple Name',
      dataIndex: 'name',
      width: '90%',
      sortable: true,
    }
  ];

  if (user?.role !== 'superadmin') {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" color="error">
          Only superadmins can access this page
        </Typography>
      </Box>
    );
  }

  const paginatedData = filteredCouples.slice(
    page * limit,
    page * limit + limit
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center', 
        mb: 3 
      }}>
        <TextField
          placeholder="Search couples..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="mdi:magnify" />
              </InputAdornment>
            ),
          }}
        />
        
        <Button 
          variant="outlined" 
          onClick={() => navigate('/admin-management')}
          startIcon={<Icon icon="mdi:arrow-left" />}
        >
          Back to Admin List
        </Button>
      </Box>

      <CustomDatatable
        dataSource={paginatedData}
        columns={columns}
        page={page}
        limit={limit}
        totalRecords={filteredCouples.length}
        handlePageChange={handlePageChange}
        handleLimitChange={handleLimitChange}
        handleSort={handleSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
      />
    </Box>
  );
}
