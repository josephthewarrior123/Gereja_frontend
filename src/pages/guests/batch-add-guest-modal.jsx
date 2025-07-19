import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TableCell,
} from '@mui/material';
import {
  Box,
  LinearProgress,
  MenuItem,
  Typography,
} from '@mui/material';
import Papa from 'papaparse';
import { useEffect, useState } from 'react';
import { CSVLink } from 'react-csv';
import { FaDownload } from 'react-icons/fa6';
import { MdClose } from 'react-icons/md';
import FileUpload from '../../reusables/FileUpload';
import CustomTableFrontendFilter from '../../reusables/layouts/CustomTableFrontendFilter';
import { CustomButton } from '../../reusables';
import InvitationDAO from '../../daos/InvitationDAO';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider.jsx';


export default function BatchAddGuestModal({ open, onClose, studioId, showId, showTime, user }) {
  const [guests, setGuests] = useState([]);
  const [errorList, setErrorList] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [fileUploaded, setFileUploaded] = useState(false);
  const message = useAlert();
  const loading = useLoading();

  const reset = () => {
    setGuests([]);
    setErrorList([]);
    setSuccessMessage('');
    setFileUploaded(false);
  };

  useEffect(() => {
    console.log(" Data user dari StudioManagePage:", user);
}, [user]);

const submitData = async () => {
  try {
    loading.start();
    if (!user?.data?.premiers?.id) {
      console.error("Error: premier_id tidak ditemukan!");
      message("Premier ID tidak ditemukan! Coba login ulang atau refresh halaman.", "error");
      return;
    }

    const premierId = user.data.premiers.id;
    console.log("Premier ID ditemukan:", premierId);

    const formattedGuests = guests.map(guest => ({
      premier_id: Number(premierId),
      studio_id: Number(studioId),
      show_id: Number(showId),
      name: guest.name,
      type: guest.type,
      quantity: Number(guest.quantity),
      email: guest.email,
      phone_number: guest.phone_number,
      inviter: guest.inviter
    }));

    console.log("Data dikirim ke API:", JSON.stringify(formattedGuests, null, 2));

    const result = await InvitationDAO.createBatch(formattedGuests, premierId);
    console.log("API Response:", result);

    if (result?.error) {
      console.log("Mengirim error ke UI:", result.error);
      alert(`⚠️ ${result.error}`);
      message(`⚠️ ${result.error}`, "error");
      return;
    }

    message("Batch invitations successfully created!", "success");
    onClose(true);
  } catch (e) {
    console.error("Error submitting bulk invitations:", e);

    if (e?.response?.data?.error) {
      message(`⚠️ ${e.response.data.error}`, "error");
    } else if (e?.error_message) {
      message(`⚠️ ${e.error_message}`, "error");
    } else {
      message("Gagal mengundang tamu. Coba lagi nanti.", "error");
    }
  } finally {
    loading.stop(); // Hentikan loading setelah proses selesai
  }
};



  

  useEffect(() => {
    reset();
  }, [open]);

  return (
    <Dialog
      style={{ zIndex: 700, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      open={open}
      onClose={() => onClose(false)}
      maxWidth={'lg'}
      fullWidth
    >
     <DialogTitle>
    Invite Guests
    <Typography 
        variant="body2" 
        sx={{
            fontWeight: 300, 
            fontSize: '0.8rem', 
            color: '#757575', 
            marginTop: '2px',
            paddingLeft: '2px'
        }}
    >
        🎬 Showtime: {showTime || 'Not Selected'}
    </Typography>
</DialogTitle>

      <IconButton
        aria-label="close"
        onClick={() => onClose(false)}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <MdClose />
      </IconButton>
      <DialogContent style={{ width: '100%', maxWidth: '1200px', margin: 'auto' }}>
        <Stack>
          <Stack direction={'row'} spacing={2}>
            {!fileUploaded && (
              <CustomButton>
                <CSVLink
                  style={{
                    color: 'white',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  separator={';'}
                  data={`name;email;phone_number;inviter;type;quantity\nJohn Doe;johndoe@email.com;08123456789;Komune;VIP;1\nJane Doe;janedoe@email.com;62123456789;Komune;NORMAL;1`}
                  filename={`upload-guest-template.csv`}
                  target="_blank"
                >
                  Download Template <FaDownload />
                </CSVLink>
              </CustomButton>
            )}

            <FileUpload
              allowedType={['text/csv', 'application/vnd.ms-excel']}
              hideSpinner={true}
              text={fileUploaded ? 'Re-upload CSV' : 'Upload CSV'}
              buttonStyle={{ backgroundColor: fileUploaded ? '#204c7f' : 'white', color: fileUploaded ? 'white' : 'black' }}
              onDrop={async (result) => {
                reset();
                let reader = new FileReader();
                reader.readAsText(result[0], 'UTF-8');
                reader.onload = async (e) => {
                  let stringCSV = e.target.result;
                  let parseResult = Papa.parse(stringCSV, {
                    delimiter: "",
                    header: true,
                    skipEmptyLines: true,
                  });
                  let unFormattedData = parseResult.data;

                  if (unFormattedData.length > 5000) {
                    return setErrorList([
                      {
                        no: 0,
                        status: 'Upload Fail',
                        message:
                          'Maximum upload limit is 5000 data',
                      },
                    ]);
                  }

                  let formattedData = unFormattedData.map(
                    (obj) => {
                      return {
                        name: obj.name,
                        email: obj.email,
                        phone_number: obj?.phone_number?.replace(/^[0|8]{1,2}/gm, '628'),
                        inviter: obj.inviter,
                        type: obj.type,
                        quantity: parseInt(obj.quantity, 10),
                      };
                    },
                  );

                  setGuests(formattedData);
                  setFileUploaded(true);
                };
              }}
            />
          </Stack>

          {successMessage && (
            <div style={{ marginTop: 10, marginBottom: 10 }}>
              {successMessage}
            </div>
          )}

          {errorList.map((obj, idx) => (
            <div key={idx}>
              Fail to process guest with email <b>{obj.data?.email}</b> with message: {obj.message}
            </div>
          ))}

          {guests.length > 0 && (
            <>
              <CustomTableFrontendFilter
                sortBy={{}}
                tableHead={[
                  { id: 'no', label: 'No', filter: true, sort: true },
                  { id: 'name', label: 'Name', filter: true, sort: true },
                  { id: 'email', label: 'Email', filter: true, sort: true },
                  { id: 'phone_number', label: 'Phone Number', filter: true, sort: true },
                  { id: 'inviter', label: 'Inviter', filter: true, sort: true },
                  { id: 'type', label: 'Type', filter: true, sort: true },
                  { id: 'quantity', label: 'Quantity', filter: true, sort: true },
                ]}
                data={guests}
                meta={{ total_data: [] }}
                tableRow={(row, idx) => (
                  <>
                    <TableCell component="th" scope="row">{idx + 1}</TableCell>
                    <TableCell align="left">{row.name}</TableCell>
                    <TableCell align="left">{row.email}</TableCell>
                    <TableCell align="left">{row.phone_number}</TableCell>
                    <TableCell align="left">{row.inviter}</TableCell>
                    <TableCell align="left">{row.type}</TableCell>
                    <TableCell align="left">{row.quantity}</TableCell>
                  </>
                )}
              />
              <div className='my-3'>
                <div>Note</div>
                <ul className='font-normal'>
                  <li>- Please make sure the phone numbers start with country code & without '+' symbol (ex: 628594567821)</li>
                  <li>- Please make sure the phone numbers not formatted as a scientific number (ex: 6.2585458E+12)</li>
                </ul>
              </div>
              <Stack direction={'row'}>
                <CustomButton onClick={submitData} disabled={loading.isLoading}>
                  {loading.isLoading ? "Saving..." : "Save"}
                </CustomButton>
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}