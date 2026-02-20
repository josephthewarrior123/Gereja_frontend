import { Icon } from '@iconify/react';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Chip,
    Avatar,
    IconButton,
    Paper,
    Tab,
    Tabs,
    Divider,
    Stack,
    Dialog,
    Fade,
    CircularProgress
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';

/* ---------------- TAB PANEL ---------------- */
function TabPanel({ children, value, index }) {
    return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

/* ---------------- IMAGE PREVIEW DIALOG ---------------- */
function ImagePreviewDialog({ open, images, currentIndex, onIndexChange, onClose }) {
    if (!images || images.length === 0) return null;

    const currentImage = images[currentIndex];

    const handlePrevious = (e) => {
        e.stopPropagation();
        onIndexChange((currentIndex - 1 + images.length) % images.length);
    };

    const handleNext = (e) => {
        e.stopPropagation();
        onIndexChange((currentIndex + 1) % images.length);
    };

    const handleDownload = async (e) => {
        e.stopPropagation();
        try {
            const response = await fetch(currentImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Try to extract filename or use a default
            const filename = currentImage.split('/').pop().split('?')[0] || 'download.jpg';
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: open in new tab if blob download fails (CORS)
            window.open(currentImage, '_blank');
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            TransitionComponent={Fade}
            PaperProps={{
                sx: { bgcolor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)' }
            }}
        >
            {/* Header Controls */}
            <Box sx={{
                position: 'fixed', top: 0, left: 0, right: 0,
                p: 2, display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', zIndex: 10,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)'
            }}>
                <Typography sx={{ color: '#fff', fontWeight: 600, ml: 2 }}>
                    {currentIndex + 1} / {images.length}
                </Typography>

                <Stack direction="row" spacing={1.5}>
                    <IconButton
                        onClick={handleDownload}
                        sx={{
                            color: '#fff', bgcolor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                        }}
                        title="Download"
                    >
                        <Icon icon="mdi:download" width={24} />
                    </IconButton>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: '#fff', bgcolor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                        }}
                    >
                        <Icon icon="mdi:close" width={24} />
                    </IconButton>
                </Stack>
            </Box>

            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <IconButton
                        onClick={handlePrevious}
                        sx={{
                            position: 'absolute', left: 24, top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#fff', bgcolor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)', zIndex: 10,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                            display: { xs: 'none', md: 'flex' }
                        }}
                    >
                        <Icon icon="mdi:chevron-left" width={40} />
                    </IconButton>
                    <IconButton
                        onClick={handleNext}
                        sx={{
                            position: 'absolute', right: 24, top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#fff', bgcolor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)', zIndex: 10,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                            display: { xs: 'none', md: 'flex' }
                        }}
                    >
                        <Icon icon="mdi:chevron-right" width={40} />
                    </IconButton>
                </>
            )}

            {/* Image Container */}
            <Box
                onClick={onClose}
                sx={{
                    height: '100vh', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', position: 'relative', p: { xs: 2, md: 8 }
                }}
            >
                <Box
                    component="img"
                    src={currentImage}
                    alt="Preview"
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        maxWidth: '100%', maxHeight: '100%', borderRadius: 2,
                        objectFit: 'contain', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        transition: 'transform 0.3s ease-out'
                    }}
                />

                {/* Mobile Navigation Area (Tap left/right) */}
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: '30%',
                    zIndex: 5, cursor: 'pointer', display: { xs: 'block', md: 'none' }
                }} onClick={handlePrevious} />
                <Box sx={{
                    position: 'absolute', top: 0, right: 0, bottom: 0, width: '30%',
                    zIndex: 5, cursor: 'pointer', display: { xs: 'block', md: 'none' }
                }} onClick={handleNext} />
            </Box>
        </Dialog>
    );
}

/* ---------------- INFO CARD ---------------- */
function InfoCard({ title, children }) {
    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2.5, fontSize: '1rem' }}>
                {title}
            </Typography>
            <Stack spacing={2.5}>{children}</Stack>
        </Paper>
    );
}

