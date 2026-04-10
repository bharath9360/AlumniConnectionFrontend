import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useFetch — generic data-fetching hook with loading/error/data states.
 *
 * @param {Function} apiFn   - The service function to call (e.g. postService.getFeed)
 * @param {Array}    deps    - Dependency array that triggers a re-fetch (default: mount only)
 * @param {boolean}  skip    - If true the fetch is skipped (useful for conditional fetching)
 *
 * @returns {{ data, loading, error, refetch }}
 *
 * Usage:
 *   const { data, loading, error, refetch } = useFetch(jobService.getJobs);
 *   const { data, loading, refetch } = useFetch(() => userService.getById(userId), [userId]);
 */
const useFetch = (apiFn, deps = [], skip = false) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error,   setError]   = useState(null);

  // Keep a stable ref to the latest apiFn so we never stale-close over an old version
  const apiFnRef = useRef(apiFn);
  useEffect(() => { apiFnRef.current = apiFn; });

  const fetchData = useCallback(async () => {
    if (skip) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFnRef.current();
      // Support both `res.data` shapes: raw array/object or { data: ... }
      setData(res?.data?.data !== undefined ? res.data.data : res?.data ?? res);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;
