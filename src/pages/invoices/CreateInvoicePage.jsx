import { Icon } from '@iconify/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    TextField,
    Grid,
    Paper,
    Divider,
    Container,
    IconButton,
    Dialog,
    useMediaQuery,
    useTheme,
    Stack,
    InputAdornment,
} from '@mui/material';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';
import CompanyDAO from '../../daos/CompanyDao';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CreateInvoicePage() {
    const navigate = useNavigate();
    const loading = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // ============ Company / Header ============
    const [companyProfile, setCompanyProfile] = useState(null);
    const [companyName, setCompanyName] = useState('PT. JAYAINDO ARTHA SUKSES');
    const [companySubtitle, setCompanySubtitle] = useState('INSURANCE AGENCY');
    const [companyCity, setCompanyCity] = useState('Jakarta');

    // ============ Customer Selection ============
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');

    // ============ Invoice Data ============
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [items, setItems] = useState([
        { description: '', quantity: 1, price: 0 }
    ]);
    const [adminFee, setAdminFee] = useState(0);
    const [stampDuty, setStampDuty] = useState(0);

    // ============ Preview Dialog ============
    const [openPreviewDialog, setOpenPreviewDialog] = useState(false);

    // ============ Effects ============
    useEffect(() => {
        fetchCompanyProfile();
        fetchCustomers();
        generateInvoiceNumber();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ============ Helpers ============
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    };

    // PDF uses "Rp 500.000" format with explicit space
    const formatCurrencyPDF = (value) => {
        return 'Rp ' + new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    };

    // ============ Fetch Company Profile ============
    const fetchCompanyProfile = async () => {
        try {
            const response = await CompanyDAO.getCompanyProfile();
            if (response.success && response.profile) {
                setCompanyProfile(response.profile);
                setCompanyName(response.profile.companyName || 'PT. JAYAINDO ARTHA SUKSES');
                setCompanySubtitle(response.profile.companySubtitle || 'INSURANCE AGENCY');
                setCompanyCity(response.profile.companyCity || 'Jakarta');
            }
        } catch (error) {
            console.error('Error fetching company profile:', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            loading.start();
            const response = await CustomerDAO.getAllCustomers();
            if (response.success) setCustomers(response.customers || []);
            else message('Failed to load customers', 'error');
        } catch (error) {
            console.error('Error fetching customers:', error);
            message('Failed to load customers', 'error');
        } finally {
            loading.stop();
        }
    };

    const generateInvoiceNumber = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        setInvoiceNumber(`INV-${year}${month}-${random}`);
    };

    const handleSaveCompanyProfile = async () => {
        try {
            if (!companyName || companyName.trim() === '') {
                message('Company name is required', 'error');
                return;
            }

            loading.start();

            const profileData = {
                companyName: companyName.trim(),
                companySubtitle: companySubtitle?.trim() || '',
                companyCity: companyCity?.trim() || ''
            };

            let profileResponse;

            if (companyProfile && companyProfile.createdAt) {
                profileResponse = await CompanyDAO.updateCompanyProfile(profileData);
            } else {
                profileResponse = await CompanyDAO.createCompanyProfile(profileData);
            }

            if (!profileResponse.success) {
                message(profileResponse.error || 'Failed to save company profile', 'error');
                return;
            }

            message('Company profile saved successfully!', 'success');
            await fetchCompanyProfile();

        } catch (error) {
            console.error('Error saving company profile:', error);
            message('Failed to save company profile', 'error');
        } finally {
            loading.stop();
        }
    };

    // ============ Item Handlers ============
    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: 1, price: 0 }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const calculateSubtotal = () => {
        return items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.price)), 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + Number(adminFee) + Number(stampDuty);
    };

    const handleSubmit = async () => {
        if (!selectedCustomer) {
            message('Please select a customer', 'error');
            return;
        }
        if (items.length === 0) {
            message('Please add at least one item', 'error');
            return;
        }

        setOpenPreviewDialog(true);
    };

    const handleConfirmDownload = () => {
        try {
            loading.start();
            generatePDF();
            message('Invoice PDF generated successfully!', 'success');
            setOpenPreviewDialog(false);
        } catch (error) {
            console.error('Error creating invoice:', error);
            message('Failed to generate invoice', 'error');
        } finally {
            loading.stop();
        }
    };

    const handleReset = () => {
        setSelectedCustomer(null);
        setItems([{ description: '', quantity: 1, price: 0 }]);
        setAdminFee(0);
        setStampDuty(0);
        generateInvoiceNumber();
    };

    // ============ PDF ============
    const generatePDF = () => {
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();

        const marginX = 18;
        const rightX = pageWidth - marginX;

        let currentY = 18;

        // ── Company Name ──
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(30, 30, 30);
        doc.text((companyName || '').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
        currentY += 6;

        // ── Subtitle ──
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text((companySubtitle || '').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;

        // ── INVOICE title ──
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.text('INVOICE', pageWidth / 2, currentY, { align: 'center' });
        currentY += 11;

        // ── Invoice Number (left) & Date (right) ──
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);

        const dateStr = new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        doc.text(`No. ${invoiceNumber}`, marginX, currentY);
        doc.text(`${companyCity || 'Jakarta'}, ${dateStr}`, rightX, currentY, { align: 'right' });
        currentY += 13;

        // ── Bill To section ──
        // FIX: fixed column positions so label / colon / value are perfectly aligned
        const labelX = marginX;       // "Bill To", "Address", "Vehicle"
        const colonX = marginX + 30;  // the ":" character
        const valueX = marginX + 34;  // value text starts here

        const drawRow = (y, label, value) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(30, 30, 30);
            doc.text(label, labelX, y);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            doc.text(':', colonX, y);
            doc.text(String(value ?? '-'), valueX, y);
        };

        drawRow(currentY, 'Bill To', selectedCustomer?.name || '-');
        currentY += 7;
        drawRow(currentY, 'Address', selectedCustomer?.address || '-');
        currentY += 7;

        if (selectedCustomer?.carData) {
            const vehicleStr = [
                selectedCustomer.carData?.carBrand,
                selectedCustomer.carData?.carModel,
                selectedCustomer.carData?.plateNumber
                    ? `(${selectedCustomer.carData.plateNumber})`
                    : ''
            ].filter(Boolean).join(' ');
            drawRow(currentY, 'Vehicle', vehicleStr);
            currentY += 7;
        }

        currentY += 6;

        // ── Table ──
        // FIX: only include items where description is filled
        const validItems = items.filter(
            (item) => item.description && item.description.trim() !== ''
        );

        const tableBody = validItems.map((item) => [
            item.description,
            { content: String(Number(item.quantity)), styles: { halign: 'center' } },
            { content: formatCurrencyPDF(item.price), styles: { halign: 'right' } },
            { content: formatCurrencyPDF(Number(item.quantity) * Number(item.price)), styles: { halign: 'right' } }
        ]);

        if (Number(adminFee) > 0) {
            tableBody.push([
                'Admin Fee',
                { content: '1', styles: { halign: 'center' } },
                { content: formatCurrencyPDF(adminFee), styles: { halign: 'right' } },
                { content: formatCurrencyPDF(adminFee), styles: { halign: 'right' } }
            ]);
        }

        if (Number(stampDuty) > 0) {
            tableBody.push([
                'Stamp Duty',
                { content: '1', styles: { halign: 'center' } },
                { content: formatCurrencyPDF(stampDuty), styles: { halign: 'right' } },
                { content: formatCurrencyPDF(stampDuty), styles: { halign: 'right' } }
            ]);
        }

        // Total row
        tableBody.push([
            {
                content: 'Total',
                colSpan: 3,
                styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 255, 255] }
            },
            {
                content: formatCurrencyPDF(calculateTotal()),
                styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 255, 255] }
            }
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Description', 'Qty', 'Unit Price', 'Amount']],
            body: tableBody,
            theme: 'striped',
            styles: {
                fontSize: 10,
                cellPadding: 3,
                overflow: 'linebreak',
                textColor: [40, 40, 40],
            },
            headStyles: {
                fillColor: [66, 66, 66],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            columnStyles: {
                0: { cellWidth: 'auto', halign: 'left' },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 38, halign: 'right' },
                3: { cellWidth: 38, halign: 'right' }
            },
            didParseCell: (data) => {
                if (data.section === 'head') {
                    if (data.column.index === 1) data.cell.styles.halign = 'center';
                    if (data.column.index === 2) data.cell.styles.halign = 'right';
                    if (data.column.index === 3) data.cell.styles.halign = 'right';
                }
            },
            margin: { left: marginX, right: marginX }
        });

        // ── Payment note ──
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text('Payment Terms: Due upon receipt', marginX, finalY);

        doc.save(`Invoice_${invoiceNumber}.pdf`);
    };

    // ============ UI helpers ============
    const filteredCustomers = useMemo(() => {
        const search = customerSearch.toLowerCase();
        return customers.filter((c) => {
            return (
                c.name?.toLowerCase().includes(search) ||
                c.phone?.toLowerCase().includes(search) ||
                c.carData?.carBrand?.toLowerCase().includes(search) ||
                c.carData?.plateNumber?.toLowerCase().includes(search)
            );
        });
    }, [customers, customerSearch]);

    return (
        <Box sx={{ bgcolor: '#F8F9FA', minHeight: '100vh' }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={600} sx={{ color: '#1a1a1a' }}>
                        Create Invoice
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {/* LEFT COLUMN */}
                    <Grid item xs={12} md={7}>
                        {/* Company Header Section */}
                        <Card
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                                border: '1px solid #E8E8E8',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                    <Icon icon="mdi:office-building" width={20} color="#1976d2" />
                                    <Typography fontSize={15} fontWeight={600} sx={{ color: '#1a1a1a' }}>
                                        Company Header (PDF)
                                    </Typography>
                                </Box>

                                <Grid container spacing={2.5}>
                                    <Grid item xs={12}>
                                        <Grid container spacing={2.5}>
                                            <Grid item xs={12}>
                                                <Typography fontSize={13} fontWeight={500} mb={1} sx={{ color: '#5a5a5a' }}>
                                                    Company Name *
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    value={companyName}
                                                    onChange={(e) => setCompanyName(e.target.value)}
                                                    placeholder="e.g., PT. Maju Jaya Abadi"
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography fontSize={13} fontWeight={500} mb={1} sx={{ color: '#5a5a5a' }}>
                                                    Subtitle
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    value={companySubtitle}
                                                    onChange={(e) => setCompanySubtitle(e.target.value)}
                                                    placeholder="e.g., INSURANCE AGENCY"
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography fontSize={13} fontWeight={500} mb={1} sx={{ color: '#5a5a5a' }}>
                                                    City
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    value={companyCity}
                                                    onChange={(e) => setCompanyCity(e.target.value)}
                                                    placeholder="e.g., Jakarta"
                                                    size="small"
                                                />
                                            </Grid>
                                        </Grid>
                                        <Box mt={2} display="flex" justifyContent="flex-end">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={handleSaveCompanyProfile}
                                                startIcon={<Icon icon="mdi:content-save" />}
                                            >
                                                Save Profile
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Customer Section */}
                        <Card
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                                border: '1px solid #E8E8E8',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                    <Icon icon="mdi:account" width={20} color="#1976d2" />
                                    <Typography fontSize={15} fontWeight={600} sx={{ color: '#1a1a1a' }}>
                                        Customer Details
                                    </Typography>
                                </Box>

                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => setOpenCustomerDialog(true)}
                                    startIcon={<Icon icon={selectedCustomer ? "mdi:account-edit" : "mdi:account-search"} />}
                                    sx={{
                                        mb: 3,
                                        py: 1.5,
                                        borderStyle: 'dashed',
                                        backgroundColor: selectedCustomer ? '#F0F7FF' : 'transparent'
                                    }}
                                >
                                    {selectedCustomer ? 'Change Customer' : 'Select Customer'}
                                </Button>

                                {selectedCustomer && (
                                    <Box sx={{ bgcolor: '#F8F9FA', p: 2, borderRadius: 2 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="caption" color="text.secondary">Name</Typography>
                                                <Typography variant="body2" fontWeight={500}>{selectedCustomer.name}</Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="caption" color="text.secondary">Phone</Typography>
                                                <Typography variant="body2">{selectedCustomer.phone}</Typography>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="caption" color="text.secondary">Address</Typography>
                                                <Typography variant="body2">{selectedCustomer.address}</Typography>
                                            </Grid>
                                            {selectedCustomer.carData && (
                                                <Grid item xs={12}>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                                                    <Typography variant="body2">
                                                        {selectedCustomer.carData.carBrand} {selectedCustomer.carData.carModel} - {selectedCustomer.carData.plateNumber}
                                                    </Typography>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>

                        {/* Invoice Items Section */}
                        <Card
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                                border: '1px solid #E8E8E8',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Icon icon="mdi:file-document-outline" width={20} color="#1976d2" />
                                        <Typography fontSize={15} fontWeight={600} sx={{ color: '#1a1a1a' }}>
                                            Invoice Items
                                        </Typography>
                                    </Box>
                                    <Button
                                        size="small"
                                        startIcon={<Icon icon="mdi:plus" />}
                                        onClick={handleAddItem}
                                        variant="soft"
                                    >
                                        Add Item
                                    </Button>
                                </Box>

                                <Stack spacing={2}>
                                    {items.map((item, index) => (
                                        <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                            <TextField
                                                label="Description"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                size="small"
                                                fullWidth
                                                multiline
                                                maxRows={2}
                                            />
                                            <TextField
                                                label="Qty"
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                size="small"
                                                sx={{ width: 80 }}
                                            />
                                            <TextField
                                                label="Price"
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                                size="small"
                                                sx={{ width: 120 }}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                                                }}
                                            />
                                            <IconButton
                                                onClick={() => handleRemoveItem(index)}
                                                color="error"
                                                size="small"
                                                sx={{ mt: 0.5 }}
                                                disabled={items.length === 1}
                                            >
                                                <Icon icon="mdi:trash-can-outline" />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Stack>

                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
                                    <Box>
                                        <TextField
                                            label="Admin Fee"
                                            type="number"
                                            value={adminFee}
                                            onChange={(e) => setAdminFee(e.target.value)}
                                            size="small"
                                            sx={{ width: 150, mb: 2 }}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                                            }}
                                        />
                                        <TextField
                                            label="Stamp Duty (Materai)"
                                            type="number"
                                            value={stampDuty}
                                            onChange={(e) => setStampDuty(e.target.value)}
                                            size="small"
                                            sx={{ width: 150, display: 'block' }}
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                                            }}
                                        />
                                    </Box>
                                </Box>

                            </CardContent>
                        </Card>

                    </Grid>

                    {/* RIGHT COLUMN */}
                    <Grid item xs={12} md={5}>
                        <Box sx={{ position: 'sticky', top: 24 }}>
                            <Card
                                sx={{
                                    borderRadius: 2,
                                    border: '1px solid #E8E8E8',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Typography fontSize={16} fontWeight={600} mb={3}>
                                        Invoice Summary
                                    </Typography>

                                    <Stack spacing={2} mb={3}>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography color="text.secondary">Invoice Number</Typography>
                                            <Typography fontWeight={600}>{invoiceNumber}</Typography>
                                        </Box>
                                        <Divider />
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography color="text.secondary">Subtotal</Typography>
                                            <Typography fontWeight={500}>{formatCurrency(calculateSubtotal())}</Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography color="text.secondary">Admin Fee</Typography>
                                            <Typography fontWeight={500}>{formatCurrency(adminFee)}</Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography color="text.secondary">Stamp Duty</Typography>
                                            <Typography fontWeight={500}>{formatCurrency(stampDuty)}</Typography>
                                        </Box>
                                        <Divider />
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography fontSize={16} fontWeight={700}>Total</Typography>
                                            <Typography fontSize={16} fontWeight={700} color="primary">
                                                {formatCurrency(calculateTotal())}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Stack spacing={2}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            onClick={handleSubmit}
                                            startIcon={<Icon icon="mdi:printer" />}
                                            sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
                                        >
                                            Generate & Download PDF
                                        </Button>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={handleReset}
                                            color="inherit"
                                        >
                                            Reset Form
                                        </Button>
                                    </Stack>

                                </CardContent>
                            </Card>
                        </Box>
                    </Grid>
                </Grid>

                {/* Customer Dialog */}
                <Dialog
                    open={openCustomerDialog}
                    onClose={() => setOpenCustomerDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <Box p={3}>
                        <Typography variant="h6" mb={2} fontWeight={600}>Select Customer</Typography>
                        <TextField
                            fullWidth
                            placeholder="Search customer by name, vehicle, or number..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" /></InputAdornment>
                            }}
                            sx={{ mb: 2 }}
                        />

                        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                            {filteredCustomers.length > 0 ? (
                                <Stack spacing={1}>
                                    {filteredCustomers.map(customer => (
                                        <Box
                                            key={customer.id}
                                            onClick={() => {
                                                setSelectedCustomer(customer);
                                                setOpenCustomerDialog(false);
                                            }}
                                            sx={{
                                                p: 2,
                                                border: '1px solid #eee',
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: '#f5f5f5' }
                                            }}
                                        >
                                            <Typography fontWeight={600}>{customer.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">{customer.phone}</Typography>
                                            {customer.carData && (
                                                <Stack direction="row" spacing={1} mt={1}>
                                                    <Typography variant="caption" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', px: 1, borderRadius: 0.5 }}>
                                                        {customer.carData.plateNumber}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {customer.carData.carBrand} {customer.carData.carModel}
                                                    </Typography>
                                                </Stack>
                                            )}
                                        </Box>
                                    ))}
                                </Stack>
                            ) : (
                                <Box py={4} textAlign="center">
                                    <Typography color="text.secondary">No customers found</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Dialog>

                {/* Simple Confirmation Dialog */}
                <Dialog open={openPreviewDialog} onClose={() => setOpenPreviewDialog(false)}>
                    <Box p={3}>
                        <Typography variant="h6" mb={2}>Confirm Invoice</Typography>
                        <Typography mb={3}>Are you sure you want to generate the invoice PDF for {selectedCustomer?.name}?</Typography>
                        <Box display="flex" justifyContent="flex-end" gap={2}>
                            <Button onClick={() => setOpenPreviewDialog(false)}>Cancel</Button>
                            <Button variant="contained" onClick={handleConfirmDownload}>Generate PDF</Button>
                        </Box>
                    </Box>
                </Dialog>

            </Container>
        </Box>
    );
}