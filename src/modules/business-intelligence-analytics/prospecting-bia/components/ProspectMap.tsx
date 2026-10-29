"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type ProspectMapProps = {
  latitude: number;
  longitude: number;
  label: string;
  className?: string;
};

/**
 * Leaflet needs an explicit invalidateSize once it is laid out (its container
 * is often still zero-sized on first paint inside a dialog).
 */
function InvalidateOnMount() {
  const map = useMap();
  React.useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 200);
    return () => window.clearTimeout(timer);
  }, [map]);
  return null;
}

/** Pin drawn as a div icon so it can use the app's design tokens. */
function usePinIcon() {
  return React.useMemo(
    () =>
      L.divIcon({
        className: "",
        html:
          '<svg viewBox="0 0 24 24" width="32" height="32" style="filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.35));">' +
          '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" ' +
          'style="fill: hsl(var(--primary)); stroke: hsl(var(--background)); stroke-width: 1.5;" />' +
          '<circle cx="12" cy="9" r="2.6" style="fill: hsl(var(--primary-foreground));" />' +
          "</svg>",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -30],
      }),
    []
  );
}

export default function ProspectMap({ latitude, longitude, label, className }: ProspectMapProps) {
  const icon = usePinIcon();

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      scrollWheelZoom
      className={className}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[latitude, longitude]} icon={icon}>
        <Popup>{label}</Popup>
      </Marker>
      <InvalidateOnMount />
    </MapContainer>
  );
}
