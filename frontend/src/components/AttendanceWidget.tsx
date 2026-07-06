import React, { useState, useEffect } from 'react';

export type AttendanceStatusType = 'CHECKED_IN' | 'CHECKED_OUT' | null;

interface AttendanceWidgetProps {
  status: AttendanceStatusType;
  checkInTime: string | null;
  checkOutTime: string | null;
  workingHours: string;
  shiftName: string;
  nowTime?: Date | string | number;
  onCheckIn: () => void;
  onCheckOut: () => void;
  isActionLoading?: boolean;
}

export const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({
  status,
  checkInTime,
  checkOutTime,
  workingHours,
  shiftName,
  nowTime,
  onCheckIn,
  onCheckOut,
  isActionLoading = false,
}) => {
  // Local live ticker state if nowTime is not passed
  const [localTime, setLocalTime] = useState<Date>(() => new Date());

  useEffect(() => {
    if (nowTime !== undefined) return;
    const interval = setInterval(() => {
      setLocalTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [nowTime]);

  const activeTimeSource = nowTime !== undefined ? new Date(nowTime) : localTime;

  // Format Date (e.g., "06 July 2026")
  const formattedDate = activeTimeSource.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Format Time (e.g., "09:45 AM")
  const formattedTime = activeTimeSource.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Determine status indicators
  let statusBadge = (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200">
      ⚪ Not Checked In
    </span>
  );
  let sideBarColor = 'bg-slate-300';

  if (status === 'CHECKED_IN') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
        🟢 On Duty
      </span>
    );
    sideBarColor = 'bg-emerald-600';
  } else if (status === 'CHECKED_OUT') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200">
        🔵 Shift Completed
      </span>
    );
    sideBarColor = 'bg-blue-600';
  }

  // Parse shift name to keep it compact (e.g. "Morning Shift (09:00 AM – 06:00 PM)" -> "Morning")
  const getShortShiftName = (fullShift: string) => {
    if (!fullShift) return 'Morning';
    const parts = fullShift.split('(');
    return parts[0].replace('Shift', '').trim();
  };

  return (
    <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs w-full relative overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 min-h-[64px] text-left">
      {/* Decorative vertical bar representing duty status */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${sideBarColor}`} />

      {/* 1. Date, Time & Status badge */}
      <div className="flex items-center gap-4 shrink-0 flex-wrap sm:flex-nowrap">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-800 tracking-tight">{formattedDate}</span>
          <span className="text-[11px] font-mono text-slate-400 font-semibold mt-0.5">{formattedTime}</span>
        </div>
        <div>{statusBadge}</div>
      </div>

      {/* 2. Horizontal Metrics block */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 flex-1 max-w-2xl">
        <div className="flex flex-col justify-center">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Check-In</span>
          <span className="text-xs font-bold text-slate-800 mt-0.5">{checkInTime || '--:--'}</span>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Check-Out</span>
          <span className="text-xs font-bold text-slate-800 mt-0.5">
            {status === 'CHECKED_IN' ? 'Pending' : (checkOutTime || '--:--')}
          </span>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Working Hours</span>
          <span className="text-xs font-bold text-slate-800 mt-0.5">{workingHours || '0h 0m'}</span>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Shift</span>
          <span className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={shiftName}>
            {getShortShiftName(shiftName)}
          </span>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
        {status === null && (
          <button
            onClick={onCheckIn}
            disabled={isActionLoading}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm border border-emerald-500 uppercase tracking-wider h-8.5"
          >
            <span>✅ Check In</span>
          </button>
        )}

        {status === 'CHECKED_IN' && (
          <button
            onClick={onCheckOut}
            disabled={isActionLoading}
            className="bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm border border-rose-500 uppercase tracking-wider h-8.5"
          >
            <span>🔴 Check Out</span>
          </button>
        )}

        {status === 'CHECKED_OUT' && (
          <button
            disabled
            className="bg-slate-150 text-slate-400 border border-slate-200/60 font-bold py-1.5 px-4 rounded-xl text-xs h-8.5 cursor-not-allowed uppercase tracking-wider flex items-center gap-1.5"
          >
            <span>✔ Shift Completed</span>
          </button>
        )}
      </div>
    </div>
  );
};
