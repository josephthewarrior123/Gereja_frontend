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
    IconButton,
    Paper,
    Tab,
    Tabs,
    useMediaQuery,
    useTheme,
    Divider,
    Fade
} from '@mui/material';
import { useState } from 'react';
import PropTypes from 'prop-types';

/* ---------------- TAB PANEL ---------------- */
function TabPanel({ children, value, index }) {
    return value === index && <Box sx={{ pt: 2 }}>{children}</Box>;
}

/* ---------------- IMAGE PREVIEW ---------------- */
function ImagePreviewDialog({ open, image, onClose }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            TransitionComponent={Fade}
            PaperProps={{
                sx: {
                    bgcolor: 'rgba(0,0,0,0.9)',
                    backdropFilter: 'blur(20px)'
                }
            }}
        >
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    color: '#fff',
                    zIndex: 10
                }}
            >
                <Icon icon="mdi:close" width={28} />
            </IconButton>

            <Box
                sx={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
                }}
            >
                <Box
                    component="img"
                    src={image}
                    alt="Preview"
                    sx={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        borderRadius: 3,
                        objectFit: 'contain'
                    }}
                />
            </Box>
        </Dialog>
    );
}

/* ---------------- MAIN ---------------- */
export default function ViewCustomerDialog({ open, customer, onClose, onEdit, onDelete }) {
    const [tabValue, setTabValue] = useState(0);
    const [previewImage, setPreviewImage] = useState(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (!customer) return null;

    const formatDate = (ts) =>
        ts
            ? new Date(ts).toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
              })
            : 'Not available';

    const statusColor = (s) =>
        s === 'Active' ? '#34C759' : s === 'Expired' ? '#FF3B30' : '#8E8E93';

    // ✅ FIX: Check if customer has photos
    const hasPhotos = customer.carPhotos && 
        Object.values(customer.carPhotos).some(url => url && url.trim() !== '');

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                fullScreen={isMobile}
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : 4,
                        background: 'rgba(255,255,255,0.88)',
                        backdropFilter: 'blur(18px)'
                    }
                }}
            >
                {/* HEADER */}
                <DialogTitle sx={{ px: 3, pt: 3 }}>
                    <Box display="flex" justifyContent="space-between">
                        <Typography fontSize={20} fontWeight={600}>
                            Customer Details
                        </Typography>
                        <IconButton onClick={onClose}>
                            <Icon icon="mdi:close" />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ px: 3 }}>
                    {/* PROFILE */}
                    <Box display="flex" gap={2} mb={3}>
                        <Avatar
                            sx={{
                                width: 64,
                                height: 64,
                                bgcolor: '#007AFF',
                                fontSize: 28
                            }}
                        >
                            {customer.name?.[0]}
                        </Avatar>

                        <Box flex={1}>
                            <Typography fontSize={22} fontWeight={600}>
                                {customer.name}
                            </Typography>

                            <Box display="flex" gap={1} mt={0.5}>
                                <Chip
                                    size="small"
                                    label={customer.status || 'Active'}
                                    sx={{
                                        bgcolor: `${statusColor(customer.status || 'Active')}22`,
                                        color: statusColor(customer.status || 'Active')
                                    }}
                                />
                                <Typography fontSize={13} color="text.secondary">
                                    ID: {customer.id}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* TABS */}
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        variant="fullWidth"
                    >
                        <Tab label="Personal" />
                        <Tab label="Car" />
                        <Tab label="Photos" />
                    </Tabs>

                    <Divider sx={{ mb: 2 }} />

                    {/* PERSONAL */}
                    <TabPanel value={tabValue} index={0}>
                        <IOSCard>
                            <InfoRow label="Phone" value={customer.phone} icon="mdi:phone" />
                            <InfoRow label="Address" value={customer.address} icon="mdi:map-marker" />
                            <InfoRow label="Notes" value={customer.notes} icon="mdi:note-text" />
                            <InfoRow label="Created" value={formatDate(customer.createdAt)} icon="mdi:calendar-plus" />
                        </IOSCard>
                    </TabPanel>

                    {/* CAR */}
                    <TabPanel value={tabValue} index={1}>
                        <IOSCard>
                            <InfoRow label="Owner" value={customer.carData?.ownerName} icon="mdi:account" />
                            <InfoRow label="Brand" value={customer.carData?.carBrand} icon="mdi:car" />
                            <InfoRow label="Model" value={customer.carData?.carModel} icon="mdi:car-info" />
                            <InfoRow label="Plate" value={customer.carData?.plateNumber} icon="mdi:numeric" />
                        </IOSCard>
                    </TabPanel>

                    {/* PHOTOS - ✅ FIX HERE */}
                    <TabPanel value={tabValue} index={2}>
                        {hasPhotos ? (
                            <Grid container spacing={2}>
                                {Object.entries(customer.carPhotos || {})
                                    .filter(([_, url]) => typeof url === 'string' && url.trim() !== '')
                                    .map(([key, url]) => (
                                        <Grid item xs={12} sm={6} key={key}>
                                            <Paper
                                                onClick={() => setPreviewImage(url)}
                                                sx={{
                                                    p: 1,
                                                    borderRadius: 3,
                                                    bgcolor: '#F2F2F7',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        transform: 'scale(1.02)',
                                                        boxShadow: 2
                                                    }
                                                }}
                                            >
                                                <Typography fontSize={13} mb={1} fontWeight={500}>
                                                    {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                                                </Typography>

                                                <Box
                                                    component="img"
                                                    src={url}
                                                    alt={key}
                                                    sx={{
                                                        width: '100%',
                                                        height: 180,
                                                        objectFit: 'cover',
                                                        borderRadius: 2
                                                    }}
                                                />
                                            </Paper>
                                        </Grid>
                                    ))}
                            </Grid>
                        ) : (
                            <Box textAlign="center" py={6}>
                                <Icon icon="mdi:camera-off" width={64} color="#C7C7CC" />
                                <Typography mt={1} color="text.secondary">
                                    No photos uploaded
                                </Typography>
                            </Box>
                        )}
                    </TabPanel>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button sx={{ color: '#FF3B30' }} onClick={onDelete}>
                        Delete
                    </Button>
                    <Box flex={1} />
                    <Button onClick={onClose}>Close</Button>
                    <Button
                        variant="contained"
                        onClick={onEdit}
                        sx={{ bgcolor: '#007AFF', borderRadius: 3 }}
                    >
                        Edit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* IMAGE PREVIEW */}
            <ImagePreviewDialog
                open={Boolean(previewImage)}
                image={previewImage}
                onClose={() => setPreviewImage(null)}
            />
        </>
    );
}

/* ---------------- UI COMPONENTS ---------------- */
function IOSCard({ children }) {
    return (
        <Paper sx={{ p: 2, borderRadius: 3, bgcolor: '#F2F2F7' }}>
            {children}
        </Paper>
    );
}

function InfoRow({ label, value, icon }) {
    return (
        <Box display="flex" gap={1.5} mb={1.5}>
            <Icon icon={icon} width={20} color="#8E8E93" />
            <Box>
                <Typography fontSize={12} color="text.secondary">
                    {label}
                </Typography>
                <Typography fontSize={15} fontWeight={500}>
                    {value || 'Not available'}
                </Typography>
            </Box>
        </Box>
    );
}

ViewCustomerDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    customer: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
};

TabPanel.propTypes = {
    children: PropTypes.node,
    value: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired
};

ImagePreviewDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    image: PropTypes.string,
    onClose: PropTypes.func.isRequired
};

IOSCard.propTypes = {
    children: PropTypes.node
};

InfoRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
    icon: PropTypes.string.isRequired
};