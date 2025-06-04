var gk_isXlsx = false;
var gk_xlsxFileLookup = {};
var gk_fileData = {};

function filledCell(cell) {
  return cell !== '' && cell != null;
}

function loadFileData(filename) {
  if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
    try {
      var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
      var firstSheetName = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[firstSheetName];
      var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
      var filteredData = jsonData.filter(row => row.some(filledCell));
      var headerRowIndex = filteredData.findIndex((row, index) =>
        row.filter(filledCell).length >= filteredData[index + 1]?.filter(filledCell).length
      );
      if (headerRowIndex === -1 || headerRowIndex > 25) {
        headerRowIndex = 0;
      }
      var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex));
      csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
      return csv;
    } catch (e) {
      console.error(e);
      return "";
    }
  }
  return gk_fileData[filename] || "";
}

async function loadTranslations() {
  const response = await fetch('prop.txt');
  const text = await response.text();
  const lines = text.split('\n');
  const translations = {};
  let currentLang = null;
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('[') && line.endsWith(']')) {
      currentLang = line.slice(1, -1);
      translations[currentLang] = {};
    } else if (currentLang && line.includes('=')) {
      const [key, ...rest] = line.split('=');
      translations[currentLang][key.trim()] = rest.join('=').trim();
    }
  }
  return translations;
}

const { useState, useEffect } = React;

const autoSetTaxRate = (vehicle, price, ac) => {
  if (vehicle === "M-Cycle/Scooter") {
    return price < 40000 ? 7 : 10;
  } else if (vehicle === "CAR") {
    if (price > 1000000) return 11;
    return ac ? 9 : 8;
  }
  return 0;
};

const calculateRebate = (tax, regDate) => {
  const today = dayjs();
  const diffDays = today.diff(regDate, 'day');
  const diffYear = Math.floor(diffDays / 365) - (regDate.month() === today.month() ? 1 : 0);
  return tax * (Math.max(diffYear, 0) * 0.05);
};

