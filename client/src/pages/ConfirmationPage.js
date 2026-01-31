import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import {
  CheckCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getBooking, cancelBooking } from '../utils/api';

export default function ConfirmationPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    getBooking(bookingId)
      .then((res) => setBooking(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [bookingId, navigate]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancelling(true);
    try {
      await cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      setBooking({ ...booking, status: 'cancelled' });
    } catch (error) {
      toast.error('Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const copyToClipboard = () => {
    const text = `
Booking Confirmation
Resource: ${booking.resourceName}
Date: ${format(parseISO(booking.startTime), 'EEEE, MMMM d, yyyy')}
Time: ${format(parseISO(booking.startTime), 'HH:mm')} - ${format(
      parseISO(booking.endTime),
      'HH:mm'
    )}
Booking ID: ${booking.id}
Status: ${booking.status}
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success('Booking details copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Booking not found</h2>
        <Link to="/" className="btn-primary mt-4 inline-block">
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card"
      >
        {/* Header */}
        <div
          className={`p-8 text-center ${
            booking.status === 'cancelled'
              ? 'bg-red-50'
              : booking.status === 'pending'
              ? 'bg-yellow-50'
              : 'bg-green-50'
          }`}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <CheckCircleIcon
              className={`w-20 h-20 mx-auto mb-4 ${
                booking.status === 'cancelled'
                  ? 'text-red-500'
                  : booking.status === 'pending'
                  ? 'text-yellow-500'
                  : 'text-green-500'
              }`}
            />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {booking.status === 'cancelled'
              ? 'Booking Cancelled'
              : booking.status === 'pending'
              ? 'Booking Pending Approval'
              : 'Booking Confirmed!'}
          </h1>
          <p className="text-gray-600">
            {booking.status === 'cancelled'
              ? 'This booking has been cancelled.'
              : booking.status === 'pending'
              ? 'Your booking is awaiting approval.'
              : 'Your reservation has been successfully created.'}
          </p>
        </div>

        {/* Details */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <CalendarDaysIcon className="w-6 h-6 text-primary-600 mr-3 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500">Resource</div>
                <div className="text-lg font-semibold text-gray-900">
                  {booking.resourceName}
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <ClockIcon className="w-6 h-6 text-primary-600 mr-3 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500">Date & Time</div>
                <div className="text-lg font-semibold text-gray-900">
                  {format(parseISO(booking.startTime), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="text-gray-600">
                  {format(parseISO(booking.startTime), 'HH:mm')} -{' '}
                  {format(parseISO(booking.endTime), 'HH:mm')}
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <UserIcon className="w-6 h-6 text-primary-600 mr-3 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500">Booked by</div>
                <div className="text-lg font-semibold text-gray-900">
                  {booking.userName}
                </div>
                {booking.userEmail && (
                  <div className="text-gray-600">{booking.userEmail}</div>
                )}
              </div>
            </div>

            {booking.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  Notes
                </div>
                <div className="text-gray-900">{booking.notes}</div>
              </div>
            )}
          </div>

          {/* Booking ID */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Booking ID
            </div>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-gray-900">
                {booking.id}
              </code>
              <button
                onClick={copyToClipboard}
                className="text-primary-600 hover:text-primary-700"
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="btn-primary flex-1 text-center">
              Book Another Resource
            </Link>
            {booking.status !== 'cancelled' && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="btn-secondary flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