/* ---------------- INFO ROW ---------------- */
function InfoRow({ label, value, icon, fullWidth }) {
    return (
        <Box>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box sx={{
                    mt: 0.5, width: 36, height: 36, borderRadius: 2,
                    bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0
                }}>
                    <Icon icon={icon} width={18} color="#1E40AF" />
                </Box>
                <Box flex={1}>
                    <Typography variant="caption" sx={{
                        color: '#64748B', fontSize: '0.8125rem', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 0.5
                    }}>
                        {label}
                    </Typography>
                    <Typography variant="body1" sx={{
                        color: '#1E293B', fontSize: '0.9375rem', fontWeight: 500,
                        lineHeight: 1.6, wordBreak: fullWidth ? 'break-word' : 'normal'
                    }}>
                        {value || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Not available</span>}
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function CustomerDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const message = useAlert();
    const loadingProvider = useLoading();

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [previewState, setPreviewState] = useState({ open: false, images: [], index: 0 });

    useEffect(() => {
        fetchCustomer();
    }, [id]);

    const fetchCustomer = async () => {
        try {
            loadingProvider.start();
            const response = await CustomerDAO.getCustomerById(id);
            if (response.success) {
                setCustomer(response.customer);
            } else {
                message(response.error || 'Customer not found', 'error');
                navigate('/customers');
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
            message('Failed to fetch customer data', 'error');
            navigate('/customers');
        } finally {
            loadingProvider.stop();
            setLoading(false);
        }
    };

    const formatDate = (ts) =>
        ts
            ? new Date(ts).toLocaleString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
            : 'Not available';

    const formatCurrency = (value) => {
        if (!value) return 'Not available';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(value);
    };

    const statusColor = (s) => {
        switch (s) {
            case 'Active': return '#10B981';
            case 'Expired': return '#DC2626';
            default: return '#64748B';
        }
    };

    const statusBgColor = (s) => {
        switch (s) {
            case 'Active': return '#D1FAE5';
            case 'Expired': return '#FEE2E2';
            default: return '#F1F5F9';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!customer) return null;

    const hasPhotos = customer.carPhotos &&
        Object.values(customer.carPhotos).some(url => url && url.trim() !== '');

    const hasDocuments = customer.documentPhotos &&
        Object.values(customer.documentPhotos).some(url => url && url.trim() !== '');

    return (
        <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', pb: 6 }}>
            <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>

                {/* ── HEADER ── */}
                <Box sx={{ mb: 5 }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                        spacing={3}
                        sx={{ mb: 4 }}
                    >
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E293B', mb: 1, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                                Customer Details
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.875rem', fontWeight: 500 }}>
                                Customer ID: <Box component="span" sx={{ color: '#475569' }}>{id}</Box>
                            </Typography>
                        </Box>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <Button
                                variant="outlined"
                                startIcon={<Icon icon="mdi:arrow-left" />}
                                onClick={() => navigate('/customers')}
                                sx={{
                                    borderColor: '#E2E8F0', color: '#475569', fontWeight: 600,
                                    px: 3, py: 1.25, textTransform: 'none', fontSize: '0.9375rem',
                                    borderRadius: 2,
                                    '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
                                }}
                            >
                                Back to List
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Icon icon="mdi:pencil" />}
                                onClick={() => navigate(`/customers/edit/${id}`)}
                                sx={{
                                    bgcolor: '#1E40AF', color: '#fff', fontWeight: 600,
                                    px: 3, py: 1.25, textTransform: 'none', fontSize: '0.9375rem',
                                    borderRadius: 2, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
                                    '&:hover': { bgcolor: '#1E3A8A' }
                                }}
                            >
                                Edit Customer
                            </Button>
                        </Stack>
                    </Stack>

                    <Divider sx={{ borderColor: '#E2E8F0' }} />
                </Box>

                {/* ── PROFILE CARD ── */}
                <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'center', sm: 'flex-start' }}>
                        <Avatar sx={{
                            width: 80, height: 80, bgcolor: '#1E40AF',
                            fontSize: '2rem', fontWeight: 700,
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        }}>
                            {customer.name?.[0]?.toUpperCase()}
                        </Avatar>

                        <Box flex={1} sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E293B', mb: 1, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                                {customer.name}
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'center', sm: 'flex-start' }} sx={{ mb: 1 }}>
                                <Chip
                                    label={customer.status || 'Active'}
                                    size="medium"
                                    sx={{
                                        bgcolor: statusBgColor(customer.status || 'Active'),
                                        color: statusColor(customer.status || 'Active'),
                                        fontWeight: 600, fontSize: '0.875rem', height: 32, borderRadius: 2
                                    }}
                                />
                                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Icon icon="mdi:identifier" width={16} />
                                    {customer.id}
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>

                {/* ── TABS ── */}
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden', mb: 4 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            bgcolor: '#fff',
                            '& .MuiTab-root': {
                                textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem',
                                color: '#64748B', py: 2, minHeight: 56,
                                '&.Mui-selected': { color: '#1E40AF' }
                            },
                            '& .MuiTabs-indicator': { height: 3, bgcolor: '#1E40AF', borderRadius: '3px 3px 0 0' }
                        }}
                    >
                        <Tab label="Personal Info" icon={<Icon icon="mdi:account" width={20} />} iconPosition="start" />
                        <Tab label="Vehicle" icon={<Icon icon="mdi:car" width={20} />} iconPosition="start" />
                        <Tab label="Photos" icon={<Icon icon="mdi:camera" width={20} />} iconPosition="start" />
                        <Tab label="Documents" icon={<Icon icon="mdi:file-document" width={20} />} iconPosition="start" />
                    </Tabs>
                </Paper>

                {/* ── TAB: PERSONAL INFO ── */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <InfoCard title="Contact Information">
                                <InfoRow label="Phone Number" value={customer.phone} icon="mdi:phone" />
                                <InfoRow label="Address" value={customer.address} icon="mdi:map-marker" />
                            </InfoCard>
                        </Grid>
                        <Grid item xs={12}>
                            <InfoCard title="Additional Information">
                                <InfoRow label="Notes" value={customer.notes} icon="mdi:note-text" fullWidth />
                                <InfoRow label="Registration Date" value={formatDate(customer.createdAt)} icon="mdi:calendar-plus" />
                                <InfoRow label="Last Updated" value={formatDate(customer.updatedAt)} icon="mdi:calendar-edit" />
                            </InfoCard>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* ── TAB: VEHICLE ── */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <InfoCard title="Owner Details">
                                <InfoRow label="Owner Name" value={customer.carData?.ownerName} icon="mdi:account-circle" />
                            </InfoCard>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <InfoCard title="Vehicle Identity">
                                <InfoRow label="Plate Number" value={customer.carData?.plateNumber} icon="mdi:numeric" />
                            </InfoCard>
                        </Grid>
                        <Grid item xs={12}>
                            <InfoCard title="Vehicle Specifications">
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <InfoRow label="Brand" value={customer.carData?.carBrand} icon="mdi:car" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <InfoRow label="Model" value={customer.carData?.carModel} icon="mdi:car-info" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <InfoRow label="Chassis Number" value={customer.carData?.chassisNumber} icon="mdi:barcode" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <InfoRow label="Engine Number" value={customer.carData?.engineNumber} icon="mdi:engine" />
                                    </Grid>
                                </Grid>
                            </InfoCard>
                        </Grid>
                        <Grid item xs={12}>
                            <InfoCard title="Financial & Insurance">
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <InfoRow label="Vehicle Price" value={formatCurrency(customer.carData?.carPrice)} icon="mdi:cash" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <InfoRow label="Insurance Due Date" value={customer.carData?.dueDate || 'Not set'} icon="mdi:calendar-clock" />
                                    </Grid>
                                </Grid>
                            </InfoCard>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* ── TAB: PHOTOS ── */}
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
                                                borderRadius: 3, border: '1px solid #E2E8F0',
                                                overflow: 'hidden', cursor: 'pointer',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                    borderColor: '#1E40AF'
                                                }
                                            }}
                                        >
                                            <Box sx={{ p: 2, bgcolor: '#F8FAFC' }}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Icon icon="mdi:camera" width={18} color="#1E40AF" />
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E293B', textTransform: 'capitalize' }}>
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                            <Box
                                                component="img"
                                                src={url}
                                                alt={key}
                                                onClick={(e) => {
                                                    const allPhotos = Object.values(customer.carPhotos || {}).filter(u => typeof u === 'string' && u.trim() !== '');
                                                    const idx = allPhotos.indexOf(url);
                                                    setPreviewState({ open: true, images: allPhotos, index: idx });
                                                }}
                                                sx={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
                                            />
                                        </Paper>
                                    </Grid>
                                ))}
                        </Grid>
                    ) : (
                        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 3, border: '2px dashed #E2E8F0', bgcolor: '#F8FAFC' }}>
                            <Icon icon="mdi:camera-off" width={64} color="#CBD5E1" />
                            <Typography variant="h6" sx={{ mt: 2, color: '#64748B', fontWeight: 600 }}>No photos uploaded</Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: '#94A3B8' }}>Vehicle photos will appear here once uploaded</Typography>
                        </Paper>
                    )}
                </TabPanel>

                {/* ── TAB: DOCUMENTS ── */}
                <TabPanel value={tabValue} index={3}>
                    {hasDocuments ? (
                        <Grid container spacing={3}>
                            {Object.entries(customer.documentPhotos || {})
                                .filter(([_, url]) => typeof url === 'string' && url.trim() !== '')
                                .map(([key, url]) => (
                                    <Grid item xs={12} sm={6} md={4} key={key}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                borderRadius: 3, border: '1px solid #E2E8F0',
                                                overflow: 'hidden',
                                                cursor: url.includes('pdf') ? 'default' : 'pointer',
                                                transition: 'all 0.2s ease-in-out',
                                                '&:hover': url.includes('pdf') ? {} : {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                    borderColor: '#1E40AF'
                                                }
                                            }}
                                        >
                                            <Box sx={{ p: 2, bgcolor: '#F8FAFC' }}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Icon icon="mdi:file-document" width={18} color="#1E40AF" />
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1E293B', textTransform: 'uppercase' }}>
                                                        {key}
                                                    </Typography>
                                                    <Chip
                                                        label="Uploaded"
                                                        size="small"
                                                        sx={{ ml: 'auto', bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600, fontSize: '0.7rem' }}
                                                    />
                                                </Stack>
                                            </Box>
                                            {url.includes('pdf') ? (
                                                <Box sx={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F1F5F9', gap: 1 }}>
                                                    <Icon icon="mdi:file-pdf-box" width={56} color="#DC2626" />
                                                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>PDF Document</Typography>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<Icon icon="mdi:open-in-new" width={14} />}
                                                        onClick={(e) => { e.stopPropagation(); window.open(url, '_blank'); }}
                                                        sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.75rem', mt: 0.5 }}
                                                    >
                                                        Open PDF
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Box
                                                    component="img"
                                                    src={url}
                                                    alt={key}
                                                    onClick={() => {
                                                        const allDocs = Object.values(customer.documentPhotos || {})
                                                            .filter(u => typeof u === 'string' && u.trim() !== '' && !u.includes('pdf'));
                                                        const idx = allDocs.indexOf(url);
                                                        setPreviewState({ open: true, images: allDocs, index: idx });
                                                    }}
                                                    sx={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                                                />
                                            )}
                                        </Paper>
                                    </Grid>
                                ))}
                        </Grid>
                    ) : (
                        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 3, border: '2px dashed #E2E8F0', bgcolor: '#F8FAFC' }}>
                            <Icon icon="mdi:file-document-outline" width={64} color="#CBD5E1" />
                            <Typography variant="h6" sx={{ mt: 2, color: '#64748B', fontWeight: 600 }}>No documents uploaded</Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: '#94A3B8' }}>Customer documents will appear here once uploaded</Typography>
                        </Paper>
                    )}
                </TabPanel>

            </Container>

            {/* Image fullscreen preview */}
            <ImagePreviewDialog
                open={previewState.open}
                images={previewState.images}
                currentIndex={previewState.index}
                onIndexChange={(newIndex) => setPreviewState(prev => ({ ...prev, index: newIndex }))}
                onClose={() => setPreviewState({ open: false, images: [], index: 0 })}
            />
        </Box>
    );
}
