'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  Check,
  Clock,
} from 'lucide-react';
import { clsx } from 'clsx';

interface DatePickerPopoverProps {
  currentDate?: string;
  onSelectDate: (dateStr: string) => void;
  onClose?: () => void;
  className?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  currentDate,
  onSelectDate,
  onClose,
  className,
}) => {

  const initialDateObj = useMemo(() => {
    if (!currentDate || !currentDate.trim()) return new Date();

    const clean = currentDate.trim();
    const currentFullYear = new Date().getFullYear();

    const match = clean.match(/^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const monthStr = match[2].toLowerCase();
      const monthIdx = MONTH_SHORT.findIndex(
        (m) => m.toLowerCase() === monthStr.slice(0, 3),
      );
      const year = match[3] ? parseInt(match[3], 10) : currentFullYear;

      if (!isNaN(day) && monthIdx !== -1) {
        return new Date(year, monthIdx, day);
      }
    }

    const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return new Date(
        parseInt(isoMatch[1], 10),
        parseInt(isoMatch[2], 10) - 1,
        parseInt(isoMatch[3], 10),
      );
    }

    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {

      if (!/\b(19\d\d|20\d\d)\b/.test(clean)) {
        parsed.setFullYear(currentFullYear);
      }
      return parsed;
    }

    return new Date();
  }, [currentDate]);

  const [viewDate, setViewDate] = useState<Date>(
    () => new Date(initialDateObj.getFullYear(), initialDateObj.getMonth(), 1),
  );

  const [selectedDate, setSelectedDate] = useState<Date>(initialDateObj);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const formatDateOutput = (date: Date): string => {
    const day = date.getDate();
    const month = MONTH_SHORT[date.getMonth()];
    const thisYear = new Date().getFullYear();
    const year = date.getFullYear();

    if (year === thisYear) {
      return `${day} ${month}`;
    }
    return `${day} ${month} ${year}`;
  };

  const handleDateClick = (day: number, isCurrentMonth: boolean, offsetMonth: number = 0) => {
    const targetDate = new Date(currentYear, currentMonth + offsetMonth, day);
    setSelectedDate(targetDate);
    onSelectDate(formatDateOutput(targetDate));
    if (onClose) onClose();
  };

  const handleQuickSelect = (daysOffset: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    setSelectedDate(target);
    onSelectDate(formatDateOutput(target));
    if (onClose) onClose();
  };

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: { day: number; isCurrentMonth: boolean; offsetMonth: number; date: Date }[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      days.push({
        day: d,
        isCurrentMonth: false,
        offsetMonth: -1,
        date: new Date(currentYear, currentMonth - 1, d),
      });
    }

    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        offsetMonth: 0,
        date: new Date(currentYear, currentMonth, i),
      });
    }

    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        offsetMonth: 1,
        date: new Date(currentYear, currentMonth + 1, i),
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const today = new Date();
  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const isSelected = (d: Date) =>
    d.getDate() === selectedDate.getDate() &&
    d.getMonth() === selectedDate.getMonth() &&
    d.getFullYear() === selectedDate.getFullYear();

  return (
    <div
      className={clsx(
        'w-[280px] bg-white dark:bg-[#1E1E20] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/80 p-3.5 flex flex-col gap-3 font-sans select-none animate-in fade-in zoom-in-95 duration-100 z-50 text-gray-900 dark:text-gray-100',
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >

      <div className="grid grid-cols-3 gap-1 pb-2 border-b border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => handleQuickSelect(0)}
          className="py-1 px-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 text-[11px] font-semibold text-gray-700 dark:text-gray-300 text-center transition-colors cursor-pointer"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect(1)}
          className="py-1 px-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 text-[11px] font-semibold text-gray-700 dark:text-gray-300 text-center transition-colors cursor-pointer"
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect(7)}
          className="py-1 px-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 text-[11px] font-semibold text-gray-700 dark:text-gray-300 text-center transition-colors cursor-pointer"
        >
          Next Week
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <CalendarIcon size={14} className="text-gray-400" />
          <span className="font-bold text-[13px] text-gray-900 dark:text-white">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-[10px] font-bold text-gray-400 uppercase py-0.5">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((item, idx) => {
          const selected = isSelected(item.date);
          const currentDay = isToday(item.date);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleDateClick(item.day, item.isCurrentMonth, item.offsetMonth)}
              className={clsx(
                'h-7 rounded-lg text-[12px] font-medium flex items-center justify-center transition-all cursor-pointer relative',
                selected
                  ? 'bg-black dark:bg-white text-white dark:text-black font-bold shadow-xs'
                  : item.isCurrentMonth
                    ? 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    : 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                currentDay && !selected && 'border border-blue-500 font-bold text-blue-600 dark:text-blue-400',
              )}
            >
              <span>{item.day}</span>
              {currentDay && !selected && (
                <span className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => {
            onSelectDate('');
            if (onClose) onClose();
          }}
          className="text-[11px] font-medium text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer flex items-center gap-1"
        >
          <X size={12} />
          <span>Clear Date</span>
        </button>

        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
          {formatDateOutput(selectedDate)}
        </span>
      </div>
    </div>
  );
};
