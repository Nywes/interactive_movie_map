import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useMarkers } from '../../hooks/useMarkers';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Map.css';

export function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { markerData } = useMarkers();

  useEffect(() => {
    if (!mapContainer.current) return;
    const mapMarkers: maplibregl.Marker[] = [];

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [2.3522, 48.8566],
      zoom: 4,
    });

    mapRef.current.on('load', () => {
      markerData.forEach((location) => {
        const el = document.createElement('div');
        el.className = 'marker';

        const popup = new maplibregl.Popup({ offset: 25 })
          .setHTML(`<h3>${location.title}</h3>`);

        const marker = new maplibregl.Marker(el)
          .setLngLat(location.coordinates)
          .setPopup(popup)
          .addTo(mapRef.current!);

        mapMarkers.push(marker);
      });
    });

    return () => {
      mapMarkers.forEach((marker) => marker.remove());
      mapRef.current?.remove();
    };
  }, [markerData]);

  return <div ref={mapContainer} id="map" />;
} 