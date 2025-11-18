import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Calendar from '../components/Calendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import { useResource, useSlots, useResourceStatus } from '../hooks/useResources';
import { createBooking } from '../utils/api';

export default function BookingPage() {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const { resource, loading: resourceLoading } = useResource(resourceId);
  const { status: statusData } = useResourceStatus(
    resource?.showStatus ? resourceId : null
  );

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const { slots, slotInfo, loading: slotsLoading } = useSlots(
    resourceId,
    dateString,
    timezone
  );

  // Reset slot when date changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    if (!formData.userName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createBooking({
        resourceId,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        ...formData,
      });

      toast.success(response.data.message);
      navigate(`/confirmation/${response.data.booking.id}`);
    } catch (error) {
      toast.error(
        error.response?.data?.error || 'Failed to create booking. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (resourceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Resource not found</h2>
        <button
          onClick={() => navigate('/')}
          className="btn-primary mt-4"
        >
          Go back home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to resources
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Book {resource.name}
            </h1>
            <p className="text-gray-600">{resource.description}</p>
          </div>
          {statusData && statusData.status !== 'not_tracked' && (
            <div
              className={`badge ${
                statusData.status === 'available'
                  ? 'bg-green-100 text-green-700'
                  : statusData.status === 'in_use'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {statusData.status === 'available'
                ? 'Available Now'
                : statusData.status === 'in_use'
                ? 'In Use'
                : 'Unavailable'}
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar and Slots */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarDaysIcon className="w-5 h-5 mr-2 text-primary-600" />
              Select Date
            </h2>
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </motion.div>

          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <TimeSlotPicker
                slots={slots}
                selectedSlot={selectedSlot}
                onSlotSelect={setSelectedSlot}
                loading={slotsLoading}
              />
            </motion.div>
          )}
        </div>

        {/* Booking Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card sticky top-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Booking Details
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Summary */}
              {selectedDate && selectedSlot && (
                <div className="bg-primary-50 rounded-lg p-4 space-y-2">
                  <div className="text-sm font-medium text-primary-900">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="text-lg font-semibold text-primary-700">
                    {selectedSlot.startFormatted} - {selectedSlot.endFormatted}
                  </div>
                  <div className="text-xs text-primary-600">
                    Duration: {slotInfo?.slotDuration} minutes
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.userName}
                    onChange={(e) =>
                      setFormData({ ...formData, userName: e.target.value })
                    }
                    className="input pl-10"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optional)
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.userEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, userEmail: e.target.value })
                    }
                    className="input pl-10"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (optional)
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.userPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, userPhone: e.target.value })
                    }
                    className="input pl-10"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <div className="relative">
                  <DocumentTextIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="input pl-10 min-h-[100px]"
                    placeholder="Any special requirements..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedSlot || isSubmitting}
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
          </div>
        </motion.div>
      </div>
    </div>
  );
}
