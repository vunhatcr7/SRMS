import { useEffect, useState } from 'react';

export function useMinimumLoading(dataLoaded: boolean, minimumTime = 1000) {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (!dataLoaded) return;

    const timer = window.setTimeout(() => {
      setShowLoading(false);
    }, minimumTime);

    return () => window.clearTimeout(timer);
  }, [dataLoaded, minimumTime]);

  return showLoading;
}
