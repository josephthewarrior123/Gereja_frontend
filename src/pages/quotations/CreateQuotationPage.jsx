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
  Chip,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Container,
  IconButton,
  Dialog,
  Avatar,
  useMediaQuery,
  useTheme,
  Stack,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  Collapse,
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

const C = {
  bg: '#F4F5F7',
  white: '#FFFFFF',
  border: '#E4E6EA',
  borderFocus: '#1971C2',
  primary: '#1971C2',
  primaryLight: '#EBF4FF',
  text: '#1C1E21',
  textSub: '#606770',
  textMuted: '#9EA8B3',
  error: '#D92B2B',
  success: '#1E8840',
  successLight: '#EBF8EF',
  stepIdle: '#C8CDD4',
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

const STEPS = [
  { label: 'Details',  icon: '1' },
  { label: 'Coverage', icon: '2' },
  { label: 'Review',   icon: '3' },
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
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: done || current ? '#1971C2' : '#FFFFFF',
                  border: `2px solid ${done || current ? '#1971C2' : '#C8CDD4'}`,
                  boxShadow: current ? `0 0 0 4px ${alpha('#1971C2', 0.15)}` : 'none',
                  transition: 'all 0.25s',
                }}
              >
                {done
                  ? <Icon icon="mdi:check" width={16} color="#fff" />
                  : <Typography fontSize={13} fontWeight={700} sx={{ color: current ? '#fff' : '#C8CDD4' }}>{step.icon}</Typography>
                }
              </Box>
              <Typography fontSize={12} fontWeight={current ? 700 : 500} mt={0.75}
                sx={{ color: current ? '#1971C2' : done ? '#606770' : '#C8CDD4' }}>
                {step.label}
              </Typography>
            </Box>
            {i < STEPS.length - 1 && (
              <Box sx={{ width: 64, height: 2, bgcolor: i < active ? '#1971C2' : '#C8CDD4', mt: '17px', transition: 'background-color 0.3s', flexShrink: 0 }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function Section({ title, action, children }) {
  return (
    <Box mb={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography fontSize={15} fontWeight={700} sx={{ color: '#1C1E21' }}>{title}</Typography>
        {action}
      </Box>
      {children}
    </Box>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <Box mb={2.5}>
      <Box display="flex" alignItems="baseline" gap={0.4} mb={0.75}>
        <Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21' }}>{label}</Typography>
        {required && <Typography fontSize={13} sx={{ color: '#D92B2B' }}>*</Typography>}
      </Box>
      {hint && <Typography fontSize={12} sx={{ color: '#606770', mb: 0.75 }}>{hint}</Typography>}
      {children}
    </Box>
  );
}

export default function CreateQuotationPage() {
  const navigate = useNavigate();
  const loading = useLoading();
  const message = useAlert();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeStep, setActiveStep] = useState(0);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [companyName, setCompanyName] = useState('PT. JAYAINDO ARTHA SUKSES');
  const [companySubtitle, setCompanySubtitle] = useState('INSURANCE AGENCY');
  const [companyCity, setCompanyCity] = useState('Jakarta');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [tsi, setTsi] = useState('');
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);

  const [coverages, setCoverages] = useState({
    comprehensive:       { enabled: true,  percentage: 1.32, freeInclude: false },
    flood:               { enabled: false, percentage: 0.1,  freeInclude: false },
    earthquake:          { enabled: false, percentage: 0.12, freeInclude: false },
    typhoonAndStorm:     { enabled: false, percentage: 0.05, freeInclude: false },
    landslide:           { enabled: false, percentage: 0.05, freeInclude: false },
    waterHammer:         { enabled: false, percentage: 0.05, freeInclude: true  },
    thirdPartyLiability: { enabled: false, percentage: 0.5,  freeInclude: false },
    authorizedWorkshop:  { enabled: false, percentage: 0.05, freeInclude: true  },
  });

  const coverageLabels = useMemo(() => ({
    comprehensive:       'Comprehensive',
    flood:               'Banjir',
    earthquake:          'Gempa Bumi',
    typhoonAndStorm:     'Angin Topan, Badai, Taifun, Hujan Es, Tornado',
    landslide:           'Tanah Longsor',
    waterHammer:         'Water Hammer',
    thirdPartyLiability: 'Tanggung Jawab Hukum Pihak III',
    authorizedWorkshop:  'Authorized Workshop',
  }), []);

  const [calculations, setCalculations] = useState({
    itemAmounts: {}, subtotal: 0, adminFee: 50000, stampDuty: 10000, totalPremium: 0,
  });

  useEffect(() => { fetchCompanyProfile(); fetchCustomers(); generateQuotationNumber(); }, []); // eslint-disable-line
  useEffect(() => { calculateTotals(); }, [tsi, coverages]); // eslint-disable-line

  const roundIDR = (n) => Math.round(Number(n) || 0);
  const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(v) || 0);
  const fmtNum = (v) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(Number(v) || 0);
  const fmtShort = (v) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(v) || 0);

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

  const generateQuotationNumber = () => {
    const d = new Date();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setQuotationNumber(`QUO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${random}`);
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

  const toggleCoverage = (key) => setCoverages(p => ({ ...p, [key]: { ...p[key], enabled: !p[key].enabled } }));
  const toggleFree = (key) => setCoverages(p => ({ ...p, [key]: { ...p[key], freeInclude: !p[key].freeInclude } }));
  const setPct = (key, val) => {
    const n = parseFloat(val);
    setCoverages(p => ({ ...p, [key]: { ...p[key], percentage: Number.isFinite(n) ? n : 0 } }));
  };

  const calculateTotals = () => {
    const tv = Number(tsi) || 0;
    const itemAmounts = {};
    let subtotal = 0;
    Object.keys(coverages).forEach((k) => {
      const c = coverages[k];
      if (!c.enabled || c.freeInclude) { itemAmounts[k] = 0; return; }
      const amt = roundIDR((tv * (Number(c.percentage) || 0)) / 100);
      itemAmounts[k] = amt;
      subtotal += amt;
    });
    const adminFee = 50000, stampDuty = 10000;
    setCalculations(p => ({ ...p, itemAmounts, subtotal, totalPremium: subtotal + adminFee + stampDuty }));
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!selectedCustomer) { message('Please select a customer', 'error'); return; }
      if (!tsi || Number(tsi) <= 0) { message('Please enter a valid TSI amount', 'error'); return; }
    }
    setActiveStep(s => s + 1);
  };
  const handleBack = () => setActiveStep(s => s - 1);

  const handleReset = () => {
    setSelectedCustomer(null); setTsi(''); setActiveStep(0);
    setCoverages({
      comprehensive:       { enabled: true,  percentage: 1.32, freeInclude: false },
      flood:               { enabled: false, percentage: 0.1,  freeInclude: false },
      earthquake:          { enabled: false, percentage: 0.12, freeInclude: false },
      typhoonAndStorm:     { enabled: false, percentage: 0.05, freeInclude: false },
      landslide:           { enabled: false, percentage: 0.05, freeInclude: false },
      waterHammer:         { enabled: false, percentage: 0.05, freeInclude: true  },
      thirdPartyLiability: { enabled: false, percentage: 0.5,  freeInclude: false },
      authorizedWorkshop:  { enabled: false, percentage: 0.05, freeInclude: true  },
    });
    generateQuotationNumber();
  };

  const handleDownload = () => {
    if (!selectedCustomer || !tsi || Number(tsi) <= 0) { message('Please complete the form first', 'error'); return; }
    setOpenPreviewDialog(true);
  };

  const handleConfirmDownload = () => {
    try { loading.start(); generatePDF(); message('PDF generated!', 'success'); setOpenPreviewDialog(false); }
    catch (e) { console.error(e); message('Failed to generate PDF', 'error'); }
    finally { loading.stop(); }
  };

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const marginX = 18;
    const rightX = pageWidth - marginX;

    let currentY = 18;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(16);
    doc.text((companyName || '').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text((companySubtitle || '').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('QUOTATION', pageWidth / 2, currentY, { align: 'center' });
    currentY += 11;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    doc.text(`No. ${quotationNumber}`, marginX, currentY);

    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`${companyCity || 'Jakarta'}, ${dateStr}`, rightX, currentY, { align: 'right' });
    currentY += 13;

    const labelX = marginX;
    const colonX = marginX + 42;
    const valueX = marginX + 46;

    const row = (y, label, value) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, labelX, y);
      doc.setFont(undefined, 'normal');
      doc.text(':', colonX, y);
      doc.text(String(value ?? ''), valueX, y);
    };

    row(currentY, 'Nama', selectedCustomer?.name || 'TBA');
    currentY += 7;
    row(currentY, 'Alamat', selectedCustomer?.address || 'TBA');
    currentY += 7;
    row(currentY, 'Perhitungan Premi', `${selectedCustomer.carData?.carBrand || ''} ${selectedCustomer.carData?.carModel || ''}`.trim());
    currentY += 7;
    row(currentY, 'No Polisi', selectedCustomer.carData?.plateNumber || 'TBA');
    currentY += 7;
    row(currentY, 'Harga TSI', `${fmtNum(Number(tsi) || 0)} (IDR)`);
    currentY += 12;

    const coverageBody = Object.keys(coverages)
      .filter((key) => coverages[key].enabled)
      .map((key) => {
        const c = coverages[key];
        const rateText = c.freeInclude ? 'FREE INCLUDE' : `${c.percentage} %`;
        return [coverageLabels[key], rateText];
      });

    autoTable(doc, {
      startY: currentY,
      head: [['Coverage', 'Rate']],
      body: coverageBody,
      theme: 'plain',
      styles: {
        fontSize: 9.5,
        cellPadding: { top: 1.6, right: 2, bottom: 1.6, left: 2 },
        overflow: 'linebreak'
      },
      headStyles: {
        fontStyle: 'bold',
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 120, halign: 'left' },
        1: { cellWidth: 35, halign: 'right' }
      },
      didParseCell: function (data) {
        if (data.section === 'head') {
          if (data.column.index === 0) {
            data.cell.styles.halign = 'left';
          }
          if (data.column.index === 1) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 1.6,
              right: 5,
              bottom: 1.6,
              left: 2
            };
          }
        }
      },
      margin: { left: marginX, right: marginX }
    });

    const afterCoverageY = (doc.lastAutoTable?.finalY ?? currentY) + 10;

    const tsiValue = Number(tsi) || 0;

    const calcBody = [];
    Object.keys(coverages).forEach((key) => {
      const c = coverages[key];
      if (!c.enabled) return;
      if (c.freeInclude) return;

      const pct = Number(c.percentage) || 0;
      const amount = roundIDR((tsiValue * pct) / 100);

      const formattedBase = `Rp ${fmtShort(tsiValue)}`;

      calcBody.push([
        coverageLabels[key],
        formattedBase,
        `x ${pct} %`,
        fmt(amount)
      ]);
    });

    if ((calculations.adminFee ?? 0) > 0) {
      calcBody.push([
        'Admin Fee',
        'Rp 50.000',
        '',
        fmt(calculations.adminFee)
      ]);
    }
    if ((calculations.stampDuty ?? 0) > 0) {
      calcBody.push([
        'Stamp Duty',
        'Rp 10.000',
        '',
        fmt(calculations.stampDuty)
      ]);
    }

    calcBody.push([
      { content: 'Total Premi', styles: { fontStyle: 'bold' } },
      { content: '', styles: { fontStyle: 'bold' } },
      { content: '', styles: { fontStyle: 'bold' } },
      { content: fmt(calculations.totalPremium), styles: { fontStyle: 'bold' } }
    ]);

    autoTable(doc, {
      startY: afterCoverageY,
      head: [['Item', 'Base', 'Rate', 'Amount']],
      body: calcBody,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 2.6,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [235, 235, 235],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 60, halign: 'left' },
        1: { cellWidth: 45, halign: 'right' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 'auto', halign: 'right' }
      },
      didParseCell: function (data) {
        if (data.section === 'head') {
          if (data.column.index === 0) {
            data.cell.styles.halign = 'left';
          }
          if (data.column.index === 1) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 2.6,
              right: 20,
              bottom: 2.6,
              left: 2
            };
          }
          if (data.column.index === 2) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 2.6,
              right: 10,
              bottom: 2.6,
              left: 2
            };
          }
          if (data.column.index === 3) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 2.6,
              right: 5,
              bottom: 2.6,
              left: 2
            };
          }
        }

        if (data.section === 'body') {
          if (data.column.index === 0) {
            data.cell.styles.halign = 'left';
          }
          if (data.column.index === 1) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 2.6,
              right: 12,
              bottom: 2.6,
              left: 2
            };
          }
          if (data.column.index === 2) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 2.6,
              right: 5,
              bottom: 2.6,
              left: 2
            };
          }
          if (data.column.index === 3) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 2.6,
              right: 3,
              bottom: 2.6,
              left: 2
            };
          }
        }
      },
      margin: { left: marginX, right: marginX }
    });

    doc.save(`Quotation_${quotationNumber}.pdf`);
  };

  const filteredCustomers = useMemo(() => {
    const s = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s) ||
      c.carData?.carBrand?.toLowerCase().includes(s) ||
      c.carData?.plateNumber?.toLowerCase().includes(s)
    );
  }, [customers, customerSearch]);

  const enabledKeys = Object.keys(coverages).filter(k => coverages[k].enabled);

  return (
    <Box sx={{ bgcolor: '#F4F5F7', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="sm">

        {/* Title */}
        <Box mb={3}>
          <Button
            startIcon={<Icon icon="mdi:arrow-left" width={16} />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: 'none', fontSize: 13, fontWeight: 500, color: '#606770', mb: 1.5, pl: 0, '&:hover': { bgcolor: 'transparent', color: '#1C1E21' } }}
          >
            Back
          </Button>
          <Typography variant="h5" fontWeight={700} align="center" sx={{ color: '#1C1E21' }}>
            New Quotation
          </Typography>
          <Typography fontSize={13} align="center" sx={{ color: '#606770', mt: 0.5 }}>
            Generate an insurance quotation PDF for your customer
          </Typography>
        </Box>

        <WizardStepper active={activeStep} />

        {/* ── STEP 1 ── */}
        {activeStep === 0 && (
          <Fade in key="s1">
            <Box>
              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section
                  title="Company Header"
                  action={
                    <Button size="small" onClick={handleSaveCompanyProfile}
                      sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, color: '#1971C2', minWidth: 0 }}>
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

              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section title="Customer">
                  <Field label="Select Customer" required>
                    <Box
                      onClick={() => setOpenCustomerDialog(true)}
                      sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        px: 1.5, py: '9px',
                        border: `1px solid ${selectedCustomer ? '#1971C2' : '#E4E6EA'}`,
                        borderRadius: '8px',
                        bgcolor: selectedCustomer ? '#EBF4FF' : '#FFFFFF',
                        cursor: 'pointer', transition: 'all 0.15s',
                        '&:hover': { borderColor: selectedCustomer ? '#1971C2' : '#B0B5BC' },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.25}>
                        <Icon icon="mdi:account-search" width={18} color={selectedCustomer ? '#1971C2' : '#9EA8B3'} />
                        <Typography fontSize={14} sx={{ color: selectedCustomer ? '#1C1E21' : '#9EA8B3' }}>
                          {selectedCustomer ? `${selectedCustomer.name} — ${selectedCustomer.carData?.plateNumber || 'No Plate'}` : 'Search and select customer...'}
                        </Typography>
                      </Box>
                      {selectedCustomer
                        ? <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); }} sx={{ p: 0.25 }}><Icon icon="mdi:close" width={15} color="#606770" /></IconButton>
                        : <Icon icon="mdi:chevron-down" width={18} color="#9EA8B3" />
                      }
                    </Box>
                  </Field>

                  {selectedCustomer && (
                    <Box sx={{ mt: -1.5, mb: 0.5, p: 2, borderRadius: '8px', bgcolor: '#F8F9FA', border: '1px solid #E4E6EA' }}>
                      <Grid container spacing={1.5}>
                        {[
                          { label: 'Phone', value: selectedCustomer.phone },
                          { label: 'Vehicle', value: `${selectedCustomer.carData?.carBrand || ''} ${selectedCustomer.carData?.carModel || ''}`.trim() },
                          { label: 'Plate', value: selectedCustomer.carData?.plateNumber },
                          { label: 'Address', value: selectedCustomer.address },
                        ].map(({ label, value }) => (
                          <Grid item xs={6} key={label}>
                            <Typography fontSize={11} sx={{ color: '#9EA8B3', textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.2 }}>{label}</Typography>
                            <Typography fontSize={13} fontWeight={500} sx={{ color: '#1C1E21' }}>{value || '—'}</Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Section>

                <Divider sx={{ borderColor: '#E4E6EA', my: 2.5 }} />

                <Section title="Total Sum Insured (TSI)">
                  <Field label="Amount (IDR)" required hint="Nilai pertanggungan kendaraan">
                    <TextField fullWidth size="small" type="number" placeholder="e.g., 400000000"
                      value={tsi} onChange={(e) => setTsi(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Typography fontSize={13} fontWeight={700} sx={{ color: '#606770' }}>Rp</Typography></InputAdornment>,
                      }}
                      sx={inputStyle}
                    />
                  </Field>
                  {tsi && Number(tsi) > 0 && (
                    <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#EBF4FF', border: `1px solid ${alpha('#1971C2', 0.2)}` }}>
                      <Typography fontSize={11} sx={{ color: '#1971C2', textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.3 }}>TSI Amount</Typography>
                      <Typography fontSize={20} fontWeight={700} sx={{ color: '#1971C2' }}>{fmt(Number(tsi))}</Typography>
                    </Box>
                  )}
                </Section>
              </Paper>

              <Button fullWidth variant="contained" onClick={handleNext}
                endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                sx={{ borderRadius: '8px', py: 1.4, textTransform: 'none', fontSize: 14, fontWeight: 600, bgcolor: '#1971C2', boxShadow: 'none', '&:hover': { bgcolor: '#145EA8' } }}>
                Continue to Coverage
              </Button>
            </Box>
          </Fade>
        )}

        {/* ── STEP 2 ── */}
        {activeStep === 1 && (
          <Fade in key="s2">
            <Box>
              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section title="Coverage Options">
                  <Stack spacing={1.25}>
                    {Object.keys(coverages).map((key) => {
                      const c = coverages[key];
                      return (
                        <Box key={key} sx={{
                          borderRadius: '8px',
                          border: `1px solid ${c.enabled ? '#1971C2' : '#E4E6EA'}`,
                          bgcolor: c.enabled ? '#EBF4FF' : '#FAFBFC',
                          overflow: 'hidden', transition: 'all 0.15s',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, cursor: 'pointer' }}
                            onClick={() => toggleCoverage(key)}>
                            <Box display="flex" alignItems="center" gap={1.25}>
                              <Box sx={{
                                width: 18, height: 18, borderRadius: '4px',
                                border: `2px solid ${c.enabled ? '#1971C2' : '#C8CDD4'}`,
                                bgcolor: c.enabled ? '#1971C2' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s',
                              }}>
                                {c.enabled && <Icon icon="mdi:check" width={12} color="#fff" />}
                              </Box>
                              <Typography fontSize={13.5} fontWeight={c.enabled ? 600 : 400} sx={{ color: c.enabled ? '#1C1E21' : '#606770' }}>
                                {coverageLabels[key]}
                              </Typography>
                            </Box>
                            {c.enabled && (
                              <Chip
                                label={c.freeInclude ? 'FREE' : fmt(calculations.itemAmounts?.[key] ?? 0)}
                                size="small"
                                sx={{
                                  height: 22, fontSize: 11, fontWeight: 700, ml: 1.5,
                                  bgcolor: c.freeInclude ? '#EBF8EF' : alpha('#1971C2', 0.12),
                                  color: c.freeInclude ? '#1E8840' : '#1971C2',
                                }}
                              />
                            )}
                          </Box>
                          <Collapse in={c.enabled}>
                            <Divider sx={{ borderColor: alpha('#1971C2', 0.15) }} />
                            <Box sx={{ px: 2, py: 1.5, bgcolor: alpha('#1971C2', 0.025) }}>
                              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems={{ sm: 'center' }}>
                                <FormControlLabel
                                  control={<Checkbox checked={c.freeInclude} onChange={() => toggleFree(key)} size="small" sx={{ p: 0.5, '&.Mui-checked': { color: '#1E8840' } }} />}
                                  label={<Typography fontSize={12} fontWeight={600} sx={{ color: '#1E8840' }}>FREE INCLUDE</Typography>}
                                  sx={{ m: 0 }}
                                />
                                <Box display="flex" alignItems="center" gap={1}>
                                  <TextField size="small" type="number" value={c.percentage} disabled={c.freeInclude}
                                    onChange={(e) => setPct(key, e.target.value)}
                                    inputProps={{ step: 0.01, min: 0, max: 100 }}
                                    InputProps={{ endAdornment: <InputAdornment position="end"><Typography fontSize={12} sx={{ color: '#606770' }}>%</Typography></InputAdornment> }}
                                    sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: 13, bgcolor: c.freeInclude ? '#F0F0F0' : '#FFFFFF', '& fieldset': { borderColor: '#E4E6EA' }, '&.Mui-focused fieldset': { borderColor: '#1971C2' } } }}
                                  />
                                  <Typography fontSize={12} sx={{ color: '#606770' }}>dari TSI</Typography>
                                </Box>
                              </Stack>
                            </Box>
                          </Collapse>
                        </Box>
                      );
                    })}
                  </Stack>
                </Section>
              </Paper>

              {/* Premium Summary */}
              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section title="Premium Summary">
                  {enabledKeys.length === 0 ? (
                    <Typography fontSize={13} sx={{ color: '#9EA8B3', textAlign: 'center', py: 2 }}>No coverage selected</Typography>
                  ) : (
                    <Stack spacing={0.9} mb={2}>
                      {enabledKeys.map(key => {
                        const c = coverages[key];
                        return (
                          <Box key={key} display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                            <Typography fontSize={13} sx={{ color: '#606770', flex: 1 }}>{coverageLabels[key]}</Typography>
                            <Typography fontSize={13} fontWeight={600} sx={{ color: c.freeInclude ? '#1E8840' : '#1C1E21', whiteSpace: 'nowrap' }}>
                              {c.freeInclude ? 'FREE' : fmt(calculations.itemAmounts?.[key] ?? 0)}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                  <Divider sx={{ borderColor: '#E4E6EA', my: 1.5 }} />
                  <Stack spacing={0.75} mb={2}>
                    <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>Subtotal</Typography><Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21' }}>{fmt(calculations.subtotal)}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>Admin Fee</Typography><Typography fontSize={13} sx={{ color: '#1C1E21' }}>{fmt(calculations.adminFee)}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>Stamp Duty</Typography><Typography fontSize={13} sx={{ color: '#1C1E21' }}>{fmt(calculations.stampDuty)}</Typography></Box>
                  </Stack>
                  <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#EBF4FF', border: `1px solid ${alpha('#1971C2', 0.2)}` }}>
                    <Box display="flex" justifyContent="space-between" alignItems="baseline">
                      <Typography fontSize={13} fontWeight={700} sx={{ color: '#1971C2' }}>TOTAL PREMIUM</Typography>
                      <Typography fontSize={20} fontWeight={800} sx={{ color: '#1971C2' }}>{fmt(calculations.totalPremium)}</Typography>
                    </Box>
                  </Box>
                </Section>
              </Paper>

              <Box display="flex" gap={1.5}>
                <Button fullWidth variant="outlined" onClick={handleBack} startIcon={<Icon icon="mdi:arrow-left" width={16} />}
                  sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: '#E4E6EA', color: '#606770' }}>
                  Back
                </Button>
                <Button fullWidth variant="contained" onClick={handleNext} endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                  sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: '#1971C2', boxShadow: 'none' }}>
                  Review
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {/* ── STEP 3 ── */}
        {activeStep === 2 && (
          <Fade in key="s3">
            <Box>
              {/* Company */}
              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section title="Company">
                  <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#F8F9FA', border: '1px solid #E4E6EA', textAlign: 'center' }}>
                    <Typography fontSize={15} fontWeight={700} sx={{ color: '#1C1E21' }}>{companyName?.toUpperCase()}</Typography>
                    <Typography fontSize={12} sx={{ color: '#606770', mt: 0.25 }}>{companySubtitle}</Typography>
                    <Typography fontSize={12} sx={{ color: '#9EA8B3' }}>{companyCity}</Typography>
                  </Box>
                </Section>
              </Paper>

              {/* Customer */}
              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section title="Customer Details">
                  <Grid container spacing={2}>
                    {[
                      { label: 'Name', value: selectedCustomer?.name },
                      { label: 'Phone', value: selectedCustomer?.phone },
                      { label: 'Address', value: selectedCustomer?.address },
                      { label: 'Plate', value: selectedCustomer?.carData?.plateNumber },
                      { label: 'Vehicle', value: `${selectedCustomer?.carData?.carBrand || ''} ${selectedCustomer?.carData?.carModel || ''}`.trim() },
                      { label: 'TSI', value: fmt(Number(tsi)) },
                    ].map(({ label, value }) => (
                      <Grid item xs={6} key={label}>
                        <Typography fontSize={11} sx={{ color: '#9EA8B3', textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.3 }}>{label}</Typography>
                        <Typography fontSize={13.5} fontWeight={500} sx={{ color: '#1C1E21' }}>{value || '—'}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Section>
              </Paper>

              {/* Coverage + Premium */}
              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section title="Coverage & Premium">
                  <Stack spacing={1} mb={2}>
                    {enabledKeys.map(key => {
                      const c = coverages[key];
                      return (
                        <Box key={key} display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Icon icon="mdi:check-circle-outline" width={15} color="#1971C2" />
                            <Typography fontSize={13} sx={{ color: '#606770' }}>{coverageLabels[key]}</Typography>
                          </Box>
                          <Chip label={c.freeInclude ? 'FREE' : `${c.percentage}%`} size="small"
                            sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: c.freeInclude ? '#EBF8EF' : '#EBF4FF', color: c.freeInclude ? '#1E8840' : '#1971C2' }} />
                        </Box>
                      );
                    })}
                  </Stack>
                  <Divider sx={{ borderColor: '#E4E6EA', my: 2 }} />
                  <Stack spacing={0.75} mb={2}>
                    {enabledKeys.filter(k => !coverages[k].freeInclude).map(key => (
                      <Box key={key} display="flex" justifyContent="space-between">
                        <Typography fontSize={13} sx={{ color: '#606770' }}>{coverageLabels[key]}</Typography>
                        <Typography fontSize={13} fontWeight={500} sx={{ color: '#1C1E21' }}>{fmt(calculations.itemAmounts?.[key] ?? 0)}</Typography>
                      </Box>
                    ))}
                    <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>Admin Fee</Typography><Typography fontSize={13} sx={{ color: '#1C1E21' }}>{fmt(calculations.adminFee)}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>Stamp Duty</Typography><Typography fontSize={13} sx={{ color: '#1C1E21' }}>{fmt(calculations.stampDuty)}</Typography></Box>
                  </Stack>
                  <Box sx={{ p: 2.5, borderRadius: '8px', bgcolor: '#EBF4FF', border: `1px solid ${alpha('#1971C2', 0.2)}`, mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="baseline">
                      <Typography fontSize={14} fontWeight={700} sx={{ color: '#1971C2' }}>TOTAL PREMIUM</Typography>
                      <Typography fontSize={22} fontWeight={800} sx={{ color: '#1971C2' }}>{fmt(calculations.totalPremium)}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ p: 1.75, borderRadius: '8px', bgcolor: '#F8F9FA', border: '1px solid #E4E6EA' }}>
                    <Typography fontSize={11} sx={{ color: '#9EA8B3', textTransform: 'uppercase', letterSpacing: 0.4 }}>Quotation No.</Typography>
                    <Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21', fontFamily: 'monospace', mt: 0.25 }}>{quotationNumber}</Typography>
                  </Box>
                </Section>
              </Paper>

              <Button fullWidth variant="contained" onClick={handleDownload}
                startIcon={<Icon icon="mdi:file-pdf-box" width={18} />}
                sx={{ borderRadius: '8px', py: 1.5, textTransform: 'none', fontSize: 14, fontWeight: 600, bgcolor: '#D32F2F', boxShadow: 'none', mb: 1.5, '&:hover': { bgcolor: '#B71C1C', boxShadow: '0 4px 12px rgba(211,47,47,0.3)' } }}>
                Download PDF
              </Button>

              <Box display="flex" gap={1.5}>
                <Button fullWidth variant="outlined" onClick={handleBack} startIcon={<Icon icon="mdi:arrow-left" width={15} />}
                  sx={{ borderRadius: '8px', py: 1.25, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: '#E4E6EA', color: '#606770' }}>
                  Edit Coverage
                </Button>
                <Button fullWidth variant="outlined" onClick={handleReset} startIcon={<Icon icon="mdi:refresh" width={15} />}
                  sx={{ borderRadius: '8px', py: 1.25, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: '#E4E6EA', color: '#606770' }}>
                  Start Over
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

      </Container>

      {/* Customer Dialog */}
      <Dialog open={openCustomerDialog} onClose={() => { setOpenCustomerDialog(false); setCustomerSearch(''); }}
        maxWidth="xs" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : '12px', m: 2 } }}>
        <Box sx={{ p: 2.5 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <IconButton size="small" onClick={() => { setOpenCustomerDialog(false); setCustomerSearch(''); }} sx={{ mr: 1 }}>
              <Icon icon="mdi:arrow-left" width={20} color="#606770" />
            </IconButton>
            <Typography fontSize={16} fontWeight={700} sx={{ color: '#1C1E21' }}>Select Customer</Typography>
          </Box>
          <TextField fullWidth autoFocus size="small" placeholder="Search by name, phone, or plate..."
            value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" width={18} color="#9EA8B3" /></InputAdornment> }}
            sx={{ mb: 2, ...inputStyle }} />
          <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {filteredCustomers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Icon icon="mdi:account-search" width={44} color="#C8CDD4" />
                <Typography fontSize={14} sx={{ color: '#606770', mt: 1.5 }}>No customers found</Typography>
                {customerSearch && <Button onClick={() => setCustomerSearch('')} sx={{ mt: 1, textTransform: 'none', fontSize: 12, color: '#1971C2' }}>Clear search</Button>}
              </Box>
            ) : (
              <Stack spacing={1}>
                {filteredCustomers.map((customer) => {
                  const sel = selectedCustomer?.id === customer.id;
                  return (
                    <Box key={customer.id} onClick={() => { setSelectedCustomer(customer); setOpenCustomerDialog(false); setCustomerSearch(''); }}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '8px', cursor: 'pointer',
                        border: `1px solid ${sel ? '#1971C2' : '#E4E6EA'}`,
                        bgcolor: sel ? '#EBF4FF' : '#FFFFFF', transition: 'all 0.15s',
                        '&:hover': { borderColor: '#1971C2', bgcolor: sel ? '#EBF4FF' : '#FAFBFC' },
                      }}>
                      <Avatar sx={{ width: 38, height: 38, bgcolor: '#1971C2', fontSize: 15, fontWeight: 700 }}>
                        {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography fontSize={13.5} fontWeight={600} sx={{ color: '#1C1E21' }}>{customer.name}</Typography>
                        <Typography fontSize={12} sx={{ color: '#606770' }}>{customer.phone || '—'}</Typography>
                        <Typography fontSize={12} sx={{ color: '#9EA8B3' }}>{customer.carData?.carBrand || 'No car'} · {customer.carData?.plateNumber || 'No plate'}</Typography>
                      </Box>
                      {sel && <Icon icon="mdi:check-circle" width={18} color="#1971C2" />}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={openPreviewDialog} onClose={() => setOpenPreviewDialog(false)}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '12px', m: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Icon icon="mdi:file-pdf-box" width={22} color="#D32F2F" />
            <Typography fontSize={16} fontWeight={700} sx={{ color: '#1C1E21' }}>Preview Quotation</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2.5, borderRadius: '8px', bgcolor: '#F8F9FA', border: '1px solid #E4E6EA' }}>
            <Box textAlign="center" mb={2}>
              <Typography fontSize={14} fontWeight={700} sx={{ color: '#1C1E21' }}>{companyName}</Typography>
              <Typography fontSize={12} sx={{ color: '#606770' }}>{companySubtitle} · {companyCity}</Typography>
            </Box>
            <Divider sx={{ borderColor: '#E4E6EA', my: 1.5 }} />
            <Stack spacing={0.75}>
              <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>Customer</Typography><Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21' }}>{selectedCustomer?.name}</Typography></Box>
              <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>Vehicle</Typography><Typography fontSize={13} sx={{ color: '#1C1E21' }}>{selectedCustomer?.carData?.plateNumber}</Typography></Box>
              <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>TSI</Typography><Typography fontSize={13} sx={{ color: '#1C1E21' }}>{fmt(Number(tsi))}</Typography></Box>
              <Divider sx={{ borderColor: '#E4E6EA', my: 0.5 }} />
              <Box display="flex" justifyContent="space-between"><Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21' }}>Total Premium</Typography><Typography fontSize={15} fontWeight={700} sx={{ color: '#D32F2F' }}>{fmt(calculations.totalPremium)}</Typography></Box>
            </Stack>
          </Box>
          <Typography fontSize={12} sx={{ color: '#9EA8B3', mt: 2, display: 'block' }}>
            PDF will include full coverage breakdown and calculation.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
          <Button onClick={() => setOpenPreviewDialog(false)} variant="outlined"
            sx={{ flex: 1, borderRadius: '8px', textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: '#E4E6EA', color: '#606770' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDownload} variant="contained" startIcon={<Icon icon="mdi:download" width={15} />}
            sx={{ flex: 1, bgcolor: '#D32F2F', borderRadius: '8px', textTransform: 'none', fontSize: 13, fontWeight: 600, boxShadow: 'none', '&:hover': { bgcolor: '#B71C1C' } }}>
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}