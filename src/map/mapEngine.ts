import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AssemblyPoint, Earthquake, FaultLine, EmergencyFacility, ObstaclePoint } from '../types';
import { createPulsingDot } from './pulsingMarker';
import { generateSafeEvacuationRoute } from '../utils/geoMath';
import { fetchWalkingRoute, WalkingRouteResult } from '../services/routingService';
import { filterPharmaciesBySchedule } from '../utils/pharmacySchedule';
import { FeltReport } from '../services/feltReportsService';

const MAP_STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';
const MAP_STYLE_FALLBACK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export class MapEngine {
  private map: maplibregl.Map | null = null;
  private isLoaded = false;
  private userMarker: maplibregl.Marker | null = null;
  private destinationMarker: maplibregl.Marker | null = null;
  private earthquakeMarkers: maplibregl.Marker[] = [];
  private obstacleMarkers: maplibregl.Marker[] = [];

  private pendingAssemblyPoints: AssemblyPoint[] | null = null;
  private pendingEarthquakes: Earthquake[] | null = null;
  private pendingFaultLines: FaultLine[] | null = null;
  private pendingFacilities: EmergencyFacility[] | null = null;
  private allFacilities: EmergencyFacility[] = [];
  private showHospitals = true;
  private showPharmacies = true;
  private onlyDutyPharmacies = true;

  private onAssemblyPointClickCallback?: (point: AssemblyPoint) => void;
  private onEarthquakeClickCallback?: (eq: Earthquake) => void;
  private onFaultLineClickCallback?: (fault: FaultLine) => void;
  private onFacilityClickCallback?: (facility: EmergencyFacility) => void;
  private onMapClickCallback?: (coords: [number, number]) => void;

  public async init(container: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      this.map = new maplibregl.Map({
        container,
        style: MAP_STYLE_DARK,
        center: [29.03367, 40.98527],
        zoom: 15,
        pitch: 52,
        bearing: -15,
        maxPitch: 75,
        attributionControl: false
      });

      this.map.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        }),
        'bottom-right'
      );

      this.map.on('error', (e) => {
        if (!this.isLoaded && e.error && e.error.message?.includes('style')) {
          this.map?.setStyle(MAP_STYLE_FALLBACK);
        }
      });

      this.map.on('load', () => {
        this.isLoaded = true;
        this.setupLayers();

        // Flush any pending data
        if (this.pendingAssemblyPoints) {
          this.setAssemblyPoints(this.pendingAssemblyPoints);
          this.pendingAssemblyPoints = null;
        }
        if (this.pendingEarthquakes) {
          this.setEarthquakes(this.pendingEarthquakes);
          this.pendingEarthquakes = null;
        }
        if (this.pendingFaultLines) {
          this.setFaultLines(this.pendingFaultLines);
          this.pendingFaultLines = null;
        }
        if (this.pendingFacilities) {
          this.setEmergencyFacilities(this.pendingFacilities);
          this.pendingFacilities = null;
        }

        resolve();
      });

      // Safety timeout: don't block UI if tile network is slow or offline
      setTimeout(() => {
        resolve();
      }, 3000);

      this.map.on('click', (e) => {
        const features = this.map?.queryRenderedFeatures(e.point, {
          layers: ['assembly-core', 'assembly-glow', 'facility-core', 'fault-lines-core']
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

    // 1. Fault Lines Source & Layers
    this.map.addSource('fault-lines', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    this.map.addLayer({
      id: 'fault-lines-glow',
      type: 'line',
      source: 'fault-lines',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#EF4444',
        'line-width': 7,
        'line-opacity': 0.45,
        'line-blur': 3
      }
    });

    this.map.addLayer({
      id: 'fault-lines-core',
      type: 'line',
      source: 'fault-lines',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#FCA5A5',
        'line-width': 2.5,
        'line-dasharray': [3, 1]
      }
    });

    // 2. Emergency Facilities (Hospitals, Blood Centers, Pharmacies)
    this.map.addSource('emergency-facilities', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    this.map.addLayer({
      id: 'facility-glow',
      type: 'circle',
      source: 'emergency-facilities',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 7, 14, 16, 18, 24],
        'circle-color': [
          'match',
          ['get', 'category'],
          'hospital', '#06B6D4',
          'blood_center', '#EF4444',
          'pharmacy', '#F59E0B',
          '#3B82F6'
        ],
        'circle-blur': 0.6,
        'circle-opacity': 0.6
      }
    });

    this.map.addLayer({
      id: 'facility-core',
      type: 'circle',
      source: 'emergency-facilities',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 14, 8, 18, 12],
        'circle-color': [
          'match',
          ['get', 'category'],
          'hospital', '#06B6D4',
          'blood_center', '#EF4444',
          'pharmacy', '#F59E0B',
          '#3B82F6'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#FFFFFF',
        'circle-opacity': 0.98
      }
    });

    this.map.addLayer({
      id: 'facility-label',
      type: 'symbol',
      source: 'emergency-facilities',
      minzoom: 12.5,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-offset': [0, 1.3],
        'text-anchor': 'top',
        'text-max-width': 12
      },
      paint: {
        'text-color': '#FFFFFF',
        'text-halo-color': '#090A0F',
        'text-halo-width': 2.5
      }
    });

    // 3. Assembly Points Source & Layers (Point Geometries)
    this.map.addSource('assembly-points', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    this.map.addLayer({
      id: 'assembly-glow',
      type: 'circle',
      source: 'assembly-points',
      minzoom: 8.5,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8.5, 6, 14, 18, 18, 28],
        'circle-color': '#10B981',
        'circle-blur': 0.65,
        'circle-opacity': 0.6
      }
    });

    this.map.addLayer({
      id: 'assembly-core',
      type: 'circle',
      source: 'assembly-points',
      minzoom: 8.5,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8.5, 4, 14, 8.5, 18, 12],
        'circle-color': '#10B981',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#FFFFFF',
        'circle-opacity': 0.98
      }
    });

    this.map.addLayer({
      id: 'assembly-label',
      type: 'symbol',
      source: 'assembly-points',
      minzoom: 12.5,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-offset': [0, 1.3],
        'text-anchor': 'top',
        'text-max-width': 14
      },
      paint: {
        'text-color': '#34D399',
        'text-halo-color': '#090A0F',
        'text-halo-width': 2.5
      }
    });

    // 4. 3D Assembly Area Pillars (Polygons)
    this.map.addSource('assembly-pillars', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    this.map.addLayer({
      id: 'assembly-3d-extrusions',
      type: 'fill-extrusion',
      source: 'assembly-pillars',
      minzoom: 13,
      paint: {
        'fill-extrusion-color': '#10B981',
        'fill-extrusion-height': 2.5,
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.35
      }
    });

    // 5. Walking Route Source & Layers
    this.map.addSource('walking-route', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    this.map.addLayer({
      id: 'walking-route-glow',
      type: 'line',
      source: 'walking-route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#10B981',
        'line-width': 10,
        'line-opacity': 0.6,
        'line-blur': 3
      }
    });

    this.map.addLayer({
      id: 'walking-route-line',
      type: 'line',
      source: 'walking-route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#34D399',
        'line-width': 4.5,
        'line-dasharray': [2, 1.5]
      }
    });

    // 6. Seismic Early Warning Wavefronts (P-Wave & S-Wave)
    this.map.addSource('early-warning-waves', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    this.map.addLayer({
      id: 's-wave-fill',
      type: 'fill',
      source: 'early-warning-waves',
      filter: ['==', ['get', 'waveType'], 'S'],
      paint: {
        'fill-color': '#EF4444',
        'fill-opacity': 0.12
      }
    });

    this.map.addLayer({
      id: 's-wave-stroke',
      type: 'line',
      source: 'early-warning-waves',
      filter: ['==', ['get', 'waveType'], 'S'],
      paint: {
        'line-color': '#EF4444',
        'line-width': 3.5,
        'line-opacity': 0.9
      }
    });

    this.map.addLayer({
      id: 'p-wave-stroke',
      type: 'line',
      source: 'early-warning-waves',
      filter: ['==', ['get', 'waveType'], 'P'],
      paint: {
        'line-color': '#38BDF8',
        'line-width': 2.5,
        'line-dasharray': [3, 2],
        'line-opacity': 0.85
      }
    });

    // Cursor interactions
    const interactiveLayers = ['assembly-core', 'facility-core', 'fault-lines-core'];
    for (const l of interactiveLayers) {
      this.map.on('mouseenter', l, () => {
        if (this.map) this.map.getCanvas().style.cursor = 'pointer';
      });
      this.map.on('mouseleave', l, () => {
        if (this.map) this.map.getCanvas().style.cursor = '';
      });
    }

    // Assembly point click
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

    // Facility click
    this.map.on('click', 'facility-core', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const props = feat.properties as any;
      const coords = (feat.geometry as any).coordinates as [number, number];

      const fac: EmergencyFacility = {
        id: props.id || String(feat.id),
        name: props.name,
        category: props.category,
        city: props.city,
        district: props.district,
        neighborhood: props.neighborhood,
        address: props.address,
        phone: props.phone,
        typeText: props.typeText,
        emergencyBeds: Number(props.emergencyBeds || 0),
        hasTraumaCenter: props.hasTraumaCenter === true || props.hasTraumaCenter === 'true',
        helipad: props.helipad === true || props.helipad === 'true',
        coordinates: coords,
        isDuty: props.isDuty === true || props.isDuty === 'true',
        closingHour: props.closingHour
      };

      if (this.onFacilityClickCallback) {
        this.onFacilityClickCallback(fac);
      }
    });

    // Fault line click
    this.map.on('click', 'fault-lines-core', (e) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const props = feat.properties as any;
      const geom = feat.geometry as any;

      const fault: FaultLine = {
        id: props.id || String(feat.id),
        name: props.name,
        zone: props.zone,
        slipRateMmYear: Number(props.slipRateMmYear || 0),
        riskLevel: props.riskLevel || 'high',
        description: props.description || '',
        coordinates: geom.coordinates
      };

      if (this.onFaultLineClickCallback) {
        this.onFaultLineClickCallback(fault);
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
    if (!this.map || !this.isLoaded) {
      this.pendingAssemblyPoints = points;
      return;
    }

    const pointSource = this.map.getSource('assembly-points') as maplibregl.GeoJSONSource;
    if (pointSource) {
      pointSource.setData({
        type: 'FeatureCollection',
        features: points.map((p) => ({
          type: 'Feature',
          id: p.id,
          geometry: {
            type: 'Point',
            coordinates: p.coordinates
          },
          properties: { ...p }
        }))
      });
    }

    const pillarSource = this.map.getSource('assembly-pillars') as maplibregl.GeoJSONSource;
    if (pillarSource) {
      // Pil ve GPU tasarrufu: 2000 yerine yalnızca en yakın 120 toplanma alanına 3D prizma uygula
      pillarSource.setData({
        type: 'FeatureCollection',
        features: points.slice(0, 120).map((p) => {
          const [lon, lat] = p.coordinates;
          const d = 0.00035;
          const polygon = [
            [lon - d, lat - d * 0.7],
            [lon, lat - d],
            [lon + d, lat - d * 0.7],
            [lon + d, lat + d * 0.7],
            [lon + d, lat + d * 0.7],
            [lon - d, lat + d * 0.7],
            [lon - d, lat - d * 0.7]
          ];
          return {
            type: 'Feature',
            id: `pillar-${p.id}`,
            geometry: {
              type: 'Polygon',
              coordinates: [polygon]
            },
            properties: { ...p }
          };
        })
      });
    }
  }

  public setFaultLines(faults: FaultLine[]): void {
    if (!this.map || !this.isLoaded) {
      this.pendingFaultLines = faults;
      return;
    }
    const source = this.map.getSource('fault-lines') as maplibregl.GeoJSONSource;
    if (!source) return;

    source.setData({
      type: 'FeatureCollection',
      features: faults.map((f) => ({
        type: 'Feature',
        id: f.id,
        geometry: {
          type: 'LineString',
          coordinates: f.coordinates
        },
        properties: { ...f }
      }))
    });
  }

  public setEmergencyFacilities(facilities: EmergencyFacility[], onlyDutyAfterHours = true): void {
    this.allFacilities = facilities;
    this.onlyDutyPharmacies = onlyDutyAfterHours;
    if (!this.map || !this.isLoaded) {
      this.pendingFacilities = facilities;
      return;
    }
    this.refreshFacilitiesSource();
  }

  public updateFacilityFilters(filters: {
    showHospitals?: boolean;
    showPharmacies?: boolean;
    onlyDutyPharmacies?: boolean;
  }): void {
    if (filters.showHospitals !== undefined) this.showHospitals = filters.showHospitals;
    if (filters.showPharmacies !== undefined) this.showPharmacies = filters.showPharmacies;
    if (filters.onlyDutyPharmacies !== undefined) this.onlyDutyPharmacies = filters.onlyDutyPharmacies;
    this.refreshFacilitiesSource();
  }

  private refreshFacilitiesSource(): void {
    if (!this.map || !this.isLoaded) return;
    const source = this.map.getSource('emergency-facilities') as maplibregl.GeoJSONSource;
    if (!source) return;

    let list = this.allFacilities;
    if (!this.showHospitals) {
      list = list.filter((f) => f.category !== 'hospital' && f.category !== 'blood_center');
    }
    if (!this.showPharmacies) {
      list = list.filter((f) => f.category !== 'pharmacy');
    } else {
      list = filterPharmaciesBySchedule(list, this.onlyDutyPharmacies);
    }

    source.setData({
      type: 'FeatureCollection',
      features: list.map((f) => ({
        type: 'Feature',
        id: f.id,
        geometry: {
          type: 'Point',
          coordinates: f.coordinates
        },
        properties: { ...f }
      }))
    });
  }

  public setEarthquakes(earthquakes: Earthquake[]): void {
    if (!this.map) {
      this.pendingEarthquakes = earthquakes;
      return;
    }

    for (const m of this.earthquakeMarkers) {
      m.remove();
    }
    this.earthquakeMarkers = [];

    earthquakes.forEach((eq, index) => {
      const isLatest = index === 0;
      const isMajor = eq.mag >= 4.0;
      const el = document.createElement('div');

      if (isLatest) {
        // En son gerçekleşen deprem: Dikkat çeken dinamik sismik halka
        el.className = 'earthquake-seismic-pulse';
        el.innerHTML = `
          <div class="seismic-ring ${isMajor ? 'ring-red' : 'ring-amber'}"></div>
          <div class="seismic-core ${isMajor ? 'core-red' : 'core-amber'}">
            <span>${eq.mag.toFixed(1)}</span>
          </div>
        `;
      } else {
        // Önceki depremler: Haritada kalabalık yapmayan sakin, sabit gösterge
        el.className = 'earthquake-marker-static';
        el.innerHTML = `
          <div class="seismic-core-static ${isMajor ? 'core-red-static' : 'core-amber-static'}">
            <span>${eq.mag.toFixed(1)}</span>
          </div>
        `;
      }

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

  public async drawWalkingRoute(
    from: [number, number],
    to: [number, number],
    _obstacles: ObstaclePoint[] = []
  ): Promise<WalkingRouteResult> {
    const route = await fetchWalkingRoute(from, to);

    if (this.map && this.isLoaded) {
      const source = this.map.getSource('walking-route') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: route.coordinates
              },
              properties: {
                distanceMeters: route.distanceMeters,
                durationMinutes: route.durationMinutes
              }
            }
          ]
        });
      }

      // Add or update destination marker
      if (!this.destinationMarker) {
        const el = document.createElement('div');
        el.className = 'destination-flag-marker';
        el.innerHTML = `
          <div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-obsidian-950 text-sm font-bold shadow-glow-emerald">
            🎯
          </div>
        `;
        this.destinationMarker = new maplibregl.Marker({ element: el })
          .setLngLat(to)
          .addTo(this.map);
      } else {
        this.destinationMarker.setLngLat(to);
      }

      if (route.coordinates.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        for (const c of route.coordinates) {
          bounds.extend(c);
        }
        this.map.fitBounds(bounds, {
          padding: { top: 90, bottom: 140, left: 60, right: 380 },
          maxZoom: 16.5,
          duration: 900
        });
      }
    }

    return route;
  }

  public drawRoute(
    from: [number, number],
    to: [number, number],
    obstacles: ObstaclePoint[] = []
  ): void {
    this.drawWalkingRoute(from, to, obstacles).catch(() => {});
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
    if (this.destinationMarker) {
      this.destinationMarker.remove();
      this.destinationMarker = null;
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

  public setObstacles(obstacles: ObstaclePoint[]): void {
    if (!this.map) return;
    for (const m of this.obstacleMarkers) m.remove();
    this.obstacleMarkers = [];

    for (const obs of obstacles) {
      const el = document.createElement('div');
      el.className = 'obstacle-marker-container';
      el.innerHTML = `
        <div class="w-7 h-7 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-glow-red animate-pulse">
          ⚠️
        </div>
      `;
      const m = new maplibregl.Marker({ element: el })
        .setLngLat(obs.coordinates)
        .addTo(this.map);
      this.obstacleMarkers.push(m);
    }
  }

  public toggleLayer(layerId: string, visible: boolean): void {
    if (!this.map || !this.isLoaded) return;
    const val = visible ? 'visible' : 'none';
    if (this.map.getLayer(layerId)) {
      this.map.setLayoutProperty(layerId, 'visibility', val);
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

  public onAssemblyPointClick(cb: (point: AssemblyPoint) => void): void {
    this.onAssemblyPointClickCallback = cb;
  }

  public onEarthquakeClick(cb: (eq: Earthquake) => void): void {
    this.onEarthquakeClickCallback = cb;
  }

  public onFaultLineClick(cb: (fault: FaultLine) => void): void {
    this.onFaultLineClickCallback = cb;
  }

  public onFacilityClick(cb: (facility: EmergencyFacility) => void): void {
    this.onFacilityClickCallback = cb;
  }

  public onMapClick(cb: (coords: [number, number]) => void): void {
    this.onMapClickCallback = cb;
  }

  public updateEarlyWarningWaves(center: [number, number], pRadiusKm: number, sRadiusKm: number): void {
    if (!this.map || !this.isLoaded) return;
    const source = this.map.getSource('early-warning-waves') as maplibregl.GeoJSONSource;
    if (!source) return;

    const pPolygon = this.createCirclePolygon(center, pRadiusKm);
    const sPolygon = this.createCirclePolygon(center, sRadiusKm);

    source.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [pPolygon] },
          properties: { waveType: 'P', radiusKm: pRadiusKm }
        },
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [sPolygon] },
          properties: { waveType: 'S', radiusKm: sRadiusKm }
        }
      ]
    });
  }

  public clearEarlyWarningWaves(): void {
    if (!this.map || !this.isLoaded) return;
    const source = this.map.getSource('early-warning-waves') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }

  public setFeltReports(_reports: FeltReport[]): void {
    // Community reports are excluded from the map canvas to prevent visual clutter
  }

  private createCirclePolygon(center: [number, number], radiusKm: number, points = 48): [number, number][] {
    if (radiusKm <= 0.1) return [];
    const coords: [number, number][] = [];
    const [lon, lat] = center;
    const earthRadiusKm = 6371;

    for (let i = 0; i <= points; i++) {
      const angle = (i * 2 * Math.PI) / points;
      const dLat = (radiusKm / earthRadiusKm) * (180 / Math.PI) * Math.cos(angle);
      const dLon = ((radiusKm / earthRadiusKm) * (180 / Math.PI) * Math.sin(angle)) / Math.cos((lat * Math.PI) / 180);
      coords.push([lon + dLon, lat + dLat]);
    }
    return coords;
  }

  public getMapInstance(): maplibregl.Map | null {
    return this.map;
  }
}
