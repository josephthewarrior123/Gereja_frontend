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
  alpha
} from '@mui/material';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';
import CompanyDAO from '../../daos/CompanyDao';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CreateQuotationPage() {
  const navigate = useNavigate();
  const loading = useLoading();
  const message = useAlert();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const logoInputRef = useRef(null);

  // ============ Company / Header ============
  const [companyProfile, setCompanyProfile] = useState(null);
  const [companyName, setCompanyName] = useState('PT. JAYAINDO ARTHA SUKSES');
  const [companySubtitle, setCompanySubtitle] = useState('INSURANCE AGENCY');
  const [companyCity, setCompanyCity] = useState('Jakarta');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // ============ Customer Selection ============
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // ============ Quotation Data ============
  const [quotationNumber, setQuotationNumber] = useState('');
  const [tsi, setTsi] = useState('');

  // ============ Preview Dialog ============
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);

  const [coverages, setCoverages] = useState({
    comprehensive: { enabled: true, percentage: 1.32, freeInclude: false },
    flood: { enabled: false, percentage: 0.1, freeInclude: false },
    earthquake: { enabled: false, percentage: 0.12, freeInclude: false },
    typhoonAndStorm: { enabled: false, percentage: 0.05, freeInclude: false },
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
      typhoonAndStorm: 'Angin Topan, Badai, Taifun, Hujan Es, Tornado',
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
    fetchCompanyProfile();
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

  // ============ Fetch Company Profile ============
  const fetchCompanyProfile = async () => {
    try {
      const response = await CompanyDAO.getCompanyProfile();
      
      console.log('🔍 GET Response:', response);
      
      if (response.success && response.profile) {
        setCompanyProfile(response.profile);
        setCompanyName(response.profile.companyName || 'PT. JAYAINDO ARTHA SUKSES');
        setCompanySubtitle(response.profile.companySubtitle || 'INSURANCE AGENCY');
        setCompanyCity(response.profile.companyCity || 'Jakarta');
        setCompanyLogo(response.profile.companyLogo?.url || null);
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

  const generateQuotationNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setQuotationNumber(`QUO-${year}${month}-${random}`);
  };

  // ============ Logo Handlers ============
  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message('Please select an image file', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      message('Image size must be less than 2MB', 'error');
      return;
    }

    setLogoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
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

      console.log('🔍 Profile data being sent:', profileData);

      let profileResponse;
      
      if (companyProfile && companyProfile.createdAt) {
        console.log('📝 Updating existing profile...');
        profileResponse = await CompanyDAO.updateCompanyProfile(profileData);
      } else {
        console.log('✨ Creating new profile...');
        profileResponse = await CompanyDAO.createCompanyProfile(profileData);
      }

      if (!profileResponse.success) {
        message(profileResponse.error || 'Failed to save company profile', 'error');
        return;
      }

      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);

        const logoResponse = await CompanyDAO.uploadCompanyLogo(formData);
        if (logoResponse.success) {
          setCompanyLogo(logoResponse.logo.url);
          message('Company profile and logo saved successfully!', 'success');
        } else {
          message('Profile saved but logo upload failed', 'warning');
        }
      } else {
        message('Company profile saved successfully!', 'success');
      }

      await fetchCompanyProfile();
      
    } catch (error) {
      console.error('Error saving company profile:', error);
      message('Failed to save company profile', 'error');
    } finally {
      loading.stop();
    }
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

    setOpenPreviewDialog(true);
  };

  const handleConfirmDownload = () => {
    try {
      loading.start();
      generatePDF();
      message('Quotation PDF generated successfully!', 'success');
      setOpenPreviewDialog(false);
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
      typhoonAndStorm: { enabled: false, percentage: 0.05, freeInclude: false },
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

    let currentY = 18;

    const logoToUse = logoPreview || companyLogo;
    if (logoToUse) {
      try {
        doc.addImage(logoToUse, 'PNG', marginX, currentY, 25, 25);
        currentY += 28;
      } catch (err) {
        console.error('Error adding logo to PDF:', err);
      }
    }

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
    row(currentY, 'Harga TSI', `${formatCurrencyIDR(Number(tsi) || 0)} (IDR)`);
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
      didParseCell: function(data) {
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

      const formattedBase = `Rp ${formatCurrencyShort(tsiValue)}`;
      
      calcBody.push([
        coverageLabels[key],
        formattedBase,
        `x ${pct} %`,
        formatCurrency(amount)
      ]);
    });

    if ((calculations.adminFee ?? 0) > 0) {
      calcBody.push([
        'Admin Fee',
        'Rp 50.000',
        '',
        formatCurrency(calculations.adminFee)
      ]);
    }
    if ((calculations.stampDuty ?? 0) > 0) {
      calcBody.push([
        'Stamp Duty',
        'Rp 10.000',
        '',
        formatCurrency(calculations.stampDuty)
      ]);
    }

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
            if (data.cell.text[0] === 'Rp 50.000' || data.cell.text[0] === 'Rp 10.000') {
              data.cell.styles.cellPadding = { 
                top: 2.6, 
                right: 12,
                bottom: 2.6, 
                left: 2
              };
            } else {
              data.cell.styles.cellPadding = { 
                top: 2.6, 
                right: 12,
                bottom: 2.6, 
                left: 2
              };
            }
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
    <Box sx={{ bgcolor: '#F8F9FA', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={600} sx={{ color: '#1a1a1a' }}>
            Create Quotation
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
                  {/* Logo Upload */}
                  <Grid item xs={12} md={4}>
                    <Typography fontSize={13} fontWeight={500} mb={1.5} sx={{ color: '#5a5a5a' }}>
                      Company Logo
                    </Typography>
                    
                    <Box
                      onClick={handleLogoClick}
                      sx={{
                        width: '100%',
                        height: 160,
                        border: '1.5px dashed #D0D0D0',
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        bgcolor: '#FAFAFA',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#1976d2',
                          bgcolor: alpha('#1976d2', 0.04)
                        },
                        overflow: 'hidden',
                        mb: 1.5
                      }}
                    >
                      {(logoPreview || companyLogo) ? (
                        <img
                          src={logoPreview || companyLogo}
                          alt="Company Logo"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: '12px'
                          }}
                        />
                      ) : (
                        <Box sx={{ textAlign: 'center' }}>
                          <Icon icon="mdi:image-plus" width={40} color="#C0C0C0" />
                          <Typography fontSize={12} color="text.secondary" mt={1}>
                            Click to upload
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={handleLogoClick}
                      startIcon={<Icon icon="mdi:upload" width={16} />}
                      sx={{ 
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontSize: 13,
                        fontWeight: 500,
                        borderColor: '#D0D0D0',
                        color: '#5a5a5a',
                        mb: 1,
                        '&:hover': {
                          borderColor: '#1976d2',
                          bgcolor: alpha('#1976d2', 0.04)
                        }
                      }}
                    >
                      {(logoPreview || companyLogo) ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    
                    {(logoPreview || companyLogo) && (
                      <Button
                        fullWidth
                        variant="text"
                        size="small"
                        color="error"
                        onClick={handleRemoveLogo}
                        startIcon={<Icon icon="mdi:delete" width={16} />}
                        sx={{ 
                          textTransform: 'none',
                          fontSize: 13,
                          fontWeight: 500
                        }}
                      >
                        Remove
                      </Button>
                    )}

                    <Typography variant="caption" display="block" color="text.secondary" mt={1} sx={{ fontSize: 11 }}>
                      Max 2MB, PNG/JPG recommended
                    </Typography>

                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      style={{ display: 'none' }}
                    />
                  </Grid>

                  {/* Company Details */}
                  <Grid item xs={12} md={8}>
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
                          required
                          error={!companyName || companyName.trim() === ''}
                          helperText={(!companyName || companyName.trim() === '') ? 'Company name is required' : ''}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                              fontSize: 14,
                              bgcolor: 'white',
                              '& fieldset': { borderColor: '#E0E0E0' },
                              '&:hover fieldset': { borderColor: '#B0B0B0' },
                              '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: 1.5 }
                            }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography fontSize={13} fontWeight={500} mb={1} sx={{ color: '#5a5a5a' }}>
                          Subtitle
                        </Typography>
                        <TextField
                          fullWidth
                          value={companySubtitle}
                          onChange={(e) => setCompanySubtitle(e.target.value)}
                          placeholder="e.g., Solusi Teknologi Terdepan"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                              fontSize: 14,
                              bgcolor: 'white',
                              '& fieldset': { borderColor: '#E0E0E0' },
                              '&:hover fieldset': { borderColor: '#B0B0B0' },
                              '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: 1.5 }
                            }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography fontSize={13} fontWeight={500} mb={1} sx={{ color: '#5a5a5a' }}>
                          City
                        </Typography>
                        <TextField
                          fullWidth
                          value={companyCity}
                          onChange={(e) => setCompanyCity(e.target.value)}
                          placeholder="Jakarta"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                              fontSize: 14,
                              bgcolor: 'white',
                              '& fieldset': { borderColor: '#E0E0E0' },
                              '&:hover fieldset': { borderColor: '#B0B0B0' },
                              '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: 1.5 }
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Save Button - Bottom Right */}
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        onClick={handleSaveCompanyProfile}
                        startIcon={<Icon icon="mdi:content-save" width={16} />}
                        sx={{ 
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontSize: 13,
                          fontWeight: 500,
                          px: 3,
                          boxShadow: 'none',
                          '&:hover': { boxShadow: '0 2px 8px rgba(25,118,210,0.25)' }
                        }}
                      >
                        Save Profile
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Customer Information */}
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
                    Customer Information
                  </Typography>
                </Box>

                <Typography fontSize={13} fontWeight={500} mb={1} sx={{ color: '#5a5a5a' }}>
                  Client *
                </Typography>

                <TextField
                  fullWidth
                  placeholder="Search and select client..."
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
                        <Icon icon="mdi:account-search" width={18} color="#9E9E9E" />
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
                            <Icon icon="mdi:close" width={16} />
                          </IconButton>
                        ) : (
                          <Icon icon="mdi:chevron-down" width={18} color="#9E9E9E" />
                        )}
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    mb: selectedCustomer ? 2.5 : 0,
                    '& .MuiOutlinedInput-root': {
                      cursor: 'pointer',
                      borderRadius: 1.5,
                      fontSize: 14,
                      bgcolor: selectedCustomer ? alpha('#1976d2', 0.04) : 'white',
                      '& fieldset': { borderColor: selectedCustomer ? '#1976d2' : '#E0E0E0' },
                      '&:hover fieldset': { borderColor: '#1976d2' }
                    }
                  }}
                />

                {selectedCustomer && (
                  <Paper 
                    sx={{ 
                      p: 2.5, 
                      borderRadius: 1.5, 
                      bgcolor: '#FAFAFA',
                      border: '1px solid #F0F0F0'
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography fontSize={11} color="text.secondary" mb={0.5} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Customer Name
                        </Typography>
                        <Typography fontSize={14} fontWeight={500}>
                          {selectedCustomer.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography fontSize={11} color="text.secondary" mb={0.5} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Phone
                        </Typography>
                        <Typography fontSize={14} fontWeight={500}>
                          {selectedCustomer.phone || '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography fontSize={11} color="text.secondary" mb={0.5} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Car Brand
                        </Typography>
                        <Typography fontSize={14} fontWeight={500}>
                          {selectedCustomer.carData?.carBrand || '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography fontSize={11} color="text.secondary" mb={0.5} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Model
                        </Typography>
                        <Typography fontSize={14} fontWeight={500}>
                          {selectedCustomer.carData?.carModel || '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography fontSize={11} color="text.secondary" mb={0.5} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Plate Number
                        </Typography>
                        <Typography fontSize={14} fontWeight={500}>
                          {selectedCustomer.carData?.plateNumber || '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography fontSize={11} color="text.secondary" mb={0.5} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Year
                        </Typography>
                        <Typography fontSize={14} fontWeight={500}>
                          {selectedCustomer.carData?.carYear || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </CardContent>
            </Card>

            {/* TSI Amount */}
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
                  <Icon icon="mdi:cash" width={20} color="#1976d2" />
                  <Typography fontSize={15} fontWeight={600} sx={{ color: '#1a1a1a' }}>
                    Total Sum Insured (TSI)
                  </Typography>
                </Box>

                <Typography fontSize={13} fontWeight={500} mb={1} sx={{ color: '#5a5a5a' }}>
                  Amount (IDR) *
                </Typography>

                <TextField
                  fullWidth
                  type="number"
                  placeholder="e.g., 400000000"
                  value={tsi}
                  onChange={(e) => setTsi(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography fontWeight={600} fontSize={14}>Rp</Typography>
                      </InputAdornment>
                    )
                  }}
                  helperText="Nilai pertanggungan kendaraan"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: 14,
                      bgcolor: 'white',
                      '& fieldset': { borderColor: '#E0E0E0' },
                      '&:hover fieldset': { borderColor: '#B0B0B0' },
                      '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: 1.5 }
                    }
                  }}
                />

                {tsi && (
                  <Box sx={{ mt: 2.5, p: 2.5, borderRadius: 1.5, bgcolor: alpha('#1976d2', 0.06), border: `1px solid ${alpha('#1976d2', 0.15)}` }}>
                    <Typography fontSize={12} color="text.secondary" mb={0.5} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      TSI Amount
                    </Typography>
                    <Typography fontSize={22} fontWeight={700} color="#1976d2">
                      {formatCurrency(Number(tsi) || 0)}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Coverage Options */}
            <Card 
              sx={{ 
                borderRadius: 2,
                border: '1px solid #E8E8E8',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <Icon icon="mdi:shield-check" width={20} color="#1976d2" />
                  <Typography fontSize={15} fontWeight={600} sx={{ color: '#1a1a1a' }}>
                    Coverage Options
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {Object.keys(coverages).map((key) => {
                    const c = coverages[key];
                    return (
                      <Paper
                        key={key}
                        sx={{
                          p: 2,
                          borderRadius: 1.5,
                          border: c.enabled ? '1.5px solid #1976d2' : '1px solid #E8E8E8',
                          bgcolor: c.enabled ? alpha('#1976d2', 0.02) : 'white',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} mb={c.enabled ? 1.5 : 0}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={c.enabled}
                                onChange={() => handleCoverageToggle(key)}
                                sx={{ 
                                  color: '#D0D0D0', 
                                  '&.Mui-checked': { color: '#1976d2' }
                                }}
                              />
                            }
                            label={
                              <Typography fontSize={14} fontWeight={500} sx={{ color: '#1a1a1a' }}>
                                {coverageLabels[key]}
                              </Typography>
                            }
                          />

                          {c.enabled && (
                            <Chip
                              label={chipLabelFor(key)}
                              size="small"
                              sx={{
                                bgcolor: c.freeInclude ? alpha('#2e7d32', 0.15) : alpha('#1976d2', 0.15),
                                color: c.freeInclude ? '#2e7d32' : '#1976d2',
                                fontWeight: 600,
                                fontSize: 11,
                                whiteSpace: 'nowrap',
                                height: 24
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
                                    size="small"
                                  />
                                }
                                label={
                                  <Typography fontSize={12} fontWeight={500} sx={{ color: '#5a5a5a' }}>
                                    FREE INCLUDE
                                  </Typography>
                                }
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
                                        <Typography fontSize={12}>%</Typography>
                                      </InputAdornment>
                                    )
                                  }}
                                  sx={{ 
                                    width: 120,
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: 1.5,
                                      fontSize: 13,
                                      '& fieldset': { borderColor: '#E0E0E0' },
                                      '&:hover fieldset': { borderColor: '#B0B0B0' },
                                      '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                                    }
                                  }}
                                />
                                <Typography fontSize={12} color="text.secondary">
                                  dari TSI
                                </Typography>
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

          {/* RIGHT COLUMN - Calculator */}
          <Grid item xs={12} md={5}>
            <Box sx={{ position: { xs: 'static', md: 'sticky' }, top: { md: 24 } }}>
              <Card 
                sx={{ 
                  borderRadius: 2,
                  border: '1.5px solid #1976d2',
                  boxShadow: '0 4px 12px rgba(25,118,210,0.12)'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                    <Icon icon="mdi:calculator" width={20} color="#1976d2" />
                    <Typography fontSize={15} fontWeight={600} sx={{ color: '#1a1a1a' }}>
                      Premium Calculation
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2.5 }}>
                    {Object.keys(coverages).map((key) => {
                      const c = coverages[key];
                      if (!c.enabled) return null;

                      const right = rightTextForCalc(key);
                      return (
                        <Box key={key} display="flex" justifyContent="space-between" alignItems="center" mb={1.2} gap={2}>
                          <Typography fontSize={13} color="text.secondary">
                            {coverageLabels[key]}
                          </Typography>
                          <Typography
                            fontSize={13}
                            fontWeight={600}
                            sx={{ 
                              whiteSpace: 'nowrap', 
                              color: c.freeInclude ? '#2e7d32' : '#1a1a1a' 
                            }}
                          >
                            {right}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  <Divider sx={{ my: 2.5 }} />

                  <Box display="flex" justifyContent="space-between" mb={1.5} gap={2}>
                    <Typography fontSize={14} fontWeight={600}>
                      Subtotal Coverage
                    </Typography>
                    <Typography fontSize={14} fontWeight={700}>
                      {formatCurrency(calculations.subtotal)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2.5 }} />

                  <Box display="flex" justifyContent="space-between" mb={1} gap={2}>
                    <Typography fontSize={13} color="text.secondary">Admin Fee</Typography>
                    <Typography fontSize={13} fontWeight={500}>
                      {formatCurrency(calculations.adminFee)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={2.5} gap={2}>
                    <Typography fontSize={13} color="text.secondary">Stamp Duty</Typography>
                    <Typography fontSize={13} fontWeight={500}>
                      {formatCurrency(calculations.stampDuty)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2.5 }} />

                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 1.5,
                      bgcolor: alpha('#1976d2', 0.08),
                      border: `1px solid ${alpha('#1976d2', 0.2)}`
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="baseline" gap={2}>
                      <Typography fontSize={14} fontWeight={700} sx={{ color: '#1a1a1a' }}>
                        TOTAL PREMIUM
                      </Typography>
                      <Typography
                        fontSize={20}
                        fontWeight={700}
                        color="#1976d2"
                      >
                        {formatCurrency(calculations.totalPremium)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        onClick={handleReset}
                        sx={{ 
                          borderRadius: 1.5, 
                          py: 1.2,
                          textTransform: 'none',
                          fontSize: 13,
                          fontWeight: 500,
                          borderColor: '#D0D0D0',
                          color: '#5a5a5a',
                          '&:hover': {
                            borderColor: '#B0B0B0',
                            bgcolor: alpha('#000', 0.02)
                          }
                        }}
                      >
                        Reset
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handlePrint}
                        disabled={!selectedCustomer || !tsi}
                        startIcon={<Icon icon="mdi:printer" width={16} />}
                        sx={{ 
                          borderRadius: 1.5, 
                          py: 1.2,
                          textTransform: 'none',
                          fontSize: 13,
                          fontWeight: 500,
                          borderColor: '#D0D0D0',
                          color: '#5a5a5a',
                          '&:hover': {
                            borderColor: '#B0B0B0',
                            bgcolor: alpha('#000', 0.02)
                          }
                        }}
                      >
                        Print
                      </Button>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={!selectedCustomer || !tsi}
                      startIcon={<Icon icon="mdi:file-pdf-box" width={16} />}
                      sx={{ 
                        bgcolor: '#d32f2f', 
                        borderRadius: 1.5, 
                        py: 1.4,
                        textTransform: 'none',
                        fontSize: 14,
                        fontWeight: 500,
                        boxShadow: 'none',
                        '&:hover': { 
                          bgcolor: '#b71c1c',
                          boxShadow: '0 4px 12px rgba(211,47,47,0.3)'
                        }
                      }}
                    >
                      Preview & Download PDF
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
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
              <IconButton 
                onClick={() => setOpenCustomerDialog(false)} 
                sx={{ mr: 1 }}
              >
                <Icon icon="mdi:arrow-left" width={20} />
              </IconButton>
              <Typography variant="h6" fontWeight={600}>
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
                    <Icon icon="mdi:magnify" width={20} color="#9E9E9E" />
                  </InputAdornment>
                )
              }}
              sx={{ 
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  fontSize: 14,
                  '& fieldset': { borderColor: '#E0E0E0' },
                  '&:hover fieldset': { borderColor: '#B0B0B0' },
                  '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                }
              }}
            />

            <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
              {filteredCustomers.map((customer) => (
                <Card
                  key={customer.id}
                  sx={{
                    mb: 1.5,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    bgcolor: selectedCustomer?.id === customer.id ? alpha('#1976d2', 0.08) : 'white',
                    border: selectedCustomer?.id === customer.id ? '1.5px solid #1976d2' : '1px solid #E8E8E8',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: selectedCustomer?.id === customer.id ? alpha('#1976d2', 0.08) : '#FAFAFA',
                      borderColor: '#1976d2'
                    },
                    '&:active': { transform: 'scale(0.99)' }
                  }}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setOpenCustomerDialog(false);
                    setCustomerSearch('');
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: '#1976d2', 
                          width: 40, 
                          height: 40,
                          fontSize: 16,
                          fontWeight: 600
                        }}
                      >
                        {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                      </Avatar>

                      <Box flex={1}>
                        <Typography fontWeight={600} fontSize={14} sx={{ color: '#1a1a1a' }}>
                          {customer.name}
                          {selectedCustomer?.id === customer.id && (
                            <Icon 
                              icon="mdi:check-circle" 
                              color="#1976d2" 
                              width={16}
                              style={{ marginLeft: 6, verticalAlign: 'middle' }} 
                            />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" fontSize={12}>
                          {customer.phone || 'No phone'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontSize={12}>
                          {customer.carData?.carBrand || 'No Car'} • {customer.carData?.plateNumber || 'No Plate'}
                        </Typography>
                      </Box>

                      <Icon icon="mdi:chevron-right" color="#C0C0C0" width={20} />
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {filteredCustomers.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Icon icon="mdi:account-search" width={48} color="#D0D0D0" />
                  <Typography color="text.secondary" mt={2} fontSize={14}>
                    No customers found
                  </Typography>
                  <Button 
                    variant="text" 
                    onClick={() => setCustomerSearch('')} 
                    sx={{ 
                      mt: 1.5,
                      textTransform: 'none',
                      fontSize: 13
                    }}
                  >
                    Clear Search
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog
          open={openPreviewDialog}
          onClose={() => setOpenPreviewDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }
          }}
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Icon icon="mdi:file-pdf-box" width={24} color="#d32f2f" />
              <Typography variant="h6" fontWeight={600}>
                Preview Quotation
              </Typography>
            </Box>
          </DialogTitle>
          
          <DialogContent dividers>
            <Paper 
              sx={{ 
                p: 3, 
                bgcolor: '#FAFAFA', 
                borderRadius: 1.5,
                border: '1px solid #F0F0F0'
              }}
            >
              {/* Preview Header dengan Logo */}
              <Box display="flex" gap={2} mb={3} alignItems="center">
                {(logoPreview || companyLogo) && (
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      border: '1px solid #E0E0E0',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      bgcolor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={logoPreview || companyLogo}
                      alt="Logo Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                )}
                
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={600} fontSize={16}>
                    {companyName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontSize={13}>
                    {companySubtitle}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize={12}>
                    {companyCity}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Customer Info */}
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: 11 }}>
                  Customer
                </Typography>
                <Typography variant="body1" fontWeight={600} fontSize={14}>
                  {selectedCustomer?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontSize={13}>
                  {selectedCustomer?.carData?.carBrand} {selectedCustomer?.carData?.carModel} • {selectedCustomer?.carData?.plateNumber}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Summary */}
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" fontSize={13}>TSI</Typography>
                  <Typography variant="body2" fontWeight={600} fontSize={13}>
                    {formatCurrency(Number(tsi) || 0)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" fontSize={13}>Total Premium</Typography>
                  <Typography variant="body2" fontWeight={700} color="#d32f2f" fontSize={14}>
                    {formatCurrency(calculations.totalPremium)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Box mt={2.5}>
              <Typography variant="caption" color="text.secondary" fontSize={12}>
                📄 PDF will include company logo, header info, customer details, coverage breakdown, and premium calculation.
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={() => setOpenPreviewDialog(false)}
              variant="outlined"
              sx={{ 
                borderRadius: 1.5,
                textTransform: 'none',
                fontSize: 13,
                fontWeight: 500,
                borderColor: '#D0D0D0',
                color: '#5a5a5a'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDownload}
              variant="contained"
              startIcon={<Icon icon="mdi:download" width={16} />}
              sx={{ 
                bgcolor: '#d32f2f', 
                borderRadius: 1.5,
                textTransform: 'none',
                fontSize: 13,
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': { 
                  bgcolor: '#b71c1c',
                  boxShadow: '0 4px 12px rgba(211,47,47,0.3)'
                }
              }}
            >
              Download PDF
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}