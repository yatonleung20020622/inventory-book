"use client";

import L from "leaflet";
import { useEffect, useId, useRef } from "react";
import type { TravelPlaceRecord } from "@/lib/actions/travel";
import "leaflet/dist/leaflet.css";

const HK_CENTER: L.LatLngExpression = [22.3, 114.2];
const DEFAULT_ZOOM = 11;
/** Reveal radius around each visited place (meters). */
const REVEAL_RADIUS_M = 200;

function createPlaceIcon() {
  return L.divIcon({
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
}

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

function mapIsAlive(map: L.Map | null): map is L.Map {
  return Boolean(map && map.getContainer()?.parentNode && map.getPane("tilePane"));
}

type TravelLeafletMapProps = {
  places: TravelPlaceRecord[];
  selectedPlaceId: string | null;
  focusToken: number;
  onSelectPlace: (placeId: string) => void;
  onMapClick: (lat: number, lon: number) => void;
};

export function TravelLeafletMap({
  places,
  selectedPlaceId,
  focusToken,
  onSelectPlace,
  onMapClick,
}: TravelLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const fogSvgRef = useRef<SVGSVGElement | null>(null);
  const fogHolesRef = useRef<SVGGElement | null>(null);
  const fogMaskBgRef = useRef<SVGRectElement | null>(null);
  const fogRectRef = useRef<SVGRectElement | null>(null);
  const placesRef = useRef(places);
  const selectedPlaceIdRef = useRef(selectedPlaceId);
  const onSelectPlaceRef = useRef(onSelectPlace);
  const onMapClickRef = useRef(onMapClick);
  const suppressMapClickRef = useRef(false);
  const fittedKeyRef = useRef<string | null>(null);
  const lastFocusTokenRef = useRef(0);
  const reactId = useId().replace(/:/g, "");

  placesRef.current = places;
  selectedPlaceIdRef.current = selectedPlaceId;
  onSelectPlaceRef.current = onSelectPlace;
  onMapClickRef.current = onMapClick;

  // Create / destroy the map once for this component instance.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      scrollWheelZoom: true,
    }).setView(HK_CENTER, DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    const paneName = "travelFogPane";
    let pane = map.getPane(paneName);
    if (!pane) {
      pane = map.createPane(paneName);
      pane.style.zIndex = "450";
      pane.style.pointerEvents = "none";
    }

    const maskId = `travel-fog-mask-${reactId}`;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    pane.appendChild(svg);
    fogSvgRef.current = svg;

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    mask.setAttribute("id", maskId);
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    const maskBg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    maskBg.setAttribute("x", "0");
    maskBg.setAttribute("y", "0");
    maskBg.setAttribute("fill", "white");
    mask.appendChild(maskBg);
    fogMaskBgRef.current = maskBg;

    const holesGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    mask.appendChild(holesGroup);
    fogHolesRef.current = holesGroup;
    defs.appendChild(mask);
    svg.appendChild(defs);

    const fogRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    fogRect.setAttribute("x", "0");
    fogRect.setAttribute("y", "0");
    fogRect.setAttribute("fill", "rgba(8, 12, 20, 0.78)");
    fogRect.setAttribute("mask", `url(#${maskId})`);
    svg.appendChild(fogRect);
    fogRectRef.current = fogRect;

    const redrawFog = () => {
      if (!mapIsAlive(map) || !fogSvgRef.current || !fogHolesRef.current) return;
      const size = map.getSize();
      const topLeft = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(fogSvgRef.current, topLeft);

      const width = String(size.x);
      const height = String(size.y);
      fogSvgRef.current.setAttribute("width", width);
      fogSvgRef.current.setAttribute("height", height);
      fogSvgRef.current.setAttribute("viewBox", `0 0 ${size.x} ${size.y}`);
      fogSvgRef.current.style.width = `${size.x}px`;
      fogSvgRef.current.style.height = `${size.y}px`;
      fogMaskBgRef.current?.setAttribute("width", width);
      fogMaskBgRef.current?.setAttribute("height", height);
      fogRectRef.current?.setAttribute("width", width);
      fogRectRef.current?.setAttribute("height", height);

      while (fogHolesRef.current.firstChild) {
        fogHolesRef.current.removeChild(fogHolesRef.current.firstChild);
      }

      for (const place of placesRef.current) {
        if (place.visits.length === 0) continue;
        const layerPoint = map.latLngToLayerPoint([place.lat, place.lon]);
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
        circle.setAttribute("cx", String(layerPoint.x - topLeft.x));
        circle.setAttribute("cy", String(layerPoint.y - topLeft.y));
        circle.setAttribute("r", String(radius));
        circle.setAttribute("fill", "black");
        fogHolesRef.current.appendChild(circle);
      }
    };

    const onClick = (event: L.LeafletMouseEvent) => {
      if (suppressMapClickRef.current) {
        suppressMapClickRef.current = false;
        return;
      }
      onMapClickRef.current(event.latlng.lat, event.latlng.lng);
    };

    map.on("click", onClick);
    map.on("move zoom resize viewreset moveend zoomend", redrawFog);
    mapRef.current = map;

    // Layout may settle after first paint (cardless shell / flex height).
    requestAnimationFrame(() => {
      if (!mapIsAlive(map)) return;
      map.invalidateSize();
      redrawFog();
    });

    return () => {
      map.off("click", onClick);
      map.off("move zoom resize viewreset moveend zoomend", redrawFog);
      fogSvgRef.current?.remove();
      fogSvgRef.current = null;
      fogHolesRef.current = null;
      fogMaskBgRef.current = null;
      fogRectRef.current = null;
      markersLayerRef.current = null;
      map.remove();
      mapRef.current = null;
      fittedKeyRef.current = null;
      lastFocusTokenRef.current = 0;
    };
  }, [reactId]);

  // Keep markers + fog holes in sync with places / selection.
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!mapIsAlive(map) || !markersLayer) return;

    markersLayer.clearLayers();
    const icon = createPlaceIcon();

    for (const place of places) {
      const marker = L.marker([place.lat, place.lon], {
        icon,
        opacity: selectedPlaceId === place.id ? 1 : 0.9,
      });
      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        suppressMapClickRef.current = true;
        onSelectPlaceRef.current(place.id);
      });
      marker.addTo(markersLayer);
    }

    map.fire("viewreset");
  }, [places, selectedPlaceId]);

  // Fit bounds when the place set changes (not on every selection).
  useEffect(() => {
    const map = mapRef.current;
    if (!mapIsAlive(map)) return;

    const key = places.map((p) => `${p.id}:${p.lat}:${p.lon}`).join("|");
    if (fittedKeyRef.current === key) return;
    fittedKeyRef.current = key;

    if (places.length === 0) {
      map.setView(HK_CENTER, DEFAULT_ZOOM);
      return;
    }
    if (places.length === 1) {
      map.setView([places[0].lat, places[0].lon], 13);
      return;
    }
    const bounds = L.latLngBounds(
      places.map((place) => [place.lat, place.lon] as [number, number]),
    );
    map.fitBounds(bounds.pad(0.25));
  }, [places]);

  // Fly to a place when the places list requests focus.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapIsAlive(map) || !selectedPlaceId || focusToken <= 0) return;
    if (lastFocusTokenRef.current === focusToken) return;
    lastFocusTokenRef.current = focusToken;

    const place = places.find((entry) => entry.id === selectedPlaceId);
    if (!place) return;
    map.flyTo([place.lat, place.lon], Math.max(map.getZoom(), 14), {
      duration: 0.65,
    });
  }, [places, selectedPlaceId, focusToken]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", borderRadius: 8 }}
    />
  );
}
