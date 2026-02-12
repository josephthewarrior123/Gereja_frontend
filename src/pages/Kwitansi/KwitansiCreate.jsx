import React, { useState, useEffect, useRef } from "react";
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
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  useMediaQuery,
  useTheme,
  Stack,
  InputAdornment,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router";
import { useLoading } from "../../hooks/LoadingProvider";
import { useAlert } from "../../hooks/SnackbarProvider";
import CustomerDAO from "../../daos/CustomerDao";
import CompanyDAO from "../../daos/CompanyDao";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function KwitansiCreate() {
  const navigate = useNavigate();
  const loading = useLoading();
  const message = useAlert();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const receiptRef = useRef(null);

  // ============ Company / Header ============
  const [companyProfile, setCompanyProfile] = useState(null);
  const [companyName, setCompanyName] = useState("PT. JAYAINDO ARTHA SUKSES");
  const [companySubtitle, setCompanySubtitle] = useState("INSURANCE AGENCY");
  const [companyCity, setCompanyCity] = useState("Jakarta");
  const [companyLogo, setCompanyLogo] = useState(null);
  const [headerFile, setHeaderFile] = useState(null);
  const [stampFile, setStampFile] = useState(null);
  const [headerPreview, setHeaderPreview] = useState("/header1.png");
  const [stampPreview, setStampPreview] = useState("/stamp1.png");

  // ============ Customer Selection ============
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // ============ Kwitansi Data ============
  const [formData, setFormData] = useState({
    nomor: "0022/JAS/VII/2024",
    jumlah: "IDR 716.800",
    terbilang: "Tujuh Ratus Enam Belas Ribu Delapan Ratus Rupiah",
    pembayaran: "PREMI SATU UNIT SEPEDA MOTOR HONDA ALL NEW VARIO 125 CBS NO POLISI : B 4063 SKY",
    tanggal: "Jakarta, 11 Juni 2024",
  });

  // ============ Preview Dialog ============
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [pdfName, setPdfName] = useState("");

  // ============ Effects ============
  useEffect(() => {
    fetchCompanyProfile();
    fetchCustomers();
  }, []);

  // ============ Helpers ============
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  // ============ Fetch Company Profile ============
  const fetchCompanyProfile = async () => {
    try {
      const response = await CompanyDAO.getCompanyProfile();
      if (response.success && response.profile) {
        setCompanyProfile(response.profile);
        setCompanyName(response.profile.companyName || "PT. JAYAINDO ARTHA SUKSES");
        setCompanySubtitle(response.profile.companySubtitle || "INSURANCE AGENCY");
        setCompanyCity(response.profile.companyCity || "Jakarta");
        setCompanyLogo(response.profile.companyLogo?.url || null);
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      loading.start();
      const response = await CustomerDAO.getAllCustomers();
      if (response.success) setCustomers(response.customers || []);
      else message("Failed to load customers", "error");
    } catch (error) {
      console.error("Error fetching customers:", error);
      message("Failed to load customers", "error");
    } finally {
      loading.stop();
    }
  };

  // ============ Image Handlers ============
  const handleHeaderChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message("Please select an image file", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      message("Image size must be less than 2MB", "error");
      return;
    }

    setHeaderFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setHeaderPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleStampChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message("Please select an image file", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      message("Image size must be less than 2MB", "error");
      return;
    }

    setStampFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setStampPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveHeader = () => {
    setHeaderFile(null);
    setHeaderPreview("/header1.png");
  };

  const handleRemoveStamp = () => {
    setStampFile(null);
    setStampPreview("/stamp1.png");
  };

  // ============ Form Handlers ============
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveCompanyProfile = async () => {
    try {
      if (!companyName || companyName.trim() === "") {
        message("Company name is required", "error");
        return;
      }

      loading.start();
      const profileData = {
        companyName: companyName.trim(),
        companySubtitle: companySubtitle?.trim() || "",
        companyCity: companyCity?.trim() || "",
      };

      let profileResponse;
      if (companyProfile && companyProfile.createdAt) {
        profileResponse = await CompanyDAO.updateCompanyProfile(profileData);
      } else {
        profileResponse = await CompanyDAO.createCompanyProfile(profileData);
      }

      if (!profileResponse.success) {
        message(profileResponse.error || "Failed to save company profile", "error");
        return;
      }

      message("Company profile saved successfully!", "success");
      await fetchCompanyProfile();
    } catch (error) {
      console.error("Error saving company profile:", error);
      message("Failed to save company profile", "error");
    } finally {
      loading.stop();
    }
  };

  const handleSubmit = () => {
    if (!selectedCustomer) {
      message("Please select a customer", "error");
      return;
    }
    if (!formData.jumlah) {
      message("Please enter payment amount", "error");
      return;
    }
    setOpenPreviewDialog(true);
  };

  // ============ PDF Generation ============
  const downloadPDF = async () => {
    try {
      loading.start();
      const element = receiptRef.current;
      if (!element) throw new Error("Receipt element not found");

      await new Promise((r) => setTimeout(r, 250));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const maxW = pdfWidth - margin * 2;
      const maxH = pdfHeight - margin * 2;

      const imgWpx = canvas.width;
      const imgHpx = canvas.height;
      const ratio = Math.min(maxW / imgWpx, maxH / imgHpx);
      const renderW = imgWpx * ratio;
      const renderH = imgHpx * ratio;

      const x = (pdfWidth - renderW) / 2;
      const y = (pdfHeight - renderH) / 2;

      pdf.addImage(imgData, "PNG", x, y, renderW, renderH, undefined, "FAST");

      const fileName = pdfName.trim() || `Kwitansi_${formData.nomor.replace(/\//g, "_")}`;
      pdf.save(`${fileName}.pdf`);

      message("Kwitansi PDF generated successfully!", "success");
      setOpenPreviewDialog(false);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      message("Failed to generate PDF", "error");
    } finally {
      loading.stop();
    }
  };

  const handleReset = () => {
    setSelectedCustomer(null);
    setFormData({
      nomor: "0022/JAS/VII/2024",
      jumlah: "IDR 716.800",
      terbilang: "Tujuh Ratus Enam Belas Ribu Delapan Ratus Rupiah",
      pembayaran: "PREMI SATU UNIT SEPEDA MOTOR HONDA ALL NEW VARIO 125 CBS NO POLISI : B 4063 SKY",
      tanggal: "Jakarta, 11 Juni 2024",
    });
    setPdfName("");
  };

  // ============ UI helpers ============
  const filteredCustomers = customers.filter((c) => {
    const search = customerSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(search) ||
      c.phone?.toLowerCase().includes(search) ||
      c.carData?.carBrand?.toLowerCase().includes(search) ||
      c.carData?.plateNumber?.toLowerCase().includes(search)
    );
  });

  // ============ Receipt Content Component ============
  const ReceiptContent = () => (
    <Box
      sx={{
        width: "210mm",
        minHeight: "297mm",
        p: "40px 60px",
        bgcolor: "white",
        color: "black",
        fontFamily: "serif",
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 4 }}>
          <img
            src={headerPreview}
            alt="Header"
            style={{ height: "150px", width: "auto" }}
            crossOrigin="anonymous"
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mt: 6 }}>
          <Box sx={{ flex: 1 }}></Box>
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography variant="h6" fontWeight="bold" sx={{ textDecoration: "underline" }}>
              KWITANSI
            </Typography>
            <Typography variant="caption" fontStyle="italic" sx={{ mt: 0.5 }}>
              RECEIPT
            </Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: "right", pt: 1 }}>
            <Typography variant="caption" fontWeight="semibold">
              No : {formData.nomor}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 6, "& > div": { mb: 2 } }}>
        {/* Terima dari */}
        <Box sx={{ display: "flex" }}>
          <Box sx={{ width: 192, flexShrink: 0 }}>
            <Typography fontWeight="semibold" sx={{ mb: 0.5 }}>
              Terima dari
            </Typography>
            <Typography variant="caption" fontStyle="italic" sx={{ borderTop: "1px solid black", pt: 0.5 }}>
              Received From
            </Typography>
          </Box>
          <Box sx={{ flex: 1, display: "flex" }}>
            <Typography sx={{ mr: 1 }}>:</Typography>
            <Typography sx={{ flex: 1 }}>
              {selectedCustomer ? selectedCustomer.name : "TBA"}
            </Typography>
          </Box>
        </Box>

        {/* Alamat */}
        <Box sx={{ display: "flex" }}>
          <Box sx={{ width: 192, flexShrink: 0 }}>
            <Typography fontWeight="semibold" sx={{ mb: 0.5 }}>
              Alamat
            </Typography>
            <Typography variant="caption" fontStyle="italic" sx={{ borderTop: "1px solid black", pt: 0.5 }}>
              Address
            </Typography>
          </Box>
          <Box sx={{ flex: 1, display: "flex" }}>
            <Typography sx={{ mr: 1 }}>:</Typography>
            <Typography sx={{ flex: 1 }}>
              {selectedCustomer ? selectedCustomer.address : "TBA"}
            </Typography>
          </Box>
        </Box>

        {/* Jumlah uang */}
        <Box sx={{ display: "flex" }}>
          <Box sx={{ width: 192, flexShrink: 0 }}>
            <Typography fontWeight="semibold" sx={{ mb: 0.5 }}>
              Jumlah uang sebesar
            </Typography>
            <Typography variant="caption" fontStyle="italic" sx={{ borderTop: "1px solid black", pt: 0.5 }}>
              The Sum of
            </Typography>
          </Box>
          <Box sx={{ flex: 1, display: "flex" }}>
            <Typography sx={{ mr: 1 }}>:</Typography>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight="semibold">{formData.jumlah}</Typography>
              <Typography sx={{ mt: 0.5 }}>{formData.terbilang}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Untuk pembayaran */}
        <Box sx={{ display: "flex", mt: 3 }}>
          <Box sx={{ width: 192, flexShrink: 0 }}>
            <Typography fontWeight="semibold" sx={{ mb: 0.5 }}>
              Untuk pembayaran
            </Typography>
            <Typography variant="caption" fontStyle="italic" sx={{ borderTop: "1px solid black", pt: 0.5 }}>
              Being payment of
            </Typography>
          </Box>
          <Box sx={{ flex: 1, display: "flex" }}>
            <Typography sx={{ mr: 1 }}>:</Typography>
            <Typography
              sx={{
                flex: 1,
                whiteSpace: "pre-wrap",
                fontFamily: "serif",
                fontSize: "0.875rem",
              }}
            >
              {formData.pembayaran}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 16 }}>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="body2" sx={{ mb: 8 }}>
            {formData.tanggal}
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            <img
              src={stampPreview}
              alt="Stamp"
              style={{ height: "80px", width: "auto", opacity: 0.7, marginRight: 16 }}
              crossOrigin="anonymous"
            />
          </Box>

          <Typography variant="body2" sx={{ mt: 1 }}>
            (Finance Department)
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <IconButton onClick={() => navigate(-1)}>
            <Icon icon="mdi:arrow-left" width={24} />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Create Kwitansi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Receipt Generator
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT SIDE - Form Input */}
        <Grid item xs={12} md={7}>
          {/* Company Settings */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Typography fontSize={16} fontWeight={700}>
                  <Icon icon="mdi:office-building" width={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
                  Company Header
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveCompanyProfile}
                  startIcon={<Icon icon="mdi:content-save" />}
                  sx={{ borderRadius: 2 }}
                >
                  Save Profile
                </Button>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="PT. ..."
                    required
                    error={!companyName || companyName.trim() === ""}
                    helperText={!companyName || companyName.trim() === "" ? "Company name is required" : ""}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Customer Selection */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontSize={16} fontWeight={700} mb={2.5}>
                <Icon icon="mdi:account" width={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
                Customer Information
              </Typography>

              <TextField
                fullWidth
                placeholder="Select customer..."
                value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.carData?.plateNumber || "No Plate"})` : ""}
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
                  ),
                }}
                sx={{
                  mb: 2.5,
                  "& .MuiInputBase-root": { cursor: "pointer", bgcolor: selectedCustomer ? "#F2F2F7" : "white" },
                }}
              />

              {selectedCustomer && (
                <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: "#F2F2F7" }}>
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
                        {selectedCustomer.phone || "-"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography fontSize={12} color="text.secondary" mb={0.5}>
                        Address
                      </Typography>
                      <Typography fontSize={14} fontWeight={600}>
                        {selectedCustomer.address || "-"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </CardContent>
          </Card>

          {/* Kwitansi Form */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontSize={16} fontWeight={700} mb={2.5}>
                <Icon icon="mdi:receipt" width={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
                Kwitansi Details
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nomor Kwitansi"
                    name="nomor"
                    value={formData.nomor}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Jumlah Uang"
                    name="jumlah"
                    value={formData.jumlah}
                    onChange={handleChange}
                    placeholder="IDR 716.800"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Terbilang"
                    name="terbilang"
                    value={formData.terbilang}
                    onChange={handleChange}
                    placeholder="Tujuh Ratus Enam Belas Ribu Delapan Ratus Rupiah"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Untuk Pembayaran"
                    name="pembayaran"
                    value={formData.pembayaran}
                    onChange={handleChange}
                    multiline
                    rows={3}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tanggal & Tempat"
                    name="tanggal"
                    value={formData.tanggal}
                    onChange={handleChange}
                    placeholder="Jakarta, 11 Juni 2024"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Image Uploads */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography fontSize={16} fontWeight={700} mb={2.5}>
                <Icon icon="mdi:image" width={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
                Images
              </Typography>

              <Grid container spacing={3}>
                {/* Header Image */}
                <Grid item xs={12} md={6}>
                  <Typography fontSize={14} fontWeight={600} mb={1}>
                    Header Image
                  </Typography>
                  <Box
                    sx={{
                      width: "100%",
                      height: 100,
                      border: "2px dashed #ccc",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      bgcolor: "#f9f9f9",
                      transition: "all 0.2s",
                      "&:hover": {
                        borderColor: "#007AFF",
                        bgcolor: "#f0f8ff",
                      },
                      overflow: "hidden",
                      mb: 1,
                    }}
                    onClick={() => document.getElementById("header-upload").click()}
                  >
                    {headerPreview ? (
                      <img
                        src={headerPreview}
                        alt="Header Preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <Icon icon="mdi:image-plus" width={32} color="#ccc" />
                    )}
                  </Box>
                  <input
                    id="header-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleHeaderChange}
                    style={{ display: "none" }}
                  />
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => document.getElementById("header-upload").click()}
                      startIcon={<Icon icon="mdi:upload" />}
                      sx={{ borderRadius: 2 }}
                    >
                      {headerPreview ? "Change" : "Upload"}
                    </Button>
                    {headerPreview && headerPreview !== "/header1.png" && (
                      <Button
                        variant="text"
                        size="small"
                        color="error"
                        onClick={handleRemoveHeader}
                        startIcon={<Icon icon="mdi:delete" />}
                        sx={{ borderRadius: 2 }}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                </Grid>

                {/* Stamp Image */}
                <Grid item xs={12} md={6}>
                  <Typography fontSize={14} fontWeight={600} mb={1}>
                    Stamp Image
                  </Typography>
                  <Box
                    sx={{
                      width: "100%",
                      height: 100,
                      border: "2px dashed #ccc",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      bgcolor: "#f9f9f9",
                      transition: "all 0.2s",
                      "&:hover": {
                        borderColor: "#007AFF",
                        bgcolor: "#f0f8ff",
                      },
                      overflow: "hidden",
                      mb: 1,
                    }}
                    onClick={() => document.getElementById("stamp-upload").click()}
                  >
                    {stampPreview ? (
                      <img
                        src={stampPreview}
                        alt="Stamp Preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          opacity: 0.7,
                        }}
                      />
                    ) : (
                      <Icon icon="mdi:stamp" width={32} color="#ccc" />
                    )}
                  </Box>
                  <input
                    id="stamp-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleStampChange}
                    style={{ display: "none" }}
                  />
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => document.getElementById("stamp-upload").click()}
                      startIcon={<Icon icon="mdi:upload" />}
                      sx={{ borderRadius: 2 }}
                    >
                      {stampPreview ? "Change" : "Upload"}
                    </Button>
                    {stampPreview && stampPreview !== "/stamp1.png" && (
                      <Button
                        variant="text"
                        size="small"
                        color="error"
                        onClick={handleRemoveStamp}
                        startIcon={<Icon icon="mdi:delete" />}
                        sx={{ borderRadius: 2 }}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT SIDE - Action Panel */}
        <Grid item xs={12} md={5}>
          <Box sx={{ position: { xs: "static", md: "sticky" }, top: { md: 24 } }}>
            <Card sx={{ borderRadius: 3, bgcolor: "#007AFF11", border: "2px solid #007AFF" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography fontSize={16} fontWeight={700} mb={2.5}>
                  <Icon icon="mdi:file-document" width={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
                  PDF Settings
                </Typography>

                <TextField
                  fullWidth
                  label="PDF File Name (Optional)"
                  value={pdfName}
                  onChange={(e) => setPdfName(e.target.value)}
                  placeholder="Leave empty for auto-generated name"
                  sx={{ mb: 3 }}
                />

                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f5f5f5", mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Preview Info:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    Customer: {selectedCustomer ? selectedCustomer.name : "Not selected"}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    Amount: {formData.jumlah}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    Date: {formData.tanggal}
                  </Typography>
                </Box>

                <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button fullWidth variant="outlined" onClick={handleReset} sx={{ borderRadius: 2, py: 1.4 }}>
                      Reset
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setOpenPreviewDialog(true)}
                      disabled={!selectedCustomer}
                      startIcon={<Icon icon="mdi:eye" />}
                      sx={{ borderRadius: 2, py: 1.4 }}
                    >
                      Preview
                    </Button>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!selectedCustomer}
                    startIcon={<Icon icon="mdi:file-pdf-box" />}
                    sx={{ bgcolor: "#d32f2f", borderRadius: 2, py: 1.4, "&:hover": { bgcolor: "#b71c1c" } }}
                  >
                    Generate PDF
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
          setCustomerSearch("");
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
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
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ maxHeight: "60vh", overflow: "auto" }}>
            {filteredCustomers.map((customer) => (
              <Card
                key={customer.id}
                sx={{
                  mb: 1.5,
                  borderRadius: 2,
                  cursor: "pointer",
                  bgcolor: selectedCustomer?.id === customer.id ? "#E3F2FD" : "white",
                  border: selectedCustomer?.id === customer.id ? "2px solid #1976d2" : "1px solid #e0e0e0",
                  transition: "all 0.2s",
                  "&:active": { transform: "scale(0.99)", bgcolor: "#f5f5f5" },
                }}
                onClick={() => {
                  setSelectedCustomer(customer);
                  setOpenCustomerDialog(false);
                  setCustomerSearch("");
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: "#1976d2", width: 40, height: 40 }}>
                      {customer.name?.charAt(0)?.toUpperCase() || "C"}
                    </Avatar>
                    <Box flex={1}>
                      <Typography fontWeight={700}>
                        {customer.name}
                        {selectedCustomer?.id === customer.id && (
                          <Icon
                            icon="mdi:check-circle"
                            color="#1976d2"
                            style={{ marginLeft: 8, verticalAlign: "middle" }}
                          />
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {customer.phone || "No phone"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.address || "No address"}
                      </Typography>
                    </Box>
                    <Icon icon="mdi:chevron-right" color="#ccc" />
                  </Box>
                </CardContent>
              </Card>
            ))}

            {filteredCustomers.length === 0 && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Icon icon="mdi:account-search" width={48} color="#ccc" />
                <Typography color="text.secondary" mt={1}>
                  No customers found
                </Typography>
                <Button variant="text" onClick={() => setCustomerSearch("")} sx={{ mt: 1 }}>
                  Clear Search
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={openPreviewDialog} onClose={() => setOpenPreviewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Icon icon="mdi:file-pdf-box" width={24} color="#d32f2f" />
            <Typography variant="h6" fontWeight={700}>
              Preview Kwitansi
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ overflow: "auto", maxHeight: "70vh" }}>
            <ReceiptContent />
          </Box>

          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              📄 PDF will include company header, customer details, payment information, and stamp.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenPreviewDialog(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={downloadPDF}
            variant="contained"
            startIcon={<Icon icon="mdi:download" />}
            sx={{ bgcolor: "#d32f2f", borderRadius: 2, "&:hover": { bgcolor: "#b71c1c" } }}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden element for PDF generation */}
      <Box sx={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div ref={receiptRef}>
          <ReceiptContent />
        </div>
      </Box>
    </Container>
  );
}