import { useState, useRef } from 'react';
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
  ListItemSecondaryAction
} from '@mui/material';
import { Icon } from '@iconify/react';
import * as XLSX from 'xlsx';

export default function CreateCoupleDialog({ open, onClose }) {
  const [coupleName, setCoupleName] = useState('');
  const [guests, setGuests] = useState([]);
  const [newGuest, setNewGuest] = useState('');
  const fileInputRef = useRef(null);

  // Fungsi untuk mereset semua input form
  const resetForm = () => {
    setCoupleName('');
    setGuests([]);
    setNewGuest('');
  };

  // Fungsi untuk membuat ID alfanumerik bersih
  const createCleanId = (str) => {
    const alphanumericOnly = str
      .toLowerCase()
      .replace(/&/g, 'dan')
      .replace(/[^a-z0-9]/g, ''); // Hanya menyisakan huruf dan angka
    
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // Angka acak 4 digit
    
    return `${alphanumericOnly}${randomSuffix}`;
  };

  const generateCode = () => {
    const initials = coupleName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${initials}${randomNum}`;
  };

  const handleSubmit = async () => {
    if (!coupleName || guests.length === 0) return;

    try {
      // Buat ID couple yang bersih
      const coupleId = createCleanId(coupleName);
      
      // Siapkan data couple
      const coupleData = {
        name: coupleName,
        guests: {}
      };

      // Tambahkan guests dengan ID bersih
      guests.forEach(guest => {
        const guestId = createCleanId(guest.name);
        coupleData.guests[guestId] = {
          name: guest.name,
          code: generateCode(),
          status: 'PENDING'
        };
      });

      // Simpan ke Firebase
      await set(ref(db, `couples/${coupleId}`), coupleData);
      
      // Reset form setelah berhasil disimpan
      resetForm();
      
      // Tutup dialog dan refresh data
      onClose(true);
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  // Check if guest name already exists (case insensitive)
  const isGuestExists = (name) => {
    return guests.some(
      guest => guest.name.toLowerCase() === name.toLowerCase()
    );
  };

  const addGuest = () => {
    const trimmedName = newGuest.trim();
    if (trimmedName && !isGuestExists(trimmedName)) {
      setGuests([...guests, { name: trimmedName }]);
      setNewGuest('');
    }
  };

  const removeGuest = (index) => {
    const updatedGuests = [...guests];
    updatedGuests.splice(index, 1);
    setGuests(updatedGuests);
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
            // Use 'name' column if exists, otherwise use first column
            const name = row.name || row[Object.keys(row)[0]];
            return { name: String(name).trim() };
          })
          .filter(guest => guest.name && !isGuestExists(guest.name)); // Filter out empty and duplicate names

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
      { name: 'John Doe' },
      { name: 'Jane Smith' },
      { name: 'Michael Johnson' },
      { name: 'Sarah Williams' }
    ];
    
    const ws = XLSX.utils.json_to_sheet(exampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Guests");
    XLSX.writeFile(wb, "guest_list_example.xlsx");
  };

  // Reset form juga ketika dialog dibuka
  useState(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={() => {
      resetForm();
      onClose(false);
    }} maxWidth="sm" fullWidth>
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          Create New Couple
        </Typography>

        <TextField
          fullWidth
          label="Couple Name"
          value={coupleName}
          onChange={(e) => setCoupleName(e.target.value)}
          margin="normal"
          placeholder="Example: Joseph and Tia"
          required
        />

        <Typography variant="subtitle1" mt={2} gutterBottom>
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
          />
          <Button 
            variant="contained" 
            onClick={addGuest}
            disabled={!newGuest.trim() || isGuestExists(newGuest.trim())}
            startIcon={<Icon icon="mdi:plus" />}
          >
            Add
          </Button>
        </Box>

        <Box display="flex" gap={1} mb={2}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<Icon icon="mdi:file-excel" />}
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
          >
            Download Example
          </Button>
        </Box>

        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
          {guests.map((guest, index) => (
            <ListItem key={index} divider>
              <ListItemText primary={guest.name} />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => removeGuest(index)}>
                  <Icon icon="mdi:delete" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        <Box display="flex" justifyContent="flex-end" gap={1} mt={3}>
          <Button variant="outlined" onClick={() => {
            resetForm();
            onClose(false);
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
            disabled={!coupleName || guests.length === 0}
            startIcon={<Icon icon="mdi:content-save" />}
          >
            Save Couple
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}