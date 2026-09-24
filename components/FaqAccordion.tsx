"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  faqs: FAQ[];
  theme?: "light" | "dark";
}

export default function FaqAccordion({
  faqs,
  theme = "light",
}: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!faqs || faqs.length === 0) return null;

  const toggleOpen = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const isDark = theme === "dark";

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;

        return (
          <div
            key={faq.id}
            className={`
              overflow-hidden rounded-[20px] transition-all duration-300
              ${isDark 
                ? "bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-slate-900/50" 
                : "bg-white/60 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/70"
              }
            `}
          >
            <button
              onClick={() => toggleOpen(faq.id)}
              className={`
                w-full flex items-center justify-between p-5 md:p-6 text-left transition-colors focus:outline-none
                ${isOpen && (isDark ? "bg-white/5" : "bg-black/5")}
              `}
            >
              <h3
                className={`font-semibold text-[16px] md:text-[17px] leading-snug tracking-tight pr-4
                  ${isDark ? "text-white" : "text-slate-800"}
                `}
              >
                {faq.question}
              </h3>
              <div
                className={`
                  flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300
                  ${isOpen ? "rotate-180" : "rotate-0"}
                  ${isDark ? "bg-white/10 text-white" : "bg-black/5 text-slate-600"}
                `}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            <div
              className={`
                grid transition-[grid-template-rows,opacity] duration-300 ease-in-out
                ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
              `}
            >
              <div className="overflow-hidden">
                <div
                  className={`
                    p-5 md:p-6 pt-0 md:pt-0 text-[15px] leading-relaxed whitespace-pre-wrap
                    ${isDark ? "text-slate-300" : "text-slate-600"}
                  `}
                >
                  {faq.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
