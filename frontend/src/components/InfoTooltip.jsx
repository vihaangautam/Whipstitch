import React, { useState, useRef, useEffect } from 'react';

/**
 * Clean, human-friendly InfoTooltip hover button.
 * Avoids jargon; provides simple, practical guidance for sales reps.
 */
export default function InfoTooltip({
  title,
  content,
  criteria = [],
  position = 'top',
  align = 'center',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Alignment classes for the popover
  const alignmentClass =
    align === 'left'
      ? 'left-0 translate-x-0'
      : align === 'right'
      ? 'right-0 left-auto translate-x-0'
      : 'left-1/2 -translate-x-1/2';

  // Arrow alignment
  const arrowAlignmentClass =
    align === 'left'
      ? 'left-3 translate-x-0'
      : align === 'right'
      ? 'right-3 left-auto translate-x-0'
      : 'left-1/2 -translate-x-1/2';

  const positionClass =
    position === 'bottom'
      ? 'top-full mt-2'
      : 'bottom-full mb-2';

  return (
    <div
      className={`relative inline-flex items-center ml-1 z-30 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label="More information"
        className="w-4 h-4 rounded-full border border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-500 flex items-center justify-center text-[10px] font-bold transition cursor-pointer bg-white shadow-2xs focus:outline-none"
      >
        i
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className={`absolute ${positionClass} ${alignmentClass} w-72 sm:w-80 bg-white border border-slate-300 rounded-xl p-3.5 shadow-2xl z-50 text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Arrow Pointer Border */}
          <div
            className={`absolute ${
              position === 'bottom'
                ? 'bottom-full top-auto border-b-slate-300'
                : 'top-full border-t-slate-300'
            } ${arrowAlignmentClass} border-4 border-transparent`}
          />
          {/* Arrow Pointer Background */}
          <div
            className={`absolute ${
              position === 'bottom'
                ? 'bottom-full top-auto -mb-[1px] border-b-white'
                : 'top-full -mt-[1px] border-t-white'
            } ${arrowAlignmentClass} border-4 border-transparent`}
          />

          {title && (
            <div className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1.5 mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{title}</span>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed font-normal">{content}</p>

          {criteria && criteria.length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-slate-100 space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Key Criteria:
              </div>
              {criteria.map((c, i) => (
                <div key={i} className="text-[11px] text-slate-700 flex items-start gap-1">
                  <span className="text-emerald-600 font-bold shrink-0">•</span>
                  <span className="leading-tight">{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
