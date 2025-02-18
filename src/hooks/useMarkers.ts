import { useMemo } from 'react';
import { MarkerData } from '../types/map';

export function useMarkers() {
  const markerData = useMemo<MarkerData[]>(
    () => [
      { id: 1, coordinates: [2.3522, 48.8566], title: 'Paris' },
      { id: 2, coordinates: [-0.1276, 51.5074], title: 'Londres' },
      { id: 3, coordinates: [13.405, 52.52], title: 'Berlin' },
      { id: 4, coordinates: [4.9041, 52.3676], title: 'Amsterdam' },
    ],
    []
  );

  return { markerData };
}
