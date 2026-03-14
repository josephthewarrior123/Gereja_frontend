// src/pages/User/CreateGembalaPage.jsx
import { Icon } from '@iconify/react';
import {
    Box, Button, Chip, CircularProgress, Stack, TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import GroupDAO from '../../daos/GroupDao';
import SuperAdminDAO from '../../daos/SuperAdminDao';

const AMBER = '#B45309';
const AMBER_BG = '#FFFBEB';
const AMBER_BORDER = '#FDE68A';

export default function CreateGembalaPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const message = useAlert();

    const [username, setUsername] = useState('');
    const [groups, setGroups] = useState([]);           // all available groups
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Guard: only super_admin
    useEffect(() => {
        if (user && user.role !== 'super_admin') {
            message('Hanya super admin yang bisa mengakses halaman ini', 'error');
            navigate('/users', { replace: true });
        }
    }, [user]);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await GroupDAO.getAllGroups();
                if (res.success) setGroups(res.data || []);
            } catch (e) { /* silent */ }
            finally { setFetching(false); }
        };
        fetchGroups();
    }, []);

    const toggleGroup = (g) => {
        setSelectedGroups((prev) =>
            prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
        );
    };

    const handleSubmit = async () => {
        if (!username.trim()) { message('Username wajib diisi', 'error'); return; }
        if (selectedGroups.length === 0) { message('Pilih minimal 1 group yang dikelola', 'error'); return; }
        try {
            setLoading(true);
            const res = await SuperAdminDAO.createOrPromoteGembala({
                username: username.trim(),
                managed_groups: selectedGroups,
            });
            if (!res.success) throw new Error(res.error || 'Gagal promote user');
            message(`@${username} berhasil dipromote jadi Gembala!`, 'success');
            navigate('/users');
        } catch (e) {
            message(e.message || 'Terjadi kesalahan', 'error');
        } finally { setLoading(false); }
    };

    return (
        <Box sx={{ maxWidth: 520, mx: 'auto', p: { xs: 2, sm: 4 } }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <Box onClick={() => navigate('/users')} sx={{ cursor: 'pointer', color: '#94a3b8', '&:hover': { color: '#0f172a' }, display: 'flex' }}>
                    <Icon icon="mdi:arrow-left" width={22} />
                </Box>
                <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: AMBER, fontFamily: '"DM Sans", sans-serif', mb: 0.2 }}>
                        Super Admin
                    </Typography>
                    <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: '"Outfit", sans-serif', lineHeight: 1 }}>
                        Promote Gembala
                    </Typography>
                </Box>
            </Stack>

            {/* Info box */}
            <Box sx={{ bgcolor: AMBER_BG, border: `1.5px solid ${AMBER_BORDER}`, borderRadius: '14px', p: 2, mb: 3, display: 'flex', gap: 1.5 }}>
                <Icon icon="mdi:information-outline" color={AMBER} width={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <Typography sx={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.6, fontFamily: '"DM Sans", sans-serif' }}>
                    Gembala dapat memberikan poin ke pengguna <strong>di dalam group yang dikelola</strong>-nya melalui fitur Bulk Award, tapi tidak dapat melihat User Management.
                </Typography>
            </Box>

            {/* Form */}
            <Box sx={{ bgcolor: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', p: 3 }}>
                <Stack spacing={3}>
                    {/* Username */}
                    <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#475569', mb: 0.8, fontFamily: '"DM Sans", sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Username
                        </Typography>
                        <TextField
                            fullWidth
                            placeholder="Masukkan username user yang akan dipromote"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            InputProps={{ sx: { borderRadius: '10px', fontSize: 14, fontFamily: '"DM Sans", sans-serif' } }}
                        />
                        <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.5, fontFamily: '"DM Sans", sans-serif' }}>
                            User harus sudah terdaftar di sistem
                        </Typography>
                    </Box>

                    {/* Managed Groups */}
                    <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#475569', mb: 0.8, fontFamily: '"DM Sans", sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Managed Groups
                        </Typography>
                        {fetching ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                <CircularProgress size={24} sx={{ color: AMBER }} />
                            </Box>
                        ) : groups.length === 0 ? (
                            <Typography sx={{ fontSize: 13, color: '#94a3b8', fontFamily: '"DM Sans", sans-serif' }}>Belum ada group tersedia</Typography>
                        ) : (
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {groups.map((g) => {
                                    const isSelected = selectedGroups.includes(g.name || g.id || g);
                                    const gName = g.name || g.id || g;
                                    return (
                                        <Chip
                                            key={gName}
                                            label={gName}
                                            onClick={() => toggleGroup(gName)}
                                            sx={{
                                                fontFamily: '"DM Sans", sans-serif',
                                                fontWeight: 600,
                                                fontSize: 12,
                                                borderRadius: '8px',
                                                border: `1.5px solid ${isSelected ? AMBER : '#e2e8f0'}`,
                                                bgcolor: isSelected ? AMBER_BG : '#f8fafc',
                                                color: isSelected ? AMBER : '#64748b',
                                                cursor: 'pointer',
                                                transition: 'all .15s',
                                            }}
                                        />
                                    );
                                })}
                            </Stack>
                        )}
                        {selectedGroups.length > 0 && (
                            <Typography sx={{ fontSize: 11, color: AMBER, mt: 1, fontFamily: '"DM Sans", sans-serif', fontWeight: 600 }}>
                                {selectedGroups.length} group dipilih
                            </Typography>
                        )}
                    </Box>

                    {/* Submit */}
                    <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                        <Button variant="outlined" onClick={() => navigate('/users')}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: '"DM Sans", sans-serif', fontWeight: 600, borderColor: '#e2e8f0', color: '#64748b' }}>
                            Batal
                        </Button>
                        <Button variant="contained" onClick={handleSubmit} disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Icon icon="mdi:account-heart-outline" width={18} />}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: '"DM Sans", sans-serif', fontWeight: 700, bgcolor: AMBER, boxShadow: `0 2px 8px ${AMBER}44`, '&:hover': { bgcolor: '#92400e' }, '&:disabled': { bgcolor: '#e2e8f0' } }}>
                            Promote Jadi Gembala
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Box>
    );
}
