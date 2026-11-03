"use client";

import L from "leaflet";
import {
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { TravelPlaceRecord } from "@/lib/actions/travel";
import "leaflet/dist/leaflet.css";

const HK_CENTER: [number, number] = [22.3, 114.2];
const DEFAULT_ZOOM = 11;
/** Reveal radius around each visited place (meters). */
const REVEAL_RADIUS_M = 5000;

const placeIcon = L.divIcon({
  className: "travel-place-marker",
  html: `<span style="
    display:block;
    width:16px;
    height:16px;
    border-radius:50%;
    background:#1677ff;
    border:2px solid #fff;
    box-shadow:0 1px 4px rgba(0,0,0,.45);
  "></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function metersToPixels(map: L.Map, lat: number, lon: number, meters: number) {
  const center = L.latLng(lat, lon);
  const east = L.latLng(
    lat,
    lon + meters / (111_320 * Math.cos((lat * Math.PI) / 180) || 1),
  );
  const p1 = map.latLngToContainerPoint(center);
  const p2 = map.latLngToContainerPoint(east);
  return Math.max(8, Math.hypot(p2.x - p1.x, p2.y - p1.y));
}

function FogOverlay({ places }: { places: TravelPlaceRecord[] }) {
  const map = useMap();

  useEffect(() => {
    const paneName = "travel-fog";
    let pane = map.getPane(paneName);
    if (!pane) {
      pane = map.createPane(paneName);
      pane.style.zIndex = "450";
      pane.style.pointerEvents = "none";
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    pane.appendChild(svg);

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    mask.setAttribute("id", "travel-fog-mask");
    const maskBg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    maskBg.setAttribute("width", "100%");
    maskBg.setAttribute("height", "100%");
    maskBg.setAttribute("fill", "white");
    mask.appendChild(maskBg);
    const holesGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    mask.appendChild(holesGroup);
    defs.appendChild(mask);
    svg.appendChild(defs);

    const fogRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    fogRect.setAttribute("width", "100%");
    fogRect.setAttribute("height", "100%");
    fogRect.setAttribute("fill", "rgba(8, 12, 20, 0.78)");
    fogRect.setAttribute("mask", "url(#travel-fog-mask)");
    svg.appendChild(fogRect);

    const redraw = () => {
      const size = map.getSize();
      svg.setAttribute("width", String(size.x));
      svg.setAttribute("height", String(size.y));
      svg.style.width = `${size.x}px`;
      svg.style.height = `${size.y}px`;

      while (holesGroup.firstChild) {
        holesGroup.removeChild(holesGroup.firstChild);
      }

      for (const place of places) {
        if (place.visits.length === 0) continue;
        const point = map.latLngToContainerPoint([place.lat, place.lon]);
        const radius = metersToPixels(
          map,
          place.lat,
          place.lon,
          REVEAL_RADIUS_M,
        );
        const circle = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );
        circle.setAttribute("cx", String(point.x));
        circle.setAttribute("cy", String(point.y));
        circle.setAttribute("r", String(radius));
        circle.setAttribute("fill", "black");
        holesGroup.appendChild(circle);
      }
    };

    redraw();
    map.on("move zoom resize viewreset", redraw);

    return () => {
      map.off("move zoom resize viewreset", redraw);
      pane?.removeChild(svg);
    };
  }, [map, places]);

  return null;
}

function MapClickHandler({
  onMapClick,
  suppressRef,
}: {
  onMapClick: (lat: number, lon: number) => void;
  suppressRef: MutableRefObject<boolean>;
}) {
  useMapEvents({
    click(event) {
      if (suppressRef.current) {
        suppressRef.current = false;
        return;
      }
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function FitPlaces({ places }: { places: TravelPlaceRecord[] }) {
  const map = useMap();
  const key = useMemo(
    () => places.map((p) => `${p.id}:${p.lat}:${p.lon}`).join("|"),
    [places],
  );
  const placesRef = useRef(places);
  placesRef.current = places;

  useEffect(() => {
    const current = placesRef.current;
    if (current.length === 0) {
      map.setView(HK_CENTER, DEFAULT_ZOOM);
      return;
    }
    if (current.length === 1) {
      map.setView([current[0].lat, current[0].lon], 13);
      return;
    }
    const bounds = L.latLngBounds(
      current.map((place) => [place.lat, place.lon] as [number, number]),
    );
    map.fitBounds(bounds.pad(0.25));
  }, [map, key]);

  return null;
}

type TravelLeafletMapProps = {
  places: TravelPlaceRecord[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  onMapClick: (lat: number, lon: number) => void;
};

export function TravelLeafletMap({
  places,
  selectedPlaceId,
  onSelectPlace,
  onMapClick,
}: TravelLeafletMapProps) {
  const suppressMapClickRef = useRef(false);

  return (
    <MapContainer
      center={HK_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ width: "100%", height: "100%", borderRadius: 8 }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FogOverlay places={places} />
      <MapClickHandler
        onMapClick={onMapClick}
        suppressRef={suppressMapClickRef}
      />
      <FitPlaces places={places} />
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lon]}
          icon={placeIcon}
          eventHandlers={{
            click: () => {
              suppressMapClickRef.current = true;
              onSelectPlace(place.id);
            },
          }}
          opacity={selectedPlaceId === place.id ? 1 : 0.9}
        />
      ))}
    </MapContainer>
  );
}
