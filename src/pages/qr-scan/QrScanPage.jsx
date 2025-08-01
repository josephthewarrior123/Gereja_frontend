import { useState, useEffect, useRef } from 'react';
import { ref, query, orderByChild, equalTo, update, onValue } from 'firebase/database';
import { db } from '../../config/firebaseConfig';
import  Html5Qrcode  from 'html5-qrcode';

export default function QrScanPage() {
  const [scannerInstance, setScannerInstance] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [scannedGuest, setScannedGuest] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);

  const warningShown = useRef(false);
  const scanTimeoutRef = useRef(null);
  const resultRef = useRef(null);

  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    return () => {
      if (scannerInstance) {
        safeStopScanner(scannerInstance);
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [scannerInstance]);

  useEffect(() => {
    if (scannedGuest && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scannedGuest]);

  const safeStopScanner = async (scanner) => {
    try {
      await scanner.stop();
    } catch (e) {
      console.warn('Cannot stop scanner:', e);
    } finally {
      setIsRunning(false);
      setScannerInstance(null);
      warningShown.current = false;
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
    }
  };

  const startScanner = () => {
    if (isRunning) return;

    const html5QrCode = new Html5Qrcode('qr-reader');
    setLoading(true);
    setError('');
    setScannedGuest(null);
    setAlreadyCheckedIn(false);
    warningShown.current = false;

    const isMobileDevice = isMobile();
    const config = {
      fps: 10,
      qrbox: isMobileDevice
        ? { width: 200, height: 200 }
        : { width: 300, height: 250 },
    };

    scanTimeoutRef.current = setTimeout(() => {
      if (!scannedGuest) {
        safeStopScanner(html5QrCode);
        setError('Tidak ada QR code terdeteksi');
      }
    }, 30000);

    html5QrCode
      .start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          clearTimeout(scanTimeoutRef.current);
          try {
            await handleScannedUrl(decodedText);
          } catch (e) {
            setError(e.message);
          } finally {
            await safeStopScanner(html5QrCode);
          }
        },
        (errorMessage) => {
          if (!warningShown.current) {
            console.warn('Scan warning:', errorMessage);
            warningShown.current = true;
          }
        }
      )
      .then(() => {
        setScannerInstance(html5QrCode);
        setIsRunning(true);
        setLoading(false);
      })
      .catch((err) => {
        setError('Gagal memulai scanner: ' + err.message);
        setLoading(false);
      });
  };

  const stopScanner = () => {
    if (scannerInstance) {
      safeStopScanner(scannerInstance);
    }
  };

  const handleScannedUrl = async (url) => {
    setLoading(true);
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
      setError('');
    } catch (err) {
      setError(err.message);
      if (err.message !== 'Anda sudah check-in sebelumnya') {
        setScannedGuest(null);
      }
    } finally {
      setLoading(false);
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
        <div
          id="qr-reader"
          className="w-full bg-gray-200 rounded-lg mb-2"
          style={{
            aspectRatio: '3 / 4',
            maxWidth: '400px',
            margin: '0 auto',
            border: '1px solid #ccc',
            overflow: 'hidden',
          }}
        />

        {!isRunning ? (
          <button
            onClick={startScanner}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Memulai...' : 'Start Scanner'}
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
          >
            Stop Scanner
          </button>
        )}
      </div>

      {error && (
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
    </div>
  );
}
