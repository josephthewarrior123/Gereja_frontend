import React, { useState, useEffect, useRef } from "react";
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
  Fade,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router";
import { useLoading } from "../../hooks/LoadingProvider";
import { useAlert } from "../../hooks/SnackbarProvider";
import CustomerDAO from "../../daos/CustomerDao";
import CompanyDAO from "../../daos/CompanyDao";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F4F5F7",
  white: "#FFFFFF",
  border: "#E4E6EA",
  primary: "#1971C2",
  primaryLight: "#EBF4FF",
  text: "#1C1E21",
  textSub: "#606770",
  textMuted: "#9EA8B3",
  error: "#D92B2B",
};

const inputStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontSize: 14,
    bgcolor: "#FFFFFF",
    "& fieldset": { borderColor: "#E4E6EA" },
    "&:hover fieldset": { borderColor: "#B0B5BC" },
    "&.Mui-focused fieldset": { borderColor: "#1971C2", borderWidth: "1.5px" },
  },
};

const inputReadOnly = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontSize: 14,
    bgcolor: "#F8F9FA",
    "& fieldset": { borderColor: "#E4E6EA" },
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
  { label: "Details", icon: "1" },
  { label: "Receipt",  icon: "2" },
  { label: "Review",  icon: "3" },
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
                width: 36, height: 36, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                bgcolor: done || current ? C.primary : C.white,
                border: `2px solid ${done || current ? C.primary : "#C8CDD4"}`,
                boxShadow: current ? `0 0 0 4px rgba(25,113,194,0.15)` : "none",
                transition: "all 0.25s",
              }}>
                {done
                  ? <Icon icon="mdi:check" width={16} color="#fff" />
                  : <Typography fontSize={13} fontWeight={700} sx={{ color: current ? "#fff" : "#C8CDD4" }}>{step.icon}</Typography>
                }
              </Box>
              <Typography fontSize={12} fontWeight={current ? 700 : 500} mt={0.75}
                sx={{ color: current ? C.primary : done ? C.textSub : "#C8CDD4" }}>
                {step.label}
              </Typography>
            </Box>
            {i < STEPS.length - 1 && (
              <Box sx={{ width: 64, height: 2, bgcolor: i < active ? C.primary : "#C8CDD4", mt: "17px", transition: "background-color 0.3s", flexShrink: 0 }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function KwitansiCreate() {
  const navigate = useNavigate();
  const loading = useLoading();
  const message = useAlert();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const receiptRef = useRef(null);

  const [activeStep, setActiveStep] = useState(0);

  // Company
  const [companyProfile, setCompanyProfile] = useState(null);
  const [companyName, setCompanyName] = useState("PT. JAYAINDO ARTHA SUKSES");
  const [companySubtitle, setCompanySubtitle] = useState("INSURANCE AGENCY");
  const [companyCity, setCompanyCity] = useState("Jakarta");
  const [stampFile, setStampFile] = useState(null);
  const [stampPreview, setStampPreview] = useState("/stamp1.png");

  // Customer
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Form
  const [formData, setFormData] = useState({
    nomor: "", jumlah: "", terbilang: "", pembayaran: "", tanggal: "",
  });
  const [pdfName, setPdfName] = useState("");
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);

  useEffect(() => { fetchCompanyProfile(); fetchCustomers(); }, []);
  useEffect(() => { generateReceiptNumber(); }, [companyCity]);
  useEffect(() => { if (selectedCustomer) generatePaymentDescription(); }, [selectedCustomer]);

  // ── Helpers ──
  const formatCurrency = (value) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value) || 0);

  const formatDate = (date) =>
    new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(date || new Date());

  const generateReceiptNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    setFormData((prev) => ({
      ...prev,
      nomor: `KW/${year}/${month}/${random}`,
      tanggal: `${companyCity || "Jakarta"}, ${formatDate(date)}`,
    }));
  };

  const generatePaymentDescription = () => {
    if (selectedCustomer?.carData) {
      const desc = `Premi ${selectedCustomer.carData?.carBrand || ""} ${selectedCustomer.carData?.carModel || ""} No. Polisi: ${selectedCustomer.carData?.plateNumber || "TBA"}`.trim();
      setFormData((prev) => ({ ...prev, pembayaran: desc }));
    }
  };

  const numberToWords = (num) => {
    if (!num) return "Nol Rupiah";
    const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    const parseNumber = (n) => {
      if (n < 12) return angka[n];
      if (n < 20) return parseNumber(n - 10) + " Belas";
      if (n < 100) return parseNumber(Math.floor(n / 10)) + " Puluh " + parseNumber(n % 10);
      if (n < 200) return "Seratus " + parseNumber(n - 100);
      if (n < 1000) return parseNumber(Math.floor(n / 100)) + " Ratus " + parseNumber(n % 100);
      if (n < 1000000) return parseNumber(Math.floor(n / 1000)) + " Ribu " + parseNumber(n % 1000);
      if (n < 1000000000) return parseNumber(Math.floor(n / 1000000)) + " Juta " + parseNumber(n % 1000000);
      return "Angka terlalu besar";
    };
    const result = parseNumber(Number(num));
    return result.charAt(0).toUpperCase() + result.slice(1) + " Rupiah";
  };

  // ── Fetch ──
  const fetchCompanyProfile = async () => {
    try {
      const r = await CompanyDAO.getCompanyProfile();
      if (r.success && r.profile) {
        setCompanyProfile(r.profile);
        setCompanyName(r.profile.companyName || "PT. JAYAINDO ARTHA SUKSES");
        setCompanySubtitle(r.profile.companySubtitle || "INSURANCE AGENCY");
        setCompanyCity(r.profile.companyCity || "Jakarta");
      }
    } catch (e) { console.error(e); }
  };

  const fetchCustomers = async () => {
    try {
      loading.start();
      const r = await CustomerDAO.getAllCustomers();
      if (r.success) setCustomers(r.customers || []);
      else message("Failed to load customers", "error");
    } catch (e) { console.error(e); message("Failed to load customers", "error"); }
    finally { loading.stop(); }
  };

  // ── Stamp handlers ──
  const handleStampChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { message("Please select an image file", "error"); return; }
    if (file.size > 2 * 1024 * 1024) { message("Image size must be less than 2MB", "error"); return; }
    setStampFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setStampPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveStamp = () => { setStampFile(null); setStampPreview("/stamp1.png"); };

  // ── Form handlers ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleJumlahChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    const numericValue = Number(value) || 0;
    setFormData((prev) => ({ ...prev, jumlah: value, terbilang: numberToWords(numericValue) }));
  };

  const handleSaveCompanyProfile = async () => {
    if (!companyName?.trim()) { message("Company name is required", "error"); return; }
    try {
      loading.start();
      const data = { companyName: companyName.trim(), companySubtitle: companySubtitle?.trim() || "", companyCity: companyCity?.trim() || "" };
      const r = companyProfile?.createdAt ? await CompanyDAO.updateCompanyProfile(data) : await CompanyDAO.createCompanyProfile(data);
      if (!r.success) { message(r.error || "Failed to save", "error"); return; }
      message("Company profile saved!", "success");
      await fetchCompanyProfile();
    } catch (e) { console.error(e); message("Failed to save", "error"); }
    finally { loading.stop(); }
  };

  const handleSubmit = () => {
    if (!selectedCustomer) { message("Please select a customer", "error"); return; }
    if (!formData.jumlah || Number(formData.jumlah) <= 0) { message("Please enter valid payment amount", "error"); return; }
    setOpenPreviewDialog(true);
  };

  // ── Navigation ──
  const handleNext = () => {
    if (activeStep === 0 && !selectedCustomer) { message("Please select a customer", "error"); return; }
    if (activeStep === 1) {
      if (!formData.jumlah || Number(formData.jumlah) <= 0) { message("Please enter valid payment amount", "error"); return; }
      if (!formData.pembayaran?.trim()) { message("Payment description is required", "error"); return; }
    }
    setActiveStep((s) => s + 1);
  };
  const handleBack = () => setActiveStep((s) => s - 1);

  const handleReset = () => {
    setSelectedCustomer(null);
    setFormData({ nomor: "", jumlah: "", terbilang: "", pembayaran: "", tanggal: "" });
    setPdfName("");
    setActiveStep(0);
    generateReceiptNumber();
  };

  // ══ PDF — TIDAK DIUBAH ══════════════════════════════════════════════════════
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
  // ════════════════════════════════════════════════════════════════════════════

  // ══ ReceiptContent — TIDAK DIUBAH ══════════════════════════════════════════
  const ReceiptContent = () => (
    <Paper elevation={0} sx={{ width: "210mm", minHeight: "297mm", p: "30px 40px", bgcolor: "#ffffff", color: "#000000", fontFamily: "Arial, Helvetica, sans-serif", boxSizing: "border-box", borderRadius: 0 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography sx={{ fontWeight: "bold", fontSize: "22px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>{companyName.toUpperCase()}</Typography>
        <Typography sx={{ fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000", mt: 0.5 }}>{companySubtitle.toUpperCase()}</Typography>
      </Box>
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <Typography sx={{ fontWeight: "bold", fontSize: "18px", fontFamily: "Arial, Helvetica, sans-serif", textDecoration: "underline", color: "#000000" }}>KWITANSI</Typography>
        <Typography sx={{ fontSize: "10px", fontFamily: "Arial, Helvetica, sans-serif", fontStyle: "italic", color: "#666666", mt: 0.25 }}>RECEIPT</Typography>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 5 }}>
        <Typography sx={{ fontWeight: "bold", fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>No. {formData.nomor || "________________"}</Typography>
      </Box>
      <Box sx={{ mb: 8 }}>
        {[
          { id: "terima", label: "Terima dari", en: "Received From", value: selectedCustomer ? selectedCustomer.name : "____________________" },
          { id: "alamat", label: "Alamat", en: "Address", value: selectedCustomer ? selectedCustomer.address : "____________________" },
        ].map((row) => (
          <Box key={row.id} sx={{ mb: 2.5 }}>
            <Box sx={{ display: "flex" }}>
              <Box sx={{ width: "130px" }}>
                <Typography sx={{ fontWeight: "bold", fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>{row.label}</Typography>
                <Typography sx={{ fontSize: "10px", fontFamily: "Arial, Helvetica, sans-serif", fontStyle: "italic", color: "#666666", mt: 0.25 }}>{row.en}</Typography>
              </Box>
              <Typography sx={{ mx: 2, fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>:</Typography>
              <Typography sx={{ fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>{row.value}</Typography>
            </Box>
          </Box>
        ))}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: "flex" }}>
            <Box sx={{ width: "130px" }}>
              <Typography sx={{ fontWeight: "bold", fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>Jumlah uang sebesar</Typography>
              <Typography sx={{ fontSize: "10px", fontFamily: "Arial, Helvetica, sans-serif", fontStyle: "italic", color: "#666666", mt: 0.25 }}>The Sum of</Typography>
            </Box>
            <Typography sx={{ mx: 2, fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>:</Typography>
            <Box>
              <Typography sx={{ fontWeight: "bold", fontSize: "12px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>{formData.jumlah ? formatCurrency(formData.jumlah) : "Rp ________"}</Typography>
              <Typography sx={{ fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", fontStyle: "italic", color: "#333333", mt: 0.5 }}>{formData.terbilang || "_________________________________________"}</Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: "flex" }}>
            <Box sx={{ width: "130px" }}>
              <Typography sx={{ fontWeight: "bold", fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>Untuk pembayaran</Typography>
              <Typography sx={{ fontSize: "10px", fontFamily: "Arial, Helvetica, sans-serif", fontStyle: "italic", color: "#666666", mt: 0.25 }}>Being payment of</Typography>
            </Box>
            <Typography sx={{ mx: 2, fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>:</Typography>
            <Typography sx={{ fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000", maxWidth: "350px" }}>{formData.pembayaran || "________________________________________________"}</Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ mt: 10 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 6 }}>
          <Typography sx={{ fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>{formData.tanggal || "Jakarta, ________"}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          {stampPreview && (
            <img src={stampPreview} alt="Company Stamp" style={{ height: "80px", width: "auto", opacity: 0.85, objectFit: "contain" }} crossOrigin="anonymous" />
          )}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
          <Typography sx={{ fontWeight: "bold", fontSize: "11px", fontFamily: "Arial, Helvetica, sans-serif", color: "#000000" }}>(Finance Department)</Typography>
        </Box>
      </Box>
    </Paper>
  );
  // ════════════════════════════════════════════════════════════════════════════

  const filteredCustomers = customers.filter((c) => {
    const s = customerSearch.toLowerCase();
    return c.name?.toLowerCase().includes(s) || c.phone?.toLowerCase().includes(s) || c.carData?.carBrand?.toLowerCase().includes(s) || c.carData?.plateNumber?.toLowerCase().includes(s);
  });

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: C.bg, minHeight: "100vh", py: 4 }}>
      <Container maxWidth="sm">

        {/* Title */}
        <Box mb={3}>
          <Button startIcon={<Icon icon="mdi:arrow-left" width={16} />} onClick={() => navigate(-1)}
            sx={{ textTransform: "none", fontSize: 13, fontWeight: 500, color: C.textSub, mb: 1.5, pl: 0, "&:hover": { bgcolor: "transparent", color: C.text } }}>
            Back
          </Button>
          <Typography variant="h5" fontWeight={700} align="center" sx={{ color: C.text }}>
            New Kwitansi
          </Typography>
          <Typography fontSize={13} align="center" sx={{ color: C.textSub, mt: 0.5 }}>
            Generate a payment receipt for your customer
          </Typography>
        </Box>

        <WizardStepper active={activeStep} />

        {/* ── STEP 1: Details ── */}
        {activeStep === 0 && (
          <Fade in key="s1">
            <Box>
              {/* Company */}
              <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                <Section
                  title="Company Header"
                  action={
                    <Button size="small" onClick={handleSaveCompanyProfile}
                      sx={{ textTransform: "none", fontSize: 12, fontWeight: 600, color: C.primary, minWidth: 0 }}>
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
              <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                <Section title="Customer">
                  <Field label="Select Customer" required>
                    <Box
                      onClick={() => setOpenCustomerDialog(true)}
                      sx={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        px: 1.5, py: "9px",
                        border: `1px solid ${selectedCustomer ? C.primary : C.border}`,
                        borderRadius: "8px",
                        bgcolor: selectedCustomer ? C.primaryLight : C.white,
                        cursor: "pointer", transition: "all 0.15s",
                        "&:hover": { borderColor: selectedCustomer ? C.primary : "#B0B5BC" },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.25}>
                        <Icon icon="mdi:account-search" width={18} color={selectedCustomer ? C.primary : C.textMuted} />
                        <Typography fontSize={14} sx={{ color: selectedCustomer ? C.text : C.textMuted }}>
                          {selectedCustomer
                            ? `${selectedCustomer.name} — ${selectedCustomer.carData?.plateNumber || "No Plate"}`
                            : "Search and select customer..."}
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
                    <Box sx={{ mt: -1.5, mb: 0.5, p: 2, borderRadius: "8px", bgcolor: "#F8F9FA", border: `1px solid ${C.border}` }}>
                      <Grid container spacing={1.5}>
                        {[
                          { label: "Phone", value: selectedCustomer.phone },
                          { label: "Vehicle", value: `${selectedCustomer.carData?.carBrand || ""} ${selectedCustomer.carData?.carModel || ""}`.trim() },
                          { label: "Plate", value: selectedCustomer.carData?.plateNumber },
                          { label: "Address", value: selectedCustomer.address },
                        ].map(({ label, value }) => (
                          <Grid item xs={6} key={label}>
                            <Typography fontSize={11} sx={{ color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.4, mb: 0.2 }}>{label}</Typography>
                            <Typography fontSize={13} fontWeight={500} sx={{ color: C.text }}>{value || "—"}</Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Section>
              </Paper>

              {/* Stamp */}
              <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                <Section title="Company Stamp">
                  <Box display="flex" gap={2} alignItems="flex-start">
                    <Box
                      onClick={() => document.getElementById("stamp-upload")?.click()}
                      sx={{
                        width: 100, height: 80, flexShrink: 0,
                        border: `1.5px dashed ${C.border}`, borderRadius: "8px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", bgcolor: "#F8F9FA", overflow: "hidden",
                        transition: "all 0.15s",
                        "&:hover": { borderColor: C.primary, bgcolor: C.primaryLight },
                      }}
                    >
                      {stampPreview
                        ? <img src={stampPreview} alt="Stamp" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "8px" }} />
                        : <Box textAlign="center"><Icon icon="mdi:stamp" width={28} color={C.textMuted} /></Box>
                      }
                    </Box>
                    <Box>
                      <Box display="flex" gap={1} mb={0.75}>
                        <Button size="small" variant="outlined"
                          onClick={() => document.getElementById("stamp-upload")?.click()}
                          startIcon={<Icon icon="mdi:upload" width={14} />}
                          sx={{ textTransform: "none", fontSize: 12, fontWeight: 600, borderColor: C.border, color: C.textSub, borderRadius: "6px" }}>
                          {stampPreview && stampPreview !== "/stamp1.png" ? "Change" : "Upload"}
                        </Button>
                        {stampPreview && stampPreview !== "/stamp1.png" && (
                          <Button size="small" variant="text" color="error" onClick={handleRemoveStamp}
                            startIcon={<Icon icon="mdi:delete" width={14} />}
                            sx={{ textTransform: "none", fontSize: 12, fontWeight: 600 }}>
                            Remove
                          </Button>
                        )}
                      </Box>
                      <Typography fontSize={11} sx={{ color: C.textMuted }}>Max 2MB · PNG transparent recommended</Typography>
                    </Box>
                    <input id="stamp-upload" type="file" accept="image/*" onChange={handleStampChange} style={{ display: "none" }} />
                  </Box>
                </Section>
              </Paper>

              <Button fullWidth variant="contained" onClick={handleNext}
                endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                sx={{ borderRadius: "8px", py: 1.4, textTransform: "none", fontSize: 14, fontWeight: 600, bgcolor: C.primary, boxShadow: "none", "&:hover": { bgcolor: "#145EA8" } }}>
                Continue to Receipt Details
              </Button>
            </Box>
          </Fade>
        )}

        {/* ── STEP 2: Receipt ── */}
        {activeStep === 1 && (
          <Fade in key="s2">
            <Box>
              <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                <Section title="Receipt Details">
                  <Field label="Receipt Number">
                    <TextField fullWidth size="small" name="nomor" value={formData.nomor} onChange={handleChange}
                      InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start"><Icon icon="mdi:tag" width={16} color={C.textMuted} /></InputAdornment> }}
                      sx={inputReadOnly} />
                  </Field>

                  <Box display="flex" gap={1.5}>
                    <Box flex={1}>
                      <Field label="Amount (IDR)" required>
                        <TextField fullWidth size="small" type="text" name="jumlah" value={formData.jumlah}
                          onChange={handleJumlahChange} placeholder="500000"
                          InputProps={{ startAdornment: <InputAdornment position="start"><Typography fontWeight={700} fontSize={13} sx={{ color: C.textSub }}>Rp</Typography></InputAdornment> }}
                          sx={inputStyle} />
                      </Field>
                    </Box>
                    <Box flex={1}>
                      <Field label="Date & Place">
                        <TextField fullWidth size="small" name="tanggal" value={formData.tanggal} onChange={handleChange}
                          placeholder="Jakarta, 11 Juni 2024"
                          InputProps={{ startAdornment: <InputAdornment position="start"><Icon icon="mdi:calendar" width={16} color={C.textMuted} /></InputAdornment> }}
                          sx={inputReadOnly} />
                      </Field>
                    </Box>
                  </Box>

                  {formData.jumlah && Number(formData.jumlah) > 0 && (
                    <Box sx={{ mt: -1.5, mb: 2.5, p: 2, borderRadius: "8px", bgcolor: C.primaryLight, border: `1px solid rgba(25,113,194,0.2)` }}>
                      <Typography fontSize={11} sx={{ color: C.primary, textTransform: "uppercase", letterSpacing: 0.4, mb: 0.25 }}>Amount</Typography>
                      <Typography fontSize={16} fontWeight={700} sx={{ color: C.primary }}>{formatCurrency(formData.jumlah)}</Typography>
                      <Typography fontSize={12} fontStyle="italic" sx={{ color: C.textSub, mt: 0.25 }}>{formData.terbilang}</Typography>
                    </Box>
                  )}

                  <Field label="Amount in Words">
                    <TextField fullWidth size="small" name="terbilang" value={formData.terbilang} onChange={handleChange}
                      multiline rows={2} placeholder="Auto-generated from amount"
                      sx={inputReadOnly} />
                  </Field>

                  <Field label="Payment Description" required>
                    <TextField fullWidth size="small" name="pembayaran" value={formData.pembayaran} onChange={handleChange}
                      multiline rows={3} placeholder="Description of payment"
                      error={!formData.pembayaran}
                      helperText={!formData.pembayaran ? "Payment description is required" : ""}
                      sx={inputStyle} />
                  </Field>

                  <Field label="PDF File Name">
                    <TextField fullWidth size="small" value={pdfName} onChange={(e) => setPdfName(e.target.value)}
                      placeholder="Leave empty for auto-generated" sx={inputStyle} />
                  </Field>
                </Section>
              </Paper>

              <Box display="flex" gap={1.5}>
                <Button fullWidth variant="outlined" onClick={handleBack}
                  startIcon={<Icon icon="mdi:arrow-left" width={16} />}
                  sx={{ borderRadius: "8px", py: 1.3, textTransform: "none", fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                  Back
                </Button>
                <Button fullWidth variant="contained" onClick={handleNext}
                  endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                  sx={{ borderRadius: "8px", py: 1.3, textTransform: "none", fontSize: 13, fontWeight: 600, bgcolor: C.primary, boxShadow: "none" }}>
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
              <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                <Section title="Company">
                  <Box sx={{ p: 2, borderRadius: "8px", bgcolor: "#F8F9FA", border: `1px solid ${C.border}`, textAlign: "center" }}>
                    <Typography fontSize={15} fontWeight={700} sx={{ color: C.text }}>{companyName?.toUpperCase()}</Typography>
                    <Typography fontSize={12} sx={{ color: C.textSub, mt: 0.25 }}>{companySubtitle}</Typography>
                    <Typography fontSize={12} sx={{ color: C.textMuted }}>{companyCity}</Typography>
                  </Box>
                </Section>
              </Paper>

              {/* Customer */}
              <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                <Section title="Customer">
                  <Grid container spacing={2}>
                    {[
                      { label: "Name", value: selectedCustomer?.name },
                      { label: "Phone", value: selectedCustomer?.phone },
                      { label: "Address", value: selectedCustomer?.address },
                      { label: "Vehicle", value: `${selectedCustomer?.carData?.carBrand || ""} ${selectedCustomer?.carData?.carModel || ""}`.trim() },
                      { label: "Plate", value: selectedCustomer?.carData?.plateNumber },
                    ].map(({ label, value }) => (
                      <Grid item xs={6} key={label}>
                        <Typography fontSize={11} sx={{ color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.4, mb: 0.3 }}>{label}</Typography>
                        <Typography fontSize={13.5} fontWeight={500} sx={{ color: C.text }}>{value || "—"}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Section>
              </Paper>

              {/* Receipt Summary */}
              <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                <Section title="Receipt Summary">
                  <Stack spacing={1} mb={2}>
                    {[
                      { label: "Receipt No.", value: formData.nomor },
                      { label: "Date", value: formData.tanggal },
                      { label: "Payment for", value: formData.pembayaran },
                    ].map(({ label, value }) => (
                      <Box key={label} display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                        <Typography fontSize={13} sx={{ color: C.textSub, flexShrink: 0 }}>{label}</Typography>
                        <Typography fontSize={13} fontWeight={500} sx={{ color: C.text, textAlign: "right" }}>{value || "—"}</Typography>
                      </Box>
                    ))}
                  </Stack>

                  <Box sx={{ p: 2.5, borderRadius: "8px", bgcolor: C.primaryLight, border: `1px solid rgba(25,113,194,0.2)`, mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="baseline">
                      <Typography fontSize={13} fontWeight={700} sx={{ color: C.primary }}>AMOUNT</Typography>
                      <Typography fontSize={22} fontWeight={800} sx={{ color: C.primary }}>{formatCurrency(formData.jumlah)}</Typography>
                    </Box>
                    <Typography fontSize={12} fontStyle="italic" sx={{ color: C.textSub, mt: 0.5 }}>{formData.terbilang}</Typography>
                  </Box>

                  {stampPreview && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.75, borderRadius: "8px", bgcolor: "#F8F9FA", border: `1px solid ${C.border}` }}>
                      <img src={stampPreview} alt="Stamp" style={{ height: 40, width: "auto", objectFit: "contain", opacity: 0.75 }} />
                      <Typography fontSize={12} sx={{ color: C.textSub }}>Company stamp attached</Typography>
                    </Box>
                  )}
                </Section>
              </Paper>

              <Button fullWidth variant="contained" onClick={handleSubmit}
                startIcon={<Icon icon="mdi:file-pdf-box" width={18} />}
                sx={{ borderRadius: "8px", py: 1.5, textTransform: "none", fontSize: 14, fontWeight: 600, bgcolor: "#D32F2F", boxShadow: "none", mb: 1.5, "&:hover": { bgcolor: "#B71C1C", boxShadow: "0 4px 12px rgba(211,47,47,0.3)" } }}>
                Preview & Download PDF
              </Button>

              <Box display="flex" gap={1.5}>
                <Button fullWidth variant="outlined" onClick={handleBack}
                  startIcon={<Icon icon="mdi:arrow-left" width={15} />}
                  sx={{ borderRadius: "8px", py: 1.25, textTransform: "none", fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                  Edit Receipt
                </Button>
                <Button fullWidth variant="outlined" onClick={handleReset}
                  startIcon={<Icon icon="mdi:refresh" width={15} />}
                  sx={{ borderRadius: "8px", py: 1.25, textTransform: "none", fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                  Start Over
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

      </Container>

      {/* ── Customer Dialog ── */}
      <Dialog open={openCustomerDialog} onClose={() => { setOpenCustomerDialog(false); setCustomerSearch(""); }}
        maxWidth="xs" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : "12px", m: 2 } }}>
        <Box sx={{ p: 2.5 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <IconButton size="small" onClick={() => { setOpenCustomerDialog(false); setCustomerSearch(""); }} sx={{ mr: 1 }}>
              <Icon icon="mdi:arrow-left" width={20} color={C.textSub} />
            </IconButton>
            <Typography fontSize={16} fontWeight={700} sx={{ color: C.text }}>Select Customer</Typography>
          </Box>
          <TextField fullWidth autoFocus size="small"
            placeholder="Search by name, phone, or plate..."
            value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" width={18} color={C.textMuted} /></InputAdornment> }}
            sx={{ mb: 2, ...inputStyle }} />
          <Box sx={{ maxHeight: "60vh", overflow: "auto" }}>
            {filteredCustomers.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 5 }}>
                <Icon icon="mdi:account-search" width={44} color="#C8CDD4" />
                <Typography fontSize={14} sx={{ color: C.textSub, mt: 1.5 }}>No customers found</Typography>
                {customerSearch && <Button onClick={() => setCustomerSearch("")} sx={{ mt: 1, textTransform: "none", fontSize: 12, color: C.primary }}>Clear search</Button>}
              </Box>
            ) : (
              <Stack spacing={1}>
                {filteredCustomers.map((customer) => {
                  const sel = selectedCustomer?.id === customer.id;
                  return (
                    <Box key={customer.id}
                      onClick={() => { setSelectedCustomer(customer); setOpenCustomerDialog(false); setCustomerSearch(""); }}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "8px", cursor: "pointer",
                        border: `1px solid ${sel ? C.primary : C.border}`,
                        bgcolor: sel ? C.primaryLight : C.white, transition: "all 0.15s",
                        "&:hover": { borderColor: C.primary, bgcolor: sel ? C.primaryLight : "#FAFBFC" },
                      }}>
                      <Avatar sx={{ width: 38, height: 38, bgcolor: C.primary, fontSize: 15, fontWeight: 700 }}>
                        {customer.name?.charAt(0)?.toUpperCase() || "C"}
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography fontSize={13.5} fontWeight={600} sx={{ color: C.text }}>{customer.name}</Typography>
                        <Typography fontSize={12} sx={{ color: C.textSub }}>{customer.phone || "—"}</Typography>
                        <Typography fontSize={12} sx={{ color: C.textMuted }}>{customer.carData?.carBrand || "No car"} · {customer.carData?.plateNumber || "No plate"}</Typography>
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

      {/* ── Preview Dialog — TIDAK DIUBAH (struktur) ── */}
      <Dialog open={openPreviewDialog} onClose={() => setOpenPreviewDialog(false)}
        maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: "12px" } }}>
        <DialogTitle sx={{ p: 2.5, borderBottom: `1px solid ${C.border}` }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Icon icon="mdi:file-pdf-box" width={22} color="#D32F2F" />
            <Typography fontSize={16} fontWeight={700} sx={{ color: C.text }}>Preview Kwitansi</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: "#F4F5F7" }}>
          <Box sx={{ overflow: "auto", maxHeight: "70vh", display: "flex", justifyContent: "center", bgcolor: C.white, borderRadius: "8px" }}>
            <ReceiptContent />
          </Box>
          <Box sx={{ mt: 2, p: 2, bgcolor: C.white, borderRadius: "8px", border: `1px solid ${C.border}` }}>
            <Typography fontSize={12} sx={{ color: C.textSub, display: "flex", alignItems: "center", gap: 1 }}>
              <Icon icon="mdi:information" width={15} color={C.primary} />
              PDF will include company information, customer details, payment amount, and company stamp.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${C.border}`, gap: 1 }}>
          <Button onClick={() => setOpenPreviewDialog(false)} variant="outlined"
            sx={{ borderRadius: "8px", textTransform: "none", fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub, px: 3 }}>
            Cancel
          </Button>
          <Button onClick={downloadPDF} variant="contained"
            startIcon={<Icon icon="mdi:download" width={16} />}
            sx={{ bgcolor: "#D32F2F", borderRadius: "8px", textTransform: "none", fontSize: 13, fontWeight: 600, px: 3, boxShadow: "none", "&:hover": { bgcolor: "#B71C1C" } }}>
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
    </Box>
  );
}