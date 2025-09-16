import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <span className="relative group">
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs
                       invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300
                       bg-slate-800 text-slate-100 text-sm rounded-md py-2 px-3 z-30 shadow-lg border border-slate-700
                       before:content-[''] before:absolute before:top-full before:left-1/2
                       before:-translate-x-1/2 before:border-8 before:border-b-0
                       before:border-transparent before:border-t-slate-800">
        {text}
      </span>
    </span>
  );
};

export default Tooltip;