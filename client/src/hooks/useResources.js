import { useState, useEffect } from 'react';
import { getResources, getResource, getResourceStatus, getResourceSlots } from '../utils/api';

export function useResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await getResources();
        setResources(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  return { resources, loading, error };
}

export function useResource(id) {
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchResource = async () => {
      try {
        const response = await getResource(id);
        setResource(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [id]);

  return { resource, loading, error };
}

export function useResourceStatus(id, interval = 30000) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchStatus = async () => {
      try {
        const response = await getResourceStatus(id);
        setStatus(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const timer = setInterval(fetchStatus, interval);

    return () => clearInterval(timer);
  }, [id, interval]);

  return { status, loading, error };
}

export function useSlots(resourceId, date, timezone) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [slotInfo, setSlotInfo] = useState(null);

  useEffect(() => {
    if (!resourceId || !date) return;

    const fetchSlots = async () => {
      setLoading(true);
      try {
        const response = await getResourceSlots(resourceId, date, timezone);
        setSlots(response.data.slots);
        setSlotInfo({
          resource: response.data.resource,
          date: response.data.date,
          timezone: response.data.timezone,
          slotDuration: response.data.slotDuration,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [resourceId, date, timezone]);

  return { slots, slotInfo, loading, error };
}
