import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import {
  CalendarDaysIcon,
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { getStats, getBookings, updateBookingStatus, cancelBooking } from '../utils/api';
import { useResources } from '../hooks/useResources';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { resources } = useResources();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        getStats(),
        getBookings(),
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      toast.success('Status updated');
      loadData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await cancelBooking(bookingId);
      toast.success('Booking cancelled');
      loadData();
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage bookings and monitor system activity</p>
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.activeResources}
                </div>
                <div className="text-sm text-gray-600">Resources</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.todayBookings}
                </div>
                <div className="text-sm text-gray-600">Today</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.weekBookings}
                </div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <UsersIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalBookings}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.pendingApprovals}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bookings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">All Bookings</h2>
            <div className="flex gap-2">
              {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No bookings found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.resourceName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.userName}
                      </div>
                      {booking.userEmail && (
                        <div className="text-xs text-gray-500">
                          {booking.userEmail}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(parseISO(booking.startTime), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(parseISO(booking.startTime), 'HH:mm')} -{' '}
                        {format(parseISO(booking.endTime), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`badge ${statusColors[booking.status]}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleStatusUpdate(booking.id, 'confirmed')
                            }
                            className="text-green-600 hover:text-green-700"
                            title="Approve"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Reject"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Embed Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Embed Widget Code
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Use these snippets to embed the booking widget on your website
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Widget (All Resources)
            </label>
            <code className="block bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
              {`<iframe src="${window.location.origin}/embed" width="100%" height="800" frameborder="0"></iframe>`}
            </code>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Single Resource Widget
            </label>
            <select className="input mb-2">
              <option value="">Select a resource</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <code className="block bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
              {`<iframe src="${window.location.origin}/embed/[RESOURCE_ID]" width="100%" height="700" frameborder="0"></iframe>`}
            </code>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
