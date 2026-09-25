'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export type Coordinate = { lat: number; lng: number };
export type MapMarker = Coordinate & {
  id: string;
  title: string;
  priority?: string;
  category?: string;
  description?: string;
  status?: string;
};

const DEFAULT_CENTER: Coordinate = { lat: -5.45, lng: 105.28 };

export function parseCoordinates(input: unknown): Coordinate | null {
  if (typeof input !== 'string') return null;
  const match = input.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export function formatCoordinates(point: Coordinate) {
  return `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;
}

export function googleMapsUrl(point: Coordinate) {
  return `https://www.google.com/maps?q=${point.lat},${point.lng}`;
}

function MapEvents({
  onSelect,
  onCenterChange,
}: {
  onSelect?: (point: Coordinate) => void;
  onCenterChange: (point: Coordinate) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
    moveend(event) {
      const point = event.target.getCenter();
      onCenterChange({ lat: point.lat, lng: point.lng });
    },
  });

  return null;
}

function FitMarkers({ enabled, markers }: { enabled: boolean; markers: MapMarker[] }) {
  const map = useMap();
  const signature = markers.map((marker) => `${marker.lat},${marker.lng}`).join(';');

  useEffect(() => {
    if (!enabled || markers.length === 0) return;

    map.fitBounds(
      markers.map((marker) => [marker.lat, marker.lng] as [number, number]),
      { padding: [32, 32], maxZoom: 13 },
    );
  }, [enabled, map, markers.length, signature]);

  return null;
}

export default function InteractiveMap({
  value,
  markers = [],
  onChange,
  onSelect,
  onMarkerClick,
  autoFit = false,
  ariaLabel,
}: {
  value?: Coordinate | null;
  markers?: MapMarker[];
  onChange?: (point: Coordinate) => void;
  onSelect?: (point: Coordinate) => void;
  onMarkerClick?: (id: string) => void;
  autoFit?: boolean;
  ariaLabel?: string;
}) {
  const initialCenter = useMemo(() => value ?? markers[0] ?? DEFAULT_CENTER, []);
  const [center, setCenter] = useState<Coordinate>(initialCenter);
  const destination = value ?? center;

  return (
    <div className="interactive-map leaflet-map" role="application" aria-label={ariaLabel ?? 'Peta lokasi prioritas'}>
      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={9}
        minZoom={5}
        maxZoom={15}
        scrollWheelZoom
        className="leaflet-map-container"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents
          onSelect={onChange ?? onSelect}
          onCenterChange={setCenter}
        />
        <FitMarkers enabled={autoFit && !value} markers={markers} />

        {markers.map((marker) => (
          <CircleMarker
            key={marker.id}
            center={[marker.lat, marker.lng]}
            radius={9}
            pathOptions={{ color: '#0e63a9', fillColor: '#2182c7', fillOpacity: 0.9, weight: 2 }}
          >
            <Popup className="incident-map-popup">
              <div className="map-popup-summary">
                <strong>{marker.title}</strong>
                {marker.category ? <span>{marker.category}</span> : null}
                {marker.description ? <p>{marker.description}</p> : null}
                <div className="map-popup-meta">
                  {marker.status ? <span>Status: {marker.status}</span> : null}
                  {marker.priority ? <span>Prioritas: {marker.priority}</span> : null}
                </div>
                <small>{formatCoordinates(marker)}</small>
                {onMarkerClick ? <button type="button" onClick={() => onMarkerClick(marker.id)}>Buka rincian</button> : null}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {value ? (
          <CircleMarker
            center={[value.lat, value.lng]}
            radius={10}
            pathOptions={{ color: '#b42318', fillColor: '#ef4444', fillOpacity: 0.95, weight: 3 }}
          >
            <Popup>Lokasi terpilih: {formatCoordinates(value)}</Popup>
          </CircleMarker>
        ) : null}
      </MapContainer>

      <a
        className="map-google-link"
        href={googleMapsUrl(destination)}
        target="_blank"
        rel="noreferrer"
      >
        Buka di Google Maps <ArrowUpRight size={14} />
      </a>
    </div>
  );
}
