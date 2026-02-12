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
    Fade,
    Stack
} from '@mui/material';
import { useState } from 'react';
import PropTypes from 'prop-types';

/* ---------------- TAB PANEL ---------------- */
function TabPanel({ children, value, index }) {
    return value === index && <Box sx={{ pt: 3 }}>{children}</Box>;
}

/* ---------------- IMAGE PREVIEW DIALOG ---------------- */
function ImagePreviewDialog({ open, image, onClose }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            TransitionComponent={Fade}
            PaperProps={{
                sx: {
                    bgcolor: 'rgba(0,0,0,0.95)',
                    backdropFilter: 'blur(20px)'
                }
            }}
        >
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    top: 24,
                    right: 24,
                    color: '#fff',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 10,
                    '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)'
                    }
                }}
            >
                <Icon icon="mdi:close" width={24} />
            </IconButton>

            <Box
                sx={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3
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
                        objectFit: 'contain',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                />
            </Box>
        </Dialog>
    );
}

/* ---------------- MAIN COMPONENT ---------------- */
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

    const formatCurrency = (value) => {
        if (!value) return 'Not available';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    const statusColor = (s) => {
        switch(s) {
            case 'Active': return '#10B981';
            case 'Expired': return '#DC2626';
            default: return '#64748B';
        }
    };

    const statusBgColor = (s) => {
        switch(s) {
            case 'Active': return '#D1FAE5';
            case 'Expired': return '#FEE2E2';
            default: return '#F1F5F9';
        }
    };

    // Check if customer has photos
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
                        borderRadius: isMobile ? 0 : 3,
                        bgcolor: '#fff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }
                }}
            >
                {/* HEADER */}
                <DialogTitle sx={{ 
                    px: { xs: 3, sm: 4 }, 
                    pt: { xs: 3, sm: 4 },
                    pb: 0
                }}>
                    <Stack 
                        direction="row" 
                        justifyContent="space-between" 
                        alignItems="center"
                    >
                        <Typography 
                            variant="h5"
                            sx={{ 
                                fontWeight: 700,
                                color: '#1E293B',
                                fontSize: { xs: '1.25rem', sm: '1.5rem' }
                            }}
                        >
                            Customer Details
                        </Typography>
                        <IconButton 
                            onClick={onClose}
                            sx={{
                                color: '#64748B',
                                '&:hover': {
                                    bgcolor: '#F1F5F9'
                                }
                            }}
                        >
                            <Icon icon="mdi:close" width={24} />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ px: { xs: 3, sm: 4 }, py: 3 }}>
                    {/* PROFILE SECTION */}
                    <Paper
                        elevation={0}
                        sx={{ 
                            p: 3,
                            mb: 3,
                            borderRadius: 3,
                            border: '1px solid #E2E8F0',
                            bgcolor: '#F8FAFC'
                        }}
                    >
                        <Stack 
                            direction={{ xs: 'column', sm: 'row' }} 
                            spacing={3}
                            alignItems={{ xs: 'center', sm: 'flex-start' }}
                        >
                            <Avatar
                                sx={{
                                    width: 80,
                                    height: 80,
                                    bgcolor: '#1E40AF',
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                {customer.name?.[0]?.toUpperCase()}
                            </Avatar>

                            <Box flex={1} sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                                <Typography 
                                    variant="h4"
                                    sx={{ 
                                        fontWeight: 700,
                                        color: '#1E293B',
                                        mb: 1,
                                        fontSize: { xs: '1.5rem', sm: '1.75rem' }
                                    }}
                                >
                                    {customer.name}
                                </Typography>

                                <Stack 
                                    direction={{ xs: 'column', sm: 'row' }} 
                                    spacing={1.5} 
                                    alignItems={{ xs: 'center', sm: 'flex-start' }}
                                    sx={{ mb: 1 }}
                                >
                                    <Chip
                                        label={customer.status || 'Active'}
                                        size="medium"
                                        sx={{
                                            bgcolor: statusBgColor(customer.status || 'Active'),
                                            color: statusColor(customer.status || 'Active'),
                                            fontWeight: 600,
                                            fontSize: '0.875rem',
                                            height: 32,
                                            borderRadius: 2
                                        }}
                                    />
                                    <Typography 
                                        variant="body2"
                                        sx={{ 
                                            color: '#64748B',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5
                                        }}
                                    >
                                        <Icon icon="mdi:identifier" width={16} />
                                        {customer.id}
                                    </Typography>
                                </Stack>
                            </Box>
                        </Stack>
                    </Paper>

                    {/* TABS */}
                    <Paper
                        elevation={0}
                        sx={{ 
                            borderRadius: 3,
                            border: '1px solid #E2E8F0',
                            overflow: 'hidden',
                            mb: 3
                        }}
                    >
                        <Tabs
                            value={tabValue}
                            onChange={(_, v) => setTabValue(v)}
                            variant="fullWidth"
                            sx={{
                                bgcolor: '#fff',
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.9375rem',
                                    color: '#64748B',
                                    py: 2,
                                    minHeight: 56,
                                    '&.Mui-selected': {
                                        color: '#1E40AF'
                                    }
                                },
                                '& .MuiTabs-indicator': {
                                    height: 3,
                                    bgcolor: '#1E40AF',
                                    borderRadius: '3px 3px 0 0'
                                }
                            }}
                        >
                            <Tab 
                                label="Personal Info" 
                                icon={<Icon icon="mdi:account" width={20} />}
                                iconPosition="start"
                            />
                            <Tab 
                                label="Vehicle" 
                                icon={<Icon icon="mdi:car" width={20} />}
                                iconPosition="start"
                            />
                            <Tab 
                                label="Photos" 
                                icon={<Icon icon="mdi:camera" width={20} />}
                                iconPosition="start"
                            />
                        </Tabs>
                    </Paper>

                    {/* TAB CONTENT */}
                    
                    {/* PERSONAL INFO TAB */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <InfoCard title="Contact Information">
                                    <InfoRow 
                                        label="Phone Number" 
                                        value={customer.phone} 
                                        icon="mdi:phone"
                                    />
                                    <InfoRow 
                                        label="Address" 
                                        value={customer.address} 
                                        icon="mdi:map-marker"
                                    />
                                </InfoCard>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <InfoCard title="Additional Information">
                                    <InfoRow 
                                        label="Notes" 
                                        value={customer.notes} 
                                        icon="mdi:note-text"
                                        fullWidth
                                    />
                                    <InfoRow 
                                        label="Registration Date" 
                                        value={formatDate(customer.createdAt)} 
                                        icon="mdi:calendar-plus"
                                    />
                                    <InfoRow 
                                        label="Last Updated" 
                                        value={formatDate(customer.updatedAt)} 
                                        icon="mdi:calendar-edit"
                                    />
                                </InfoCard>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* VEHICLE TAB */}
                    <TabPanel value={tabValue} index={1}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <InfoCard title="Owner Details">
                                    <InfoRow 
                                        label="Owner Name" 
                                        value={customer.carData?.ownerName} 
                                        icon="mdi:account-circle"
                                    />
                                </InfoCard>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <InfoCard title="Vehicle Identity">
                                    <InfoRow 
                                        label="Plate Number" 
                                        value={customer.carData?.plateNumber} 
                                        icon="mdi:numeric"
                                    />
                                </InfoCard>
                            </Grid>

                            <Grid item xs={12}>
                                <InfoCard title="Vehicle Specifications">
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <InfoRow 
                                                label="Brand" 
                                                value={customer.carData?.carBrand} 
                                                icon="mdi:car"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <InfoRow 
                                                label="Model" 
                                                value={customer.carData?.carModel} 
                                                icon="mdi:car-info"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <InfoRow 
                                                label="Chassis Number" 
                                                value={customer.carData?.chassisNumber} 
                                                icon="mdi:barcode"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <InfoRow 
                                                label="Engine Number" 
                                                value={customer.carData?.engineNumber} 
                                                icon="mdi:engine"
                                            />
                                        </Grid>
                                    </Grid>
                                </InfoCard>
                            </Grid>

                            <Grid item xs={12}>
                                <InfoCard title="Financial & Insurance">
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <InfoRow 
                                                label="Vehicle Price" 
                                                value={formatCurrency(customer.carData?.carPrice)} 
                                                icon="mdi:cash"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <InfoRow 
                                                label="Insurance Due Date" 
                                                value={customer.carData?.dueDate || 'Not set'} 
                                                icon="mdi:calendar-clock"
                                            />
                                        </Grid>
                                    </Grid>
                                </InfoCard>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* PHOTOS TAB */}
                    <TabPanel value={tabValue} index={2}>
                        {hasPhotos ? (
                            <Grid container spacing={3}>
                                {Object.entries(customer.carPhotos || {})
                                    .filter(([_, url]) => typeof url === 'string' && url.trim() !== '')
                                    .map(([key, url]) => (
                                        <Grid item xs={12} sm={6} md={6} key={key}>
                                            <Paper
                                                elevation={0}
                                                onClick={() => setPreviewImage(url)}
                                                sx={{
                                                    borderRadius: 3,
                                                    border: '1px solid #E2E8F0',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease-in-out',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                        borderColor: '#1E40AF'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ p: 2, bgcolor: '#F8FAFC' }}>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Icon icon="mdi:camera" width={18} color="#1E40AF" />
                                                        <Typography 
                                                            variant="subtitle2"
                                                            sx={{ 
                                                                fontWeight: 600,
                                                                color: '#1E293B',
                                                                textTransform: 'capitalize'
                                                            }}
                                                        >
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </Typography>
                                                    </Stack>
                                                </Box>

                                                <Box
                                                    component="img"
                                                    src={url}
                                                    alt={key}
                                                    sx={{
                                                        width: '100%',
                                                        height: 220,
                                                        objectFit: 'cover',
                                                        display: 'block'
                                                    }}
                                                />
                                            </Paper>
                                        </Grid>
                                    ))}
                            </Grid>
                        ) : (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 8,
                                    textAlign: 'center',
                                    borderRadius: 3,
                                    border: '2px dashed #E2E8F0',
                                    bgcolor: '#F8FAFC'
                                }}
                            >
                                <Icon icon="mdi:camera-off" width={64} color="#CBD5E1" />
                                <Typography 
                                    variant="h6"
                                    sx={{ 
                                        mt: 2,
                                        color: '#64748B',
                                        fontWeight: 600
                                    }}
                                >
                                    No photos uploaded
                                </Typography>
                                <Typography 
                                    variant="body2"
                                    sx={{ 
                                        mt: 1,
                                        color: '#94A3B8'
                                    }}
                                >
                                    Vehicle photos will appear here once uploaded
                                </Typography>
                            </Paper>
                        )}
                    </TabPanel>
                </DialogContent>

                {/* FOOTER ACTIONS */}
                <DialogActions sx={{ 
                    px: { xs: 3, sm: 4 }, 
                    pb: { xs: 3, sm: 4 },
                    pt: 2,
                    borderTop: '1px solid #E2E8F0',
                    gap: 1.5
                }}>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={onDelete}
                        startIcon={<Icon icon="mdi:delete" />}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 3,
                            py: 1.25,
                            borderColor: '#FEE2E2',
                            color: '#DC2626',
                            '&:hover': {
                                borderColor: '#DC2626',
                                bgcolor: '#FEF2F2'
                            }
                        }}
                    >
                        Delete
                    </Button>
                    
                    <Box flex={1} />
                    
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 3,
                            py: 1.25,
                            borderColor: '#E2E8F0',
                            color: '#475569',
                            '&:hover': {
                                borderColor: '#CBD5E1',
                                bgcolor: '#F8FAFC'
                            }
                        }}
                    >
                        Close
                    </Button>
                    
                    <Button
                        variant="contained"
                        onClick={onEdit}
                        startIcon={<Icon icon="mdi:pencil" />}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 3,
                            py: 1.25,
                            bgcolor: '#1E40AF',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                            '&:hover': {
                                bgcolor: '#1E3A8A',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }
                        }}
                    >
                        Edit Customer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* IMAGE PREVIEW DIALOG */}
            <ImagePreviewDialog
                open={Boolean(previewImage)}
                image={previewImage}
                onClose={() => setPreviewImage(null)}
            />
        </>
    );
}

/* ---------------- REUSABLE UI COMPONENTS ---------------- */

function InfoCard({ title, children }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                bgcolor: '#fff',
                height: '100%'
            }}
        >
            <Typography
                variant="subtitle1"
                sx={{
                    fontWeight: 700,
                    color: '#1E293B',
                    mb: 2.5,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                {title}
            </Typography>
            <Stack spacing={2.5}>
                {children}
            </Stack>
        </Paper>
    );
}

function InfoRow({ label, value, icon, fullWidth }) {
    return (
        <Box>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                    sx={{
                        mt: 0.5,
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                >
                    <Icon icon={icon} width={18} color="#1E40AF" />
                </Box>
                <Box flex={1}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#64748B',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'block',
                            mb: 0.5
                        }}
                    >
                        {label}
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#1E293B',
                            fontSize: '0.9375rem',
                            fontWeight: 500,
                            lineHeight: 1.6,
                            wordBreak: fullWidth ? 'break-word' : 'normal'
                        }}
                    >
                        {value || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Not available</span>}
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}

/* ---------------- PROPTYPES ---------------- */

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

InfoCard.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired
};

InfoRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
    icon: PropTypes.string.isRequired,
    fullWidth: PropTypes.bool
};