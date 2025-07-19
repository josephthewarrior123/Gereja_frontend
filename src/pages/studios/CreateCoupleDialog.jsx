import { useState } from 'react';
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

export default function CreateCoupleDialog({ open, onClose }) {
  const [coupleName, setCoupleName] = useState('');
  const [guests, setGuests] = useState([]);
  const [newGuest, setNewGuest] = useState('');

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

  const addGuest = () => {
    if (newGuest.trim()) {
      setGuests([...guests, { name: newGuest.trim() }]);
      setNewGuest('');
    }
  };

  const removeGuest = (index) => {
    const updatedGuests = [...guests];
    updatedGuests.splice(index, 1);
    setGuests(updatedGuests);
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
          />
          <Button 
            variant="contained" 
            onClick={addGuest}
            startIcon={<Icon icon="mdi:plus" />}
          >
            Add
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