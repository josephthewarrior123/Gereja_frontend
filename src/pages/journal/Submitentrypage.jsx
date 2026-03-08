import { Icon } from '@iconify/react';
import {
    Box, Card, CardContent, Chip, CircularProgress,
    Stack, TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import JournalDAO from '../../daos/JournalDao';

function PointsBadge({ points }) {
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            px: 1.5, py: 0.4, borderRadius: 99,
            bgcolor: '#FFFBEB', border: '1px solid #FDE68A',
        }}>
            <Icon icon="mdi:star" color="#F59E0B" width={13} />
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#D97706' }}>{points} pts</Typography>
        </Box>
    );
}

export default function SubmitEntryPage() {
    const navigate = useNavigate();
    const message = useAlert();
    const loading = useLoading();

    const [activities, setActivities] = useState([]);
    const [fetchingActivities, setFetchingActivities] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [fieldValues, setFieldValues] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1); // 1: pilih activity, 2: isi form

    useEffect(() => {
        const load = async () => {
            try {
                const res = await JournalDAO.listActivities();
                if (res.success) setActivities(res.data || []);
                else message(res.error || 'Gagal memuat activities', 'error');
            } catch (e) {
                message('Gagal memuat activities', 'error');
            } finally {
                setFetchingActivities(false);
            }
        };
        load();
    }, []);

    const selectActivity = (activity) => {
        setSelectedActivity(activity);
        // init field values
        const init = {};
        (activity.fields || []).forEach((f) => { init[f.key] = ''; });
        setFieldValues(init);
        setStep(2);
    };

    const handleSubmit = async () => {
        // Validasi required fields
        if (selectedActivity.fields?.length > 0) {
            for (const f of selectedActivity.fields) {
                if (f.required && !fieldValues[f.key]) {
                    message(`Field "${f.key}" wajib diisi`, 'error');
                    return;
                }
            }
        }

        try {
            setSubmitting(true);
            // Cast number fields
            const parsedData = { ...fieldValues };
            (selectedActivity.fields || []).forEach((f) => {
                if (f.type === 'number' && parsedData[f.key] !== '') {
                    parsedData[f.key] = Number(parsedData[f.key]);
                }
            });

            const res = await JournalDAO.submitEntry({
                activity_id: selectedActivity.id,
                data: parsedData,
            });

            if (!res.success) throw new Error(res.error || 'Gagal submit entry');
            message(`Entry berhasil! +${res.data?.points_awarded || selectedActivity.points} pts`, 'success');
            navigate('/journal');
        } catch (e) {
            message(e.message || 'Terjadi kesalahan', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 560, mx: 'auto', px: { xs: 2, sm: 0 }, pb: 10 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={1} mb={3} mt={{ xs: 2, sm: 0 }}>
                <Box onClick={() => step === 2 ? setStep(1) : navigate('/journal')}
                    sx={{ width: 36, height: 36, borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#F1F5F9' } }}>
                    <Icon icon="mdi:arrow-left" width={20} color="#64748B" />
                </Box>
                <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 22, color: '#0F172A', lineHeight: 1 }}>
                        {step === 1 ? 'Submit Entry' : selectedActivity?.name}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#94A3B8', mt: 0.25 }}>
                        {step === 1 ? 'Pilih aktivitas yang ingin dicatat' : 'Isi data aktivitasmu'}
                    </Typography>
                </Box>
            </Stack>

            {/* Step 1: Pilih Activity */}
            {step === 1 && (
                <>
                    {fetchingActivities ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress sx={{ color: '#1E3A8A' }} />
                        </Box>
                    ) : activities.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Icon icon="mdi:lightning-bolt-outline" width={56} color="#CBD5E1" />
                            <Typography sx={{ mt: 2, color: '#94A3B8', fontWeight: 600 }}>
                                Belum ada activity tersedia
                            </Typography>
                        </Box>
                    ) : (
                        activities.map((a) => (
                            <Card key={a.id}
                                onClick={() => selectActivity(a)}
                                sx={{
                                    borderRadius: 3, border: '1px solid #F1F5F9', boxShadow: 'none', mb: 1.5,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    '&:hover': { borderColor: '#1E3A8A', boxShadow: '0 4px 16px rgba(30,58,138,0.1)' },
                                }}>
                                <CardContent sx={{ p: '16px !important' }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0F172A', mb: 0.5 }}>
                                                {a.name}
                                            </Typography>
                                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                                <PointsBadge points={a.points} />
                                                {(a.groups || []).map((g) => (
                                                    <Chip key={g} label={g} size="small" variant="outlined"
                                                        sx={{ fontSize: 10, height: 20, borderRadius: 1 }} />
                                                ))}
                                            </Stack>
                                            {a.fields?.length > 0 && (
                                                <Typography sx={{ fontSize: 11, color: '#94A3B8', mt: 0.75 }}>
                                                    {a.fields.length} field{a.fields.length > 1 ? 's' : ''} to fill
                                                </Typography>
                                            )}
                                        </Box>
                                        <Icon icon="mdi:chevron-right" color="#CBD5E1" width={24} />
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </>
            )}

            {/* Step 2: Isi Form */}
            {step === 2 && selectedActivity && (
                <Box>
                    {/* Activity info */}
                    <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', mb: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#1E3A8A' }}>
                                {selectedActivity.name}
                            </Typography>
                            <PointsBadge points={selectedActivity.points} />
                        </Stack>
                        {selectedActivity.groups?.length > 0 && (
                            <Stack direction="row" spacing={0.5} mt={0.75} flexWrap="wrap">
                                {selectedActivity.groups.map((g) => (
                                    <Chip key={g} label={g} size="small" variant="outlined"
                                        sx={{ fontSize: 10, height: 18, borderRadius: 1, borderColor: '#93C5FD', color: '#1D4ED8' }} />
                                ))}
                            </Stack>
                        )}
                    </Box>

                    {/* Fields */}
                    {selectedActivity.fields?.length > 0 ? (
                        <Stack spacing={2}>
                            {selectedActivity.fields.map((f) => (
                                <Box key={f.key}>
                                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.75 }}>
                                        {f.key} {f.required && <span style={{ color: '#EF4444' }}>*</span>}
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type={f.type === 'number' ? 'number' : 'text'}
                                        placeholder={f.label || f.key}
                                        value={fieldValues[f.key] || ''}
                                        onChange={(e) => setFieldValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                                        InputProps={{ sx: { borderRadius: 2.5, bgcolor: '#fff', fontSize: 14 } }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    ) : (
                        <Box sx={{ py: 3, textAlign: 'center' }}>
                            <Icon icon="mdi:check-circle-outline" width={40} color="#86EFAC" />
                            <Typography sx={{ mt: 1, fontSize: 14, color: '#64748B' }}>
                                Tidak ada field tambahan untuk diisi
                            </Typography>
                        </Box>
                    )}

                    {/* Submit Button */}
                    <Box
                        onClick={!submitting ? handleSubmit : undefined}
                        sx={{
                            mt: 4, py: 1.75, borderRadius: 3, bgcolor: '#1E3A8A', color: '#fff',
                            textAlign: 'center', fontWeight: 700, fontSize: 15, cursor: submitting ? 'default' : 'pointer',
                            opacity: submitting ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                            '&:hover': { bgcolor: submitting ? '#1E3A8A' : '#1e40af' },
                        }}
                    >
                        {submitting ? (
                            <><CircularProgress size={18} sx={{ color: '#fff' }} /> Menyimpan...</>
                        ) : (
                            <><Icon icon="mdi:check" width={20} /> Submit Entry</>
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
}