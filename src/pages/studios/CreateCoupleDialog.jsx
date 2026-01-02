// CreateCoupleDialog.jsx
import { useState, useRef, useEffect } from 'react';
import { ref, set } from 'firebase/database';
import { db } from '../../config/firebaseConfig';
import { 
  Dialog, 
  TextField, 
  Button, 
  IconButton, 
  Typography, 
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import { Icon } from '@iconify/react';
import * as XLSX from 'xlsx';

// Warna untuk tipe tamu
const guestTypeColors = {
  regular: '#4caf50', // Green
  vip: '#1976d2', // Blue
};

// Warna untuk tipe seat
const seatTypeColors = {
  regular: '#4caf50', // Green
  vip: '#1976d2', // Blue
};

const occupiedColor = '#f44336'; // Red

export default function CreateCoupleDialog({ open, onClose }) {
  const [coupleName, setCoupleName] = useState('');
  const [guests, setGuests] = useState([]);
  const [newGuest, setNewGuest] = useState('');
  const [newGuestType, setNewGuestType] = useState('regular');
  const [seatingType, setSeatingType] = useState('none'); // 'none' or 'seat'
  const [seatConfigs, setSeatConfigs] = useState([
    { rows: '', type: 'regular', seatsPerRow: '' }
  ]);
  const [seatArrangement, setSeatArrangement] = useState([]);
  const [rowLetters, setRowLetters] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState({});
  const fileInputRef = useRef(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  // Generate row letters based on seat configurations
  useEffect(() => {
    if (seatingType === 'seat') {
      const allRows = [];
      seatConfigs.forEach(config => {
        if (config.rows) {
          const rows = config.rows.split(',').map(row => row.trim().toUpperCase());
          allRows.push(...rows);
        }
      });
      setRowLetters(allRows);
    }
  }, [seatConfigs, seatingType]);

  // Reset all form inputs
  const resetForm = () => {
    setCoupleName('');
    setGuests([]);
    setNewGuest('');
    setNewGuestType('regular');
    setSeatingType('none');
    setSeatConfigs([{ rows: '', type: 'regular', seatsPerRow: '' }]);
    setSeatArrangement([]);
    setRowLetters([]);
    setSelectedSeats({});
  };

  // Create clean alphanumeric ID
  const createCleanId = (str) => {
    const alphanumericOnly = str
      .toLowerCase()
      .replace(/&/g, 'dan')
      .replace(/[^a-z0-9]/g, '');
    
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    
    return `${alphanumericOnly}${randomSuffix}`;
  };

  // Generate unique code for guest
  const generateCode = () => {
    const initials = coupleName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${initials}${randomNum}`;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!coupleName || guests.length === 0) return;

    try {
      const coupleId = createCleanId(coupleName);
      const coupleData = {
        name: coupleName,
        seatingType,
        guests: {},
        arrangement: seatingType === 'seat' ? seatArrangement : null
      };

      // Add guests with clean IDs
      guests.forEach(guest => {
        const guestId = createCleanId(guest.name);
        coupleData.guests[guestId] = {
          name: guest.name,
          type: guest.type || 'regular',
          code: generateCode(),
          status: 'PENDING',
          seat: guest.seat || null
        };
      });

      // Save to Firebase
      await set(ref(db, `couples/${coupleId}`), coupleData);

      
      // Reset form and close dialog
      resetForm();
      onClose(true);
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  // Check if guest already exists
  const isGuestExists = (name) => {
    return guests.some(
      guest => guest.name.toLowerCase() === name.toLowerCase()
    );
  };

  // Add new guest
  const addGuest = () => {
    const trimmedName = newGuest.trim();
    if (trimmedName && !isGuestExists(trimmedName)) {
      setGuests([...guests, { 
        name: trimmedName, 
        type: newGuestType,
        seat: null
      }]);
      setNewGuest('');
      setNewGuestType('regular');
    }
  };

  // Remove guest
  const removeGuest = (index) => {
    const updatedGuests = [...guests];
    
    // Remove seat assignment if exists
    const guest = updatedGuests[index];
    if (guest.seat) {
      const [row, seatNumber] = guest.seat.split('-');
      const seatRowIndex = rowLetters.indexOf(row);
      const seatColIndex = parseInt(seatNumber) - 1;
      
      if (seatRowIndex !== -1 && seatArrangement[seatRowIndex]) {
        const newSeatArrangement = [...seatArrangement];
        newSeatArrangement[seatRowIndex][seatColIndex] = null;
        setSeatArrangement(newSeatArrangement);
      }
      
      // Remove from selected seats
      const newSelectedSeats = {...selectedSeats};
      delete newSelectedSeats[guest.seat];
      setSelectedSeats(newSelectedSeats);
    }
    
    updatedGuests.splice(index, 1);
    setGuests(updatedGuests);
  };

  // Add new seat configuration
  const addSeatConfig = () => {
    setSeatConfigs([...seatConfigs, { rows: '', type: 'regular', seatsPerRow: '' }]);
  };

  // Remove seat configuration
  const removeSeatConfig = (index) => {
    const updatedConfigs = [...seatConfigs];
    updatedConfigs.splice(index, 1);
    setSeatConfigs(updatedConfigs);
  };

  // Update seat configuration
  const updateSeatConfig = (index, field, value) => {
    const updatedConfigs = [...seatConfigs];
    updatedConfigs[index][field] = value;
    setSeatConfigs(updatedConfigs);
  };

  // Generate seat arrangement based on configurations
  const generateSeatArrangement = () => {
    // Validate all configurations
    for (const config of seatConfigs) {
      if (!config.rows || !config.seatsPerRow) {
        alert('Please fill all seat configuration fields');
        return;
      }
    }

    // Generate all rows and their types
    const allRows = [];
    const rowTypes = {};
    
    seatConfigs.forEach(config => {
      const rows = config.rows.split(',').map(row => row.trim().toUpperCase());
      const seatsPerRow = parseInt(config.seatsPerRow);
      
      rows.forEach(row => {
        allRows.push(row);
        rowTypes[row] = { type: config.type, seatsPerRow };
      });
    });

    // Sort rows alphabetically
    allRows.sort();
    
    // Create seat arrangement matrix
    const newArrangement = allRows.map(row => {
      const seatsPerRow = rowTypes[row].seatsPerRow;
      return Array(seatsPerRow).fill(null);
    });

    setSeatArrangement(newArrangement);
    setSelectedSeats({});
  };

  // Handle seat selection
  const handleSeatSelect = (rowIndex, colIndex) => {
    if (!guests.length) return;
    
    const rowLetter = rowLetters[rowIndex];
    const seatId = `${rowLetter}-${colIndex + 1}`;
    
    // If this seat is already assigned, unassign it
    if (seatArrangement[rowIndex][colIndex] !== null) {
      const guestIndex = guests.findIndex(g => g.seat === seatId);
      if (guestIndex !== -1) {
        const updatedGuests = [...guests];
        updatedGuests[guestIndex].seat = null;
        setGuests(updatedGuests);
      }
      
      const newSeatArrangement = [...seatArrangement];
      newSeatArrangement[rowIndex][colIndex] = null;
      setSeatArrangement(newSeatArrangement);
      
      const newSelectedSeats = {...selectedSeats};
      delete newSelectedSeats[seatId];
      setSelectedSeats(newSelectedSeats);
      return;
    }
    
    // Find first guest without a seat assignment
    const guestIndex = guests.findIndex(g => !g.seat);
    if (guestIndex === -1) return;
    
    // Assign seat to guest
    const updatedGuests = [...guests];
    updatedGuests[guestIndex].seat = seatId;
    setGuests(updatedGuests);
    
    const newSeatArrangement = [...seatArrangement];
    newSeatArrangement[rowIndex][colIndex] = updatedGuests[guestIndex].name;
    setSeatArrangement(newSeatArrangement);
    
    setSelectedSeats({...selectedSeats, [seatId]: guestIndex});
  };

  // Get seat type for a specific row
  const getSeatTypeForRow = (rowIndex) => {
    const rowLetter = rowLetters[rowIndex];
    for (const config of seatConfigs) {
      const rows = config.rows.split(',').map(r => r.trim().toUpperCase());
      if (rows.includes(rowLetter)) {
        return config.type;
      }
    }
    return 'regular';
  };

  // Handle Excel file import
  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (jsonData.length > 0) {
        const importedGuests = jsonData
          .map(row => {
            const name = row.name || row[Object.keys(row)[0]];
            const type = row.type || 'regular';
            return { 
              name: String(name).trim(),
              type: ['regular', 'vip'].includes(type.toLowerCase()) ? type.toLowerCase() : 'regular',
              seat: null
            };
          })
          .filter(guest => guest.name && !isGuestExists(guest.name));

        if (importedGuests.length > 0) {
          setGuests([...guests, ...importedGuests]);
        } else {
          alert('No new guests found to import (duplicates were skipped)');
        }
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset file input
    e.target.value = '';
  };

  // Generate example Excel file
  const downloadExampleExcel = () => {
    const exampleData = [
      { name: 'John Doe', type: 'regular' },
      { name: 'Jane Smith', type: 'vip' },
      { name: 'Michael Johnson', type: 'regular' },
      { name: 'Sarah Williams', type: 'vip' }
    ];
    
    const ws = XLSX.utils.json_to_sheet(exampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Guests");
    XLSX.writeFile(wb, "guest_list_example.xlsx");
  };

  return (
    <Dialog open={open} onClose={() => {
      resetForm();
      onClose(false);
    }} maxWidth="lg" fullWidth>
      <Box className="px-6 pt-5 pb-7">
        <div className="flex justify-between items-center">
          <Typography variant="h6" className="typography-2">
            Create New Couple
          </Typography>
          <IconButton 
            onClick={() => {
              resetForm();
              onClose(false);
            }}
            sx={{ p: 3 }}
          >
            <Icon icon="heroicons:x-mark" />
          </IconButton>
        </div>

        <Box className="mt-5">
          <TextField
            fullWidth
            label="Couple Name"
            value={coupleName}
            onChange={(e) => setCoupleName(e.target.value)}
            margin="normal"
            placeholder="Example: Joseph and Tia"
            required
            variant="filled"
          />

          <Box mt={2} mb={2}>
            <Typography variant="subtitle1" className="typography-3 mb-2">
              Seating Type
            </Typography>
            <ToggleButtonGroup
              value={seatingType}
              exclusive
              onChange={(e, newType) => newType && setSeatingType(newType)}
              aria-label="seating type"
            >
              <ToggleButton value="none" aria-label="no arrangement">
                No Arrangement
              </ToggleButton>
              <ToggleButton value="seat" aria-label="seat arrangement">
                Seat Arrangement
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {seatingType === 'seat' && (
            <Box className="mt-6">
              <Typography variant="subtitle1" className="typography-3 mb-4">
                Seat Configuration
              </Typography>
              
              {seatConfigs.map((config, index) => (
                <Box key={index} className="border p-4 rounded-lg flex flex-col gap-2 mb-4">
                  <Box display="flex" gap={1} alignItems="center">
                    <TextField
                      label="Rows (e.g., A, B, C)"
                      value={config.rows}
                      onChange={(e) => updateSeatConfig(index, 'rows', e.target.value)}
                      placeholder="A, B, C"
                      variant="filled"
                      fullWidth
                    />
                    <TextField
                      select
                      label="Type"
                      value={config.type}
                      onChange={(e) => updateSeatConfig(index, 'type', e.target.value)}
                      sx={{ minWidth: 120 }}
                      variant="filled"
                    >
                      <MenuItem value="regular">Regular</MenuItem>
                      <MenuItem value="vip">VIP</MenuItem>
                    </TextField>
                    <TextField
                      label="Seats per Row"
                      type="number"
                      value={config.seatsPerRow}
                      onChange={(e) => updateSeatConfig(index, 'seatsPerRow', e.target.value)}
                      sx={{ minWidth: 120 }}
                      variant="filled"
                    />
                    {seatConfigs.length > 1 && (
                      <IconButton onClick={() => removeSeatConfig(index)}>
                        <Icon icon="mdi:trash-can-outline" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              ))}
              
              <Box display="flex" gap={1} mb={2}>
                <Button 
                  variant="outlined" 
                  onClick={addSeatConfig}
                  startIcon={<Icon icon="mdi:plus" />}
                  sx={{ minWidth: 200, height: 55, fontSize: 15 }}
                >
                  Add Configuration
                </Button>
                <Button 
                  variant="contained" 
                  onClick={generateSeatArrangement}
                  disabled={!seatConfigs.every(config => config.rows && config.seatsPerRow)}
                  sx={{ minWidth: 200, height: 55, fontSize: 15 }}
                >
                  Generate Seating
                </Button>
              </Box>

              {seatArrangement.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom className="typography-3">
                    Seat Layout - Click to Assign Guests
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                    <Box display="flex" flexDirection="column" gap={1}>
                      {/* Screen representation */}
                      <Box 
                        sx={{ 
                          height: 20, 
                          bgcolor: 'grey.300', 
                          borderRadius: 1, 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          mb: 2
                        }}
                      >
                        <Typography variant="caption">Screen</Typography>
                      </Box>
                      
                      {/* Seats grid - FIXED LAYOUT */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {seatArrangement.map((row, rowIndex) => {
                          const rowLetter = rowLetters[rowIndex];
                          const seatType = getSeatTypeForRow(rowIndex);
                          
                          return (
                            <Box key={rowIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              {row.map((seat, colIndex) => {
                                const seatId = `${rowLetter}${colIndex + 1}`;
                                const isAssigned = seat !== null;
                                
                                return (
                                  <Tooltip
                                    key={colIndex}
                                    title={
                                      isAssigned 
                                        ? `Occupied by: ${seat}`
                                        : `${rowLetter}${colIndex + 1} (${seatType})`
                                    }
                                    arrow
                                    placement="top"
                                  >
                                    <Box
                                      onClick={() => handleSeatSelect(rowIndex, colIndex)}
                                      sx={{
                                        p: 1,
                                        width: 40,
                                        height: 40,
                                        borderRadius: '4px',
                                        backgroundColor: isAssigned 
                                          ? occupiedColor 
                                          : seatTypeColors[seatType],
                                        cursor: guests.length > 0 ? 'pointer' : 'default',
                                        color: 'white',
                                        textAlign: 'center',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        '&:hover': {
                                          opacity: guests.length > 0 ? 0.8 : 1
                                        }
                                      }}
                                    >
                                      {rowLetter}
                                      {colIndex + 1}
                                      {isAssigned && '#'}
                                    </Box>
                                  </Tooltip>
                                );
                              })}
                            </Box>
                          );
                        })}
                      </Box>
                      
                      {/* Legend */}
                      <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box width={20} height={20} bgcolor={seatTypeColors.regular} borderRadius="4px" />
                          <Typography variant="caption">Regular Seats</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box width={20} height={20} bgcolor={seatTypeColors.vip} borderRadius="4px" />
                          <Typography variant="caption">VIP Seats</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box width={20} height={20} bgcolor={occupiedColor} borderRadius="4px" />
                          <Typography variant="caption">Occupied Seats</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              )}
            </Box>
          )}

          <Typography variant="subtitle1" mt={4} gutterBottom className="typography-3">
            Guest List
          </Typography>

          <Box display="flex" gap={1} mb={2}>
            <TextField
              fullWidth
              label="Guest Name"
              value={newGuest}
              onChange={(e) => setNewGuest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addGuest()}
              error={newGuest.trim() && isGuestExists(newGuest.trim())}
              helperText={
                newGuest.trim() && isGuestExists(newGuest.trim())
                  ? 'This guest already exists'
                  : ''
              }
              variant="filled"
            />
            <TextField
              select
              label="Type"
              value={newGuestType}
              onChange={(e) => setNewGuestType(e.target.value)}
              sx={{ minWidth: 120 }}
              variant="filled"
            >
              <MenuItem value="regular">Regular</MenuItem>
              <MenuItem value="vip">VIP</MenuItem>
            </TextField>
            <Button 
              variant="contained" 
              onClick={addGuest}
              disabled={!newGuest.trim() || isGuestExists(newGuest.trim())}
              startIcon={<Icon icon="mdi:plus" />}
              sx={{ height: 55 }}
            >
              Add
            </Button>
          </Box>

          <Box display="flex" gap={1} mb={2}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Icon icon="mdi:file-excel" />}
              sx={{ height: 55 }}
            >
              Import from Excel
              <input
                type="file"
                hidden
                accept=".xlsx, .xls"
                onChange={handleFileImport}
                ref={fileInputRef}
              />
            </Button>
            
            <Button
              variant="text"
              onClick={downloadExampleExcel}
              startIcon={<Icon icon="mdi:download" />}
              sx={{ height: 55 }}
            >
              Download Example
            </Button>
          </Box>

          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {guests.map((guest, index) => (
              <ListItem 
                key={index} 
                divider
                sx={{
                  borderLeft: `4px solid ${guestTypeColors[guest.type] || guestTypeColors.regular}`,
                  backgroundColor: guest.seat ? '#e8f5e9' : 'transparent'
                }}
              >
                <ListItemText 
                  primary={guest.name} 
                  secondary={
                    <>
                      <span>Type: {guest.type || 'regular'}</span>
                      {guest.seat && <><br /><span>Seat: {guest.seat}</span></>}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => removeGuest(index)}>
                    <Icon icon="mdi:delete" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          <Box display="flex" justifyContent="flex-end" gap={1} mt={3}>
            <Button 
              variant="outlined" 
              onClick={() => {
                resetForm();
                onClose(false);
              }}
              sx={{ height: 55, minWidth: 120 }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSubmit}
              disabled={!coupleName || guests.length === 0}
              startIcon={<Icon icon="mdi:content-save" />}
              sx={{ height: 55, minWidth: 150 }}
            >
              Save Couple
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}