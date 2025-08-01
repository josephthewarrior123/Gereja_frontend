import { useState, useEffect, useRef } from 'react';
import { ref, query, orderByChild, equalTo, update, onValue } from 'firebase/database';
import { db } from '../../config/firebaseConfig';
import { QrReader } from 'react-qr-reader';

export default function QrScanPage() {
  const [scannedGuest, setScannedGuest] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const resultRef = useRef(null);

  useEffect(() => {
    // Check camera availability
    const checkCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Browser tidak mendukung akses kamera');
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setCameraReady(true);
      } catch (err) {
        setError('Tidak dapat mengakses kamera: ' + (err.message || 'Izin kamera diperlukan'));
        setCameraReady(false);
      }
    };

    checkCamera();
  }, []);

  useEffect(() => {
    if (scannedGuest && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scannedGuest]);

  const handleScannedUrl = async (url) => {
    setLoading(true);
    setError('');
    
    try {
      const urlObj = new URL(url);
      const searchParams = new URLSearchParams(urlObj.search);
      const fullCode = searchParams.get('to');

      if (!fullCode) throw new Error('Format QR tidak valid');

      const [coupleId, guestCode] = fullCode.split('_');
      if (!coupleId || !guestCode) throw new Error('Data QR tidak valid');

      const guestsRef = ref(db, `couples/${coupleId}/guests`);
      const guestQuery = query(guestsRef, orderByChild('code'), equalTo(guestCode));

      const snapshot = await new Promise((resolve) => {
        onValue(guestQuery, (snap) => resolve(snap), { onlyOnce: true });
      });

      if (!snapshot.exists()) {
        throw new Error('Tamu tidak ditemukan');
      }

      const guestData = snapshot.val();
      const [guestId, guest] = Object.entries(guestData)[0];

      if (guest.status === 'checked-in') {
        setAlreadyCheckedIn(true);
        setScannedGuest(guest);
        throw new Error('Anda sudah check-in sebelumnya');
      }

      await update(ref(db, `couples/${coupleId}/guests/${guestId}`), {
        status: 'checked-in',
        checkedInAt: Date.now(),
      });

      setScannedGuest(guest);
    } catch (err) {
      setError(err.message);
      if (err.message !== 'Anda sudah check-in sebelumnya') {
        setScannedGuest(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScanResult = (result, error) => {
    if (result) {
      handleScannedUrl(result?.text);
    }
    
    if (error) {
      console.info('Scan error:', error);
      if (!error.message.includes('No QR code found')) {
        setError('Gagal memindai: ' + error.message);
      }
    }
  };

  return (
    <div
      className="p-4 max-w-md mx-auto"
      style={{
        minHeight: '100vh',
        overflowY: 'auto',
        paddingBottom: '5rem',
      }}
    >
      <h1 className="text-2xl font-bold mb-4 text-center">Wedding QR Scanner</h1>

      <div className="mb-4">
        {cameraReady ? (
          <div className="relative">
            <QrReader
              constraints={{ facingMode: 'environment' }}
              onResult={handleScanResult}
              scanDelay={500}
              className="w-full bg-gray-200 rounded-lg mb-2"
              style={{
                aspectRatio: '3/4',
                maxWidth: '400px',
                margin: '0 auto',
                border: '1px solid #ccc',
                overflow: 'hidden',
              }}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white font-bold">Memproses...</div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full bg-gray-200 rounded-lg mb-2 flex items-center justify-center"
            style={{
              aspectRatio: '3/4',
              maxWidth: '400px',
              margin: '0 auto',
              border: '1px solid #ccc',
              padding: '1rem',
              textAlign: 'center'
            }}>
            {error || 'Menyiapkan scanner...'}
          </div>
        )}
      </div>

      {error && !scannedGuest && (
        <div className="p-3 mb-4 bg-red-100 text-red-800 rounded-lg text-center">
          {error}
        </div>
      )}

      {scannedGuest && (
        <div
          ref={resultRef}
          className="p-4 bg-green-50 rounded-lg border border-green-200"
        >
          <h3 className="font-bold text-lg text-green-800 text-center">
            {alreadyCheckedIn ? 'Anda Sudah Check-in' : 'Check-in Berhasil!'}
          </h3>
          <div className="mt-2">
            <p>
              <span className="font-semibold">Nama:</span> {scannedGuest.name}
            </p>
            <p>
              <span className="font-semibold">Kode:</span> {scannedGuest.code}
            </p>
            <p>
              <span className="font-semibold">Status:</span> Sudah Check-in
            </p>
            {scannedGuest.wish && (
              <p>
                <span className="font-semibold">Ucapan:</span> {scannedGuest.wish}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Manual Input Fallback */}
      {!cameraReady && (
        <div className="mt-4">
          <h3 className="text-center mb-2">Atau masukkan kode manual:</h3>
          <input
            type="text"
            placeholder="Masukkan kode tamu"
            className="w-full p-2 border rounded mb-2"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleScannedUrl(e.target.value);
              }
            }}
          />
          <button
            onClick={() => {
              const input = prompt('Masukkan kode tamu:');
              if (input) handleScannedUrl(input);
            }}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Submit Kode Manual
          </button>
        </div>
      )}
    </div>
  );
}