const Tab1 = ({ text }) => {
  const [vehicle, setVehicle] = useState("M-Cycle/Scooter");
  const [ac, setAc] = useState(false);
  const [price, setPrice] = useState("");
  const [regDate, setRegDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [nocDate, setNocDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [results, setResults] = useState({
    taxRate: 0,
    tax: 0,
    rebate: 0,
    fine: 0,
    fee: 0,
    total: 0,
  });

  useEffect(() => {
    if (vehicle === "CAR" && parseFloat(price) <= 1000000) {
      // AC checkbox enabled
    } else {
      setAc(false);
    }
  }, [vehicle, price]);

  const calculate = () => {
    try {
      const priceVal = parseFloat(price);
      const reg = dayjs(regDate);
      const noc = dayjs(nocDate);
      const today = dayjs();

      const taxRate = autoSetTaxRate(vehicle, priceVal, ac);
      const tax = Math.ceil(priceVal * taxRate / 100);

      const diffDays = today.diff(reg, 'day');
      const diffYear = Math.floor(diffDays / 365) - (reg.month() === today.month() ? 1 : 0);
      const nocPlus45 = noc.add(45, 'day');
      let lateMonth = 0;

      if (today.isAfter(nocPlus45)) {
        lateMonth = today.startOf('month').diff(noc.startOf('month'), 'month') + 1;
      }

      let rebate = lateMonth > 19 ? tax * 0.4 : tax * (Math.max(diffYear, 0) * 0.05);
      let fine = lateMonth > 19 ? tax * 0.6 : (tax - rebate) * (lateMonth * 0.05);
      const fee = vehicle === "M-Cycle/Scooter" ? 450 : 900;
      const total = tax + fine - rebate + fee;

      setResults({ taxRate, tax, rebate, fine, fee, total });
    } catch {
      alert("Please enter a valid price.");
    }
  };

  const reset = () => {
    setVehicle("M-Cycle/Scooter");
    setAc(false);
    setPrice("");
    setRegDate(dayjs().format("YYYY-MM-DD"));
    setNocDate(dayjs().format("YYYY-MM-DD"));
    setResults({ taxRate: 0, tax: 0, rebate: 0, fine: 0, fee: 0, total: 0 });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-blue-800 mb-4 text-center">{text.tab1Title}</h2>
      <div className="bg-white p-4 rounded shadow text-left">
        <label className="block mb-2">{text.vehicleType}</label>
        <select
          className="w-full p-2 border rounded"
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
        >
          <option>{text.mcycle}</option>
          <option>{text.car}</option>
        </select>

        <label className="block mt-4">
          <input
            type="checkbox"
            checked={ac}
            onChange={(e) => setAc(e.target.checked)}
            disabled={vehicle !== text.car || parseFloat(price) > 1000000}
          /> {text.acFitted}
        </label>

        <label className="block mt-4">{text.price}</label>
        <input
          type="number"
          className="w-full p-2 border rounded"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <label className="block mt-4">{text.regDate}</label>
        <input
          type="date"
          className="w-full p-2 border rounded"
          value={regDate}
          onChange={(e) => setRegDate(e.target.value)}
        />

        <label className="block mt-4">{text.nocDate}</label>
        <input
          type="date"
          className="w-full p-2 border rounded"
          value={nocDate}
          onChange={(e) => setNocDate(e.target.value)}
        />

        <div className="flex gap-4 mt-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={calculate}
          >
            {text.calculate}
          </button>
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            onClick={reset}
          >
            {text.reset}
          </button>
        </div>
      </div>

      <div className="bg-white p-4 mt-4 rounded shadow text-left">
        <p>{text.taxRate}: {results.taxRate}%</p>
        <p>{text.tax}: ₹{results.tax.toFixed(2)}</p>
        <p>{text.rebate}: ₹{results.rebate.toFixed(2)}</p>
        <p>{text.fine}: ₹{results.fine.toFixed(2)}</p>
        <p>{text.fee}: ₹{results.fee.toFixed(2)}</p>
        <p className="text-green-600 font-bold">{text.total}: ₹{results.total.toFixed(2)}</p>
      </div>
    </div>
  );
};

const Tab2 = ({ text }) => {
  const [vehicle, setVehicle] = useState("Motor/Maxi Cab to CAR");
  const [ac, setAc] = useState(false);
  const [sale, setSale] = useState("");
  const [regDate, setRegDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [results, setResults] = useState({ tax: 0, rebate: 0, total: 0 });

  useEffect(() => {
    if (parseFloat(sale) > 1000000) {
      setAc(false);
    }
  }, [sale]);

  const calculateConversion = () => {
    try {
      const price = parseFloat(sale);
      const reg = dayjs(regDate);

      const taxRate = autoSetTaxRate("CAR", price, ac);
      const tax = Math.ceil(price * taxRate / 100);
      const rebate = calculateRebate(tax, reg);
      const total = tax - rebate;

      setResults({ tax, rebate, total });
    } catch {
      alert("Please enter valid numbers.");
    }
  };

  const reset = () => {
    setVehicle("Motor/Maxi Cab to CAR");
    setAc(false);
    setSale("");
    setRegDate(dayjs().format("YYYY-MM-DD"));
    setResults({ tax: 0, rebate: 0, total: 0 });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-blue-800 mb-4 text-left">{text.tab2Title}</h2>
      <div className="bg-white p-4 rounded shadow text-center">
        <label className="block mb-2">{text.vehicleType}</label>
        <select
          className="w-full p-2 border rounded"
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
        >
          <option>{text.mcycle}</option>
          <option>{text.car}</option>
        </select>

        <label className="block mt-4">
          <input
            type="checkbox"
            checked={ac}
            onChange={(e) => setAc(e.target.checked)}
            disabled={vehicle !== text.car || parseFloat(sale) > 1000000}
          /> {text.acFitted}
        </label>

        <label className="block mt-4">{text.saleAmount}</label>
        <input
          type="number"
          className="w-full p-2 border rounded"
          value={sale}
          onChange={(e) => setSale(e.target.value)}
        />

        <label className="block mt-4">{text.regDate}</label>
        <input
          type="date"
          className="w-full p-2 border rounded"
          value={regDate}
          onChange={(e) => setRegDate(e.target.value)}
        />

        <div className="flex gap-4 mt-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={calculateConversion}
          >
            {text.calculate}
          </button>
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            onClick={reset}
          >
            {text.reset}
          </button>
        </div>
      </div>

      <div className="bg-white p-4 mt-4 rounded shadow text-left">
        <p>{text.tax}: ₹{results.tax.toFixed(2)}</p>
        <p>{text.rebate}: ₹{results.rebate.toFixed(2)}</p>
        <p className="text-green-600 font-bold">{text.total}: ₹{results.total.toFixed(2)}</p>
      </div>
    </div>
  );
};

function Login({ onLogin, text }) {
  const [mobile, setMobile] = React.useState('');
  const [error, setError] = React.useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (/^\d{10}$/.test(mobile)) {
      setError('');
      onLogin(mobile);
    } else {
      setError(text.invalidMobile || "Please enter a valid 10-digit mobile number.");
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-sm mx-auto mt-12">
      <h2 className="text-xl font-bold mb-4 text-left">{text.loginTitle || "Login"}</h2>
      <form onSubmit={handleLogin}>
        <label className="block mb-2 text-left">{text.mobileLabel || "Mobile Number"}:</label>
        <input
          type="tel"
          className="w-full p-2 border rounded mb-2"
          value={mobile}
          onChange={e => setMobile(e.target.value)}
          placeholder={text.mobilePlaceholder || "Enter mobile number"}
        />
        {error && <div className="text-red-600 mb-2 text-left">{error}</div>}
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
        >
          {text.loginBtn || "Login"}
        </button>
      </form>
    </div>
  );
}

function LanguageSwitcher({ language, setLanguage }) {
  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => setLanguage('en')}
      >
        ENG
      </button>
      <button
        class={`lang-btn ${language === 'hi' ? 'active' : ''}`}
        onClick={() => setLanguage('hi')}
      >
        हिन्दी
      </button>
    </div>
  );
}

function Clock() {
  const [now, setNow] = React.useState(dayjs());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="clock">
      {now.format('DD-MM-YYYY HH:mm:ss')}
    </div>
  )
}

