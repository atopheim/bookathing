import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import {
  ChevronLeftIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Calendar from '../components/Calendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import ResourceCard from '../components/ResourceCard';
import { useResources, useResource, useSlots } from '../hooks/useResources';
import { createBooking, getConfig } from '../utils/api';

export default function EmbedPage() {
  const { resourceId } = useParams();
  const { resources, loading: resourcesLoading } = useResources();
  const { resource } = useResource(resourceId);
  const [config, setConfig] = useState(null);

  const [step, setStep] = useState(resourceId ? 'date' : 'resource');
  const [selectedResource, setSelectedResource] = useState(resourceId || null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [completedBooking, setCompletedBooking] = useState(null);

  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const { slots, loading: slotsLoading } = useSlots(
    selectedResource,
    dateString,
    timezone
  );

  useEffect(() => {
    getConfig().then((res) => setConfig(res.data));
  }, []);

  useEffect(() => {
    if (resourceId) {
      setSelectedResource(resourceId);
      setStep('date');
    }
  }, [resourceId]);

  const handleResourceSelect = (id) => {
    setSelectedResource(id);
    setStep('date');
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStep('details');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.userName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createBooking({
        resourceId: selectedResource,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        ...formData,
      });

      setCompletedBooking(response.data.booking);
      setBookingComplete(true);
      toast.success('Booking confirmed!');
    } catch (error) {
      toast.error(
        error.response?.data?.error || 'Failed to create booking'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBooking = () => {
    setStep(resourceId ? 'date' : 'resource');
    setSelectedDate(null);
    setSelectedSlot(null);
    setFormData({ userName: '', userEmail: '', notes: '' });
    setBookingComplete(false);
    setCompletedBooking(null);
  };

  if (resourcesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <CalendarDaysIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {config?.app?.name || 'BookAThing'}
              </span>
            </div>
            {step !== 'resource' && !bookingComplete && (
              <button
                onClick={() => {
                  if (step === 'details') setStep('date');
                  else if (step === 'date' && !resourceId) setStep('resource');
                }}
                className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Back
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Success Screen */}
          {bookingComplete && completedBooking && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Booking Confirmed!
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md mx-auto mb-6">
                <div className="space-y-3 text-left">
                  <div>
                    <div className="text-sm text-gray-500">Resource</div>
                    <div className="font-medium">{completedBooking.resourceName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Date & Time</div>
                    <div className="font-medium">
                      {format(new Date(completedBooking.startTime), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-gray-600">
                      {format(new Date(completedBooking.startTime), 'HH:mm')} -{' '}
                      {format(new Date(completedBooking.endTime), 'HH:mm')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Booking ID</div>
                    <div className="font-mono text-sm">{completedBooking.id}</div>
                  </div>
                </div>
              </div>
              <button onClick={resetBooking} className="btn-primary">
                Make Another Booking
              </button>
            </motion.div>
          )}

          {/* Resource Selection */}
          {step === 'resource' && !bookingComplete && (
            <motion.div
              key="resource"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Select a Resource
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => handleResourceSelect(res.id)}
                    className="cursor-pointer"
                  >
                    <ResourceCard resource={res} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Date & Time Selection */}
          {step === 'date' && !bookingComplete && (
            <motion.div
              key="date"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">
                Select Date & Time
              </h2>
              {resource && (
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="font-medium text-primary-900">
                    {resource.name}
                  </div>
                  <div className="text-sm text-primary-700">
                    {resource.slotDuration} min per booking
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                />
                {selectedDate && (
                  <TimeSlotPicker
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSlotSelect={handleSlotSelect}
                    loading={slotsLoading}
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* Details Form */}
          {step === 'details' && !bookingComplete && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Your Details
              </h2>

              {/* Summary */}
              <div className="bg-primary-50 rounded-lg p-4 mb-6">
                <div className="font-medium text-primary-900">
                  {resource?.name}
                </div>
                <div className="text-primary-700">
                  {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="text-lg font-semibold text-primary-900">
                  {selectedSlot?.startFormatted} - {selectedSlot?.endFormatted}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.userName}
                    onChange={(e) =>
                      setFormData({ ...formData, userName: e.target.value })
                    }
                    className="input"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={formData.userEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, userEmail: e.target.value })
                    }
                    className="input"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="input min-h-[80px]"
                    placeholder="Any special requirements..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Booking...
                    </span>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          Powered by {config?.app?.name || 'BookAThing'}
        </div>
      </div>
    </div>
  );
}
