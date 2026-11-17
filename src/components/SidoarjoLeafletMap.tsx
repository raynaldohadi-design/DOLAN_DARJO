import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Destination } from '../types/dolandarjo';

export interface PickupOrigin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface SidoarjoLeafletMapProps {
  destinations: Destination[];
  pickupOrigin: PickupOrigin;
  selectedDestId: string;
  onSelectDestination: (destId: string) => void;
  distanceLabelMap: Record<string, string>;
}

export const SidoarjoLeafletMap: React.FC<SidoarjoLeafletMapProps> = ({
  destinations,
  pickupOrigin,
  selectedDestId,
  onSelectDestination,
  distanceLabelMap,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [pickupOrigin.latitude, pickupOrigin.longitude],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors · Disporapar Sidoarjo',
      maxZoom: 18,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update markers & geodesic line whenever pickupOrigin, destinations, or selectedDestId changes
  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Pickup Origin Marker (Deep Navy Bus Hub)
    const pickupIcon = L.divIcon({
      className: 'custom-pickup-pin',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:#0B1F3A;border:3px solid #FFFFFF;box-shadow:0 3px 10px rgba(11,31,58,0.4);color:#38BDF8;font-weight:700;font-size:11px;font-family:sans-serif;">BUS</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    L.marker([pickupOrigin.latitude, pickupOrigin.longitude], { icon: pickupIcon })
      .bindPopup(
        `<div style="font-family:sans-serif;font-size:12px;">
          <div style="font-weight:700;color:#0B1F3A;">Titik Jemput Bus (Origin)</div>
          <div style="margin-top:2px;color:#334155;">${pickupOrigin.name}</div>
        </div>`
      )
      .addTo(group);

    // 2. Destination Markers
    const selectedDest = destinations.find((d) => d.id === selectedDestId);

    destinations.forEach((dest) => {
      const isSelected = dest.id === selectedDestId;
      const pinColor = dest.busAccessible ? '#16A34A' : '#D97706';
      const ringColor = isSelected ? '#0284C7' : '#FFFFFF';
      const size = isSelected ? 28 : 20;

      const destIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${pinColor};border:${
          isSelected ? '4px' : '2.5px'
        } solid ${ringColor};box-shadow:0 2px 8px rgba(15,23,42,0.32);cursor:pointer;"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([dest.latitude, dest.longitude], { icon: destIcon });
      const distText = distanceLabelMap[dest.id] || '';

      marker.bindPopup(
        `<div style="font-family:sans-serif;font-size:12px;min-width:190px;">
          <div style="font-size:10px;font-weight:700;color:#0284C7;text-transform:uppercase;">${dest.category} · ${dest.district}</div>
          <div style="font-weight:700;color:#0F172A;margin-top:2px;">${dest.name}</div>
          <div style="margin-top:4px;color:#334155;">Jarak dari titik jemput: <strong>${distText}</strong></div>
          <div style="margin-top:3px;font-size:11px;color:${
            dest.busAccessible ? '#15803D' : '#B45309'
          };font-weight:600;">${
          dest.busAccessible ? 'Akses Bus Besar Terverifikasi' : 'Jalan Sempit — Drop-off Terdekat'
        }</div>
        </div>`
      );

      marker.on('click', () => {
        onSelectDestination(dest.id);
      });

      marker.addTo(group);
      if (isSelected) {
        marker.openPopup();
      }
    });

    // 3. Real-time Distance Polyline from Pickup Origin to Selected Destination
    if (selectedDest) {
      L.polyline(
        [
          [pickupOrigin.latitude, pickupOrigin.longitude],
          [selectedDest.latitude, selectedDest.longitude],
        ],
        {
          color: '#0284C7',
          weight: 3,
          dashArray: '7, 7',
          opacity: 0.9,
        }
      ).addTo(group);

      const bounds = L.latLngBounds([
        [pickupOrigin.latitude, pickupOrigin.longitude],
        [selectedDest.latitude, selectedDest.longitude],
      ]);
      map.fitBounds(bounds.pad(0.35), { maxZoom: 13, animate: true });
    }
  }, [destinations, pickupOrigin, selectedDestId, distanceLabelMap, onSelectDestination]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <div ref={containerRef} className="h-full w-full z-10" />
    </div>
  );
};
