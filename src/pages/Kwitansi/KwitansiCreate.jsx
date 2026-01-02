import React, { useState, useRef } from "react";

const KwitansiApp = () => {
  const [formData, setFormData] = useState({
    nomor: "0022/JAS/VII/2024",
    nama: "KON NANCY",
    alamat: "JL. GOTONG ROYONG I NO 23 A RT 004/006, GANDARIA UTARA, KEBAYORAN BARU, JAKARTA BARAT",
    jumlah: "IDR 716.800",
    terbilang: "Tujuh Ratus Enam Belas Ribu Delapan Ratus Rupiah",
    pembayaran: "PREMI SATU UNIT SEPEDA MOTOR\nHONDA ALL NEW VARIO 125 CBS\nNO POLISI : B 4063 SKY",
    tanggal: "Jakarta, 11 Juni 2024",
  });

  const [pdfName, setPdfName] = useState("");
  const receiptRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const downloadPDF = async () => {
    const button = document.querySelector('#downloadBtn');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Generating PDF...';

    try {
      const loadScript = (src) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };

      if (!window.jspdf) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      }

      if (!window.html2canvas) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const { jsPDF } = window.jspdf;
      const html2canvas = window.html2canvas;

      await new Promise(resolve => {
        const checkImages = () => {
          const img = document.querySelector('#pdf-header-image');
          const logo = document.querySelector('#pdf-stamp-image');
          if (img && img.complete && logo && logo.complete) {
            resolve();
          } else {
            setTimeout(checkImages, 100);
          }
        };
        checkImages();
      });

      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      const fileName = pdfName.trim() || `Kwitansi_${formData.nomor.replace(/\//g, '_')}`;
      pdf.save(`${fileName}.pdf`);

      button.textContent = originalText;
      button.disabled = false;
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Gagal membuat PDF: ' + error.message + '\n\nCoba refresh halaman dan coba lagi.');
      button.textContent = originalText;
      button.disabled = false;
    }
  };

  const ReceiptContent = ({ idPrefix = "" }) => (
    <div className="bg-white text-black font-serif" style={{ width: "210mm", minHeight: "297mm", padding: "40px 60px" }}>
      <div className="mb-12">
        <div className="flex justify-center items-center mb-8">
          <img
            id={`${idPrefix}header-image`}
            src="/header1.png"
            alt="PT. JAYAINDO ARTHA SUKSES"
            style={{ height: "150px", width: "auto" }} 
          />
        </div>

        <div className="flex justify-between items-start mt-12">
          <div className="flex-1"></div>
          <div className="flex-1 text-center">
            <h2 className="font-bold text-xl underline">KWITANSI</h2>
            <p className="italic text-xs mt-1">RECEIPT</p>
          </div>
          <div className="flex-1 text-right pt-2">
            <p className="text-xs font-semibold">No : {formData.nomor}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-4 text-sm">
        <div className="flex">
          <div className="w-48 flex-shrink-0">
            <div className="inline-block">
              <div className="font-semibold mb-1">Terima dari</div>
              <div className="font-normal italic text-xs border-t border-black pt-1">
                Received From
              </div>
            </div>
          </div>
          <div className="flex-1 flex">
            <span className="mr-2">:</span>
            <span className="flex-1">{formData.nama}</span>
          </div>
        </div>

        <div className="flex">
          <div className="w-48 flex-shrink-0">
            <div className="inline-block">
              <div className="font-semibold mb-1">Alamat</div>
              <div className="font-normal italic text-xs border-t border-black pt-1">
                Address
              </div>
            </div>
          </div>
          <div className="flex-1 flex">
            <span className="mr-2">:</span>
            <span className="flex-1">{formData.alamat}</span>
          </div>
        </div>

        <div className="flex">
          <div className="w-48 flex-shrink-0">
            <div className="inline-block">
              <div className="font-semibold mb-1">Jumlah uang sebesar</div>
              <div className="font-normal italic text-xs border-t border-black pt-1">
                The Sum of
              </div>
            </div>
          </div>
          <div className="flex-1 flex">
            <span className="mr-2">:</span>
            <div className="flex-1">
              <div className="font-semibold">{formData.jumlah}</div>
              <div className="mt-1">{formData.terbilang}</div>
            </div>
          </div>
        </div>

        <div className="flex mt-6">
          <div className="w-48 flex-shrink-0">
            <div className="inline-block">
              <div className="font-semibold mb-1">Untuk pembayaran</div>
              <div className="font-normal italic text-xs border-t border-black pt-1">
                Being payment of
              </div>
            </div>
          </div>
          <div className="flex-1 flex">
            <span className="mr-2">:</span>
            <pre className="whitespace-pre-wrap font-serif text-sm flex-1">{formData.pembayaran}</pre>
          </div>
        </div>
      </div>

      <div className="mt-32">
        <div className="text-right">
          <p className="text-sm mb-16">{formData.tanggal}</p>
          <div className="flex justify-end items-center">
            <img 
              id={`${idPrefix}stamp-image`}
              src="https://wellsource.sgp1.digitaloceanspaces.com/visual_novel/uploads/image/1760512384052-stamp1.png" 
              alt="Stamp"
              className="mr-4"
              style={{ height: '80px', width: 'auto', opacity: 0.7 }}
              crossOrigin="anonymous"
            />
          </div>
          <p className="text-sm mt-2">(Finance Department)</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ overflow: 'auto', height: '100vh' }}>
      <div className="py-8 px-4" style={{ background: 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)', minHeight: '100vh' }}>
        <div className="max-w-2xl mx-auto pb-8">
          <h1 className="text-3xl font-bold text-center mb-8" style={{ color: '#1f2937' }}>
            Kwitansi Receipt Generator
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#374151' }}>
              Input Data
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Nomor Kwitansi
                </label>
                <input
                  type="text"
                  name="nomor"
                  value={formData.nomor}
                  onChange={(e) => handleChange(e.target)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Nama Penerima
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={(e) => handleChange(e.target)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={(e) => handleChange(e.target)}
                  rows="3"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Jumlah Uang
                </label>
                <input
                  type="text"
                  name="jumlah"
                  value={formData.jumlah}
                  onChange={(e) => handleChange(e.target)}
                  placeholder="IDR 716.800"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Terbilang
                </label>
                <input
                  type="text"
                  name="terbilang"
                  value={formData.terbilang}
                  onChange={(e) => handleChange(e.target)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Untuk Pembayaran
                </label>
                <textarea
                  name="pembayaran"
                  value={formData.pembayaran}
                  onChange={(e) => handleChange(e.target)}
                  rows="4"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Tanggal & Tempat
                </label>
                <input
                  type="text"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={(e) => handleChange(e.target)}
                  placeholder="Jakarta, 11 Juni 2024"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                  Nama File PDF (optional)
                </label>
                <input
                  type="text"
                  value={pdfName}
                  onChange={(e) => setPdfName(e.target.value)}
                  placeholder="Kosongkan untuk nama otomatis"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex-1 font-semibold py-3 px-4 rounded-md transition shadow-md"
                  style={{ backgroundColor: '#10b981', color: 'white' }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                >
                  Preview
                </button>
                <button
                  id="downloadBtn"
                  onClick={downloadPDF}
                  className="flex-1 font-semibold py-3 px-4 rounded-md transition shadow-md"
                  style={{ backgroundColor: '#2563eb', color: 'white' }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>

          {showPreview && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto"
              onClick={() => setShowPreview(false)}
            >
              <div className="min-h-screen flex items-center justify-center p-4">
                <div 
                  className="bg-white rounded-lg shadow-2xl max-w-4xl w-full my-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10 rounded-t-lg">
                    <h3 className="text-xl font-semibold" style={{ color: '#374151' }}>Preview Kwitansi</h3>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-6 overflow-x-auto">
                    <ReceiptContent idPrefix="preview-" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <div ref={receiptRef}>
              <ReceiptContent idPrefix="pdf-" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KwitansiApp;