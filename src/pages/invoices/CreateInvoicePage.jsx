import { Icon } from '@iconify/react';
import {
    Box,
    Button,
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
    Avatar,
    Fade,
} from '@mui/material';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';
import CompanyDAO from '../../daos/CompanyDao';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
    bg: '#F4F5F7',
    white: '#FFFFFF',
    border: '#E4E6EA',
    primary: '#1971C2',
    primaryLight: '#EBF4FF',
    text: '#1C1E21',
    textSub: '#606770',
    textMuted: '#9EA8B3',
    error: '#D92B2B',
};

const inputStyle = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        fontSize: 14,
        bgcolor: '#FFFFFF',
        '& fieldset': { borderColor: '#E4E6EA' },
        '&:hover fieldset': { borderColor: '#B0B5BC' },
        '&.Mui-focused fieldset': { borderColor: '#1971C2', borderWidth: '1.5px' },
    },
};

function Section({ title, action, children }) {
    return (
        <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography fontSize={15} fontWeight={700} sx={{ color: C.text }}>{title}</Typography>
                {action}
            </Box>
            {children}
        </Box>
    );
}

function Field({ label, required, children }) {
    return (
        <Box mb={2.5}>
            <Box display="flex" alignItems="baseline" gap={0.4} mb={0.75}>
                <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>{label}</Typography>
                {required && <Typography fontSize={13} sx={{ color: C.error }}>*</Typography>}
            </Box>
            {children}
        </Box>
    );
}

const STEPS = [
    { label: 'Details', icon: '1' },
    { label: 'Items',   icon: '2' },
    { label: 'Review',  icon: '3' },
];

