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
  Stack
} from '@mui/material';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CreateQuotationPage() {
  const navigate = useNavigate();
  const loading = useLoading();
  const message = useAlert();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ============ Company / Header ============
  const [companyName, setCompanyName] = useState('PT. JAYAINDO ARTHA SUKSES');
  const [companySubtitle, setCompanySubtitle] = useState('INSURANCE AGENCY');
  const [companyCity, setCompanyCity] = useState('Jakarta');

  // ============ Customer Selection ============
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // ============ Quotation Data ============
  const [quotationNumber, setQuotationNumber] = useState('');
  const [tsi, setTsi] = useState('');

  // IMPORTANT: now every coverage can be FREE INCLUDE (per item)
  const [coverages, setCoverages] = useState({
    comprehensive: { enabled: true, percentage: 1.32, freeInclude: false },
    flood: { enabled: false, percentage: 0.1, freeInclude: false },
    earthquake: { enabled: false, percentage: 0.12, freeInclude: false },
    typhoon: { enabled: false, percentage: 0.05, freeInclude: false },
    hail: { enabled: false, percentage: 0.05, freeInclude: false },
    landslide: { enabled: false, percentage: 0.05, freeInclude: false },
    waterHammer: { enabled: false, percentage: 0.05, freeInclude: true },
    thirdPartyLiability: { enabled: false, percentage: 0.5, freeInclude: false },
    authorizedWorkshop: { enabled: false, percentage: 0.05, freeInclude: true }
  });

  const coverageLabels = useMemo(
    () => ({
      comprehensive: 'Comprehensive',
      flood: 'Banjir',
      earthquake: 'Gempa Bumi',
      typhoon: 'Angin Topan',
      hail: 'Hujan Es',
      landslide: 'Tanah Longsor',
      waterHammer: 'Water Hammer',
      thirdPartyLiability: 'Tanggung Jawab Hukum Pihak III',
      authorizedWorkshop: 'Authorized Workshop'
    }),
    []
  );

  const [calculations, setCalculations] = useState({
    itemAmounts: {},
    subtotal: 0,
    adminFee: 50000,
    stampDuty: 10000,
    totalPremium: 0
  });

  // ============ Effects ============
  useEffect(() => {
    fetchCustomers();
    generateQuotationNumber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    calculateTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tsi, coverages, calculations.adminFee, calculations.stampDuty]);

  // ============ Helpers ============
  const roundIDR = (n) => Math.round(Number(n) || 0);

  const formatCurrencyShort = (value) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
      Number(value) || 0
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  };

  const formatCurrencyIDR = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
      Number(value) || 0
    );
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

  const generateQuotationNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setQuotationNumber(`QUO-${year}${month}-${random}`);
  };

  const handleCoverageToggle = (coverageKey) => {
    setCoverages((prev) => ({
      ...prev,
      [coverageKey]: { ...prev[coverageKey], enabled: !prev[coverageKey].enabled }
    }));
  };

  const handleFreeIncludeToggle = (coverageKey) => {
    setCoverages((prev) => ({
      ...prev,
      [coverageKey]: { ...prev[coverageKey], freeInclude: !prev[coverageKey].freeInclude }
    }));
  };

  const handlePercentageChange = (coverageKey, value) => {
    const num = parseFloat(value);
    const safe = Number.isFinite(num) ? num : 0;
    setCoverages((prev) => ({
      ...prev,
      [coverageKey]: { ...prev[coverageKey], percentage: safe }
    }));
  };

  const calculateTotals = () => {
    const tsiValue = Number(tsi) || 0;

    const itemAmounts = {};
    let subtotal = 0;

    Object.keys(coverages).forEach((key) => {
      const c = coverages[key];
      if (!c.enabled) {
        itemAmounts[key] = 0;
        return;
      }

      if (c.freeInclude) {
        itemAmounts[key] = 0;
        return;
      }

      const pct = Number(c.percentage) || 0;
      const amount = roundIDR((tsiValue * pct) / 100);
      itemAmounts[key] = amount;
      subtotal += amount;
    });

    const adminFee = calculations.adminFee ?? 50000;
    const stampDuty = calculations.stampDuty ?? 10000;

    setCalculations((prev) => ({
      ...prev,
      itemAmounts,
      subtotal,
      totalPremium: subtotal + adminFee + stampDuty
    }));
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      message('Please select a customer', 'error');
      return;
    }
    if (!tsi || Number(tsi) <= 0) {
      message('Please enter valid TSI amount', 'error');
      return;
    }

    try {
      loading.start();
      generatePDF();
      message('Quotation PDF generated successfully!', 'success');
    } catch (error) {
      console.error('Error creating quotation:', error);
      message('Failed to generate quotation', 'error');
    } finally {
      loading.stop();
    }
  };

  const handlePrint = () => {
    if (!selectedCustomer || !tsi) {
      message('Please complete the form first', 'error');
      return;
    }
    window.print();
  };

  const handleReset = () => {
    setSelectedCustomer(null);
    setTsi('');
    setCoverages({
      comprehensive: { enabled: true, percentage: 1.32, freeInclude: false },
      flood: { enabled: false, percentage: 0.1, freeInclude: false },
      earthquake: { enabled: false, percentage: 0.12, freeInclude: false },
      typhoon: { enabled: false, percentage: 0.05, freeInclude: false },
      hail: { enabled: false, percentage: 0.05, freeInclude: false },
      landslide: { enabled: false, percentage: 0.05, freeInclude: false },
      waterHammer: { enabled: false, percentage: 0.05, freeInclude: true },
      thirdPartyLiability: { enabled: false, percentage: 0.5, freeInclude: false },
      authorizedWorkshop: { enabled: false, percentage: 0.05, freeInclude: true }
    });
    setCalculations((prev) => ({
      ...prev,
      itemAmounts: {},
      subtotal: 0,
      totalPremium: (prev.adminFee ?? 50000) + (prev.stampDuty ?? 10000)
    }));
    generateQuotationNumber();
  };

  // ============ PDF ============
  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const marginX = 18;
    const rightX = pageWidth - marginX;

    // Header
    doc.setFont(undefined, 'bold');
    doc.setFontSize(16);
    doc.text((companyName || '').toUpperCase(), pageWidth / 2, 18, { align: 'center' });

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text((companySubtitle || '').toUpperCase(), pageWidth / 2, 24, { align: 'center' });

    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('QUOTATION', pageWidth / 2, 34, { align: 'center' });

    // Top info line
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    doc.text(`No. ${quotationNumber}`, marginX, 45);

    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`${companyCity || 'Jakarta'}, ${dateStr}`, rightX, 45, { align: 'right' });

    // Helper for aligned label/value
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

    let y = 58;
    row(y, 'Perhitungan Premi', `${selectedCustomer.carData?.carBrand || ''} ${selectedCustomer.carData?.carModel || ''}`.trim());
    y += 7;
    row(y, 'No Polisi', selectedCustomer.carData?.plateNumber || 'TBA');
    y += 7;
    row(y, 'Harga TSI', `${formatCurrencyIDR(Number(tsi) || 0)} (IDR)`);

    // Coverage table - FIXED WIDTH
    const coverageBody = Object.keys(coverages)
      .filter((key) => coverages[key].enabled)
      .map((key) => {
        const c = coverages[key];
        const rateText = c.freeInclude ? 'FREE INCLUDE' : `${c.percentage} %`;
        return [coverageLabels[key], rateText];
      });

      autoTable(doc, {
        startY: y + 12,
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
        didParseCell: function(data) {
          // ========== HEADER ROW ==========
          if (data.section === 'head') {
            // KOLOM 0 - "Coverage"
            if (data.column.index === 0) {
              data.cell.styles.halign = 'left';
            }
            
            // KOLOM 1 - "Rate" - CUSTOM PADDING DI SINI BRO
            if (data.column.index === 1) {
              data.cell.styles.halign = 'right';
              data.cell.styles.cellPadding = { 
                top: 1.6, 
                right: 5,  // ← UBAH ANGKA INI BRO (makin besar makin ke kiri)
                bottom: 1.6, 
                left: 2
              };
            }
          }
        },
        margin: { left: marginX, right: marginX }
      });

    const afterCoverageY = (doc.lastAutoTable?.finalY ?? (y + 12)) + 10;

    // Calculation table - FIXED WIDTH
    const tsiValue = Number(tsi) || 0;

    const calcBody = [];
    Object.keys(coverages).forEach((key) => {
      const c = coverages[key];
      if (!c.enabled) return;
      if (c.freeInclude) return;

      const pct = Number(c.percentage) || 0;
      const amount = roundIDR((tsiValue * pct) / 100);

      // TAMBAH "Rp" di depan angka base
      const formattedBase = `Rp ${formatCurrencyShort(tsiValue)}`;
      
      calcBody.push([
        coverageLabels[key],
        formattedBase,  // Sekarang dengan "Rp"
        `x ${pct} %`,
        formatCurrency(amount)
      ]);
    });

    // admin + stamp - TAMBAH KODE BARU DI SINI
    if ((calculations.adminFee ?? 0) > 0) {
      // Admin Fee: base = Rp 50.000, rate = kosong
      calcBody.push([
        'Admin Fee',
        'Rp 50.000',  // Base dengan Rp
        '',           // Rate kosong
        formatCurrency(calculations.adminFee)
      ]);
    }
    if ((calculations.stampDuty ?? 0) > 0) {
      // Stamp Duty: base = Rp 10.000, rate = kosong
      calcBody.push([
        'Stamp Duty',
        'Rp 10.000',  // Base dengan Rp
        '',           // Rate kosong
        formatCurrency(calculations.stampDuty)
      ]);
    }

    // total row
    calcBody.push([
      { content: 'Total Premi', styles: { fontStyle: 'bold' } },
      { content: '', styles: { fontStyle: 'bold' } },
      { content: '', styles: { fontStyle: 'bold' } },
      { content: formatCurrency(calculations.totalPremium), styles: { fontStyle: 'bold' } }
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
      didParseCell: function(data) {
        // ========== HEADER ROW ==========
        if (data.section === 'head') {
          
          // KOLOM 0 - "Item" (ga usah diubah, udah oke)
          if (data.column.index === 0) {
            data.cell.styles.halign = 'left';
          }
          
          // KOLOM 1 - "Base" - PERBAIKAN DI SINI
          if (data.column.index === 1) {
            data.cell.styles.halign = 'right';  // UBAH JADI 'right' BUKAN 'left'
            data.cell.styles.cellPadding = { 
              top: 2.6, 
              right: 20,  // PERBAIKAN: tambahkan right padding
              bottom: 2.6, 
              left: 2
            };
          }
          
          // KOLOM 2 - "Rate"
          if (data.column.index === 2) {
            data.cell.styles.halign = 'right';  // UBAH JADI 'right' BUKAN 'left'
            data.cell.styles.cellPadding = { 
              top: 2.6, 
              right: 10,  // PERBAIKAN: tambahkan right padding
              bottom: 2.6, 
              left: 2
            };
          }
          
          // KOLOM 3 - "Amount"
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
        
        // ========== BODY ROW ==========
        if (data.section === 'body') {
          
          // KOLOM 0 - Item name (Comprehensive, dll)
          if (data.column.index === 0) {
            data.cell.styles.halign = 'left';
          }
          
          // KOLOM 1 - Base data (Rp 400.000.000 atau Rp 50.000)
          if (data.column.index === 1) {
            data.cell.styles.halign = 'right';
            // Atur padding untuk semua data base
            if (data.cell.text[0] === 'Rp 50.000' || data.cell.text[0] === 'Rp 10.000') {
              // Untuk Admin Fee dan Stamp Duty
              data.cell.styles.cellPadding = { 
                top: 2.6, 
                right: 12,
                bottom: 2.6, 
                left: 2
              };
            } else {
              // Untuk coverage lain
              data.cell.styles.cellPadding = { 
                top: 2.6, 
                right: 12,
                bottom: 2.6, 
                left: 2
              };
            }
          }
          
          // KOLOM 2 - Rate data ("x 1.32 %" atau kosong untuk admin/stamp)
          if (data.column.index === 2) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = { 
              top: 2.6, 
              right: 5,
              bottom: 2.6, 
              left: 2
            };
          }
          
          // KOLOM 3 - Amount data
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

  const chipLabelFor = (key) => {
    const c = coverages[key];
    if (!c.enabled) return '';
    if (c.freeInclude) return 'FREE INCLUDE';
    return formatCurrency(calculations.itemAmounts?.[key] ?? 0);
  };

  const rightTextForCalc = (key) => {
    const c = coverages[key];
    if (!c.enabled) return null;
    if (c.freeInclude) return 'FREE INCLUDE';
    return formatCurrency(calculations.itemAmounts?.[key] ?? 0);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <IconButton onClick={() => navigate(-1)}>
            <Icon icon="mdi:arrow-left" width={24} />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Create Quotation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {quotationNumber}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3} alignItems="flex-start">
        {/* LEFT */}
        <Grid item xs={12} md={7}>
          {/* Company Settings */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontSize={16} fontWeight={700} mb={2.5}>
                <Icon icon="mdi:office-building" width={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                Company Header (PDF)
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="PT. ..."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Subtitle"
                    value={companySubtitle}
                    onChange={(e) => setCompanySubtitle(e.target.value)}
                    placeholder="INSURANCE AGENCY"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    placeholder="Jakarta"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontSize={16} fontWeight={700} mb={2.5}>
                <Icon icon="mdi:account" width={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                Customer Information
              </Typography>

              <TextField
                fullWidth
                placeholder="Select customer..."
                value={
                  selectedCustomer
                    ? `${selectedCustomer.name} (${selectedCustomer.carData?.plateNumber || 'No Plate'})`
                    : ''
                }
                onClick={() => setOpenCustomerDialog(true)}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon icon="mdi:account-search" width={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {selectedCustomer ? (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(null);
                          }}
                        >
                          <Icon icon="mdi:close" width={18} />
                        </IconButton>
                      ) : (
                        <Icon icon="mdi:chevron-down" width={20} color="#666" />
                      )}
                    </InputAdornment>
                  )
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiInputBase-root': { cursor: 'pointer', bgcolor: selectedCustomer ? '#F2F2F7' : 'white' }
                }}
              />

              {selectedCustomer && (
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#F2F2F7' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography fontSize={12} color="text.secondary" mb={0.5}>
                        Customer Name
                      </Typography>
                      <Typography fontSize={14} fontWeight={600}>
                        {selectedCustomer.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography fontSize={12} color="text.secondary" mb={0.5}>
                        Phone
                      </Typography>
                      <Typography fontSize={14} fontWeight={600}>
                        {selectedCustomer.phone || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography fontSize={12} color="text.secondary" mb={0.5}>
                        Car Brand
                      </Typography>
                      <Typography fontSize={14} fontWeight={600}>
                        {selectedCustomer.carData?.carBrand || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography fontSize={12} color="text.secondary" mb={0.5}>
                        Model
                      </Typography>
                      <Typography fontSize={14} fontWeight={600}>
                        {selectedCustomer.carData?.carModel || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography fontSize={12} color="text.secondary" mb={0.5}>
                        Plate Number
                      </Typography>
                      <Typography fontSize={14} fontWeight={600}>
                        {selectedCustomer.carData?.plateNumber || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography fontSize={12} color="text.secondary" mb={0.5}>
                        Year
                      </Typography>
                      <Typography fontSize={14} fontWeight={600}>
                        {selectedCustomer.carData?.carYear || '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </CardContent>
          </Card>

          {/* TSI */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontSize={16} fontWeight={700} mb={2.5}>
                <Icon icon="mdi:cash" width={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                Total Sum Insured (TSI)
              </Typography>

              <TextField
                fullWidth
                type="number"
                placeholder="Masukkan nilai TSI (contoh: 400000000)"
                value={tsi}
                onChange={(e) => setTsi(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography fontWeight={700}>Rp</Typography>
                    </InputAdornment>
                  )
                }}
                helperText="Nilai pertanggungan kendaraan"
              />

              {tsi && (
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: '#007AFF11', textAlign: 'center' }}>
                  <Typography fontSize={13} color="text.secondary" mb={0.5}>
                    TSI Amount
                  </Typography>
                  <Typography fontSize={20} fontWeight={800} color="#007AFF">
                    {formatCurrency(Number(tsi) || 0)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Coverages */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontSize={16} fontWeight={700} mb={2.5}>
                <Icon icon="mdi:shield-check" width={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                Coverage Options
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.keys(coverages).map((key) => {
                  const c = coverages[key];
                  return (
                    <Paper
                      key={key}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: c.enabled ? '2px solid #007AFF' : '1px solid #E5E5EA',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} mb={1.5}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={c.enabled}
                              onChange={() => handleCoverageToggle(key)}
                              sx={{ color: '#007AFF', '&.Mui-checked': { color: '#007AFF' } }}
                            />
                          }
                          label={<Typography fontSize={14} fontWeight={600}>{coverageLabels[key]}</Typography>}
                        />

                        {c.enabled && (
                          <Chip
                            label={chipLabelFor(key)}
                            size="small"
                            sx={{
                              bgcolor: c.freeInclude ? '#2e7d3222' : '#007AFF22',
                              color: c.freeInclude ? '#2e7d32' : '#007AFF',
                              fontWeight: 800,
                              fontSize: 12,
                              whiteSpace: 'nowrap'
                            }}
                          />
                        )}
                      </Stack>

                      {c.enabled && (
                        <Grid container spacing={1.5} alignItems="center">
                          <Grid item xs={12} sm="auto">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={c.freeInclude}
                                  onChange={() => handleFreeIncludeToggle(key)}
                                />
                              }
                              label={<Typography fontSize={13}>FREE INCLUDE</Typography>}
                            />
                          </Grid>

                          <Grid item xs={12} sm>
                            <Box display="flex" gap={1} alignItems="center">
                              <TextField
                                size="small"
                                type="number"
                                value={c.percentage}
                                disabled={c.freeInclude}
                                onChange={(e) => handlePercentageChange(key, e.target.value)}
                                inputProps={{ step: 0.01, min: 0, max: 100 }}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <Typography fontSize={13}>%</Typography>
                                    </InputAdornment>
                                  )
                                }}
                                sx={{ width: 140 }}
                              />
                              <Typography fontSize={13} color="text.secondary">
                                dari TSI
                              </Typography>

                              {c.freeInclude && (
                                <Typography fontSize={12} color="text.secondary" sx={{ ml: 1 }}>
                                  (tidak menambah premi)
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT (Calculator) */}
        <Grid item xs={12} md={5}>
          <Box sx={{ position: { xs: 'static', md: 'sticky' }, top: { md: 24 } }}>
            <Card sx={{ borderRadius: 3, bgcolor: '#007AFF11', border: '2px solid #007AFF' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography fontSize={16} fontWeight={700} mb={2.5}>
                  <Icon icon="mdi:calculator" width={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  Premium Calculation
                </Typography>

                <Box sx={{ mb: 2 }}>
                  {Object.keys(coverages).map((key) => {
                    const c = coverages[key];
                    if (!c.enabled) return null;

                    const right = rightTextForCalc(key);
                    return (
                      <Box key={key} display="flex" justifyContent="space-between" alignItems="center" mb={1.1} gap={2}>
                        <Typography fontSize={13} color="text.secondary" sx={{ pr: 1 }}>
                          {coverageLabels[key]}
                        </Typography>
                        <Typography
                          fontSize={13}
                          fontWeight={800}
                          sx={{ whiteSpace: 'nowrap', color: c.freeInclude ? '#2e7d32' : 'inherit' }}
                        >
                          {right}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between" mb={1.2} gap={2}>
                  <Typography fontSize={14} fontWeight={700}>
                    Subtotal Coverage
                  </Typography>
                  <Typography fontSize={14} fontWeight={900} sx={{ whiteSpace: 'nowrap' }}>
                    {formatCurrency(calculations.subtotal)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box display="flex" justifyContent="space-between" mb={1} gap={2}>
                  <Typography fontSize={14}>Admin Fee</Typography>
                  <Typography fontSize={14} sx={{ whiteSpace: 'nowrap' }}>
                    {formatCurrency(calculations.adminFee)}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={2} gap={2}>
                  <Typography fontSize={14}>Stamp Duty</Typography>
                  <Typography fontSize={14} sx={{ whiteSpace: 'nowrap' }}>
                    {formatCurrency(calculations.stampDuty)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2, borderStyle: 'dashed', borderWidth: 2 }} />

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'white',
                    boxShadow: '0 2px 10px rgba(0,122,255,0.15)'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="baseline" gap={2}>
                    <Typography fontSize={18} fontWeight={900}>
                      TOTAL PREMIUM
                    </Typography>
                    <Typography
                      fontSize={isMobile ? 18 : 22}
                      fontWeight={900}
                      color="#007AFF"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {formatCurrency(calculations.totalPremium)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button fullWidth variant="outlined" onClick={handleReset} sx={{ borderRadius: 2, py: 1.4 }}>
                      Reset
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handlePrint}
                      disabled={!selectedCustomer || !tsi}
                      startIcon={<Icon icon="mdi:printer" />}
                      sx={{ borderRadius: 2, py: 1.4 }}
                    >
                      Print
                    </Button>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!selectedCustomer || !tsi}
                    startIcon={<Icon icon="mdi:file-pdf-box" />}
                    sx={{ bgcolor: '#d32f2f', borderRadius: 2, py: 1.4, '&:hover': { bgcolor: '#b71c1c' } }}
                  >
                    Download PDF
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Customer Dialog */}
      <Dialog
        open={openCustomerDialog}
        onClose={() => {
          setOpenCustomerDialog(false);
          setCustomerSearch('');
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => setOpenCustomerDialog(false)} sx={{ mr: 1 }}>
              <Icon icon="mdi:arrow-left" />
            </IconButton>
            <Typography variant="h6" fontWeight={700}>
              Select Customer
            </Typography>
          </Box>

          <TextField
            fullWidth
            autoFocus
            placeholder="Search customer..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="mdi:magnify" />
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {filteredCustomers.map((customer) => (
              <Card
                key={customer.id}
                sx={{
                  mb: 1.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: selectedCustomer?.id === customer.id ? '#E3F2FD' : 'white',
                  border: selectedCustomer?.id === customer.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  transition: 'all 0.2s',
                  '&:active': { transform: 'scale(0.99)', bgcolor: '#f5f5f5' }
                }}
                onClick={() => {
                  setSelectedCustomer(customer);
                  setOpenCustomerDialog(false);
                  setCustomerSearch('');
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#1976d2', width: 40, height: 40 }}>
                      {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                    </Avatar>

                    <Box flex={1}>
                      <Typography fontWeight={700}>
                        {customer.name}
                        {selectedCustomer?.id === customer.id && (
                          <Icon icon="mdi:check-circle" color="#1976d2" style={{ marginLeft: 8, verticalAlign: 'middle' }} />
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {customer.phone || 'No phone'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.carData?.carBrand || 'No Car'} • {customer.carData?.plateNumber || 'No Plate'}
                      </Typography>
                    </Box>

                    <Icon icon="mdi:chevron-right" color="#ccc" />
                  </Box>
                </CardContent>
              </Card>
            ))}

            {filteredCustomers.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Icon icon="mdi:account-search" width={48} color="#ccc" />
                <Typography color="text.secondary" mt={1}>
                  No customers found
                </Typography>
                <Button variant="text" onClick={() => setCustomerSearch('')} sx={{ mt: 1 }}>
                  Clear Search
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
}