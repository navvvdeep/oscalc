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

// Example main App component
function App() {
  const [activeTab, setActiveTab] = useState("tab1");
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [totpVerified, setTotpVerified] = React.useState(false);

  useEffect(() => {
    loadTranslations().then(setTranslations);
  }, []);

  if (!totpVerified) {
    return <TotpModal onSuccess={() => setTotpVerified(true)} />;
  }

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
            <div className="flex gap-4 mb-4">
              <button
                className={`px-4 py-2 rounded ${activeTab === "tab1" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                onClick={() => setActiveTab("tab1")}
              >
                {text.tab1}
              </button>
              <button
                className={`px-4 py-2 rounded ${activeTab === "tab2" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                onClick={() => setActiveTab("tab2")}
              >
                {text.tab2}
              </button>
              <button
                className={`px-4 py-2 rounded ${activeTab === "tab3" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                onClick={() => setActiveTab("tab3")}
              >
                Krutidev To Mangal
              </button>
            </div>
            <div style={{ marginTop: "3rem", textAlign: "center" }}>
              {/* Remove Vehicle Tax Calculator heading from tab 3 */}
              {activeTab !== "tab3" && <h1>{text.title}</h1>}
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
                    background: "transparent"
                  }}
                >
                  <iframe
                    src="index2.html"
                    title="Krutidev To Mangal"
                    style={{
                      width: "100%",
                      minWidth: 0,
                      maxWidth: "100vw",
                      minHeight: "60vh",
                      height: "80vh",
                      border: "none",
                      borderRadius: "0.75rem",
                      background: "#fff",
                      flex: 1,
                      boxSizing: "border-box"
                    }}
                    allowFullScreen
                  />
                </div>
              )}
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