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
  Chip,
  alpha,
  FormHelperText,
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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const receiptRef = useRef(null);

  // ============ Company / Header ============
  const [companyProfile, setCompanyProfile] = useState(null);
  const [companyName, setCompanyName] = useState("PT. JAYAINDO ARTHA SUKSES");
  const [companySubtitle, setCompanySubtitle] = useState("INSURANCE AGENCY");
  const [companyCity, setCompanyCity] = useState("Jakarta");
  const [stampFile, setStampFile] = useState(null);
  const [stampPreview, setStampPreview] = useState("/stamp1.png");

  // ============ Customer Selection ============
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // ============ Kwitansi Data ============
  const [formData, setFormData] = useState({
    nomor: "",
    jumlah: "",
    terbilang: "",
    pembayaran: "",
    tanggal: "",
  });

  // ============ Preview Dialog ============
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [pdfName, setPdfName] = useState("");

  // ============ Effects ============
  useEffect(() => {
    fetchCompanyProfile();
    fetchCustomers();
  }, []);

  useEffect(() => {
    generateReceiptNumber();
  }, [companyCity]);

  useEffect(() => {
    if (selectedCustomer) {
      generatePaymentDescription();
    }
  }, [selectedCustomer]);

  // ============ Helpers ============
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date || new Date());
  };

  const generateReceiptNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    setFormData((prev) => ({
      ...prev,
      nomor: `KW/${year}/${month}/${random}`,
      tanggal: `${companyCity || "Jakarta"}, ${formatDate(date)}`,
    }));
  };

  const generatePaymentDescription = () => {
    if (selectedCustomer?.carData) {
      const desc = `Premi ${selectedCustomer.carData?.carBrand || ""} ${
        selectedCustomer.carData?.carModel || ""
      } No. Polisi: ${selectedCustomer.carData?.plateNumber || "TBA"}`.trim();
      setFormData((prev) => ({ ...prev, pembayaran: desc }));
    }
  };

  const numberToWords = (num) => {
    if (!num) return "Nol Rupiah";

    const angka = [
      "",
      "Satu",
      "Dua",
      "Tiga",
      "Empat",
      "Lima",
      "Enam",
      "Tujuh",
      "Delapan",
      "Sembilan",
      "Sepuluh",
      "Sebelas",
    ];
    const parseNumber = (n) => {
      if (n < 12) return angka[n];
      if (n < 20) return parseNumber(n - 10) + " Belas";
      if (n < 100)
        return parseNumber(Math.floor(n / 10)) + " Puluh " + parseNumber(n % 10);
      if (n < 200) return "Seratus " + parseNumber(n - 100);
      if (n < 1000)
        return parseNumber(Math.floor(n / 100)) + " Ratus " + parseNumber(n % 100);
      if (n < 1000000)
        return parseNumber(Math.floor(n / 1000)) + " Ribu " + parseNumber(n % 1000);
      if (n < 1000000000)
        return (
          parseNumber(Math.floor(n / 1000000)) + " Juta " + parseNumber(n % 1000000)
        );
      return "Angka terlalu besar";
    };

    const result = parseNumber(Number(num));
    return result.charAt(0).toUpperCase() + result.slice(1) + " Rupiah";
  };

  // ============ Fetch Data ============
  const fetchCompanyProfile = async () => {
    try {
      const response = await CompanyDAO.getCompanyProfile();
      if (response.success && response.profile) {
        setCompanyProfile(response.profile);
        setCompanyName(
          response.profile.companyName || "PT. JAYAINDO ARTHA SUKSES"
        );
        setCompanySubtitle(
          response.profile.companySubtitle || "INSURANCE AGENCY"
        );
        setCompanyCity(response.profile.companyCity || "Jakarta");
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

  const handleRemoveStamp = () => {
    setStampFile(null);
    setStampPreview("/stamp1.png");
  };

  // ============ Form Handlers ============
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleJumlahChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    const numericValue = Number(value) || 0;

    setFormData((prev) => ({
      ...prev,
      jumlah: value,
      terbilang: numberToWords(numericValue),
    }));
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
    if (!formData.jumlah || Number(formData.jumlah) <= 0) {
      message("Please enter valid payment amount", "error");
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
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
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

      const fileName =
        pdfName.trim() || `Kwitansi_${formData.nomor.replace(/\//g, "_")}`;
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
      nomor: "",
      jumlah: "",
      terbilang: "",
      pembayaran: "",
      tanggal: "",
    });
    setPdfName("");
    generateReceiptNumber();
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

  // ============ RECEIPT CONTENT - CORRECT BILINGUAL FORMAT ============
  const ReceiptContent = () => (
    <Paper
      elevation={0}
      sx={{
        width: "210mm",
        minHeight: "297mm",
        p: "30px 40px",
        bgcolor: "#ffffff",
        color: "#000000",
        fontFamily: "Arial, Helvetica, sans-serif",
        boxSizing: "border-box",
        borderRadius: 0,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          sx={{
            fontWeight: "bold",
            fontSize: "22px",
            fontFamily: "Arial, Helvetica, sans-serif",
            color: "#000000",
          }}
        >
          {companyName.toUpperCase()}
        </Typography>
        <Typography
          sx={{
            fontSize: "11px",
            fontFamily: "Arial, Helvetica, sans-serif",
            color: "#000000",
            mt: 0.5,
          }}
        >
          {companySubtitle.toUpperCase()}
        </Typography>
      </Box>

      {/* Title */}
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <Typography
          sx={{
            fontWeight: "bold",
            fontSize: "18px",
            fontFamily: "Arial, Helvetica, sans-serif",
            textDecoration: "underline",
            color: "#000000",
          }}
        >
          KWITANSI
        </Typography>
        <Typography
          sx={{
            fontSize: "10px",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontStyle: "italic",
            color: "#666666",
            mt: 0.25,
          }}
        >
          RECEIPT
        </Typography>
      </Box>

      {/* Receipt Number */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 5 }}>
        <Typography
          sx={{
            fontWeight: "bold",
            fontSize: "11px",
            fontFamily: "Arial, Helvetica, sans-serif",
            color: "#000000",
          }}
        >
          No. {formData.nomor || "________________"}
        </Typography>
      </Box>

      {/* Content Fields - CORRECT BILINGUAL FORMAT */}
      {/* Content Fields - BILINGUAL FORMAT WITH ENGLISH UNDER INDONESIAN LABELS */}
      <Box sx={{ mb: 8 }}>
        {/* Terima dari / Received From */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: "flex" }}>
            <Box sx={{ width: "130px" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "11px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  color: "#000000",
                }}
              >
                Terima dari
              </Typography>
              <Typography
                sx={{
                  fontSize: "10px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontStyle: "italic",
                  color: "#666666",
                  mt: 0.25,
                }}
              >
                Received From
              </Typography>
            </Box>
            <Typography
              sx={{
                mx: 2,
                fontSize: "11px",
                fontFamily: "Arial, Helvetica, sans-serif",
                color: "#000000",
              }}
            >
              :
            </Typography>
            <Typography
              sx={{
                fontSize: "11px",
                fontFamily: "Arial, Helvetica, sans-serif",
                color: "#000000",
              }}
            >
              {selectedCustomer ? selectedCustomer.name : "____________________"}
            </Typography>
          </Box>
        </Box>

        {/* Alamat / Address */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: "flex" }}>
            <Box sx={{ width: "130px" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "11px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  color: "#000000",
                }}
              >
                Alamat
              </Typography>
              <Typography
                sx={{
                  fontSize: "10px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontStyle: "italic",
                  color: "#666666",
                  mt: 0.25,
                }}
              >
                Address
              </Typography>
            </Box>
            <Typography
              sx={{
                mx: 2,
                fontSize: "11px",
                fontFamily: "Arial, Helvetica, sans-serif",
                color: "#000000",
              }}
            >
              :
            </Typography>
            <Typography
              sx={{
                fontSize: "11px",
                fontFamily: "Arial, Helvetica, sans-serif",
                color: "#000000",
              }}
            >
              {selectedCustomer ? selectedCustomer.address : "____________________"}
            </Typography>
          </Box>
        </Box>

        {/* Jumlah uang sebesar / The Sum of */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: "flex" }}>
            <Box sx={{ width: "130px" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "11px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  color: "#000000",
                }}
              >
                Jumlah uang sebesar
              </Typography>
              <Typography
                sx={{
                  fontSize: "10px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontStyle: "italic",
                  color: "#666666",
                  mt: 0.25,
                }}
              >
                The Sum of
              </Typography>
            </Box>
            <Typography
              sx={{
                mx: 2,
                fontSize: "11px",
                fontFamily: "Arial, Helvetica, sans-serif",
                color: "#000000",
              }}
            >
              :
            </Typography>
            <Box>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "12px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  color: "#000000",
                }}
              >
                {formData.jumlah ? formatCurrency(formData.jumlah) : "Rp ________"}
              </Typography>
              <Typography
                sx={{
                  fontSize: "11px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontStyle: "italic",
                  color: "#333333",
                  mt: 0.5,
                }}
              >
                {formData.terbilang || "_________________________________________"}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Untuk pembayaran / Being payment of */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: "flex" }}>
            <Box sx={{ width: "130px" }}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "11px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  color: "#000000",
                }}
              >
                Untuk pembayaran
              </Typography>
              <Typography
                sx={{
                  fontSize: "10px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontStyle: "italic",
                  color: "#666666",
                  mt: 0.25,
                }}
              >
                Being payment of
              </Typography>
            </Box>
            <Typography
              sx={{
                mx: 2,
                fontSize: "11px",
                fontFamily: "Arial, Helvetica, sans-serif",
                color: "#000000",
              }}
            >
              :
            </Typography>
            <Typography
              sx={{
                fontSize: "11px",
                fontFamily: "Arial, Helvetica, sans-serif",
                color: "#000000",
                maxWidth: "350px",
              }}
            >
              {formData.pembayaran || "________________________________________________"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* FOOTER - CLEAN VERSION */}
      <Box sx={{ mt: 10 }}>
        {/* Date */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 6 }}>
          <Typography
            sx={{
              fontSize: "11px",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#000000",
            }}
          >
            {formData.tanggal || "Jakarta, ________"}
          </Typography>
        </Box>

        {/* Stamp Only - No Signature Text */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          {stampPreview && (
            <img
              src={stampPreview}
              alt="Company Stamp"
              style={{
                height: "80px",
                width: "auto",
                opacity: 0.85,
                objectFit: "contain",
              }}
              crossOrigin="anonymous"
            />
          )}
        </Box>

        {/* Finance Department - Bottom Right */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: "11px",
              fontFamily: "Arial, Helvetica, sans-serif",
              color: "#000000",
            }}
          >
            (Finance Department)
          </Typography>
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Box
      sx={{
        bgcolor: "#f8fafc",
        minHeight: "100vh",
        py: { xs: 3, md: 5 },
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        {/* Page Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                bgcolor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                "&:hover": { bgcolor: "#f8fafc" },
              }}
            >
              <Icon icon="mdi:arrow-left" width={20} color="#2563eb" />
            </IconButton>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                  fontSize: { xs: "1.25rem", md: "1.5rem" },
                }}
              >
                Create Kwitansi
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#475569", mt: 0.5, fontSize: "0.875rem" }}
              >
                Generate professional payment receipt
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* LEFT COLUMN - Form Input */}
          <Grid item xs={12} md={7} lg={8}>
            <Stack spacing={3}>
              {/* Company Information Card */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 3,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          bgcolor: alpha("#2563eb", 0.1),
                          borderRadius: 1.5,
                          width: 36,
                          height: 36,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon icon="mdi:office-building" width={20} color="#2563eb" />
                      </Box>
                      <Typography
                        fontSize={16}
                        fontWeight={600}
                        sx={{ color: "#0f172a" }}
                      >
                        Company Information
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSaveCompanyProfile}
                      startIcon={<Icon icon="mdi:content-save" width={16} />}
                      sx={{
                        borderRadius: 1.5,
                        textTransform: "none",
                        fontSize: 13,
                        fontWeight: 500,
                        px: 2.5,
                        py: 0.8,
                        bgcolor: "#2563eb",
                        boxShadow: "none",
                        "&:hover": {
                          bgcolor: "#1d4ed8",
                          boxShadow: "0 4px 12px rgba(37,99,235,0.2)",
                        },
                      }}
                    >
                      Save
                    </Button>
                  </Box>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                      <Typography
                        fontSize={13}
                        fontWeight={500}
                        mb={0.5}
                        sx={{ color: "#475569" }}
                      >
                        Company Name <span style={{ color: "#ef4444" }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="PT. Maju Jaya Abadi"
                        size="small"
                        error={!companyName || companyName.trim() === ""}
                        helperText={
                          !companyName || companyName.trim() === ""
                            ? "Company name is required"
                            : ""
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            fontSize: 14,
                            bgcolor: "#ffffff",
                            "& fieldset": { borderColor: "#e2e8f0" },
                            "&:hover fieldset": { borderColor: "#94a3b8" },
                            "&.Mui-focused fieldset": {
                              borderColor: "#2563eb",
                              borderWidth: 1.5,
                            },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography
                        fontSize={13}
                        fontWeight={500}
                        mb={0.5}
                        sx={{ color: "#475569" }}
                      >
                        Subtitle
                      </Typography>
                      <TextField
                        fullWidth
                        value={companySubtitle}
                        onChange={(e) => setCompanySubtitle(e.target.value)}
                        placeholder="INSURANCE AGENCY"
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            fontSize: 14,
                            bgcolor: "#ffffff",
                            "& fieldset": { borderColor: "#e2e8f0" },
                            "&:hover fieldset": { borderColor: "#94a3b8" },
                            "&.Mui-focused fieldset": {
                              borderColor: "#2563eb",
                              borderWidth: 1.5,
                            },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography
                        fontSize={13}
                        fontWeight={500}
                        mb={0.5}
                        sx={{ color: "#475569" }}
                      >
                        City
                      </Typography>
                      <TextField
                        fullWidth
                        value={companyCity}
                        onChange={(e) => setCompanyCity(e.target.value)}
                        placeholder="Jakarta"
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            fontSize: 14,
                            bgcolor: "#ffffff",
                            "& fieldset": { borderColor: "#e2e8f0" },
                            "&:hover fieldset": { borderColor: "#94a3b8" },
                            "&.Mui-focused fieldset": {
                              borderColor: "#2563eb",
                              borderWidth: 1.5,
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Customer Information Card */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <Box
                      sx={{
                        bgcolor: alpha("#2563eb", 0.1),
                        borderRadius: 1.5,
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon icon="mdi:account" width={20} color="#2563eb" />
                    </Box>
                    <Typography fontSize={16} fontWeight={600} sx={{ color: "#0f172a" }}>
                      Customer Information
                    </Typography>
                  </Box>

                  <Typography
                    fontSize={13}
                    fontWeight={500}
                    mb={0.5}
                    sx={{ color: "#475569" }}
                  >
                    Client <span style={{ color: "#ef4444" }}>*</span>
                  </Typography>

                  <TextField
                    fullWidth
                    placeholder="Search and select client..."
                    value={
                      selectedCustomer
                        ? `${selectedCustomer.name} (${selectedCustomer.carData?.plateNumber || "No Plate"})`
                        : ""
                    }
                    onClick={() => setOpenCustomerDialog(true)}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Icon icon="mdi:account-search" width={18} color="#94a3b8" />
                        </InputAdornment>
                      ),
                      endAdornment: selectedCustomer ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            edge="end"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(null);
                            }}
                          >
                            <Icon icon="mdi:close" width={16} color="#64748b" />
                          </IconButton>
                        </InputAdornment>
                      ) : (
                        <InputAdornment position="end">
                          <Icon icon="mdi:chevron-down" width={18} color="#94a3b8" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: selectedCustomer ? 2.5 : 0,
                      "& .MuiOutlinedInput-root": {
                        cursor: "pointer",
                        borderRadius: 1.5,
                        fontSize: 14,
                        bgcolor: selectedCustomer ? alpha("#2563eb", 0.04) : "#ffffff",
                        "& fieldset": {
                          borderColor: selectedCustomer ? "#2563eb" : "#e2e8f0",
                        },
                        "&:hover fieldset": { borderColor: "#2563eb" },
                      },
                    }}
                  />

                  {selectedCustomer && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 1.5,
                        bgcolor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography
                            fontSize={11}
                            fontWeight={600}
                            color="#64748b"
                            mb={0.5}
                            sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                          >
                            Customer Name
                          </Typography>
                          <Typography fontSize={14} fontWeight={600} color="#0f172a">
                            {selectedCustomer.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            fontSize={11}
                            fontWeight={600}
                            color="#64748b"
                            mb={0.5}
                            sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                          >
                            Phone
                          </Typography>
                          <Typography fontSize={14} fontWeight={500} color="#0f172a">
                            {selectedCustomer.phone || "-"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography
                            fontSize={11}
                            fontWeight={600}
                            color="#64748b"
                            mb={0.5}
                            sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                          >
                            Address
                          </Typography>
                          <Typography fontSize={14} fontWeight={500} color="#0f172a">
                            {selectedCustomer.address || "-"}
                          </Typography>
                        </Grid>
                        {selectedCustomer.carData && (
                          <>
                            <Grid item xs={6}>
                              <Typography
                                fontSize={11}
                                fontWeight={600}
                                color="#64748b"
                                mb={0.5}
                                sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                              >
                                Vehicle
                              </Typography>
                              <Typography fontSize={14} fontWeight={500} color="#0f172a">
                                {selectedCustomer.carData.carBrand || ""}{" "}
                                {selectedCustomer.carData.carModel || ""}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography
                                fontSize={11}
                                fontWeight={600}
                                color="#64748b"
                                mb={0.5}
                                sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                              >
                                Plate Number
                              </Typography>
                              <Typography fontSize={14} fontWeight={500} color="#0f172a">
                                {selectedCustomer.carData.plateNumber || "-"}
                              </Typography>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </Paper>
                  )}
                </CardContent>
              </Card>

              {/* Receipt Details Card */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <Box
                      sx={{
                        bgcolor: alpha("#2563eb", 0.1),
                        borderRadius: 1.5,
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon icon="mdi:receipt" width={20} color="#2563eb" />
                    </Box>
                    <Typography fontSize={16} fontWeight={600} sx={{ color: "#0f172a" }}>
                      Receipt Details
                    </Typography>
                  </Box>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                      <Typography
                        fontSize={13}
                        fontWeight={500}
                        mb={0.5}
                        sx={{ color: "#475569" }}
                      >
                        Receipt Number
                      </Typography>
                      <TextField
                        fullWidth
                        name="nomor"
                        value={formData.nomor}
                        onChange={handleChange}
                        placeholder="Auto-generated"
                        size="small"
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <Icon icon="mdi:tag" width={18} color="#94a3b8" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            fontSize: 14,
                            bgcolor: "#f8fafc",
                            "& fieldset": { borderColor: "#e2e8f0" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography
                        fontSize={13}
                        fontWeight={500}
                        mb={0.5}
                        sx={{ color: "#475569" }}
                      >
                        Amount (IDR) <span style={{ color: "#ef4444" }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        type="text"
                        name="jumlah"
                        value={formData.jumlah}
                        onChange={handleJumlahChange}
                        placeholder="500000"
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography fontWeight={600} fontSize={14} color="#475569">
                                Rp
                              </Typography>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            fontSize: 14,
                            bgcolor: "#ffffff",
                            "& fieldset": { borderColor: "#e2e8f0" },
                            "&:hover fieldset": { borderColor: "#94a3b8" },
                            "&.Mui-focused fieldset": {
                              borderColor: "#2563eb",
                              borderWidth: 1.5,
                            },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography
                        fontSize={13}
                        fontWeight={500}
                        mb={0.5}
                        sx={{ color: "#475569" }}
                      >
                        Date & Place
                      </Typography>
                      <TextField
                        fullWidth
                        name="tanggal"
                        value={formData.tanggal}
                        onChange={handleChange}
                        placeholder="Jakarta, 11 Juni 2024"
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Icon icon="mdi:calendar" width={18} color="#94a3b8" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            fontSize: 14,
                            bgcolor: "#f8fafc",
                            "& fieldset": { borderColor: "#e2e8f0" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography
                        fontSize={13}
                        fontWeight={500}
                        mb={0.5}
                        sx={{ color: "#475569" }}
                      >
                        Amount in Words
                      </Typography>
                      <TextField
                        fullWidth
                        name="terbilang"
                        value={formData.terbilang}
                        onChange={handleChange}
                        multiline
                        rows={2}
                        placeholder="Auto-generated from amount"
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}>
                              <Icon icon="mdi:format-text" width={18} color="#94a3b8" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            fontSize: 14,
                            bgcolor: "#f8fafc",
                            "& fieldset": { borderColor: "#e2e8f0" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography
                        fontSize={13}
                        fontWeight={500}
                        mb={0.5}
                        sx={{ color: "#475569" }}
                      >
                        Payment Description <span style={{ color: "#ef4444" }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        name="pembayaran"
                        value={formData.pembayaran}
                        onChange={handleChange}
                        multiline
                        rows={3}
                        placeholder="Description of payment"
                        size="small"
                        error={!formData.pembayaran}
                        helperText={
                          !formData.pembayaran ? "Payment description is required" : ""
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            fontSize: 14,
                            bgcolor: "#ffffff",
                            "& fieldset": { borderColor: "#e2e8f0" },
                            "&:hover fieldset": { borderColor: "#94a3b8" },
                            "&.Mui-focused fieldset": {
                              borderColor: "#2563eb",
                              borderWidth: 1.5,
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Stamp Upload Card */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <Box
                      sx={{
                        bgcolor: alpha("#2563eb", 0.1),
                        borderRadius: 1.5,
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon icon="mdi:stamp" width={20} color="#2563eb" />
                    </Box>
                    <Typography fontSize={16} fontWeight={600} sx={{ color: "#0f172a" }}>
                      Company Stamp
                    </Typography>
                  </Box>

                  <Grid container spacing={2.5} alignItems="center">
                    <Grid item xs={12} sm="auto">
                      <Box
                        onClick={() => document.getElementById("stamp-upload")?.click()}
                        sx={{
                          width: { xs: "100%", sm: 200 },
                          height: 120,
                          border: "1.5px dashed #cbd5e1",
                          borderRadius: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          bgcolor: "#f8fafc",
                          transition: "all 0.2s",
                          "&:hover": {
                            borderColor: "#2563eb",
                            bgcolor: alpha("#2563eb", 0.02),
                          },
                          overflow: "hidden",
                        }}
                      >
                        {stampPreview ? (
                          <img
                            src={stampPreview}
                            alt="Stamp Preview"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              opacity: 0.8,
                              padding: "12px",
                            }}
                          />
                        ) : (
                          <Box sx={{ textAlign: "center" }}>
                            <Icon icon="mdi:stamp" width={40} color="#94a3b8" />
                            <Typography fontSize={12} color="#64748b" mt={1}>
                              Click to upload
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <input
                        id="stamp-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleStampChange}
                        style={{ display: "none" }}
                      />
                    </Grid>

                    <Grid item xs={12} sm>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => document.getElementById("stamp-upload")?.click()}
                          startIcon={<Icon icon="mdi:upload" width={16} />}
                          sx={{
                            borderRadius: 1.5,
                            textTransform: "none",
                            fontSize: 13,
                            fontWeight: 500,
                            borderColor: "#cbd5e1",
                            color: "#475569",
                            "&:hover": {
                              borderColor: "#2563eb",
                              bgcolor: alpha("#2563eb", 0.02),
                            },
                          }}
                        >
                          {stampPreview && stampPreview !== "/stamp1.png"
                            ? "Change"
                            : "Upload"}
                        </Button>
                        {stampPreview && stampPreview !== "/stamp1.png" && (
                          <Button
                            variant="text"
                            size="small"
                            color="error"
                            onClick={handleRemoveStamp}
                            startIcon={<Icon icon="mdi:delete" width={16} />}
                            sx={{
                              textTransform: "none",
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                      <FormHelperText sx={{ mt: 1, color: "#64748b", fontSize: 11 }}>
                        Max 2MB, PNG with transparent background recommended
                      </FormHelperText>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* RIGHT COLUMN - Action Panel */}
          <Grid item xs={12} md={5} lg={4}>
            <Box sx={{ position: { md: "sticky" }, top: { md: 24 } }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                  bgcolor: "#ffffff",
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <Box
                      sx={{
                        bgcolor: alpha("#2563eb", 0.1),
                        borderRadius: 1.5,
                        width: 36,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon icon="mdi:file-pdf-box" width={20} color="#2563eb" />
                    </Box>
                    <Typography fontSize={16} fontWeight={600} sx={{ color: "#0f172a" }}>
                      PDF Generator
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    label="PDF File Name (Optional)"
                    value={pdfName}
                    onChange={(e) => setPdfName(e.target.value)}
                    placeholder="Leave empty for auto-generated"
                    size="small"
                    sx={{
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                        fontSize: 14,
                        "& fieldset": { borderColor: "#e2e8f0" },
                        "&:hover fieldset": { borderColor: "#94a3b8" },
                        "&.Mui-focused fieldset": { borderColor: "#2563eb" },
                      },
                    }}
                  />

                  {/* Summary Card */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 1.5,
                      bgcolor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      mb: 3,
                    }}
                  >
                    <Typography
                      fontSize={13}
                      fontWeight={600}
                      color="#2563eb"
                      sx={{ mb: 2 }}
                    >
                      Receipt Summary
                    </Typography>

                    <Stack spacing={1.5}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography fontSize={12} color="#64748b">
                          Customer
                        </Typography>
                        <Chip
                          label={
                            selectedCustomer
                              ? selectedCustomer.name.length > 20
                                ? `${selectedCustomer.name.substring(0, 20)}...`
                                : selectedCustomer.name
                              : "Not selected"
                          }
                          size="small"
                          sx={{
                            bgcolor: selectedCustomer
                              ? alpha("#2563eb", 0.1)
                              : alpha("#94a3b8", 0.1),
                            color: selectedCustomer ? "#2563eb" : "#475569",
                            fontWeight: 600,
                            fontSize: 11,
                            height: 24,
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography fontSize={12} color="#64748b">
                          Amount
                        </Typography>
                        <Typography
                          fontSize={14}
                          fontWeight={700}
                          color={formData.jumlah ? "#2563eb" : "#94a3b8"}
                        >
                          {formData.jumlah ? formatCurrency(formData.jumlah) : "Rp 0"}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography fontSize={12} color="#64748b">
                          Receipt No.
                        </Typography>
                        <Typography fontSize={12} fontWeight={600} color="#0f172a">
                          {formData.nomor || "-"}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography fontSize={12} color="#64748b">
                          Date
                        </Typography>
                        <Typography fontSize={12} fontWeight={500} color="#0f172a">
                          {formData.tanggal.split(",")[1]?.trim() || "-"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  {/* Action Buttons */}
                  <Stack spacing={1.5}>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleReset}
                        sx={{
                          borderRadius: 1.5,
                          py: 1.2,
                          textTransform: "none",
                          fontSize: 13,
                          fontWeight: 500,
                          borderColor: "#cbd5e1",
                          color: "#475569",
                          "&:hover": {
                            borderColor: "#94a3b8",
                            bgcolor: alpha("#000", 0.02),
                          },
                        }}
                      >
                        Reset
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setOpenPreviewDialog(true)}
                        disabled={!selectedCustomer}
                        startIcon={<Icon icon="mdi:eye" width={16} />}
                        sx={{
                          borderRadius: 1.5,
                          py: 1.2,
                          textTransform: "none",
                          fontSize: 13,
                          fontWeight: 500,
                          borderColor: "#cbd5e1",
                          color: "#475569",
                          "&:hover": {
                            borderColor: "#94a3b8",
                            bgcolor: alpha("#000", 0.02),
                          },
                        }}
                      >
                        Preview
                      </Button>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={!selectedCustomer || !formData.jumlah || !formData.pembayaran}
                      startIcon={<Icon icon="mdi:file-pdf-box" width={16} />}
                      sx={{
                        bgcolor: "#2563eb",
                        borderRadius: 1.5,
                        py: 1.4,
                        textTransform: "none",
                        fontSize: 14,
                        fontWeight: 600,
                        boxShadow: "none",
                        "&:hover": {
                          bgcolor: "#1d4ed8",
                          boxShadow: "0 8px 16px rgba(37,99,235,0.2)",
                        },
                        "&:disabled": {
                          bgcolor: "#e2e8f0",
                          color: "#94a3b8",
                        },
                      }}
                    >
                      Generate PDF
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
          onClose={() => {
            setOpenCustomerDialog(false);
            setCustomerSearch("");
          }}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : 2,
              boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
            },
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton onClick={() => setOpenCustomerDialog(false)} sx={{ mr: 0.5 }}>
                  <Icon icon="mdi:arrow-left" width={20} color="#2563eb" />
                </IconButton>
                <Typography variant="h6" fontWeight={600} color="#0f172a">
                  Select Customer
                </Typography>
              </Box>
            </Box>

            <TextField
              fullWidth
              autoFocus
              placeholder="Search customer by name, phone, or vehicle..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon icon="mdi:magnify" width={20} color="#94a3b8" />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2.5,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  fontSize: 14,
                  "& fieldset": { borderColor: "#e2e8f0" },
                  "&:hover fieldset": { borderColor: "#94a3b8" },
                  "&.Mui-focused fieldset": { borderColor: "#2563eb" },
                },
              }}
            />

            <Box sx={{ maxHeight: "60vh", overflow: "auto", pr: 0.5 }}>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <Card
                    key={customer.id}
                    elevation={0}
                    sx={{
                      mb: 1.5,
                      borderRadius: 1.5,
                      cursor: "pointer",
                      bgcolor:
                        selectedCustomer?.id === customer.id
                          ? alpha("#2563eb", 0.04)
                          : "#ffffff",
                      border:
                        selectedCustomer?.id === customer.id
                          ? "1.5px solid #2563eb"
                          : "1px solid #e2e8f0",
                      transition: "all 0.2s",
                      "&:hover": {
                        borderColor: "#2563eb",
                        bgcolor:
                          selectedCustomer?.id === customer.id
                            ? alpha("#2563eb", 0.04)
                            : "#f8fafc",
                      },
                    }}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setOpenCustomerDialog(false);
                      setCustomerSearch("");
                    }}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha("#2563eb", 0.1),
                            color: "#2563eb",
                            width: 44,
                            height: 44,
                            fontSize: 16,
                            fontWeight: 600,
                          }}
                        >
                          {customer.name?.charAt(0)?.toUpperCase() || "C"}
                        </Avatar>

                        <Box flex={1}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              fontWeight={600}
                              fontSize={14}
                              color="#0f172a"
                            >
                              {customer.name}
                            </Typography>
                            {selectedCustomer?.id === customer.id && (
                              <Icon
                                icon="mdi:check-circle"
                                color="#2563eb"
                                width={16}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="caption"
                            color="#64748b"
                            display="block"
                            fontSize={12}
                          >
                            {customer.phone || "No phone"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="#64748b"
                            fontSize={12}
                            sx={{
                              display: "block",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "200px",
                            }}
                          >
                            {customer.address || "No address"}
                          </Typography>
                          {customer.carData && (
                            <Typography
                              variant="caption"
                              color="#2563eb"
                              fontSize={11}
                              fontWeight={500}
                              sx={{ mt: 0.5, display: "block" }}
                            >
                              {customer.carData.carBrand || ""}{" "}
                              {customer.carData.carModel || ""} •{" "}
                              {customer.carData.plateNumber || "No Plate"}
                            </Typography>
                          )}
                        </Box>

                        <Icon icon="mdi:chevron-right" color="#cbd5e1" width={20} />
                      </Box>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Icon icon="mdi:account-search" width={56} color="#cbd5e1" />
                  <Typography color="#64748b" mt={2} fontSize={14}>
                    No customers found
                  </Typography>
                  <Button
                    variant="text"
                    onClick={() => setCustomerSearch("")}
                    sx={{
                      mt: 1.5,
                      textTransform: "none",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#2563eb",
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
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
            },
          }}
        >
          <DialogTitle sx={{ p: 2.5, borderBottom: "1px solid #e2e8f0" }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  bgcolor: alpha("#2563eb", 0.1),
                  borderRadius: 1.5,
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon icon="mdi:file-pdf-box" width={20} color="#2563eb" />
              </Box>
              <Typography variant="h6" fontWeight={600} color="#0f172a">
                Preview Kwitansi
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 3, bgcolor: "#f1f5f9" }}>
            <Box
              sx={{
                overflow: "auto",
                maxHeight: "70vh",
                display: "flex",
                justifyContent: "center",
                bgcolor: "#ffffff",
                borderRadius: 1.5,
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <ReceiptContent />
            </Box>

            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "#f8fafc",
                borderRadius: 1.5,
                border: "1px solid #e2e8f0",
              }}
            >
              <Typography
                variant="caption"
                color="#475569"
                fontSize={12}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Icon icon="mdi:information" width={16} color="#2563eb" />
                PDF will include company information, customer details, payment amount,
                and company stamp.
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e2e8f0" }}>
            <Button
              onClick={() => setOpenPreviewDialog(false)}
              variant="outlined"
              sx={{
                borderRadius: 1.5,
                textTransform: "none",
                fontSize: 13,
                fontWeight: 500,
                borderColor: "#cbd5e1",
                color: "#475569",
                px: 3,
                "&:hover": {
                  borderColor: "#94a3b8",
                  bgcolor: alpha("#000", 0.02),
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={downloadPDF}
              variant="contained"
              startIcon={<Icon icon="mdi:download" width={16} />}
              sx={{
                bgcolor: "#2563eb",
                borderRadius: 1.5,
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                px: 3,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#1d4ed8",
                  boxShadow: "0 8px 16px rgba(37,99,235,0.2)",
                },
              }}
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
    </Box>
  );
}