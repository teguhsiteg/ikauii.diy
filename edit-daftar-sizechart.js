const fs = require('fs');
let code = fs.readFileSync('app/run/daftar/page.tsx', 'utf8');

// Add state
const searchState = `const [modal, setModal] = useState({ isOpen: false, type: "info", title: "", message: "" });`;
const replaceState = `const [modal, setModal] = useState({ isOpen: false, type: "info", title: "", message: "" });
  const [showSizeChart, setShowSizeChart] = useState(false);`;
code = code.replace(searchState, replaceState);

// Add modal
const searchModalEnd = `      {/* MODAL */}`;
const replaceModalEnd = `      {/* MODAL SIZE CHART */}
      {showSizeChart && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSizeChart(false)}>
          <div className="bg-white rounded-xl p-2 max-w-lg w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowSizeChart(false)} className="absolute -top-3 -right-3 w-8 h-8 bg-white text-slate-800 rounded-full flex items-center justify-center font-bold shadow-md hover:bg-slate-100 z-10">?</button>
            <div className="overflow-hidden rounded-lg">
              {settings?.offlineSizeChartUrl ? (
                <img src={settings.offlineSizeChartUrl} alt="Size Chart" className="w-full h-auto object-contain" />
              ) : (
                <div className="p-8 text-center text-slate-500 font-medium">Image size chart belum ditambahkan oleh Admin.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}`;
code = code.replace(searchModalEnd, replaceModalEnd);

// Replace button onClick
const searchBtn = `<span className="text-[11px] text-[#1A73E8] font-bold cursor-pointer hover:underline">View Size Chart</span>`;
const replaceBtn = `<span onClick={() => setShowSizeChart(true)} className="text-[11px] text-[#1A73E8] font-bold cursor-pointer hover:underline">View Size Chart</span>`;
code = code.replace(searchBtn, replaceBtn);

fs.writeFileSync('app/run/daftar/page.tsx', code);
console.log("Updated daftar for size chart");
