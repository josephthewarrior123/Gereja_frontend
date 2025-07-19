import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from '@mui/material';

export default function EditStudio({ open, onClose, studio, onSave }) {
    const [name, setName] = useState('');

    // Reset name setiap kali modal dibuka
    useEffect(() => {
        if (open) {
            setName(studio?.name || '');
        }
    }, [open]); // Dependensi hanya `open`

    const handleSave = () => {
        onSave(studio.id, name); // Kirim ID dan nama baru ke fungsi onSave
        onClose(); // Tutup pop-up
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Edit Studio</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label="Studio Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
