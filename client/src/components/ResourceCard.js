import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  WrenchScrewdriverIcon,
  HomeModernIcon,
  FireIcon,
  TruckIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useResourceStatus } from '../hooks/useResources';

const iconMap = {
  'washing-machine': WrenchScrewdriverIcon,
  wind: HomeModernIcon,
  flame: FireIcon,
  car: TruckIcon,
  users: UsersIcon,
};

function StatusBadge({ status }) {
  const statusConfig = {
    available: {
      icon: CheckCircleIcon,
      text: 'Available',
      className: 'bg-green-100 text-green-700',
      dotClass: 'bg-green-500',
    },
    in_use: {
      icon: ClockIcon,
      text: 'In Use',
      className: 'bg-yellow-100 text-yellow-700',
      dotClass: 'bg-yellow-500',
    },
    maintenance: {
      icon: WrenchScrewdriverIcon,
      text: 'Maintenance',
      className: 'bg-orange-100 text-orange-700',
      dotClass: 'bg-orange-500',
    },
    offline: {
      icon: XCircleIcon,
      text: 'Offline',
      className: 'bg-red-100 text-red-700',
      dotClass: 'bg-red-500',
    },
    not_tracked: {
      icon: null,
      text: '',
      className: '',
      dotClass: '',
    },
  };

  const config = statusConfig[status] || statusConfig.not_tracked;

  if (status === 'not_tracked') return null;

  return (
    <div
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      <span className={`w-2 h-2 rounded-full mr-1.5 animate-pulse ${config.dotClass}`} />
      {config.text}
    </div>
  );
}

export default function ResourceCard({ resource }) {
  const { status: statusData } = useResourceStatus(
    resource.showStatus ? resource.id : null,
    10000
  );
  const Icon = iconMap[resource.icon] || WrenchScrewdriverIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/book/${resource.id}`} className="block">
        <div className="card h-full hover:border-primary-300 transition-colors">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${resource.color}20` }}
              >
                <Icon className="w-6 h-6" style={{ color: resource.color }} />
              </div>
              {statusData && <StatusBadge status={statusData.status} />}
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {resource.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {resource.description}
            </p>

            {/* Meta */}
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <svg
                  className="w-4 h-4 mr-2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {resource.location}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg
                  className="w-4 h-4 mr-2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {resource.slotDuration} min per slot
              </div>
            </div>

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="badge bg-gray-100 text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-600">
                Book now
              </span>
              <svg
                className="w-5 h-5 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
