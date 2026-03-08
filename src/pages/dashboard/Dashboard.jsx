import { Box, Button, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: { xs: 2, sm: 0 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        <Typography sx={{ fontSize: { xs: 22, sm: 28 }, fontWeight: 800, color: '#0f172a', mb: 1 }}>
          User Management Dashboard
        </Typography>
        <Typography sx={{ fontSize: 14, color: '#64748b', mb: 3 }}>
          Semua modul lama sudah dibersihkan. Gunakan halaman Users untuk kelola akun.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/users')}
            sx={{ textTransform: 'none', borderRadius: 2, px: 2.5, py: 1, fontWeight: 700 }}
          >
            Buka Users
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/users/create')}
            sx={{ textTransform: 'none', borderRadius: 2, px: 2.5, py: 1, fontWeight: 700 }}
          >
            Tambah User
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
