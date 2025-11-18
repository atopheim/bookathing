import React from 'react';
import { motion } from 'framer-motion';
import { ClockIcon } from '@heroicons/react/24/outline';

export default function TimeSlotPicker({
  slots,
  selectedSlot,
  onSlotSelect,
  loading,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading available slots...</span>
        </div>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center py-12">
          <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No available slots
          </h3>
          <p className="text-gray-500">
            Please select a different date to see available time slots.
          </p>
        </div>
      </div>
    );
  }

  const availableSlots = slots.filter((slot) => slot.available);
  const unavailableSlots = slots.filter((slot) => !slot.available);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <ClockIcon className="w-5 h-5 mr-2 text-primary-600" />
        Available Time Slots
      </h3>

      {availableSlots.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No slots available for this date. Please try another date.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            {availableSlots.length} slot{availableSlots.length !== 1 ? 's' : ''}{' '}
            available
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((slot, index) => {
              const isSelected =
                selectedSlot && selectedSlot.start === slot.start;

              return (
                <motion.button
                  key={slot.start}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={slot.available ? { scale: 1.02 } : {}}
                  whileTap={slot.available ? { scale: 0.98 } : {}}
                  onClick={() => slot.available && onSlotSelect(slot)}
                  disabled={!slot.available}
                  className={`
                    relative px-4 py-3 rounded-lg text-sm font-medium transition-all
                    ${
                      slot.available
                        ? isSelected
                          ? 'bg-primary-600 text-white ring-2 ring-primary-600 ring-offset-2'
                          : 'bg-white border border-gray-200 text-gray-900 hover:border-primary-300 hover:bg-primary-50'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                    }
                  `}
                >
                  <div className="text-center">
                    <div>{slot.startFormatted}</div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                      >
                        <svg
                          className="w-4 h-4 text-primary-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
