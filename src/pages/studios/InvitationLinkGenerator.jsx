// InvitationLinkGenerator.jsx
import { useState } from 'react';
import {
    Box,
    Dialog,
    Typography,
    TextField,
    Chip,
    Button,
    List,
    ListItem,
    ListItemText,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemIcon,
    ListItemButton
} from '@mui/material';
import { Icon } from '@iconify/react';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomButton from '../../reusables/CustomButton';

const InvitationLinkGenerator = ({ couple, disabled = false }) => {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [customBaseUrl, setCustomBaseUrl] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [selectedGuests, setSelectedGuests] = useState([]);
    const [searchGuest, setSearchGuest] = useState("");
    const message = useAlert();
    
    // Template options
    const templateOptions = [
        { value: "https://wedding-template1-topaz.vercel.app/intro?to=", label: "Template 1" },
        { value: "https://wedding-template2.vercel.app/invitation?guest=", label: "Template 2" },
        { value: "https://my-wedding-site.com/welcome?code=", label: "Template 3" },
        { value: "custom", label: "Custom URL" }
    ];

    const handleOpenDialog = () => {
        setOpen(true);
        setSelectedGuests([]); // Reset selected guests setiap buka dialog
        setSearchGuest(""); // Reset search
    };

    const handleTemplateChange = (event) => {
        const templateValue = event.target.value;
        setSelectedTemplate(templateValue);
        
        if (templateValue !== "custom") {
            setCustomBaseUrl(templateValue);
        } else {
            setCustomBaseUrl("");
        }
    };

    const handleGuestSelection = (guest) => {
        if (selectedGuests.some(g => g.id === guest.id)) {
            setSelectedGuests(selectedGuests.filter(g => g.id !== guest.id));
        } else {
            setSelectedGuests([...selectedGuests, guest]);
        }
    };

    const handleSelectAllGuests = () => {
        if (selectedGuests.length === couple.guests.length) {
            setSelectedGuests([]);
        } else {
            setSelectedGuests([...couple.guests]);
        }
    };

    const handleCopyAllLinks = () => {
        const baseUrl = selectedTemplate === "custom" ? customBaseUrl : selectedTemplate;
        
        if (!baseUrl) {
            message('Please select or enter a valid URL first', 'warning');
            return;
        }

        if (selectedGuests.length === 0) {
            message('Please select at least one guest first', 'warning');
            return;
        }

        const links = selectedGuests.map(guest => 
            `${baseUrl}${couple.id}_${guest.code}`  // FIX: Hapus $ disini
        ).join('\n');

        navigator.clipboard.writeText(links)
            .then(() => {
                setCopied(true);
                message('All links copied to clipboard', 'success');
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                message('Failed to copy links', 'error');
            });
    };

    const getCurrentBaseUrl = () => {
        return selectedTemplate === "custom" ? customBaseUrl : selectedTemplate;
    };

    // Filter guests based on search
    const filteredGuests = couple.guests.filter(guest =>
        guest.name.toLowerCase().includes(searchGuest.toLowerCase()) ||
        guest.code.toLowerCase().includes(searchGuest.toLowerCase())
    );

    return (
        <>
            <CustomButton
                variant="outlined"
                startIcon={<Icon icon="mdi:link-variant" />}
                onClick={handleOpenDialog}
                disabled={disabled || couple.guests.length === 0}
                sx={{ height: 40 }}
            >
                Generate Links
            </CustomButton>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Generate Invitation Links
                    </Typography>

                    {/* Template Selection */}
                    <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                        <InputLabel>Select Template</InputLabel>
                        <Select
                            value={selectedTemplate}
                            onChange={handleTemplateChange}
                            label="Select Template"
                        >
                            {templateOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Custom URL Input */}
                    {selectedTemplate === "custom" && (
                        <TextField
                            fullWidth
                            label="Custom Base URL"
                            value={customBaseUrl}
                            onChange={(e) => setCustomBaseUrl(e.target.value)}
                            placeholder="https://your-wedding-site.com/invitation?code="
                            margin="normal"
                            sx={{ mb: 2 }}
                        />
                    )}

                    {/* Guest Selection Section */}
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        Select Guests ({selectedGuests.length} selected)
                    </Typography>

                    {/* Search Guest */}
                    <TextField
                        fullWidth
                        label="Search guests..."
                        value={searchGuest}
                        onChange={(e) => setSearchGuest(e.target.value)}
                        margin="normal"
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: <Icon icon="mdi:magnify" style={{ marginRight: 8, color: '#666' }} />
                        }}
                    />

                    {/* Select All Button */}
                    <Button 
                        onClick={handleSelectAllGuests}
                        variant="outlined"
                        size="small"
                        sx={{ mb: 2 }}
                    >
                        {selectedGuests.length === couple.guests.length ? 'Deselect All' : 'Select All'}
                    </Button>

                    {/* Guests List */}
                    <Box sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, mb: 2 }}>
                        <List dense>
                            {filteredGuests.map((guest) => (
                                <ListItem key={guest.id} disablePadding>
                                    <ListItemButton onClick={() => handleGuestSelection(guest)} dense>
                                        <ListItemIcon>
                                            <Checkbox
                                                edge="start"
                                                checked={selectedGuests.some(g => g.id === guest.id)}
                                                tabIndex={-1}
                                                disableRipple
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={guest.name}
                                            secondary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                    <Chip 
                                                        label={guest.code} 
                                                        size="small" 
                                                        variant="outlined"
                                                        sx={{ mr: 1 }}
                                                    />
                                                    <Chip 
                                                        label={guest.status}
                                                        size="small"
                                                        color={
                                                            guest.status === 'checked-in' ? 'success' :
                                                            guest.status === 'ACCEPTED' ? 'primary' :
                                                            'error'
                                                        }
                                                    />
                                                </Box>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Box>

                    {/* Copy Links Section */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2">
                            {selectedGuests.length} guests selected
                        </Typography>
                        <Button 
                            onClick={handleCopyAllLinks}
                            variant="contained"
                            size="small"
                            startIcon={<Icon icon={copied ? "mdi:check" : "mdi:content-copy"} />}
                            color={copied ? "success" : "primary"}
                            disabled={!getCurrentBaseUrl() || selectedGuests.length === 0}
                        >
                            {copied ? 'Copied!' : 'Copy Links'}
                        </Button>
                    </Box>

                    {/* Preview Links */}
                    {selectedGuests.length > 0 && getCurrentBaseUrl() && (
                        <>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>
                                Preview Links:
                            </Typography>
                            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                                <List dense>
                                    {selectedGuests.slice(0, 5).map((guest) => (
                                        <ListItem key={guest.id} divider>
                                            <ListItemText
                                                primary={guest.name}
                                                secondary={
                                                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                                                        {getCurrentBaseUrl()}{couple.id}_{guest.code}  {/* FIX: Hapus $ disini */}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                    {selectedGuests.length > 5 && (
                                        <ListItem>
                                            <ListItemText
                                                primary={`...and ${selectedGuests.length - 5} more guests`}
                                            />
                                        </ListItem>
                                    )}
                                </List>
                            </Box>
                        </>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                        <Button 
                            onClick={() => setOpen(false)}
                            variant="outlined"
                        >
                            Close
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </>
    );
};

export default InvitationLinkGenerator;