function WizardStepper({ active }) {
    return (
        <Box display="flex" alignItems="flex-start" justifyContent="center" mb={4}>
            {STEPS.map((step, i) => {
                const done = i < active;
                const current = i === active;
                return (
                    <Box key={i} display="flex" alignItems="flex-start">
                        <Box display="flex" flexDirection="column" alignItems="center" sx={{ minWidth: 72 }}>
                            <Box sx={{
                                width: 36, height: 36, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: done || current ? C.primary : C.white,
                                border: `2px solid ${done || current ? C.primary : '#C8CDD4'}`,
                                boxShadow: current ? `0 0 0 4px rgba(25,113,194,0.15)` : 'none',
                                transition: 'all 0.25s',
                            }}>
                                {done
                                    ? <Icon icon="mdi:check" width={16} color="#fff" />
                                    : <Typography fontSize={13} fontWeight={700} sx={{ color: current ? '#fff' : '#C8CDD4' }}>{step.icon}</Typography>
                                }
                            </Box>
                            <Typography fontSize={12} fontWeight={current ? 700 : 500} mt={0.75}
                                sx={{ color: current ? C.primary : done ? C.textSub : '#C8CDD4' }}>
                                {step.label}
                            </Typography>
                        </Box>
                        {i < STEPS.length - 1 && (
                            <Box sx={{ width: 64, height: 2, bgcolor: i < active ? C.primary : '#C8CDD4', mt: '17px', transition: 'background-color 0.3s', flexShrink: 0 }} />
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function CreateInvoicePage() {
    const navigate = useNavigate();
    const loading = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [activeStep, setActiveStep] = useState(0);

    // Company
    const [companyProfile, setCompanyProfile] = useState(null);
    const [companyName, setCompanyName] = useState('PT. JAYAINDO ARTHA SUKSES');
    const [companySubtitle, setCompanySubtitle] = useState('INSURANCE AGENCY');
    const [companyCity, setCompanyCity] = useState('Jakarta');

    // Customer
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');

    // Invoice
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [items, setItems] = useState([{ description: '', quantity: 1, price: 0 }]);
    const [adminFee, setAdminFee] = useState(0);
    const [stampDuty, setStampDuty] = useState(0);

    // Preview
    const [openPreviewDialog, setOpenPreviewDialog] = useState(false);

    useEffect(() => {
        fetchCompanyProfile();
        fetchCustomers();
        generateInvoiceNumber();
    }, []); // eslint-disable-line

    // ── Helpers ──
    const formatCurrency = (value) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value) || 0);

    const formatCurrencyPDF = (value) =>
        'Rp ' + new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value) || 0);

    const calculateSubtotal = () => items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.price)), 0);
    const calculateTotal = () => calculateSubtotal() + Number(adminFee) + Number(stampDuty);

    // ── Fetch ──
    const fetchCompanyProfile = async () => {
        try {
            const r = await CompanyDAO.getCompanyProfile();
            if (r.success && r.profile) {
                setCompanyProfile(r.profile);
                setCompanyName(r.profile.companyName || 'PT. JAYAINDO ARTHA SUKSES');
                setCompanySubtitle(r.profile.companySubtitle || 'INSURANCE AGENCY');
                setCompanyCity(r.profile.companyCity || 'Jakarta');
            }
        } catch (e) { console.error(e); }
    };

    const fetchCustomers = async () => {
        try {
            loading.start();
            const r = await CustomerDAO.getAllCustomers();
            if (r.success) setCustomers(r.customers || []);
            else message('Failed to load customers', 'error');
        } catch (e) { console.error(e); message('Failed to load customers', 'error'); }
        finally { loading.stop(); }
    };

    const generateInvoiceNumber = () => {
        const d = new Date();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        setInvoiceNumber(`INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${random}`);
    };

    const handleSaveCompanyProfile = async () => {
        if (!companyName?.trim()) { message('Company name is required', 'error'); return; }
        try {
            loading.start();
            const data = { companyName: companyName.trim(), companySubtitle: companySubtitle?.trim() || '', companyCity: companyCity?.trim() || '' };
            const r = companyProfile?.createdAt ? await CompanyDAO.updateCompanyProfile(data) : await CompanyDAO.createCompanyProfile(data);
            if (!r.success) { message(r.error || 'Failed to save', 'error'); return; }
            message('Company profile saved!', 'success');
            await fetchCompanyProfile();
        } catch (e) { console.error(e); message('Failed to save', 'error'); }
        finally { loading.stop(); }
    };

    // ── Item handlers ──
    const handleAddItem = () => setItems([...items, { description: '', quantity: 1, price: 0 }]);
    const handleRemoveItem = (i) => { const n = [...items]; n.splice(i, 1); setItems(n); };
    const handleItemChange = (i, field, value) => { const n = [...items]; n[i][field] = value; setItems(n); };

    // ── Navigation ──
    const handleNext = () => {
        if (activeStep === 0 && !selectedCustomer) { message('Please select a customer', 'error'); return; }
        if (activeStep === 1 && !items.some(it => it.description?.trim())) { message('Please add at least one item', 'error'); return; }
        setActiveStep(s => s + 1);
    };
    const handleBack = () => setActiveStep(s => s - 1);

    const handleReset = () => {
        setSelectedCustomer(null);
        setItems([{ description: '', quantity: 1, price: 0 }]);
        setAdminFee(0); setStampDuty(0);
        setActiveStep(0);
        generateInvoiceNumber();
    };

    const handleSubmit = () => {
        if (!selectedCustomer) { message('Please select a customer', 'error'); return; }
        setOpenPreviewDialog(true);
    };

    const handleConfirmDownload = () => {
        try { loading.start(); generatePDF(); message('Invoice PDF generated!', 'success'); setOpenPreviewDialog(false); }
        catch (e) { console.error(e); message('Failed to generate invoice', 'error'); }
        finally { loading.stop(); }
    };

    // ══ PDF — TIDAK DIUBAH ══════════════════════════════════════════════════
    const generatePDF = () => {
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();

        const marginX = 18;
        const rightX = pageWidth - marginX;

        let currentY = 18;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(30, 30, 30);
        doc.text((companyName || '').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
        currentY += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text((companySubtitle || '').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
        currentY += 10;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.text('INVOICE', pageWidth / 2, currentY, { align: 'center' });
        currentY += 11;

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

        const labelX = marginX;
        const colonX = marginX + 30;
        const valueX = marginX + 34;

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
                selectedCustomer.carData?.plateNumber ? `(${selectedCustomer.carData.plateNumber})` : ''
            ].filter(Boolean).join(' ');
            drawRow(currentY, 'Vehicle', vehicleStr);
            currentY += 7;
        }

        currentY += 6;

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

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text('Payment Terms: Due upon receipt', marginX, finalY);

        doc.save(`Invoice_${invoiceNumber}.pdf`);
    };
    // ════════════════════════════════════════════════════════════════════════

    const filteredCustomers = useMemo(() => {
        const s = customerSearch.toLowerCase();
        return customers.filter(c =>
            c.name?.toLowerCase().includes(s) ||
            c.phone?.toLowerCase().includes(s) ||
            c.carData?.carBrand?.toLowerCase().includes(s) ||
            c.carData?.plateNumber?.toLowerCase().includes(s)
        );
    }, [customers, customerSearch]);

    const validItemCount = items.filter(it => it.description?.trim()).length;

    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <Box sx={{ bgcolor: C.bg, minHeight: '100vh', py: 4 }}>
            <Container maxWidth="sm">

                {/* Title */}
                <Box mb={3}>
                    <Button
                        startIcon={<Icon icon="mdi:arrow-left" width={16} />}
                        onClick={() => navigate(-1)}
                        sx={{ textTransform: 'none', fontSize: 13, fontWeight: 500, color: C.textSub, mb: 1.5, pl: 0, '&:hover': { bgcolor: 'transparent', color: C.text } }}
                    >
                        Back
                    </Button>
                    <Typography variant="h5" fontWeight={700} align="center" sx={{ color: C.text }}>
                        New Invoice
                    </Typography>
                    <Typography fontSize={13} align="center" sx={{ color: C.textSub, mt: 0.5 }}>
                        Generate an invoice PDF for your customer
                    </Typography>
                </Box>

                <WizardStepper active={activeStep} />

                {/* ── STEP 1: Details ── */}
                {activeStep === 0 && (
                    <Fade in key="s1">
                        <Box>
                            {/* Company */}
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section
                                    title="Company Header"
                                    action={
                                        <Button size="small" onClick={handleSaveCompanyProfile}
                                            sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, color: C.primary, minWidth: 0 }}>
                                            Save
                                        </Button>
                                    }
                                >
                                    <Field label="Company Name" required>
                                        <TextField fullWidth size="small" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="e.g., PT. Maju Jaya Abadi" error={!companyName?.trim()} sx={inputStyle} />
                                    </Field>
                                    <Field label="Subtitle">
                                        <TextField fullWidth size="small" value={companySubtitle} onChange={(e) => setCompanySubtitle(e.target.value)}
                                            placeholder="e.g., INSURANCE AGENCY" sx={inputStyle} />
                                    </Field>
                                    <Field label="City">
                                        <TextField fullWidth size="small" value={companyCity} onChange={(e) => setCompanyCity(e.target.value)}
                                            placeholder="Jakarta" sx={inputStyle} />
                                    </Field>
                                </Section>
                            </Paper>

                            {/* Customer */}
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section title="Customer">
                                    <Field label="Select Customer" required>
                                        <Box
                                            onClick={() => setOpenCustomerDialog(true)}
                                            sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                px: 1.5, py: '9px',
                                                border: `1px solid ${selectedCustomer ? C.primary : C.border}`,
                                                borderRadius: '8px',
                                                bgcolor: selectedCustomer ? C.primaryLight : C.white,
                                                cursor: 'pointer', transition: 'all 0.15s',
                                                '&:hover': { borderColor: selectedCustomer ? C.primary : '#B0B5BC' },
                                            }}
                                        >
                                            <Box display="flex" alignItems="center" gap={1.25}>
                                                <Icon icon="mdi:account-search" width={18} color={selectedCustomer ? C.primary : C.textMuted} />
                                                <Typography fontSize={14} sx={{ color: selectedCustomer ? C.text : C.textMuted }}>
                                                    {selectedCustomer
                                                        ? `${selectedCustomer.name} — ${selectedCustomer.carData?.plateNumber || 'No Plate'}`
                                                        : 'Search and select customer...'}
                                                </Typography>
                                            </Box>
                                            {selectedCustomer
                                                ? <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); }} sx={{ p: 0.25 }}>
                                                    <Icon icon="mdi:close" width={15} color={C.textSub} />
                                                </IconButton>
                                                : <Icon icon="mdi:chevron-down" width={18} color={C.textMuted} />
                                            }
                                        </Box>
                                    </Field>

                                    {selectedCustomer && (
                                        <Box sx={{ mt: -1.5, mb: 0.5, p: 2, borderRadius: '8px', bgcolor: '#F8F9FA', border: `1px solid ${C.border}` }}>
                                            <Grid container spacing={1.5}>
                                                {[
                                                    { label: 'Phone', value: selectedCustomer.phone },
                                                    { label: 'Vehicle', value: `${selectedCustomer.carData?.carBrand || ''} ${selectedCustomer.carData?.carModel || ''}`.trim() },
                                                    { label: 'Plate', value: selectedCustomer.carData?.plateNumber },
                                                    { label: 'Address', value: selectedCustomer.address },
                                                ].map(({ label, value }) => (
                                                    <Grid item xs={6} key={label}>
                                                        <Typography fontSize={11} sx={{ color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.2 }}>{label}</Typography>
                                                        <Typography fontSize={13} fontWeight={500} sx={{ color: C.text }}>{value || '—'}</Typography>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
                                    )}
                                </Section>
                            </Paper>

                            <Button fullWidth variant="contained" onClick={handleNext}
                                endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                                sx={{ borderRadius: '8px', py: 1.4, textTransform: 'none', fontSize: 14, fontWeight: 600, bgcolor: C.primary, boxShadow: 'none', '&:hover': { bgcolor: '#145EA8' } }}>
                                Continue to Items
                            </Button>
                        </Box>
                    </Fade>
                )}

                {/* ── STEP 2: Items ── */}
                {activeStep === 1 && (
                    <Fade in key="s2">
                        <Box>
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section
                                    title="Invoice Items"
                                    action={
                                        <Button size="small" onClick={handleAddItem}
                                            startIcon={<Icon icon="mdi:plus" width={16} />}
                                            sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, color: C.primary }}>
                                            Add Item
                                        </Button>
                                    }
                                >
                                    <Stack spacing={2}>
                                        {items.map((item, index) => (
                                            <Box key={index} sx={{ p: 2, borderRadius: '8px', border: `1px solid ${C.border}`, bgcolor: '#FAFBFC' }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                                    <Typography fontSize={12} fontWeight={600} sx={{ color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                                        Item {index + 1}
                                                    </Typography>
                                                    {items.length > 1 && (
                                                        <IconButton size="small" onClick={() => handleRemoveItem(index)} sx={{ color: C.error, p: 0.25 }}>
                                                            <Icon icon="mdi:trash-can-outline" width={16} />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                                <Stack spacing={1.5}>
                                                    <Box>
                                                        <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>
                                                            Description <span style={{ color: C.error }}>*</span>
                                                        </Typography>
                                                        <TextField fullWidth size="small" multiline maxRows={2}
                                                            placeholder="e.g., Premi Asuransi Kendaraan"
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                            sx={inputStyle} />
                                                    </Box>
                                                    <Box display="flex" gap={1.5}>
                                                        <Box flex={1}>
                                                            <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>Quantity</Typography>
                                                            <TextField fullWidth size="small" type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                                sx={inputStyle} />
                                                        </Box>
                                                        <Box flex={2}>
                                                            <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>Unit Price</Typography>
                                                            <TextField fullWidth size="small" type="number"
                                                                value={item.price}
                                                                onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                                                InputProps={{ startAdornment: <InputAdornment position="start"><Typography fontSize={13} fontWeight={700} sx={{ color: C.textSub }}>Rp</Typography></InputAdornment> }}
                                                                sx={inputStyle} />
                                                        </Box>
                                                    </Box>
                                                    {item.description && Number(item.price) > 0 && (
                                                        <Box display="flex" justifyContent="flex-end">
                                                            <Typography fontSize={12} sx={{ color: C.textSub }}>
                                                                Subtotal: <strong style={{ color: C.text }}>{formatCurrency(Number(item.quantity) * Number(item.price))}</strong>
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Stack>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Section>

                                <Divider sx={{ borderColor: C.border, my: 2.5 }} />

                                <Section title="Additional Fees">
                                    <Box display="flex" gap={1.5}>
                                        <Box flex={1}>
                                            <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>Admin Fee</Typography>
                                            <TextField fullWidth size="small" type="number" value={adminFee}
                                                onChange={(e) => setAdminFee(e.target.value)}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Typography fontSize={13} fontWeight={700} sx={{ color: C.textSub }}>Rp</Typography></InputAdornment> }}
                                                sx={inputStyle} />
                                        </Box>
                                        <Box flex={1}>
                                            <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>Stamp Duty</Typography>
                                            <TextField fullWidth size="small" type="number" value={stampDuty}
                                                onChange={(e) => setStampDuty(e.target.value)}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Typography fontSize={13} fontWeight={700} sx={{ color: C.textSub }}>Rp</Typography></InputAdornment> }}
                                                sx={inputStyle} />
                                        </Box>
                                    </Box>
                                </Section>
                            </Paper>

                            {/* Live summary */}
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section title="Summary">
                                    <Stack spacing={0.75} mb={2}>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography fontSize={13} sx={{ color: C.textSub }}>Subtotal ({validItemCount} item{validItemCount !== 1 ? 's' : ''})</Typography>
                                            <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>{formatCurrency(calculateSubtotal())}</Typography>
                                        </Box>
                                        {Number(adminFee) > 0 && (
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography fontSize={13} sx={{ color: C.textSub }}>Admin Fee</Typography>
                                                <Typography fontSize={13} sx={{ color: C.text }}>{formatCurrency(adminFee)}</Typography>
                                            </Box>
                                        )}
                                        {Number(stampDuty) > 0 && (
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography fontSize={13} sx={{ color: C.textSub }}>Stamp Duty</Typography>
                                                <Typography fontSize={13} sx={{ color: C.text }}>{formatCurrency(stampDuty)}</Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                    <Box sx={{ p: 2, borderRadius: '8px', bgcolor: C.primaryLight, border: `1px solid rgba(25,113,194,0.2)` }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="baseline">
                                            <Typography fontSize={13} fontWeight={700} sx={{ color: C.primary }}>TOTAL</Typography>
                                            <Typography fontSize={20} fontWeight={800} sx={{ color: C.primary }}>{formatCurrency(calculateTotal())}</Typography>
                                        </Box>
                                    </Box>
                                </Section>
                            </Paper>

                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="outlined" onClick={handleBack}
                                    startIcon={<Icon icon="mdi:arrow-left" width={16} />}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                                    Back
                                </Button>
                                <Button fullWidth variant="contained" onClick={handleNext}
                                    endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: C.primary, boxShadow: 'none' }}>
                                    Review
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                )}

                {/* ── STEP 3: Review ── */}
                {activeStep === 2 && (
                    <Fade in key="s3">
                        <Box>
                            {/* Company */}
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section title="Company">
                                    <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#F8F9FA', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                                        <Typography fontSize={15} fontWeight={700} sx={{ color: C.text }}>{companyName?.toUpperCase()}</Typography>
                                        <Typography fontSize={12} sx={{ color: C.textSub, mt: 0.25 }}>{companySubtitle}</Typography>
                                        <Typography fontSize={12} sx={{ color: C.textMuted }}>{companyCity}</Typography>
                                    </Box>
                                </Section>
                            </Paper>

                            {/* Customer */}
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section title="Bill To">
                                    <Grid container spacing={2}>
                                        {[
                                            { label: 'Name', value: selectedCustomer?.name },
                                            { label: 'Phone', value: selectedCustomer?.phone },
                                            { label: 'Address', value: selectedCustomer?.address },
                                            { label: 'Vehicle', value: `${selectedCustomer?.carData?.carBrand || ''} ${selectedCustomer?.carData?.carModel || ''}`.trim() },
                                            { label: 'Plate', value: selectedCustomer?.carData?.plateNumber },
                                        ].map(({ label, value }) => (
                                            <Grid item xs={6} key={label}>
                                                <Typography fontSize={11} sx={{ color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.3 }}>{label}</Typography>
                                                <Typography fontSize={13.5} fontWeight={500} sx={{ color: C.text }}>{value || '—'}</Typography>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Section>
                            </Paper>

                            {/* Items + Total */}
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section title="Items & Total">
                                    <Stack spacing={1} mb={2}>
                                        {items.filter(it => it.description?.trim()).map((item, i) => (
                                            <Box key={i} display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                                                <Box flex={1}>
                                                    <Typography fontSize={13} sx={{ color: C.text }}>{item.description}</Typography>
                                                    <Typography fontSize={12} sx={{ color: C.textSub }}>
                                                        {item.quantity} × {formatCurrency(item.price)}
                                                    </Typography>
                                                </Box>
                                                <Typography fontSize={13} fontWeight={600} sx={{ color: C.text, whiteSpace: 'nowrap' }}>
                                                    {formatCurrency(Number(item.quantity) * Number(item.price))}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>

                                    <Divider sx={{ borderColor: C.border, my: 2 }} />

                                    <Stack spacing={0.75} mb={2}>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography fontSize={13} sx={{ color: C.textSub }}>Subtotal</Typography>
                                            <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>{formatCurrency(calculateSubtotal())}</Typography>
                                        </Box>
                                        {Number(adminFee) > 0 && (
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography fontSize={13} sx={{ color: C.textSub }}>Admin Fee</Typography>
                                                <Typography fontSize={13} sx={{ color: C.text }}>{formatCurrency(adminFee)}</Typography>
                                            </Box>
                                        )}
                                        {Number(stampDuty) > 0 && (
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography fontSize={13} sx={{ color: C.textSub }}>Stamp Duty</Typography>
                                                <Typography fontSize={13} sx={{ color: C.text }}>{formatCurrency(stampDuty)}</Typography>
                                            </Box>
                                        )}
                                    </Stack>

                                    <Box sx={{ p: 2.5, borderRadius: '8px', bgcolor: C.primaryLight, border: `1px solid rgba(25,113,194,0.2)`, mb: 2 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="baseline">
                                            <Typography fontSize={14} fontWeight={700} sx={{ color: C.primary }}>TOTAL</Typography>
                                            <Typography fontSize={22} fontWeight={800} sx={{ color: C.primary }}>{formatCurrency(calculateTotal())}</Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ p: 1.75, borderRadius: '8px', bgcolor: '#F8F9FA', border: `1px solid ${C.border}` }}>
                                        <Typography fontSize={11} sx={{ color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Invoice No.</Typography>
                                        <Typography fontSize={13} fontWeight={600} sx={{ color: C.text, fontFamily: 'monospace', mt: 0.25 }}>{invoiceNumber}</Typography>
                                    </Box>
                                </Section>
                            </Paper>

                            <Button fullWidth variant="contained" onClick={handleSubmit}
                                startIcon={<Icon icon="mdi:file-pdf-box" width={18} />}
                                sx={{ borderRadius: '8px', py: 1.5, textTransform: 'none', fontSize: 14, fontWeight: 600, bgcolor: '#D32F2F', boxShadow: 'none', mb: 1.5, '&:hover': { bgcolor: '#B71C1C', boxShadow: '0 4px 12px rgba(211,47,47,0.3)' } }}>
                                Download PDF
                            </Button>

                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="outlined" onClick={handleBack}
                                    startIcon={<Icon icon="mdi:arrow-left" width={15} />}
                                    sx={{ borderRadius: '8px', py: 1.25, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                                    Edit Items
                                </Button>
                                <Button fullWidth variant="outlined" onClick={handleReset}
                                    startIcon={<Icon icon="mdi:refresh" width={15} />}
                                    sx={{ borderRadius: '8px', py: 1.25, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                                    Start Over
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                )}

            </Container>

            {/* ── Customer Dialog ── */}
            <Dialog open={openCustomerDialog} onClose={() => { setOpenCustomerDialog(false); setCustomerSearch(''); }}
                maxWidth="xs" fullWidth fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : '12px', m: 2 } }}>
                <Box sx={{ p: 2.5 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                        <IconButton size="small" onClick={() => { setOpenCustomerDialog(false); setCustomerSearch(''); }} sx={{ mr: 1 }}>
                            <Icon icon="mdi:arrow-left" width={20} color={C.textSub} />
                        </IconButton>
                        <Typography fontSize={16} fontWeight={700} sx={{ color: C.text }}>Select Customer</Typography>
                    </Box>
                    <TextField fullWidth autoFocus size="small"
                        placeholder="Search by name, phone, or plate..."
                        value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" width={18} color={C.textMuted} /></InputAdornment> }}
                        sx={{ mb: 2, ...inputStyle }} />
                    <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                        {filteredCustomers.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 5 }}>
                                <Icon icon="mdi:account-search" width={44} color="#C8CDD4" />
                                <Typography fontSize={14} sx={{ color: C.textSub, mt: 1.5 }}>No customers found</Typography>
                                {customerSearch && <Button onClick={() => setCustomerSearch('')} sx={{ mt: 1, textTransform: 'none', fontSize: 12, color: C.primary }}>Clear search</Button>}
                            </Box>
                        ) : (
                            <Stack spacing={1}>
                                {filteredCustomers.map((customer) => {
                                    const sel = selectedCustomer?.id === customer.id;
                                    return (
                                        <Box key={customer.id}
                                            onClick={() => { setSelectedCustomer(customer); setOpenCustomerDialog(false); setCustomerSearch(''); }}
                                            sx={{
                                                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '8px', cursor: 'pointer',
                                                border: `1px solid ${sel ? C.primary : C.border}`,
                                                bgcolor: sel ? C.primaryLight : C.white, transition: 'all 0.15s',
                                                '&:hover': { borderColor: C.primary, bgcolor: sel ? C.primaryLight : '#FAFBFC' },
                                            }}>
                                            <Avatar sx={{ width: 38, height: 38, bgcolor: C.primary, fontSize: 15, fontWeight: 700 }}>
                                                {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                                            </Avatar>
                                            <Box flex={1} minWidth={0}>
                                                <Typography fontSize={13.5} fontWeight={600} sx={{ color: C.text }}>{customer.name}</Typography>
                                                <Typography fontSize={12} sx={{ color: C.textSub }}>{customer.phone || '—'}</Typography>
                                                <Typography fontSize={12} sx={{ color: C.textMuted }}>{customer.carData?.carBrand || 'No car'} · {customer.carData?.plateNumber || 'No plate'}</Typography>
                                            </Box>
                                            {sel && <Icon icon="mdi:check-circle" width={18} color={C.primary} />}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Dialog>

            {/* ── Confirm Dialog ── */}
            <Dialog open={openPreviewDialog} onClose={() => setOpenPreviewDialog(false)}
                maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '12px', m: 2 } }}>
                <Box sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Icon icon="mdi:file-pdf-box" width={22} color="#D32F2F" />
                        <Typography fontSize={16} fontWeight={700} sx={{ color: C.text }}>Confirm Invoice</Typography>
                    </Box>
                    <Box sx={{ p: 2.5, borderRadius: '8px', bgcolor: '#F8F9FA', border: `1px solid ${C.border}`, mb: 2.5 }}>
                        <Stack spacing={0.75}>
                            <Box display="flex" justifyContent="space-between">
                                <Typography fontSize={13} sx={{ color: C.textSub }}>Customer</Typography>
                                <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>{selectedCustomer?.name}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography fontSize={13} sx={{ color: C.textSub }}>Items</Typography>
                                <Typography fontSize={13} sx={{ color: C.text }}>{validItemCount} item{validItemCount !== 1 ? 's' : ''}</Typography>
                            </Box>
                            <Divider sx={{ borderColor: C.border, my: 0.5 }} />
                            <Box display="flex" justifyContent="space-between">
                                <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>Total</Typography>
                                <Typography fontSize={15} fontWeight={700} sx={{ color: '#D32F2F' }}>{formatCurrency(calculateTotal())}</Typography>
                            </Box>
                        </Stack>
                    </Box>
                    <Box display="flex" gap={1}>
                        <Button fullWidth variant="outlined" onClick={() => setOpenPreviewDialog(false)}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                            Cancel
                        </Button>
                        <Button fullWidth variant="contained" onClick={handleConfirmDownload}
                            startIcon={<Icon icon="mdi:download" width={15} />}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: '#D32F2F', boxShadow: 'none', '&:hover': { bgcolor: '#B71C1C' } }}>
                            Generate PDF
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}