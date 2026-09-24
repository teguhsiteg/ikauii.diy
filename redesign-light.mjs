import fs from "fs";

const path = "app/virtual-run/register/page.tsx";
let content = fs.readFileSync(path, "utf-8");

const replacements = [
  // Container & Background
  {
    from: `className="min-h-screen bg-slate-50 font-sans selection:bg-yellow-400 selection:text-slate-950 flex flex-col relative antialiased"`,
    to: `className="min-h-screen bg-white font-sans selection:bg-blue-400 selection:text-white flex flex-col relative antialiased"`
  },
  {
    from: `className="bg-[#071324] pt-32 pb-28 px-4 sm:px-6 relative overflow-hidden border-b border-slate-800"`,
    to: `className="bg-white pt-24 pb-16 px-4 sm:px-6 relative overflow-hidden border-b border-slate-100"`
  },
  {
    from: `className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"`,
    to: `className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-50 to-white opacity-50 z-0"`
  },
  {
    from: `className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight leading-tight"`,
    to: `className="text-3xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight"`
  },
  {
    from: `className="text-slate-300 text-sm max-w-xl leading-relaxed"`,
    to: `className="text-slate-500 text-sm max-w-xl leading-relaxed"`
  },

  // Remove Cards, use subtle borders
  {
    from: /className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200"/g,
    to: `className="border-b border-slate-100 pb-10 mb-10"`
  },

  // Number bubbles (1, 2, 3) to minimalistic borders
  {
    from: `className="bg-blue-100 text-blue-700 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"`,
    to: `className="border border-slate-300 text-slate-500 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"`
  },
  {
    from: `className="bg-blue-100 text-blue-700 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"`,
    to: `className="border border-slate-300 text-slate-500 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"`
  },

  // Headers inside the form
  {
    from: /text-base font-black text-slate-800/g,
    to: `text-lg font-black text-slate-900`
  },

  // Tipe Peserta Toggles
  {
    from: `className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex gap-1"`,
    to: `className="bg-slate-100/50 p-1.5 rounded-xl flex gap-1"`
  },
  {
    from: /\? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"/g,
    to: `? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 font-bold" : "text-slate-500 hover:text-slate-700"`
  },

  // Inputs & Textareas
  {
    from: /className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800/g,
    to: `className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-sm transition-all text-slate-900 placeholder:text-slate-400`
  },
  {
    from: /className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/g,
    to: `className="w-full px-4 py-3 bg-blue-50/30 border border-blue-300 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10`
  },

  // Jarak Lari
  {
    from: /\? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"/g,
    to: `? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500 font-bold" : "border-slate-200 text-slate-500 hover:bg-slate-50"`
  },

  // Paket
  {
    from: /\? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 hover:bg-slate-50"/g,
    to: `? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm" : "border-slate-200 hover:bg-slate-50"`
  },
  {
    from: `className="w-5 h-5 text-blue-600 focus:ring-blue-500"`,
    to: `className="w-5 h-5 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"`
  },

  // Charity Card
  {
    from: `className="bg-gradient-to-br from-emerald-50 to-teal-50/30 rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100"`,
    to: `className="bg-emerald-50/30 rounded-3xl p-6 sm:p-8 border border-emerald-100"`
  },

  // Ringkasan Biaya Card (Make it a soft sidebar)
  {
    from: `className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200"`,
    to: `className="bg-slate-50/50 rounded-3xl p-6 sm:p-8 border border-slate-100"`
  }
];

for (let r of replacements) {
  content = content.replace(r.from, r.to);
}

fs.writeFileSync(path, content);
console.log("Light seamless redesign script applied.");
