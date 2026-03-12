import { Icon } from '@iconify/react';
import {
    Box,
    Button,
    Dialog,
    Divider,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import GroupDAO from '../../daos/GroupDao';

export default function GroupFormDialog({ open, onClose, onSuccess, editTarget }) {
    const message = useAlert();
    const loading = useLoading();
    const isEdit = Boolean(editTarget);

    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setName(editTarget ? editTarget.name : '');
            setError('');
        }
    }, [open, editTarget]);

    const handleSubmit = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Nama group tidak boleh kosong');
            return;
        }

        try {
            setSubmitting(true);
            loading.start();

            let result;
            if (isEdit) {
                result = await GroupDAO.updateGroup(editTarget.id, { name: trimmed });
            } else {
                result = await GroupDAO.createGroup({ name: trimmed });
            }

            if (!result.success) throw new Error(result.error || 'Gagal menyimpan group');

            message(`Group berhasil ${isEdit ? 'diupdate' : 'dibuat'}`, 'success');
            onSuccess();
            onClose();
        } catch (e) {
            message(e.message || 'Terjadi kesalahan', 'error');
        } finally {
            setSubmitting(false);
            loading.stop();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <Box sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                    <Box>
                        <Typography variant="h6" fontWeight={800} color="#0F172A">
                            {isEdit ? 'Edit Group' : 'Buat Group Baru'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {isEdit ? `Ubah nama group "${editTarget?.name}"` : 'Tambahkan group baru ke sistem'}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <Icon icon="mdi:close" />
                    </IconButton>
                </Stack>

                <Divider sx={{ mb: 2.5 }} />

                <Box mb={3}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        Nama Group
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="contoh: Pemuda, Ranting, ..."
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(''); }}
                        onKeyPress={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                        error={Boolean(error)}
                        helperText={error}
                        sx={{ mt: 0.75 }}
                        InputProps={{ sx: { borderRadius: 2, fontSize: 14 } }}
                        autoFocus
                    />
                </Box>

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button variant="outlined" onClick={onClose} disabled={submitting}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Batal
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={submitting}
                        startIcon={submitting
                            ? <span style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTop: '2.5px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                            : <Icon icon={isEdit ? 'mdi:content-save-outline' : 'mdi:plus'} />
                        }
                        sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#1e40af' } }}
                    >
                        {submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Group'}
                    </Button>
                </Stack>
            </Box>
        </Dialog>
    );
}