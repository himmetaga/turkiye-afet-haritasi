import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AssemblyPoint, Earthquake } from '../types';
import { createPulsingDot } from './pulsingMarker';

const MAP_STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';
const MAP_STYLE_FALLBACK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export class MapEngine {
  private map: maplibregl.Map | null = null;
  private isLoaded = false;
  private userMarker: maplibregl.Marker | null = null;
  private earthquakeMarkers: maplibregl.Marker[] = [];
  private onAssemblyPointClickCallback?: (point: AssemblyPoint) => void;
  private onEarthquakeClickCallback?: (eq: Earthquake) => void;
  private onMapClickCallback?: (coords: [number, number]) => void;

  public async init(container: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      this.map = new maplibregl.Map({
        container,
        style: MAP_STYLE_DARK,
        center: [29.0275, 40.9885],
        zoom: 12,
        pitch: 52,
        bearing: -15,
        maxPitch: 75,
        attributionControl: false
      });

      this.map.addControl(new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
      }), 'bottom-right');

      this.map.on('error', (e) => {
        if (!this.isLoaded && e.error && e.error.message?.includes('style')) {
          this.map?.setStyle(MAP_STYLE_FALLBACK);
        }
      });

      this.map.on('load', () => {
        this.isLoaded = true;
        this.setupLayers();
        resolve();
      });

      this.map.on('click', (e) => {
        const features = this.map?.queryRenderedFeatures(e.point, {
          layers: ['assembly-core', 'assembly-glow']
        });
        if (!features || features.length === 0) {
          if (this.onMapClickCallback) {
            this.onMapClickCallback([e.lngLat.lng, e.lngLat.lat]);
          }
        }
      });
    });
  }

  private setupLayers(): void {
    if (!this.map) return;

    this.setup3DBuildings();

    // Setup pulsing image
    try {
      const redDot = createPulsingDot(this.map, 100, [239, 68, 68]);
      const amberDot = createPulsingDot(this.map, 80, [245, 158, 11]);
      if (!this.map.hasImage('pulsing-red')) {
        this.map.addImage('pulsing-red', redDot, { pixelRatio: 2 });
      }
      if (!this.map.hasImage('pulsing-amber')) {
        this.map.addImage('pulsing-amber', amberDot, { pixelRatio: 2 });
      }
    } catch {}

    // Assembly Points Source
    this.map.addSource('assembly-points', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    // Glowing halo
    this.map.addLayer({
      id: 'assembly-glow',
      type: 'circle',
      source: 'assembly-points',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 8, 14, 18, 18, 28],
        'circle-color': '#10B981',
        'circle-blur': 0.7,
        'circle-opacity': 0.55
      }
    });

    // Core point
    this.map.addLayer({
      id: 'assembly-core',
      type: 'circle',
      source: 'assembly-points',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 14, 7, 18, 10],
        'circle-color': '#10B981',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.95
      }
    });

    // 3D Pillar Extrusions for Assembly Zones
    this.map.addLayer({
      id: 'assembly-3d-pillars',
      type: 'fill-extrusion',
      source: 'assembly-points',
      minzoom: 13,
      paint: {
        'fill-extrusion-color': '#10B981',
        'fill-extrusion-height': 45,
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.4
      }
    });

    // Route Sources & Layers
    this.map.addSource('walking-route', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    this.map.addLayer({
      id: 'walking-route-glow',
      type: 'line',
      source: 'walking-route',
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#10B981',
        'line-width': 8,
        'line-opacity': 0.35,
        'line-blur': 3
      }
    });

    this.map.addLayer({
      id: 'walking-route-line',
      type: 'line',
      source: 'walking-route',
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#34D399',
        'line-width': 3.5,
        'line-dasharray': [1.5, 2]
      }
    });

    // Interaction cursor
    this.map.on('mouseenter', 'assembly-core', () => {
      if (this.map) this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'assembly-core', () => {
      if (this.map) this.map.getCanvas().style.cursor = '';
    });

    this.map.on('click', 'assembly-core', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const props = feat.properties as any;
      const coords = (feat.geometry as any).coordinates as [number, number];

      const point: AssemblyPoint = {
        id: props.id || String(feat.id),
        name: props.name,
        city: props.city,
        district: props.district,
        coordinates: coords,
        capacity: Number(props.capacity || 0),
        areaSqM: Number(props.areaSqM || 0),
        hasWater: props.hasWater === true || props.hasWater === 'true',
        hasElectricity: props.hasElectricity === true || props.hasElectricity === 'true',
        hasTentArea: props.hasTentArea === true || props.hasTentArea === 'true',
        hasGenerator: props.hasGenerator === true || props.hasGenerator === 'true'
      };

      if (this.onAssemblyPointClickCallback) {
        this.onAssemblyPointClickCallback(point);
      }
    });
  }

  private setup3DBuildings(): void {
    if (!this.map) return;
    const layers = this.map.getStyle().layers || [];
    let labelLayerId: string | undefined;

    for (const layer of layers) {
      if (layer.type === 'symbol' && layer.layout && (layer.layout as any)['text-field']) {
        labelLayerId = layer.id;
        break;
      }
    }

    const sources = this.map.getStyle().sources;
    const vectorSourceId = Object.keys(sources).find((k) => sources[k].type === 'vector');

    if (vectorSourceId) {
      this.map.addLayer(
        {
          id: '3d-buildings',
          source: vectorSourceId,
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 13,
          paint: {
            'fill-extrusion-color': [
              'interpolate',
              ['linear'],
              ['get', 'render_height'],
              0, '#0c0e17',
              20, '#151926',
              60, '#1d2335',
              120, '#273049'
            ],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              13, 0,
              14, ['case', ['has', 'render_height'], ['get', 'render_height'], ['has', 'height'], ['get', 'height'], 18]
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              13, 0,
              14, ['case', ['has', 'render_min_height'], ['get', 'render_min_height'], 0]
            ],
            'fill-extrusion-opacity': 0.88
          }
        },
        labelLayerId
      );
    }
  }

  public setAssemblyPoints(points: AssemblyPoint[]): void {
    if (!this.map || !this.isLoaded) return;
    const source = this.map.getSource('assembly-points') as maplibregl.GeoJSONSource;
    if (!source) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: points.map((p) => {
        // create a small hexagonal 3D pillar around the coordinates
        const [lon, lat] = p.coordinates;
        const d = 0.00035; // approx 35 meters
        const polygon = [
          [lon - d, lat - d * 0.7],
          [lon, lat - d],
          [lon + d, lat - d * 0.7],
          [lon + d, lat + d * 0.7],
          [lon, lat + d],
          [lon - d, lat + d * 0.7],
          [lon - d, lat - d * 0.7]
        ];

        return {
          type: 'Feature',
          id: p.id,
          geometry: {
            type: 'Polygon',
            coordinates: [polygon]
          },
          properties: {
            ...p
          }
        };
      })
    };

    source.setData(geojson);
  }

  public setEarthquakes(earthquakes: Earthquake[]): void {
    if (!this.map) return;

    // Clear old markers
    for (const m of this.earthquakeMarkers) {
      m.remove();
    }
    this.earthquakeMarkers = [];

    earthquakes.forEach((eq) => {
      const isMajor = eq.mag >= 4.0;
      const el = document.createElement('div');
      el.className = 'earthquake-seismic-pulse';
      el.innerHTML = `
        <div class="seismic-ring ${isMajor ? 'ring-red' : 'ring-amber'}"></div>
        <div class="seismic-core ${isMajor ? 'core-red' : 'core-amber'}">
          <span>${eq.mag.toFixed(1)}</span>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onEarthquakeClickCallback) {
          this.onEarthquakeClickCallback(eq);
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(eq.coordinates)
        .addTo(this.map!);

      this.earthquakeMarkers.push(marker);
    });
  }

  public drawRoute(from: [number, number], to: [number, number]): void {
    if (!this.map || !this.isLoaded) return;
    const source = this.map.getSource('walking-route') as maplibregl.GeoJSONSource;
    if (!source) return;

    // Slight realistic arc for aesthetics
    const midLng = (from[0] + to[0]) / 2 + (to[1] - from[1]) * 0.08;
    const midLat = (from[1] + to[1]) / 2 - (to[0] - from[0]) * 0.08;

    source.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [from, [midLng, midLat], to]
          },
          properties: {}
        }
      ]
    });
  }

  public clearRoute(): void {
    if (!this.map || !this.isLoaded) return;
    const source = this.map.getSource('walking-route') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  }

  public setUserLocation(coords: [number, number], heading?: number): void {
    if (!this.map) return;

    if (!this.userMarker) {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.innerHTML = `
        <div class="user-pulse"></div>
        <div class="user-dot">
          <div class="user-heading" style="transform: rotate(${heading || 0}deg);"></div>
        </div>
      `;
      this.userMarker = new maplibregl.Marker({ element: el })
        .setLngLat(coords)
        .addTo(this.map);
    } else {
      this.userMarker.setLngLat(coords);
      const headingEl = this.userMarker.getElement().querySelector('.user-heading') as HTMLElement;
      if (headingEl && heading !== undefined) {
        headingEl.style.transform = `rotate(${heading}deg)`;
      }
    }
  }

  public flyTo(
    coords: [number, number],
    zoom = 15.5,
    pitch = 56,
    bearing = -20
  ): void {
    if (!this.map) return;
    this.map.flyTo({
      center: coords,
      zoom,
      pitch,
      bearing,
      essential: true,
      curve: 1.3,
      speed: 1.1
    });
  }

  public fitBounds(bounds: [[number, number], [number, number]]): void {
    if (!this.map) return;
    this.map.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 360, right: 80 },
      maxZoom: 16
    });
  }

  public onAssemblyPointClick(cb: (point: AssemblyPoint) => void): void {
    this.onAssemblyPointClickCallback = cb;
  }

  public onEarthquakeClick(cb: (eq: Earthquake) => void): void {
    this.onEarthquakeClickCallback = cb;
  }

  public onMapClick(cb: (coords: [number, number]) => void): void {
    this.onMapClickCallback = cb;
  }

  public getMapInstance(): maplibregl.Map | null {
    return this.map;
  }
}
