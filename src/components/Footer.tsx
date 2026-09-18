import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-amber-200/60 bg-white/80 backdrop-blur-md py-4 px-6 text-xs text-neutral-500 font-mono flex flex-col sm:flex-row justify-between items-center gap-2">
      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
        <span className="tnum font-semibold text-neutral-700">ACADEMICSYNC • SMART ATTENDANCE MANAGEMENT SYSTEM</span>
      </div>
      <div className="tnum">
        © 2026 Academic-Sync. Attendance Tracking & Predictive Forecasting.
      </div>
    </footer>
  );
};


