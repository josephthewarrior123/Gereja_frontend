import { Icon } from '@iconify/react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Grid,
    Chip,
    Avatar,
    Divider,
    IconButton,
    Paper,
    Tab,
    Tabs
} from '@mui/material';
import { useState } from 'react';
import PropTypes from 'prop-types';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`customer-tabpanel-${index}`}
            aria-labelledby={`customer-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

export default function ViewCustomerDialog({ open, customer, onClose, onEdit, onDelete }) {
    const [tabValue, setTabValue] = useState(0);

    if (!customer) return null;

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Not available';
        const date = new Date(timestamp);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'success';
            case 'Expired': return 'error';
            default: return 'default';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Customer Details</Typography>
                    <IconButton onClick={onClose} size="small">
                        <Icon icon="mdi:close" />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers>
                {/* Header Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ width: 60, height: 60, bgcolor: '#1976d2', fontSize: 24 }}>
                        {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            {customer.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip 
                                label={customer.status} 
                                size="small" 
                                color={getStatusColor(customer.status)}
                            />
                            <Typography variant="body2" color="textSecondary">
                                ID: {customer.id}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="Personal Info" />
                        <Tab label="Car Details" />
                        <Tab label="Photos" />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <InfoRow label="Email" value={customer.email} icon="mdi:email" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <InfoRow label="Phone" value={customer.phone} icon="mdi:phone" />
                        </Grid>
                        <Grid item xs={12}>
                            <InfoRow label="Address" value={customer.address} icon="mdi:map-marker" />
                        </Grid>
                        <Grid item xs={12}>
                            <InfoRow label="Notes" value={customer.notes} icon="mdi:note" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <InfoRow label="Created" value={formatDate(customer.createdAt)} icon="mdi:calendar-plus" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <InfoRow label="Last Updated" value={formatDate(customer.updatedAt)} icon="mdi:calendar-edit" />
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <InfoRow label="Car Owner" value={customer.carData?.ownerName} icon="mdi:account" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <InfoRow label="Car Brand" value={customer.carData?.carBrand} icon="mdi:car" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <InfoRow label="Car Model" value={customer.carData?.carModel} icon="mdi:car-info" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <InfoRow label="Plate Number" value={customer.carData?.plateNumber} icon="mdi:numeric" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <InfoRow label="Chassis Number" value={customer.carData?.chassisNumber} icon="mdi:barcode" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <InfoRow label="Engine Number" value={customer.carData?.engineNumber} icon="mdi:engine" />
                        </Grid>
                        <Grid item xs={12}>
                            <InfoRow label="Due Date" value={customer.dueDate ? formatDate(customer.dueDate) : 'Not set'} icon="mdi:calendar-clock" />
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    {customer.hasPhotos ? (
                        <Grid container spacing={2}>
                            {Object.entries(customer.carPhotos || {}).map(([side, url]) => (
                                url && (
                                    <Grid item xs={12} sm={6} key={side}>
                                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                {side.replace('Side', ' Side').replace('front', 'Front').replace('back', 'Back')}
                                            </Typography>
                                            <Box
                                                component="img"
                                                src={url}
                                                alt={`Car ${side}`}
                                                sx={{
                                                    width: '100%',
                                                    maxHeight: 200,
                                                    objectFit: 'contain',
                                                    borderRadius: 1
                                                }}
                                            />
                                            <Button
                                                size="small"
                                                href={url}
                                                target="_blank"
                                                sx={{ mt: 1 }}
                                                startIcon={<Icon icon="mdi:open-in-new" />}
                                            >
                                                Open Full Size
                                            </Button>
                                        </Paper>
                                    </Grid>
                                )
                            ))}
                        </Grid>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Icon icon="mdi:camera-off" width={60} color="#9e9e9e" />
                            <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
                                No Photos Uploaded
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Upload car photos from the edit page
                            </Typography>
                        </Box>
                    )}
                </TabPanel>
            </DialogContent>
            
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    color="error"
                    onClick={onDelete}
                    startIcon={<Icon icon="mdi:delete" />}
                >
                    Delete
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button
                    onClick={onClose}
                >
                    Close
                </Button>
                <Button
                    variant="contained"
                    onClick={onEdit}
                    startIcon={<Icon icon="mdi:pencil" />}
                >
                    Edit Customer
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function InfoRow({ label, value, icon }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Icon icon={icon} width={20} style={{ marginTop: 4, color: '#666' }} />
            <Box>
                <Typography variant="caption" color="textSecondary">
                    {label}
                </Typography>
                <Typography variant="body1">
                    {value || 'Not available'}
                </Typography>
            </Box>
        </Box>
    );
}