function DisclaimerModal({ text, onAgree, onDecline }) {
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 99999,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          maxWidth: "95vw",
          width: 400,
          padding: "2rem",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          textAlign: "left"
        }}
      >
        <h2 style={{ fontWeight: "bold", fontSize: "1.2em", marginBottom: "1rem", color: "#b91c1c" }}>
          {text.disclaimerTitle || "Disclaimer"}
        </h2>
        <div style={{ marginBottom: "1.5rem", whiteSpace: "pre-line", color: "#333" }}>
          {text.disclaimerText || "The purpose of this website is solely for testing purposes. Any calculations performed on this website are not related to real-life calculations or those conducted by any government or official authority. This website is created solely for the assistance and information of users. This calculator will compute the road tax for vehicles registered from different states, which is only an estimated calculation."}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <button
            onClick={onDecline}
            style={{
              background: "#e5e7eb",
              color: "#222",
              border: "none",
              borderRadius: "4px",
              padding: "8px 18px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            {text.declineBtn || "Decline"}
          </button>
          <button
            onClick={onAgree}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "8px 18px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            {text.agreeBtn || "I Agree"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleFormBox({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        maxWidth: "100vw",
        zIndex: 999,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none"
      }}
    >
      <div
        style={{
          width: 320,
          maxWidth: "98vw",
          margin: 8,
          pointerEvents: "auto",
          position: "relative"
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            background: "#e5e7eb",
            border: "none",
            borderRadius: "50%",
            width: 28,
            height: 28,
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 2
          }}
          aria-label="Close"
        >×</button>
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSdb38qvE7gXz1ldAW83nZ-UVFzDAx8B3TeS1blwW8l217ru-A/viewform?embedded=true"
          width="100%"
          height="220"
          frameBorder="0"
          marginHeight="0"
          marginWidth="0"
          style={{
            borderRadius: "10px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
            background: "#fff",
            display: "block"
          }}
          allow="autoplay"
          title="Comment Form"
        >
          Loading…
        </iframe>
      </div>
    </div>
  );
}

