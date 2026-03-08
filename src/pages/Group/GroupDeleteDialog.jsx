import { Icon } from '@iconify/react';
import {
    Box,
    Button,
    Dialog,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';

export default function GroupDeleteDialog({ open, onClose, onConfirm, target, isMobile }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={isMobile}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">Konfirmasi Hapus</Typography>
                    <IconButton onClick={onClose} size="small">
                        <Icon icon="mdi:close" />
                    </IconButton>
                </Stack>

                <Typography variant="body1" sx={{ mb: 1 }}>
                    Yakin mau hapus group <b>{target?.name}</b>?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Aksi ini tidak bisa dibatalkan. User yang tergabung di group ini tidak akan otomatis terhapus, tapi group tidak akan muncul lagi.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
                    <Button variant="outlined" onClick={onClose}
                        sx={{ textTransform: 'none', borderRadius: 2 }}>
                        Batal
                    </Button>
                    <Button
                        variant="contained" color="error"
                        startIcon={<Icon icon="mdi:delete" />}
                        onClick={onConfirm}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                        Hapus Permanen
                    </Button>
                </Stack>
            </Box>
        </Dialog>
    );
}