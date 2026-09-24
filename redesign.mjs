import fs from "fs";

const path = "app/virtual-run/register/page.tsx";
let content = fs.readFileSync(path, "utf-8");

const replacements = [
  // Container & Background
  {
    from: `className="min-h-screen bg-slate-50 font-sans selection:bg-yellow-400 selection:text-slate-950 flex flex-col relative antialiased"`,
    to: `className="min-h-screen bg-[#050B14] font-sans selection:bg-emerald-400 selection:text-[#050B14] flex flex-col relative antialiased text-slate-200"`
  },
  {
    from: `className="bg-[#071324] pt-32 pb-28 px-4 sm:px-6 relative overflow-hidden border-b border-slate-800"`,
    to: `className="bg-transparent pt-32 pb-28 px-4 sm:px-6 relative overflow-hidden border-b border-white/5"`
  },
  {
    from: `className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"`,
    to: `className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-emerald-900/10 to-[#050B14] opacity-50 z-0"`
  },
  {
    from: `className="text-slate-300 text-sm max-w-xl leading-relaxed"`,
    to: `className="text-slate-400 text-sm max-w-xl leading-relaxed font-medium"`
  },

  // Number bubbles (1, 2, 3)
  {
    from: `className="bg-blue-100 text-blue-700 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"`,
    to: `className="bg-emerald-500/20 text-emerald-400 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-[0_0_10px_rgba(16,185,129,0.3)]"`
  },
  {
    from: `className="bg-blue-100 text-blue-700 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"`,
    to: `className="bg-emerald-500/20 text-emerald-400 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-[0_0_10px_rgba(16,185,129,0.3)]"`
  },

  // Cards
  {
    from: /className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200"/g,
    to: `className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 relative overflow-hidden"`
  },
  {
    from: /text-slate-800/g,
    to: `text-white`
  },
  {
    from: /text-slate-500/g,
    to: `text-slate-400`
  },
  {
    from: /border-slate-100/g,
    to: `border-white/10`
  },
  
  // Tipe Peserta Toggles
  {
    from: `className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex gap-1"`,
    to: `className="bg-black/40 p-1.5 rounded-xl border border-white/5 flex gap-1 shadow-inner"`
  },
  {
    from: /\? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"/g,
    to: `? "bg-emerald-500 text-[#050B14] shadow-lg shadow-emerald-500/30" : "text-slate-400 hover:text-white"`
  },

  // Inputs & Textareas
  {
    from: /className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800/g,
    to: `className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white/5 outline-none text-sm transition-all text-white placeholder:text-slate-600 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)]`
  },
  {
    from: /className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/g,
    to: `className="w-full px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500`
  },

  // Jarak Lari
  {
    from: /\? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"/g,
    to: `? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500" : "border-white/10 text-slate-400 hover:bg-white/5 hover:text-white hover:border-white/30"`
  },

  // Paket
  {
    from: /\? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 hover:bg-slate-50"/g,
    to: `? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "border-white/10 hover:bg-white/5 hover:border-white/30"`
  },
  {
    from: `className="w-5 h-5 text-blue-600 focus:ring-blue-500"`,
    to: `className="w-5 h-5 text-emerald-500 focus:ring-emerald-500 bg-black/50 border-white/20"`
  },

  // Pengiriman details
  {
    from: `className="bg-slate-50 p-5 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 space-y-5"`,
    to: `className="bg-black/30 p-5 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-4 space-y-5 shadow-inner"`
  },
  {
    from: `className="w-5 h-5 text-slate-700"`,
    to: `className="w-5 h-5 text-emerald-400"`
  },
  {
    from: `className="w-full sm:w-1/3 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all font-bold text-slate-800 cursor-pointer"`,
    to: `className="w-full sm:w-1/3 px-4 py-3 bg-[#0F172A] border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all font-bold text-white cursor-pointer hover:border-white/30"`
  },
  
  // Select styling needs darker bg so options don't hide
  {
    from: /bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800 font-bold/g,
    to: `bg-[#0F172A] border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all text-white font-bold`
  },
  {
    from: /disabled:bg-slate-100/g,
    to: `disabled:bg-[#0F172A]/50 disabled:text-slate-500 disabled:border-white/5 disabled:cursor-not-allowed`
  },

  // Charity Card
  {
    from: `className="bg-gradient-to-br from-emerald-50 to-teal-50/30 rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100"`,
    to: `className="bg-gradient-to-br from-emerald-900/40 to-[#050B14] rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/30 relative overflow-hidden backdrop-blur-2xl"`
  },
  {
    from: `className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100"`,
    to: `className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-500/30"`
  },
  {
    from: /text-emerald-900/g,
    to: `text-white`
  },
  {
    from: /text-emerald-700/g,
    to: `text-emerald-400`
  },
  {
    from: `className="flex items-center gap-3 bg-white p-4 rounded-xl border border-emerald-200 mb-3 hover:shadow-md transition-shadow"`,
    to: `className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-emerald-500/20 mb-3 hover:border-emerald-500/50 transition-colors shadow-inner"`
  },
  {
    from: `className="w-full pl-12 pr-4 py-3 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white font-black text-base transition-all font-mono shadow-inner"`,
    to: `className="w-full pl-12 pr-4 py-3 bg-black/60 border border-emerald-500/30 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-400 font-black text-base transition-all font-mono shadow-inner focus:shadow-[0_0_20px_rgba(16,185,129,0.2)]"`
  },

  // Agreement Boxes
  {
    from: `className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto custom-scrollbar"`,
    to: `className="bg-black/30 border border-white/5 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto custom-scrollbar shadow-inner"`
  },
  {
    from: `text-slate-700`,
    to: `text-slate-300`
  },
  {
    from: /text-slate-600/g,
    to: `text-slate-400`
  },
  {
    from: `bg-slate-50 p-4 rounded-xl border border-slate-200 hover:bg-slate-100`,
    to: `bg-black/30 p-4 rounded-xl border border-white/5 hover:border-white/20`
  },
  {
    from: `text-[#1A73E8]`,
    to: `text-emerald-400`
  },
  {
    from: `focus:ring-[#1A73E8]`,
    to: `focus:ring-emerald-500 bg-black/50 border-white/20`
  },
  {
    from: `bg-[#e6f4ea]/50 p-4 rounded-xl border border-[#ceead6] hover:bg-[#e6f4ea]`,
    to: `bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20`
  },
  {
    from: `text-[#137333]`,
    to: `text-emerald-300`
  },
  {
    from: `bg-rose-50 p-4 rounded-xl border border-rose-200 hover:bg-rose-100`,
    to: `bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 hover:bg-rose-500/20`
  },
  {
    from: `text-rose-900`,
    to: `text-rose-200`
  },
  {
    from: `border-rose-300`,
    to: `border-rose-500/30 bg-black/50`
  },

  // Ringkasan Biaya Card
  {
    from: `className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200"`,
    to: `className="bg-gradient-to-b from-white/10 to-transparent backdrop-blur-3xl rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden"`
  },
  {
    from: `text-blue-700`,
    to: `text-white`
  },
  {
    from: `className="w-full bg-[#1A73E8] hover:bg-[#1557b0] text-white font-black py-4 rounded-2xl text-sm transition-all shadow-lg shadow-blue-600/30 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"`,
    to: `className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#050B14] font-black py-4 rounded-2xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"`
  },
  {
    from: `text-blue-300`,
    to: `text-emerald-900`
  },
  {
    from: `bg-emerald-50 p-2.5 -mx-2.5 rounded-lg border border-emerald-100/50`,
    to: `bg-emerald-500/10 p-2.5 -mx-2.5 rounded-lg border border-emerald-500/20`
  },
  {
    from: `text-blue-500`,
    to: `text-emerald-400`
  }
];

for (let r of replacements) {
  content = content.replace(r.from, r.to);
}

fs.writeFileSync(path, content);
console.log("Redesign script applied.");