// Add this TOTP modal before your App component
function TotpModal({ onSuccess }) {
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://oscalc.onrender.com/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code })
      });
      const text = await res.text();
      if (text.trim().toLowerCase().startsWith("ok")) {
        onSuccess();
      } else if (text.toLowerCase().includes("invalid")) {
        setError("Invalid code. Try again.");
      } else {
        setError("Verification failed.");
      }
    } catch {
      setError("Server error. Try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", zIndex: 100001, top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <form onSubmit={handleSubmit} style={{
        background: "#fff", borderRadius: "16px", width: 340, padding: "2.5rem 2rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)", textAlign: "center", position: "relative"
      }}>
        <h2 style={{ fontWeight: "bold", fontSize: "1.3em", marginBottom: "1.2rem", color: "#2563eb" }}>
          🔒 TOTP Authentication
        </h2>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter 6-digit code"
          style={{
            width: "100%", padding: "12px", fontSize: "1.1em", borderRadius: "6px",
            border: "1px solid #bbb", marginBottom: "1.2rem", outline: "none"
          }}
          maxLength={6}
          autoFocus
          disabled={loading}
        />
        {error && <div style={{ color: "#b91c1c", marginBottom: "1rem" }}>{error}</div>}
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          style={{
            background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px",
            padding: "10px 0", fontWeight: "bold", fontSize: "1.1em", width: "100%",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
}

// Tab6: Images to PDF (browser-based, A4 size)
function Tab6ImagesToPdf() {
  const [files, setFiles] = React.useState([]);
  const [processing, setProcessing] = React.useState(false);

  // Load pdf-lib from CDN if not already loaded
  React.useEffect(() => {
    if (!window.PDFLib) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/pdf-lib/dist/pdf-lib.min.js";
      script.onload = () => {};
      document.body.appendChild(script);
    }
  }, []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const mergeImagesToPdf = async () => {
    if (!window.PDFLib) {
      alert("Loading PDF engine, please wait a moment and try again.");
      return;
    }
    if (!files.length) {
      alert("Please select image(s) first!");
      return;
    }
    setProcessing(true);
    try {
      const pdfDoc = await window.PDFLib.PDFDocument.create();
      const a4Width = 595.28, a4Height = 841.89; // A4 in points

      for (let file of files) {
        const imgBytes = await file.arrayBuffer();
        let img, dims;
        if (file.type === "image/png") {
          img = await pdfDoc.embedPng(imgBytes);
        } else {
          img = await pdfDoc.embedJpg(imgBytes);
        }
        dims = img.scale(1);

        // Fit image inside A4, keep aspect ratio
        let scale = Math.min(a4Width / dims.width, a4Height / dims.height, 1);
        let imgW = dims.width * scale;
        let imgH = dims.height * scale;
        let x = (a4Width - imgW) / 2;
        let y = (a4Height - imgH) / 2;

        const page = pdfDoc.addPage([a4Width, a4Height]);
        page.drawImage(img, { x, y, width: imgW, height: imgH });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "images_merged.pdf";
      a.click();
    } catch (e) {
      alert("Failed to create PDF: " + e.message);
    }
    setProcessing(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-blue-800 mb-4 text-center">
        Images to PDF (A4)
      </h2>
      <div className="bg-white p-4 rounded shadow flex flex-col items-center gap-4">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={processing}
        />
        <div>
          {files.length > 0 && (
            <div style={{ fontSize: "0.98em", color: "#2563eb" }}>
              {files.length} image(s) selected
            </div>
          )}
        </div>
        <button
          className="bg-green-500 text-white px-6 py-2 rounded font-bold hover:bg-green-600"
          onClick={mergeImagesToPdf}
          disabled={processing || !files.length}
        >
          {processing ? "Processing..." : "Merge & Download PDF"}
        </button>
      </div>
      <div className="mt-4 text-gray-500 text-sm text-center">
        Each image will be placed on a new A4 page, centered and scaled to fit.
      </div>
    </div>
  );
}

function Tab6PdfToImages() {
  const [images, setImages] = React.useState([]);
  const [processing, setProcessing] = React.useState(false);

  // Dynamically load JSZip if not present
  React.useEffect(() => {
    if (!window.JSZip) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
      document.body.appendChild(script);
    }
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProcessing(true);
    setImages([]);
    const fileReader = new FileReader();
    fileReader.onload = async function() {
      const typedarray = new Uint8Array(this.result);
      const pdf = await window.pdfjsLib.getDocument({ data: typedarray }).promise;
      const imgs = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 }); // Small thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
        imgs.push(canvas.toDataURL("image/png"));
      }
      setImages(imgs);
      setProcessing(false);
    };
    fileReader.readAsArrayBuffer(file);
  };

  const handleDownloadZip = async () => {
    if (!window.JSZip) {
      alert("Loading ZIP engine, please wait a moment and try again.");
      return;
    }
    const zip = new window.JSZip();
    images.forEach((img, idx) => {
      // Remove data URL header for base64
      zip.file(`page${idx + 1}.png`, img.split(',')[1], { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pdf_images.zip";
    a.click();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
      <h2 style={{ color: "#2563eb", marginBottom: 16 }}>PDF to Images</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {processing && <div style={{ margin: 16 }}>Processing...</div>}
      {images.length > 0 && (
        <div style={{ margin: "16px 0" }}>
          <button
            onClick={handleDownloadZip}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "8px 18px",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: 12
            }}
          >
            Download All as ZIP
          </button>
        </div>
      )}
      <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 16 }}>
        {images.map((img, idx) => (
          <div key={idx} style={{ width: 90, textAlign: "center" }}>
            <img
              src={img}
              alt={`Page ${idx + 1}`}
              style={{
                width: 80,
                height: 100,
                objectFit: "cover",
                border: "1px solid #b6cbe7",
                borderRadius: 4,
                background: "#fafdff",
                display: "block",
                margin: "0 auto"
              }}
            />
            <a
              href={img}
              download={`page${idx + 1}.png`}
              style={{
                display: "block",
                marginTop: 6,
                color: "#2563eb",
                fontSize: "0.95em",
                textDecoration: "underline"
              }}
            >
              Download
            </a>
            <div style={{ fontSize: "0.85em", color: "#374151" }}>Page {idx + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("tab1");
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  // const [totpVerified, setTotpVerified] = React.useState(false); // <-- Disable TOTP

  useEffect(() => {
    loadTranslations().then(setTranslations);
  }, []);

  // --- Disable TOTP check ---
  // if (!totpVerified) {
  //   return <TotpModal onSuccess={() => setTotpVerified(true)} />;
  // }

  if (!translations) {
    return <div>Loading...</div>;
  }

  const text = translations[language];

  const handleAgree = () => {
    setShowDisclaimer(false);
  };

  const handleDecline = () => {
    window.location.href = "https://google.co.in";
  };

  return (
    <>
      {showDisclaimer && (
        <DisclaimerModal
          text={text}
          onAgree={handleAgree}
          onDecline={handleDecline}
        />
      )}
      {!showDisclaimer && (
        <>
          <div className="max-w-2xl mx-auto p-4">
            <div className="top-bar">
              <LanguageSwitcher language={language} setLanguage={setLanguage} />
              <Clock />
            </div>
            <div className="ribbon-tabs">
              <button
                className={`ribbon-tab-btn${activeTab === "tab1" ? " active" : ""}`}
                onClick={() => setActiveTab("tab1")}
              >
                {text.tab1}
              </button>
              <button
                className={`ribbon-tab-btn${activeTab === "tab2" ? " active" : ""}`}
                onClick={() => setActiveTab("tab2")}
              >
                {text.tab2}
              </button>
              <button
                className={`ribbon-tab-btn${activeTab === "tab3" ? " active" : ""}`}
                onClick={() => setActiveTab("tab3")}
              >
                Krutidev To Mangal
              </button>
              <button
                className={`ribbon-tab-btn${activeTab === "tab4" ? " active" : ""}`}
                onClick={() => setActiveTab("tab4")}
              >
                PDF Compressor / Image to PDF
              </button>
              <button
                className={`ribbon-tab-btn${activeTab === "tab5" ? " active" : ""}`}
                onClick={() => setActiveTab("tab5")}
              >
                Image Compressor/Resizer
              </button>
              <button
                className={`ribbon-tab-btn${activeTab === "tab6" ? " active" : ""}`}
                onClick={() => setActiveTab("tab6")}
              >
                PDF to Images
              </button>
            </div>
            <div style={{ marginTop: "3rem", textAlign: "center" }}>
              {/* Remove Vehicle Tax Calculator heading from tab 3, 4, 5, 6 */}
              {activeTab !== "tab3" && activeTab !== "tab4" && activeTab !== "tab5" && activeTab !== "tab6" && <h1>{text.title}</h1>}
              {activeTab === "tab1" && <Tab1 text={text} />}
              {activeTab === "tab2" && <Tab2 text={text} />}
              {activeTab === "tab3" && (
                <div
                  style={{
                    width: "100%",
                    maxWidth: "100vw",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    background: "transparent",
                    minHeight: "60vh"
                  }}
                >
                  <div style={{
                    width: "100%",
                    maxWidth: 900,
                    minHeight: "160vh",
                    height: "115vh",
                    background: "#fff",
                    borderRadius: "0.75rem",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}>
                    <iframe
                      src="kruti.html"
                      title="Krutidev To Mangal"
                      style={{
                        width: "100%",
                        maxWidth: "100vw",
                        height: "200%",
                        maxHeight: "200vh",
                        display: "flex",
                        border: "none",
                        background: "#fff",
                        flex: 1,
                        minHeight: 400,
                      }}
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              {activeTab === "tab4" && (
                <div
                  style={{
                    width: "100%",
                    maxWidth: "100vw",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    background: "transparent",
                    minHeight: "60vh"
                  }}
                >
                  <div style={{
                    width: "100%",
                    maxWidth: 900,
                    minHeight: "50vh",
                    height: "100vh",
                    background: "#fff",
                    borderRadius: "0.75rem",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                  }}>
                    <iframe
                      src="pdf.html"
                      title="PDF Compressor/Image to PDF"
                      style={{
                        width: "100%",
                        maxWidth: "100vw",
                        height: "200%",
                        maxHeight: "1000vh",
                        display: "flex",
                        border: "none",
                        background: "#fff",
                        flex: 1,
                        minHeight: 500,
                        overflow: "hidden",
                        scrollbarWidth: "5px"
                      }}
                      scrolling="yes"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              {activeTab === "tab5" && (
                <div
                  style={{
                    width: "100%",
                    maxWidth: "100vw",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    background: "transparent",
                    minHeight: "60vh"
                  }}
                >
                  <div style={{
                    width: "100%",
                    maxWidth: 900,
                    minHeight: "100vh",
                    height: "100vh",
                    background: "#fff",
                    borderRadius: "0.75rem",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                  }}>
                    <iframe
                      src="image.html"
                      title="Image Compressor/Resizer"
                      style={{
                        width: "100%",
                        maxWidth: "100vw",
                        height: "100%",
                        maxHeight: "100vh",
                        display: "flex",
                        border: "none",
                        background: "#fff",
                        flex: 1,
                        minHeight: 400,
                        overflow: "hidden",
                        scrollbarWidth: "5px"
                        
                      }}
                      scrolling="yes"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              {activeTab === "tab6" && <Tab6PdfToImages />}
            </div>
          </div>
          {/* Feedback Button */}
          <button
            onClick={() => setShowFeedback(true)}
            style={{
              position: "fixed",
              bottom: 20,
              left: 20,
              zIndex: 1000,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "24px",
              padding: "10px 22px",
              fontWeight: "bold",
              fontSize: "1em",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              cursor: "pointer"
            }}
          >
            Feedback
          </button>
          <GoogleFormBox open={showFeedback} onClose={() => setShowFeedback(false)} />
        </>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);