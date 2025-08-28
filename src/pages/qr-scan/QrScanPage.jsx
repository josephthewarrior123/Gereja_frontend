import { useState, useEffect, useRef } from 'react';
import { ref, query, orderByChild, equalTo, update, onValue } from 'firebase/database';
import { db } from '../../config/firebaseConfig';
import { Html5Qrcode } from 'html5-qrcode';
import CustomButton from '../../reusables/CustomButton';
import CustomSelect from '../../reusables/CustomSelect';
import { MenuItem } from '@mui/material';
import dayjs from 'dayjs';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function QrScanPage() {
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [scanner, setScanner] = useState(null);
    const [scannedGuest, setScannedGuest] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
    const [guestToCheckIn, setGuestToCheckIn] = useState(null);
    const [coupleId, setCoupleId] = useState('');
    const [guestId, setGuestId] = useState('');

    const warningShown = useRef(false);
    const scanTimeoutRef = useRef(null);
    const contentRef = useRef(null);

    const initializeScanner = async () => {
        setLoading(true);
        try {
            const availableDevices = await Html5Qrcode.getCameras();
            if (availableDevices && availableDevices.length > 0) {
                setCameras(availableDevices);
                setSelectedCamera(availableDevices[0].id);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const toggleScanningState = () => {
        if (scanner) {
            safeStopScanner(scanner);
            return;
        }

        setScannedGuest(null);
        setErrorMessage('');
        warningShown.current = false;

        const html5QrCode = new Html5Qrcode('reader');
        
        scanTimeoutRef.current = setTimeout(() => {
            if (!scannedGuest) {
                safeStopScanner(html5QrCode);
                setErrorMessage('No QR code detected');
            }
        }, 30000);

        html5QrCode
            .start(
                selectedCamera,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    if (decodedText) {
                        clearTimeout(scanTimeoutRef.current);
                        handleScannedUrl(decodedText);
                        safeStopScanner(html5QrCode);
                    }
                },
                (errorMessage) => {
                    if (!warningShown.current) {
                        console.warn('Scan warning:', errorMessage);
                        warningShown.current = true;
                    }
                }
            )
            .then(() => setScanner(html5QrCode))
            .catch((error) => {
                console.error(error);
                setErrorMessage('Failed to start scanner: ' + error.message);
            });
    };

    const safeStopScanner = async (scanner) => {
        try {
            await scanner.stop();
        } catch (e) {
            console.warn('Cannot stop scanner:', e);
        } finally {
            setScanner(null);
            warningShown.current = false;
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
                scanTimeoutRef.current = null;
            }
        }
    };

    const handleScannedUrl = async (url) => {
        setLoading(true);
        try {
            const urlObj = new URL(url);
            const searchParams = new URLSearchParams(urlObj.search);
            const fullCode = searchParams.get('to');

            if (!fullCode) throw new Error('Invalid QR format');

            const [coupleId, guestCode] = fullCode.split('_');
            if (!coupleId || !guestCode) throw new Error('Invalid QR data');

            const guestsRef = ref(db, `couples/${coupleId}/guests`);
            const guestQuery = query(guestsRef, orderByChild('code'), equalTo(guestCode));

            const snapshot = await new Promise((resolve) => {
              onValue(guestQuery, (snap) => resolve(snap), { onlyOnce: true });
            });
            
            if (!snapshot.exists()) {
                throw new Error('Guest not found');
            }

            const guestData = snapshot.val();
            const [guestId, guest] = Object.entries(guestData)[0];

            if (guest.status === 'checked-in') {
                setAlreadyCheckedIn(true);
                setScannedGuest(guest);
                setModalMessage('You have already checked in before');
                setOpenModal(true);
                return;
            }

            // Simpan data untuk check-in nanti
            setGuestToCheckIn(guest);
            setCoupleId(coupleId);
            setGuestId(guestId);
            
            // Tampilkan modal konfirmasi
            setConfirmModal(true);
            
        } catch (err) {
            setErrorMessage(err.message);
            setModalMessage(err.message);
            setOpenModal(true);
            if (err.message !== 'You have already checked in before') {
                setScannedGuest(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmCheckIn = async () => {
        setLoading(true);
        try {
            const checkInTime = Date.now();
    
            await update(ref(db, `couples/${coupleId}/guests/${guestId}`), {
                status: 'checked-in',
                checkedInAt: checkInTime,
            });
    
            // update state lokal biar UI auto refresh
            setScannedGuest({
                ...guestToCheckIn,
                status: 'checked-in',
                checkedInAt: checkInTime,
            });
    
            setErrorMessage('');
            setModalMessage('Check-in successful!');
            setOpenModal(true);
            setConfirmModal(false);
        } catch (err) {
            setErrorMessage(err.message);
            setModalMessage('Failed to check in: ' + err.message);
            setOpenModal(true);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        initializeScanner();
        return () => {
            if (scanner) {
                safeStopScanner(scanner);
            }
        };
    }, []);

    // helper buat status modal: success / error
    const isSuccessMessage = modalMessage.toLowerCase().includes('success');

    return (
        <div className="flex flex-col h-screen">
            <div className="max-w-lg w-full mx-auto flex flex-col h-full sm:hidden">
                <div className="flex-grow overflow-y-auto" ref={contentRef}>
                    <div className="p-5 flex flex-col gap-6">
                        <div>
                            <h1>QR Scan</h1>
                            <div className="typography-1 mt-2">
                                Point the guest's QR code inside the box to check them in.
                            </div>
                        </div>

                        <div>
                            {cameras?.length > 0 ? (
                                <div className="flex flex-col">
                                    <div className="flex flex-col gap-1">
                                        <CustomSelect
                                            label={'Select Camera'}
                                            value={selectedCamera}
                                            onChange={(event) => setSelectedCamera(event.target.value)}
                                            fullWidth
                                            className="col-span-3"
                                            disabled={Boolean(scanner)}
                                        >
                                            {cameras.map((device, index) => (
                                                <MenuItem key={device.id || index} value={device.id || index}>
                                                    {device.label || `Camera ${index + 1}`}
                                                </MenuItem>
                                            ))}
                                        </CustomSelect>
                                    </div>
                                    <div className="mt-3 flex flex-col gap-3">
                                        <div className="w-full bg-project-tertiary rounded-2xl" id="reader" />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-red-500">Error: No camera available!</div>
                            )}
                        </div>

                        {scannedGuest && (
                            <div>
                                <h2>Guest Details</h2>
                                <div className="mt-1 typography-1 text-sm flex flex-col gap-1">
                                    <div className="grid grid-flow-col grid-cols-4">
                                        <div className="col-span-1 font-medium">Name</div>
                                        <div className="col-span-3">: {scannedGuest?.name || '-'}</div>
                                    </div>
                                    <div className="grid grid-flow-col grid-cols-4">
                                        <div className="col-span-1 font-medium">Code</div>
                                        <div className="col-span-3">: {scannedGuest?.code || '-'}</div>
                                    </div>
                                    <div className="grid grid-flow-col grid-cols-4">
                                        <div className="col-span-1 font-medium">Pax</div>
                                        <div className="col-span-3">: {scannedGuest?.pax || 1} orang</div>
                                    </div>
                                    <div className="grid grid-flow-col grid-cols-4 items-center">
                                        <div className="col-span-1 font-medium">Status</div>
                                        <div className="col-span-3 flex items-center gap-2">
                                            : {scannedGuest?.status === 'checked-in' ? (
                                                <span className="flex items-center text-green-600">
                                                    <FaCheckCircle className="mr-1" /> Checked In
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-red-600">
                                                    <FaTimesCircle className="mr-1" /> Not Checked In
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {scannedGuest?.wish && (
                                        <div className="grid grid-flow-col grid-cols-4">
                                            <div className="col-span-1 font-medium">Wish</div>
                                            <div className="col-span-3">: {scannedGuest.wish}</div>
                                        </div>
                                    )}
                                    {scannedGuest?.checkedInAt && (
                                        <div className="grid grid-flow-col grid-cols-4">
                                            <div className="col-span-1 font-medium">Check-in Time</div>
                                            <div className="col-span-3">
                                                : {dayjs(scannedGuest?.checkedInAt).format('DD MMM YYYY - HH:mm')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="text-red-500 text-center">
                                {errorMessage}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t border-gray-200 bg-white sticky bottom-0">
                    {selectedCamera && (
                        <CustomButton 
                            fullWidth 
                            variant="outlined" 
                            onClick={toggleScanningState}
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : scanner ? 'Stop Scanning' : 'Start Scanning'}
                        </CustomButton>
                    )}
                </div>
            </div>

            <div className="hidden sm:flex h-screen items-center justify-center text-center text-lg font-bold p-5">
                This page is only available in mobile devices please open in your phone
            </div>

            {/* MODAL FOR MESSAGES */}
            {openModal && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 p-5 z-50">
                    <div className="bg-white p-5 rounded-lg shadow-lg max-w-sm w-full text-center">
                        <div className="flex flex-col items-center gap-2">
                            {isSuccessMessage ? (
                                <FaCheckCircle className="text-green-600 text-4xl" />
                            ) : (
                                <FaTimesCircle className="text-red-600 text-4xl" />
                            )}
                            <p className="whitespace-pre-line">{modalMessage}</p>
                        </div>
                        <button 
                            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() => setOpenModal(false)}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL */}
            {confirmModal && guestToCheckIn && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 p-5 z-50">
                    <div className="bg-white p-5 rounded-lg shadow-lg max-w-sm w-full">
                        <h2 className="text-xl font-bold mb-4">Confirm Check-in</h2>
                        <div className="mb-4">
                            <p className="font-medium">Guest Details:</p>
                            <div className="mt-2 space-y-2">
                                <div className="grid grid-cols-3">
                                    <span className="font-medium">Name:</span>
                                    <span className="col-span-2">{guestToCheckIn.name || '-'}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="font-medium">Code:</span>
                                    <span className="col-span-2">{guestToCheckIn.code || '-'}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="font-medium">Pax:</span>
                                    <span className="col-span-2">{guestToCheckIn.pax || 1} orang</span>
                                </div>
                                {guestToCheckIn.wish && (
                                    <div className="grid grid-cols-3">
                                        <span className="font-medium">Wish:</span>
                                        <span className="col-span-2">{guestToCheckIn.wish}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button 
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                onClick={() => setConfirmModal(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button 
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                onClick={handleConfirmCheckIn}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Confirm Check-in'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
