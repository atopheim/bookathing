import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ResourceCard from '../components/ResourceCard';
import { useResources } from '../hooks/useResources';
import { getConfig, getStats } from '../utils/api';

export default function HomePage() {
  const { resources, loading, error } = useResources();
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    getConfig().then((res) => setConfig(res.data));
    getStats().then((res) => setStats(res.data));
  }, []);

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags?.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesType =
      selectedType === 'all' || resource.type === selectedType;
    return matchesSearch && matchesType;
  });

  const resourceTypes = [
    'all',
    ...new Set(resources.map((r) => r.type)),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 text-red-600 rounded-lg p-6 inline-block">
          <p className="font-medium">Failed to load resources</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {config?.app?.description || 'Book Your Resources Easily'}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select from available resources below and book your preferred time slot in just a few clicks.
        </p>
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">
              {stats.activeResources}
            </div>
            <div className="text-sm text-gray-600">Resources</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.todayBookings}
            </div>
            <div className="text-sm text-gray-600">Today's Bookings</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.weekBookings}
            </div>
            <div className="text-sm text-gray-600">This Week</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalBookings}
            </div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>
        </motion.div>
      )}

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {resourceTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === type
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Resource Grid */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No resources found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <ResourceCard resource={resource} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
