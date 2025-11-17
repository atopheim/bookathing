import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Calendar({ selectedDate, onDateSelect, minDate = new Date() }) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isPast = isBefore(startOfDay(day), startOfDay(minDate));
        const isTodayDate = isToday(day);

        days.push(
          <motion.button
            key={day.toString()}
            whileHover={!isPast && isCurrentMonth ? { scale: 1.1 } : {}}
            whileTap={!isPast && isCurrentMonth ? { scale: 0.95 } : {}}
            onClick={() => !isPast && isCurrentMonth && onDateSelect(cloneDay)}
            disabled={isPast || !isCurrentMonth}
            className={`
              relative w-full aspect-square flex items-center justify-center rounded-lg text-sm transition-colors
              ${!isCurrentMonth ? 'text-gray-300' : ''}
              ${
                isCurrentMonth && !isPast && !isSelected
                  ? 'text-gray-900 hover:bg-primary-50'
                  : ''
              }
              ${isPast && isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : ''}
              ${
                isSelected
                  ? 'bg-primary-600 text-white hover:bg-primary-700 font-semibold'
                  : ''
              }
              ${
                isTodayDate && !isSelected
                  ? 'ring-2 ring-primary-200 font-semibold'
                  : ''
              }
            `}
          >
            {format(day, 'd')}
          </motion.button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {renderHeader()}
      {renderDays()}
      <AnimatePresence mode="wait">
        <motion.div
          key={format(currentMonth, 'yyyy-MM')}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderCells()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
