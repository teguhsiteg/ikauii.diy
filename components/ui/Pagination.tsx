import React from "react";

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
}

export default function Pagination({
  totalItems,
  currentPage,
  itemsPerPage,
  setCurrentPage,
  setItemsPerPage,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="bg-[#F8F9FA] border-t border-[#DADCE0] px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600 font-medium">Tampilkan:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border border-[#DADCE0] rounded-lg text-sm px-3 py-1.5 bg-white outline-none focus:border-[#1A73E8]"
        >
          <option value={10}>10 Baris</option>
          <option value={20}>20 Baris</option>
          <option value={totalItems}>Semua Data</option>
        </select>
        <span className="text-sm text-slate-500 border-l border-[#DADCE0] pl-3">Total {totalItems} data</span>
      </div>
      {itemsPerPage < totalItems && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-[#DADCE0] rounded-md text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sebelumnya
          </button>
          <span className="text-sm font-medium text-slate-700 px-2">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage * itemsPerPage >= totalItems}
            className="px-3 py-1.5 border border-[#DADCE0] rounded-md text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
