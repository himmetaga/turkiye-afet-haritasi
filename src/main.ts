import './index.css';
import { MapEngine } from './map/mapEngine';
import { AssemblyPoint, Earthquake, FaultLine, EmergencyFacility, ObstaclePoint } from './types';
import { fetchLiveEarthquakes } from './services/earthquakeService';
import { findNearestAssemblyPoints, findNearestFaultLine, haversineDistanceMeters } from './utils/geoMath';
import { HeaderHUD, SearchResultItem } from './ui/HeaderHUD';
import { NearestPointsHUD } from './ui/NearestPointsHUD';
import { PointDetailHUD } from './ui/PointDetailHUD';
import { EmergencySOSModal } from './ui/EmergencySOSModal';
import { OfflineSyncHUD } from './ui/OfflineSyncHUD';
import { SeismicFeedHUD } from './ui/SeismicFeedHUD';
import { OfflineNotificationToast } from './ui/OfflineNotificationToast';
import { EmergencyBagHUD } from './ui/EmergencyBagHUD';
import { FamilySafetyHUD } from './ui/FamilySafetyHUD';
import { LayerControlHUD } from './ui/LayerControlHUD';
import { RouteNavigationHUD } from './ui/RouteNavigationHUD';
import { filterPharmaciesBySchedule } from './utils/pharmacySchedule';
import { livePharmacyService } from './services/livePharmacyService';

import { EarlyWarningHUD } from './ui/EarlyWarningHUD';
import { earlyWarningEngine } from './services/earlyWarningEngine';
import { SeismographModal } from './ui/SeismographModal';
import { EmergencyWhistleModal } from './ui/EmergencyWhistleModal';
import { FeltReportModal } from './ui/FeltReportModal';
import { feltReportsService } from './services/feltReportsService';
import { CrisisChatHUD } from './ui/CrisisChatHUD';
import { NightWatchHUD } from './ui/NightWatchHUD';
import { BuildingRiskModal } from './ui/BuildingRiskModal';
import { OfflineQRPackModal } from './ui/OfflineQRPackModal';
import { DrillSimulator } from './simulation/DrillSimulator';
import { ApartmentPosterGenerator } from './ui/ApartmentPosterGenerator';
import { SocialShareCard } from './ui/SocialShareCard';
import { LockScreenICEGenerator } from './ui/LockScreenICEGenerator';
import { DisasterSurvivalGuideModal } from './ui/DisasterSurvivalGuideModal';
import { QuickEmergencySMSModal } from './ui/QuickEmergencySMSModal';
import { FloodRadarModal } from './ui/FloodRadarModal';
import { EmergencyRadioModal } from './ui/EmergencyRadioModal';
import { TriageModal } from './ui/TriageModal';
import { AirQualityRadarModal } from './ui/AirQualityRadarModal';
import { TsunamiRadarModal } from './ui/TsunamiRadarModal';
import { BloodCenterModal } from './ui/BloodCenterModal';
import { TourniquetTimerModal } from './ui/TourniquetTimerModal';
import { EmergencyPrescriptionModal } from './ui/EmergencyPrescriptionModal';
import { HomeHazardHuntModal } from './ui/HomeHazardHuntModal';
import { FieldAidCoordinationModal } from './ui/FieldAidCoordinationModal';
import { PetDisasterSafetyModal } from './ui/PetDisasterSafetyModal';
import { TentHeatingSafetyModal } from './ui/TentHeatingSafetyModal';
import { UltraBatterySaverModal } from './ui/UltraBatterySaverModal';
import { PsychologicalFirstAidModal } from './ui/PsychologicalFirstAidModal';
import { AcousticDebrisListenerModal } from './ui/AcousticDebrisListenerModal';
import { OfflineMapPackModal } from './ui/OfflineMapPackModal';
import { FieldCampStatusModal } from './ui/FieldCampStatusModal';
import { InfantFeedingSafetyModal } from './ui/InfantFeedingSafetyModal';
import { Icons } from './ui/icons';
import { bitChatService } from './services/bitChatService';
import { parseDeepLink, ParsedDeepLink } from './utils/deepLink';

class DisasterAtlasApp {
  private mapEngine: MapEngine;
  private assemblyPoints: AssemblyPoint[] = [];
  private earthquakes: Earthquake[] = [];
  private faultLines: FaultLine[] = [];
  private facilities: EmergencyFacility[] = [];
  private obstacles: ObstaclePoint[] = [];
  private userCoords: [number, number] = [29.03367, 40.98527]; // Kadıköy/İstanbul (Yoğurtçu Parkı çevresi)
  private selectedPoint: AssemblyPoint | null = null;
  private onlyDutyPharmacies = true;
  private deepLink: ParsedDeepLink = parseDeepLink();

  private headerHUD!: HeaderHUD;
  private nearestHUD!: NearestPointsHUD;
  private detailHUD!: PointDetailHUD;
  private navHUD!: RouteNavigationHUD;
  private sosModal!: EmergencySOSModal;
  private bagHUD!: EmergencyBagHUD;
  private familyHUD!: FamilySafetyHUD;
  private layerHUD!: LayerControlHUD;
  private offlineSyncHUD!: OfflineSyncHUD;
  private seismicFeedHUD!: SeismicFeedHUD;
  private notificationToast!: OfflineNotificationToast;

  private earlyWarningHUD!: EarlyWarningHUD;
  private seismographModal!: SeismographModal;
  private whistleModal!: EmergencyWhistleModal;
  private feltModal!: FeltReportModal;
  private crisisHUD!: CrisisChatHUD;
  private nightWatchHUD!: NightWatchHUD;
  private buildingRiskModal!: BuildingRiskModal;
  private qrPackModal!: OfflineQRPackModal;
  private drillSimulator!: DrillSimulator;
  private apartmentPoster!: ApartmentPosterGenerator;
  private familyCard!: SocialShareCard;
  private iceGenerator!: LockScreenICEGenerator;
  private survivalGuide!: DisasterSurvivalGuideModal;
  private emergencySMS!: QuickEmergencySMSModal;
  private floodRadarModal!: FloodRadarModal;
  private emergencyRadioModal!: EmergencyRadioModal;
  private triageModal!: TriageModal;
  private airQualityModal!: AirQualityRadarModal;
  private tsunamiModal!: TsunamiRadarModal;
  private bloodCenterModal!: BloodCenterModal;
  private tourniquetModal!: TourniquetTimerModal;
  private medPassportModal!: EmergencyPrescriptionModal;
  private hazardHuntModal!: HomeHazardHuntModal;
  private fieldAidModal!: FieldAidCoordinationModal;
  private petSafetyModal!: PetDisasterSafetyModal;
  private tentHeatingModal!: TentHeatingSafetyModal;
  private batterySaverModal!: UltraBatterySaverModal;
  private psychFirstAidModal!: PsychologicalFirstAidModal;
  private acousticListenerModal!: AcousticDebrisListenerModal;
  private offlineMapModal!: OfflineMapPackModal;
  private campStatusModal!: FieldCampStatusModal;
  private infantFeedingModal!: InfantFeedingSafetyModal;

  constructor() {
    this.mapEngine = new MapEngine();
  }

  public async bootstrap(): Promise<void> {
    // Instant Synchronous SEO Title & Meta Resolution for Deep Links / Crawlers
    if (this.deepLink.city) {
      const cityCapitalized = this.deepLink.city.charAt(0).toUpperCase() + this.deepLink.city.slice(1);
      document.title = `${cityCapitalized} Deprem, Sel ve Toplanma Alanları — afet.live`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          `${cityCapitalized} genelinde AFAD toplanma alanları, acil servis hastaneleri, nöbetçi eczaneler ve diri fay hattı analizi. afet.live ile internetsiz çevrimdışı harita.`
        );
      }
    } else if (this.deepLink.mod) {
      const titles: Record<string, string> = {
        'duduk': 'Afet Düdüğü (2.9 kHz SOS) — afet.live',
        'gece-nobeti': 'Gece Sismograf Nöbeti (Başucu Deprem Alarmı) — afet.live',
        'bina-risk': 'Bina Sismik Risk Kartı ve Diri Fay Analizi — afet.live',
        'afis': 'Apartman Acil Durum Afişi Üretici (A4 Çıktı) — afet.live',
        'kart': 'Aile Afet Buluşma Planı Kartı — afet.live',
        'tatbikat': 'Deprem Tatbikat Simülatörü — afet.live',
        'canta': 'Deprem Çantası Malzeme Kontrol Listesi — afet.live',
        'qr': 'Çevrimdışı Güvendeyim QR Durum Paketi — afet.live',
        'sismograf': 'Canlı Sismograf ve İvmeölçer — afet.live',
        'kriz': 'Afet Kriz Koordinasyon Masası — afet.live'
      };
      if (titles[this.deepLink.mod]) {
        document.title = titles[this.deepLink.mod];
      }
    }

    const appEl = document.getElementById('app')!;
    const mapContainer = document.getElementById('map-container')!;
    appEl.querySelectorAll('header').forEach((el) => el.remove());

    this.notificationToast = new OfflineNotificationToast(appEl);

    // 1. Initialize UI Modals & Drawers
    this.headerHUD = new HeaderHUD(appEl, {
      onSearchChange: (q) => this.handleSearch(q),
      onLocateMe: () => this.requestUserLocation(true, true),
      onToggleSeismic: () => this.toggleSeismicDrawer(),
      onToggleSOS: () => this.openSOSModal(),
      onToggleBag: () => this.bagHUD.show(),
      onToggleFamily: () => this.openFamilyModal(),
      onToggleLayers: () => this.layerHUD.toggle(),
      onSelectProvince: (prov) => this.handleProvinceSelect(prov),
      onToggleEarlyWarning: () => {
        this.notificationToast.show('Sismik erken uyarı ağı devrede.', false);
      },
      onToggleNightWatch: () => this.nightWatchHUD.show(),
      onToggleSeismograph: () => this.seismographModal.show(),
      onToggleBuildingRisk: () => this.buildingRiskModal.show(),
      onToggleDrill: () => this.drillSimulator.show(),
      onToggleApartmentPoster: () => this.apartmentPoster.show(),
      onToggleFamilyCard: () => this.familyCard.show(),
      onToggleWhistle: () => this.whistleModal.show(),
      onToggleFelt: () => this.feltModal.show(),
      onToggleCrisis: () => this.crisisHUD.show(),
      onToggleQRPack: () => this.qrPackModal.show(),
      onToggleICE: () => this.iceGenerator.show(),
      onToggleGuide: () => this.survivalGuide.show(),
      onToggleSMS: () => this.emergencySMS.show(),
      onToggleFloodRadar: () => this.floodRadarModal.show(),
      onToggleRadio: () => this.emergencyRadioModal.show(),
      onToggleTriage: () => this.triageModal.show(),
      onToggleAirQuality: () => this.airQualityModal.show(),
      onToggleTsunami: () => this.tsunamiModal.show(),
      onToggleBlood: () => this.bloodCenterModal.show(),
      onToggleTourniquet: () => this.tourniquetModal.show(),
      onToggleMedPassport: () => this.medPassportModal.show(),
      onToggleHazardHunt: () => this.hazardHuntModal.show(),
      onToggleFieldAid: () => this.fieldAidModal.show(),
      onTogglePetSafety: () => this.petSafetyModal.show(),
      onToggleTentHeating: () => this.tentHeatingModal.show(),
      onToggleBatterySaver: () => this.batterySaverModal.show(),
      onToggleAcousticListener: () => this.acousticListenerModal.show(),
      onToggleOfflineMapPack: () => this.offlineMapModal.show(),
      onTogglePsychFirstAid: () => this.psychFirstAidModal.show(),
      onToggleCampStatus: () => this.campStatusModal.show(),
      onToggleInfantFeeding: () => this.infantFeedingModal.show()
    });

    this.nearestHUD = new NearestPointsHUD(appEl, (point) => {
      this.focusPoint(point);
    });

    this.detailHUD = new PointDetailHUD(appEl, {
      onRoute: (point) => this.routeToPoint(point),
      onClose: () => {
        this.selectedPoint = null;
        this.clearActiveRoute();
      }
    });

    this.navHUD = new RouteNavigationHUD(appEl, {
      onClose: () => this.clearActiveRoute()
    });

    this.sosModal = new EmergencySOSModal(appEl);
    this.bagHUD = new EmergencyBagHUD(appEl);
    this.familyHUD = new FamilySafetyHUD(appEl);

    this.earlyWarningHUD = new EarlyWarningHUD(appEl, () => {
      if (this.assemblyPoints.length > 0) {
        const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
        if (nearest.length > 0) {
          this.focusPoint(nearest[0].point);
        }
      }
    });

    this.nightWatchHUD = new NightWatchHUD(appEl);
    this.buildingRiskModal = new BuildingRiskModal(appEl, this.userCoords, {
      onNavigateToPoint: (point) => this.focusPoint(point)
    });
    this.qrPackModal = new OfflineQRPackModal(appEl, this.userCoords);
    this.drillSimulator = new DrillSimulator(appEl, this.mapEngine, this.userCoords, this.assemblyPoints);
    this.apartmentPoster = new ApartmentPosterGenerator(appEl, this.userCoords, this.assemblyPoints, this.facilities);
    this.familyCard = new SocialShareCard(appEl, this.userCoords, this.assemblyPoints, this.facilities);
    this.iceGenerator = new LockScreenICEGenerator(appEl, this.userCoords, this.assemblyPoints);
    this.survivalGuide = new DisasterSurvivalGuideModal(appEl);
    this.emergencySMS = new QuickEmergencySMSModal(appEl, this.userCoords);
    this.floodRadarModal = new FloodRadarModal(appEl, this.userCoords);
    this.emergencyRadioModal = new EmergencyRadioModal(appEl);
    this.triageModal = new TriageModal(appEl, (text) => {
      this.crisisHUD.show();
      bitChatService.broadcastMessage(text, 'sos', {
        coordinates: this.userCoords
      });
    });
    this.airQualityModal = new AirQualityRadarModal(appEl, this.userCoords);
    this.tsunamiModal = new TsunamiRadarModal(appEl, this.userCoords, this.assemblyPoints, (point) => {
      this.focusPoint(point);
    });
    this.bloodCenterModal = new BloodCenterModal(
      appEl,
      this.userCoords,
      this.facilities,
      (point) => this.focusPoint(point),
      (text) => {
        this.crisisHUD.show();
        bitChatService.broadcastMessage(text, 'chat', {
          coordinates: this.userCoords
        });
      }
    );

    this.tourniquetModal = new TourniquetTimerModal(appEl, (text) => {
      this.crisisHUD.show();
      bitChatService.broadcastMessage(text, 'sos', {
        coordinates: this.userCoords
      });
    });

    this.medPassportModal = new EmergencyPrescriptionModal(appEl, (text) => {
      this.crisisHUD.show();
      bitChatService.broadcastMessage(text, 'chat', {
        coordinates: this.userCoords
      });
    });

    this.hazardHuntModal = new HomeHazardHuntModal(appEl);

    this.fieldAidModal = new FieldAidCoordinationModal(appEl, (text) => {
      this.crisisHUD.show();
      bitChatService.broadcastMessage(text, 'chat', {
        coordinates: this.userCoords
      });
    });

    this.petSafetyModal = new PetDisasterSafetyModal(appEl);
    this.tentHeatingModal = new TentHeatingSafetyModal(appEl);

    this.batterySaverModal = new UltraBatterySaverModal(
      appEl,
      () => this.whistleModal.show(),
      () => this.openSOSModal()
    );

    this.psychFirstAidModal = new PsychologicalFirstAidModal(appEl);

    this.acousticListenerModal = new AcousticDebrisListenerModal(appEl, () => {
      this.whistleModal.show();
    });

    this.offlineMapModal = new OfflineMapPackModal(appEl);

    this.campStatusModal = new FieldCampStatusModal(appEl, (text) => {
      this.crisisHUD.show();
      bitChatService.broadcastMessage(text, 'chat', {
        coordinates: this.userCoords
      });
    });

    this.infantFeedingModal = new InfantFeedingSafetyModal(appEl);

    this.seismographModal = new SeismographModal(appEl);
    this.whistleModal = new EmergencyWhistleModal(appEl);
    this.feltModal = new FeltReportModal(appEl, this.userCoords, (report) => {
      this.notificationToast.show(`Hissedildi bildirimi alındı (${report.intensityRoman} - ${report.district}).`, false);
    });
    this.crisisHUD = new CrisisChatHUD(appEl, this.userCoords, {
      onOpenQRPack: (preferredStatus) => this.qrPackModal.show(preferredStatus)
    });
    this.layerHUD = new LayerControlHUD(appEl, (layerKey, visible) => {
      this.handleLayerToggle(layerKey, visible);
    });

    this.offlineSyncHUD = new OfflineSyncHUD(appEl, () => {
      return this.userCoords;
    });

    this.seismicFeedHUD = new SeismicFeedHUD(appEl, {
      onSelectEarthquake: (eq) => this.focusEarthquake(eq),
      onClose: () => {}
    });

    this.initFloatingBitChatButton(appEl);

    // 2. Start 3D WebGL Map
    await this.mapEngine.init(mapContainer);

    // 3. Map Event Listeners
    this.mapEngine.onAssemblyPointClick((point) => {
      this.focusPoint(point);
    });

    this.mapEngine.onFacilityClick((fac) => {
      this.focusFacility(fac);
    });

    this.mapEngine.onFaultLineClick((fault) => {
      this.focusFault(fault);
    });

    this.mapEngine.onEarthquakeClick((eq) => {
      this.focusEarthquake(eq);
    });

    // Connect Early Warning propagating waves to 3D map
    earlyWarningEngine.subscribe((status) => {
      if (status.isActive && status.earthquake) {
        this.mapEngine.updateEarlyWarningWaves(
          status.earthquake.coordinates,
          status.pWaveRadiusKm,
          status.sWaveRadiusKm
        );
      } else {
        this.mapEngine.clearEarlyWarningWaves();
      }
    });

    // 4. Load Datasets in Parallel
    await Promise.all([
      this.loadAssemblyData(),
      this.loadFaultLinesData(),
      this.loadFacilitiesData(),
      this.loadEarthquakeData()
    ]);

    // 5. Place user marker & immediate calculations
    this.mapEngine.setUserLocation(this.userCoords, 0);
    this.updateUserContextCalculations('En Yakın Güvenlik Noktaları');
    this.updateBuildingRiskContext();

    // 6. Handle Deep Link or request real GPS location
    this.handleDeepLink();
    if (!this.deepLink.coords && !this.deepLink.city) {
      this.requestUserLocation(true, false);
    } else if (this.deepLink.coords) {
      this.requestUserLocation(false, false);
    }

    // 7. PWA Service Worker
    this.registerPWA();
  }

  private async loadAssemblyData(): Promise<void> {
    try {
      const res = await fetch('/data/assembly-points.geojson');
      if (!res.ok) throw new Error('Data fetch failed');
      const geojson = await res.json();

      this.assemblyPoints = geojson.features.map((f: any) => ({
        id: f.id || f.properties.id,
        name: f.properties.name,
        city: f.properties.city,
        district: f.properties.district,
        coordinates: f.geometry.coordinates as [number, number],
        capacity: Number(f.properties.capacity || 0),
        areaSqM: Number(f.properties.areaSqM || 0),
        hasWater: f.properties.hasWater ?? true,
        hasElectricity: f.properties.hasElectricity ?? true,
        hasTentArea: f.properties.hasTentArea ?? true,
        hasGenerator: f.properties.hasGenerator ?? true
      }));

      this.mapEngine.setAssemblyPoints(this.assemblyPoints);

      // Summary provinces for dropdown
      try {
        const sumRes = await fetch('/data/summary.json');
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          if (sumData.provinces) {
            this.headerHUD.populateProvinces(sumData.provinces);
          }
        }
      } catch {}

      // Re-trigger nearest calculation now that assembly data is ready
      this.updateUserContextCalculations();
      this.updateBuildingRiskContext();
      this.iceGenerator?.setData(this.userCoords, this.assemblyPoints);
    } catch {}
  }

  private async loadFaultLinesData(): Promise<void> {
    try {
      const res = await fetch('/data/fault-lines.geojson');
      if (res.ok) {
        const geojson = await res.json();
        this.faultLines = geojson.features.map((f: any) => ({
          id: f.id || f.properties.name,
          name: f.properties.name,
          zone: f.properties.zone,
          slipRateMmYear: Number(f.properties.slipRateMmYear || 0),
          riskLevel: f.properties.riskLevel || 'high',
          description: f.properties.description || '',
          coordinates: f.geometry.coordinates as [number, number][]
        }));
        this.mapEngine.setFaultLines(this.faultLines);
        this.updateFaultProximity();
        this.updateBuildingRiskContext();
      }
    } catch {}
  }

  private async loadFacilitiesData(): Promise<void> {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const res = await fetch(`/data/emergency-facilities.geojson?v=${todayStr}`);
      if (res.ok) {
        const geojson = await res.json();
        this.facilities = geojson.features.map((f: any) => ({
          id: f.id || f.properties.id,
          name: f.properties.name,
          category: f.properties.category,
          city: f.properties.city,
          district: f.properties.district,
          neighborhood: f.properties.neighborhood,
          address: f.properties.address,
          phone: f.properties.phone,
          isDuty: Boolean(f.properties.isDuty),
          closingHour: f.properties.closingHour,
          dutyDate: f.properties.dutyDate || todayStr,
          typeText: f.properties.typeText,
          emergencyBeds: Number(f.properties.emergencyBeds || 0),
          hasTraumaCenter: Boolean(f.properties.hasTraumaCenter),
          helipad: Boolean(f.properties.helipad),
          coordinates: f.geometry.coordinates as [number, number]
        }));
        this.mapEngine.setEmergencyFacilities(this.facilities, this.onlyDutyPharmacies);
        this.updateUserContextCalculations();
      }

      // Canlı nöbetçi eczaneleri hemen çek
      this.refreshLiveDutyPharmacies();
    } catch {}
  }

  private async refreshLiveDutyPharmacies(province?: string): Promise<void> {
    try {
      let targetProv = province;
      if (!targetProv) {
        const nearby = this.assemblyPoints.length > 0
          ? findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1)
          : [];
        targetProv = nearby.length > 0 && nearby[0].point.city ? nearby[0].point.city : 'istanbul';
      }

      const live = await livePharmacyService.fetchDutyPharmacies(targetProv);
      if (live && live.length > 0) {
        this.facilities = livePharmacyService.mergeLivePharmacies(this.facilities, live);
        this.mapEngine.setEmergencyFacilities(this.facilities, this.onlyDutyPharmacies);
        this.updateUserContextCalculations();
      }
    } catch {}
  }

  private async loadEarthquakeData(): Promise<void> {
    try {
      const { earthquakes, isOffline } = await fetchLiveEarthquakes();
      this.earthquakes = earthquakes;
      this.mapEngine.setEarthquakes(earthquakes);
      this.headerHUD.updateSeismicCount(earthquakes.length);
      if (isOffline) {
        this.headerHUD.setOnlineState(false);
      }
    } catch {}
  }

  private applyVerifiedLocation(coords: [number, number], source: string, flyTo = true): void {
    this.userCoords = coords;
    earlyWarningEngine.setUserCoordinates(coords);
    this.feltModal.setUserCoords(coords);
    this.crisisHUD.setUserLocation(coords);
    this.qrPackModal?.setUserCoords(coords);
    this.iceGenerator?.setData(coords, this.assemblyPoints);
    this.emergencySMS?.setCoords(coords);
    this.updateBuildingRiskContext();

    this.mapEngine.setUserLocation(coords, 0);
    if (flyTo) {
      this.mapEngine.flyTo(coords, 15.5, 52, -15);
    }
    this.updateUserContextCalculations(source ? `${source} · En Yakın Noktalar` : 'En Yakın Güvenlik Noktaları');
    this.refreshLiveDutyPharmacies();
  }

  private updateBuildingRiskContext(): void {
    if (this.buildingRiskModal) {
      let nearestPoint: AssemblyPoint | null = null;
      if (this.assemblyPoints.length > 0) {
        const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
        if (nearest.length > 0) nearestPoint = nearest[0].point;
      }
      this.buildingRiskModal.setUserContext(this.userCoords, this.faultLines, nearestPoint);
    }
  }

  private handleDeepLink(): void {
    if (this.deepLink.coords) {
      this.applyVerifiedLocation(this.deepLink.coords, 'Paylaşılan Konum', true);
      if (this.deepLink.zoom) {
        this.mapEngine.flyTo(this.deepLink.coords, this.deepLink.zoom, 52, -15);
      }
    }

    if (this.deepLink.city) {
      this.handleProvinceSelect(this.deepLink.city);
    }

    if (this.deepLink.pointId) {
      const match =
        this.assemblyPoints.find((p) => p.id === this.deepLink.pointId) ||
        this.facilities.find((f) => f.id === this.deepLink.pointId);
      if (match) {
        this.focusPoint(match as any);
      }
    }

    if (this.deepLink.mod) {
      const titles: Record<string, string> = {
        'duduk': 'Afet Düdüğü (2.9 kHz SOS) — afet.live',
        'gece-nobeti': 'Gece Sismograf Nöbeti (Başucu Deprem Alarmı) — afet.live',
        'bina-risk': 'Bina Sismik Risk Kartı ve Diri Fay Analizi — afet.live',
        'afis': 'Apartman Acil Durum Afişi Üretici (A4 Çıktı) — afet.live',
        'kart': 'Aile Afet Buluşma Planı Kartı — afet.live',
        'tatbikat': 'Deprem Tatbikat Simülatörü — afet.live',
        'canta': 'Deprem Çantası Malzeme Kontrol Listesi — afet.live',
        'qr': 'Çevrimdışı Güvendeyim QR Durum Paketi — afet.live',
        'sismograf': 'Canlı Sismograf ve İvmeölçer — afet.live',
        'kriz': 'Afet Kriz Koordinasyon Masası — afet.live',
        'ice': 'Kilit Ekranı Tıbbi Kimlik & Duvar Kağıdı (ICE) — afet.live',
        'kilit-ekrani': 'Kilit Ekranı Tıbbi Kimlik & Duvar Kağıdı (ICE) — afet.live',
        'rehber': 'Afet Hayatta Kalma & İlk Yardım Rehberi — afet.live',
        'ilk-yardim': 'Afet Hayatta Kalma & İlk Yardım Rehberi — afet.live',
        'sms': 'Acil Durum SMS ve Hızlı İhbar Hatları — afet.live',
        'acil-sms': 'Acil Durum SMS ve Hızlı İhbar Hatları — afet.live',
        'turnike': 'Turnike Güvenlik Zamanlayıcısı (120 Dk) — afet.live',
        'ilac': 'Afet İlaç & Tedavi Pasaportu, Eşdeğer Rehberi — afet.live',
        'recete': 'Afet İlaç & Tedavi Pasaportu, Eşdeğer Rehberi — afet.live',
        'tehlike-avi': 'Ev İçi Deprem Tehlike Avı & Güvenlik Puanı — afet.live',
        'ihtiyac': 'Afet Sahra İhtiyaç ve Yardım Masası (P2P Dağıtım) — afet.live',
        'yardim': 'Afet Sahra İhtiyaç ve Yardım Masası (P2P Dağıtım) — afet.live',
        'sahra-yardim': 'Afet Sahra İhtiyaç ve Yardım Masası (P2P Dağıtım) — afet.live',
        'pati': 'Pati & Evcil Hayvan Afet Güvenlik Rehberi — afet.live',
        'evcil-hayvan': 'Pati & Evcil Hayvan Afet Güvenlik Rehberi — afet.live',
        'isinma-guvenligi': 'Çadır Isınma ve Karbonmonoksit Güvenliği — afet.live',
        'soba': 'Çadır Isınma ve Karbonmonoksit Güvenliği — afet.live',
        'pil-tasarrufu': 'Ultra Pil Tasarrufu (72 Saat OLED Modu) — afet.live',
        'batarya': 'Ultra Pil Tasarrufu (72 Saat OLED Modu) — afet.live',
        'psikolojik-yardim': 'Afet Psikolojik İlk Yardım & Kutu Nefesi — afet.live',
        'nefes': 'Afet Psikolojik İlk Yardım & Kutu Nefesi — afet.live',
        'enkaz-dinleme': 'Akustik Enkaz Dinleme ve Otomatik S.O.S — afet.live',
        'akustik-radar': 'Akustik Enkaz Dinleme ve Otomatik S.O.S — afet.live',
        'harita-indir': 'Çevrimdışı Harita İndir & Önbellek — afet.live',
        'cevrimdisi-harita': 'Çevrimdışı Harita İndir & Önbellek — afet.live',
        'sahra-durumu': 'Toplanma Alanı Sahra Karnesi — afet.live',
        'altyapi': 'Toplanma Alanı Sahra Karnesi — afet.live',
        'bebek-besleme': 'Afet Dönemi Bebek Besleme & Relaktasyon — afet.live'
      };
      if (titles[this.deepLink.mod]) {
        document.title = titles[this.deepLink.mod];
      }

      switch (this.deepLink.mod) {
        case 'ice':
        case 'kilit-ekrani':
          this.iceGenerator.show();
          break;
        case 'rehber':
        case 'ilk-yardim':
          this.survivalGuide.show();
          break;
        case 'sms':
        case 'acil-sms':
          this.emergencySMS.show();
          break;
        case 'sel':
        case 'taskin':
          this.floodRadarModal.show();
          break;
        case 'telsiz':
        case 'radyo':
          this.emergencyRadioModal.show();
          break;
        case 'gece-nobeti':
          this.nightWatchHUD.show();
          break;
        case 'bina-risk':
          this.buildingRiskModal.show();
          break;
        case 'qr':
          this.qrPackModal.show();
          break;
        case 'duduk':
          this.whistleModal.show();
          break;
        case 'sismograf':
          this.seismographModal.show();
          break;
        case 'kriz':
        case 'bitchat':
          this.crisisHUD.show();
          break;
        case 'triyaj':
        case 'triage':
          this.triageModal.show();
          break;
        case 'hava':
        case 'duman':
          this.airQualityModal.show();
          break;
        case 'tsunami':
        case 'dalga':
          this.tsunamiModal.show();
          break;
        case 'kan':
        case 'kizilay':
          this.bloodCenterModal.show();
          break;
        case 'turnike':
          this.tourniquetModal.show();
          break;
        case 'ilac':
        case 'recete':
          this.medPassportModal.show();
          break;
        case 'tehlike-avi':
          this.hazardHuntModal.show();
          break;
        case 'ihtiyac':
        case 'yardim':
        case 'sahra-yardim':
          this.fieldAidModal.show();
          break;
        case 'pati':
        case 'evcil-hayvan':
          this.petSafetyModal.show();
          break;
        case 'isinma-guvenligi':
        case 'soba':
          this.tentHeatingModal.show();
          break;
        case 'pil-tasarrufu':
        case 'batarya':
          this.batterySaverModal.show();
          break;
        case 'psikolojik-yardim':
        case 'nefes':
          this.psychFirstAidModal.show();
          break;
        case 'enkaz-dinleme':
        case 'akustik-radar':
          this.acousticListenerModal.show();
          break;
        case 'harita-indir':
        case 'cevrimdisi-harita':
          this.offlineMapModal.show();
          break;
        case 'sahra-durumu':
        case 'altyapi':
          this.campStatusModal.show();
          break;
        case 'bebek-besleme':
          this.infantFeedingModal.show();
          break;
        case 'canta':
          this.bagHUD.show();
          break;
        case 'erken-uyari':
          if (this.earthquakes.length > 0) {
            earlyWarningEngine.startWarning(this.earthquakes[0]);
          } else {
            this.notificationToast.show('Sismik erken uyarı ağı devrede.', false);
          }
          break;
        case 'tatbikat':
          this.drillSimulator.show();
          break;
        case 'afis':
          this.apartmentPoster.show();
          break;
        case 'kart':
          this.familyCard.show();
          break;
      }
    }
  }

  private requestUserLocation(flyToUser = true, notify = false): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          this.applyVerifiedLocation(coords, 'Doğrulanan Konum', flyToUser);
          if (notify) {
            this.notificationToast.show('Konumunuz doğrulandı.', false);
          }

          try {
            navigator.geolocation.watchPosition(
              (p) => {
                const liveCoords: [number, number] = [p.coords.longitude, p.coords.latitude];
                this.applyVerifiedLocation(liveCoords, 'Canlı Konum', false);
              },
              () => {},
              { enableHighAccuracy: true, maximumAge: 10000 }
            );
          } catch {}
        },
        async () => {
          try {
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
              const data = await res.json();
              if (data.latitude && data.longitude) {
                const ipCoords: [number, number] = [Number(data.longitude), Number(data.latitude)];
                this.applyVerifiedLocation(ipCoords, `${data.city || 'Bölgeniz'}`, flyToUser);
                if (notify) {
                  this.notificationToast.show(`Konum: ${data.city || 'Türkiye'}`, false);
                }
                return;
              }
            }
          } catch {}
          if (notify) {
            this.notificationToast.show('Konum izni alınamadı.', true);
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    }
  }

  private updateUserContextCalculations(label?: string): void {
    const assemblyResults = this.assemblyPoints.length > 0
      ? findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 3)
      : [];

    const hospitalsList = this.facilities.filter((f) => f.category === 'hospital');
    const hospitalResults = hospitalsList.length > 0
      ? findNearestAssemblyPoints(this.userCoords, hospitalsList as any, 3)
      : [];

    const activePharmacies = filterPharmaciesBySchedule(
      this.facilities.filter((f) => f.category === 'pharmacy'),
      this.onlyDutyPharmacies
    );
    const pharmacyResults = activePharmacies.length > 0
      ? findNearestAssemblyPoints(this.userCoords, activePharmacies as any, 3)
      : [];

    this.nearestHUD.updateAll(
      {
        assembly: assemblyResults,
        hospitals: hospitalResults,
        pharmacies: pharmacyResults
      },
      label
    );

    // Default route to #1 nearest assembly point
    if (assemblyResults.length > 0) {
      this.mapEngine.drawRoute(this.userCoords, assemblyResults[0].point.coordinates, this.obstacles);
    }

    if (this.drillSimulator) {
      this.drillSimulator.setUserCoords(this.userCoords);
      this.drillSimulator.setAssemblyPoints(this.assemblyPoints);
    }
    if (this.apartmentPoster) {
      this.apartmentPoster.setData(this.userCoords, this.assemblyPoints, this.facilities);
    }
    if (this.familyCard) {
      this.familyCard.setData(this.userCoords, this.assemblyPoints, this.facilities);
    }
    if (this.floodRadarModal) {
      this.floodRadarModal.setUserCoords(this.userCoords);
    }
    if (this.triageModal) {
      this.triageModal.setUserCoords(this.userCoords);
    }
    if (this.airQualityModal) {
      this.airQualityModal.setUserCoords(this.userCoords);
    }
    if (this.tsunamiModal) {
      this.tsunamiModal.setUserCoords(this.userCoords);
      this.tsunamiModal.setAssemblyPoints(this.assemblyPoints);
    }
    if (this.bloodCenterModal) {
      this.bloodCenterModal.setUserCoords(this.userCoords);
      this.bloodCenterModal.setFacilities(this.facilities);
    }
  }

  private updateFaultProximity(): void {
    if (this.faultLines.length > 0) {
      const nearestFault = findNearestFaultLine(this.userCoords, this.faultLines);
      this.headerHUD.updateNearestFault(nearestFault);
    }
  }

  private async focusPoint(point: AssemblyPoint | EmergencyFacility): Promise<void> {
    this.selectedPoint = point as any;
    this.detailHUD.show(point);
    try {
      const route = await this.mapEngine.drawWalkingRoute(this.userCoords, point.coordinates, this.obstacles);
      this.navHUD.show(route, point);
    } catch {
      this.mapEngine.flyTo(point.coordinates, 16.5, 60, -25);
    }
  }

  private focusFacility(fac: EmergencyFacility): void {
    this.focusPoint(fac);
  }

  private focusFault(fault: FaultLine): void {
    const center = fault.coordinates[Math.floor(fault.coordinates.length / 2)];
    this.mapEngine.flyTo(center, 10, 45, 0);
  }

  private async routeToPoint(point: AssemblyPoint | EmergencyFacility): Promise<void> {
    try {
      this.detailHUD.setRoutingState(true);
      const route = await this.mapEngine.drawWalkingRoute(this.userCoords, point.coordinates, this.obstacles);
      this.detailHUD.setRoutingState(false);
      this.navHUD.show(route, point);
      const km = (route.distanceMeters / 1000).toFixed(1);
      this.notificationToast.show(
        `📍 "${point.name}" için gerçek sokak yürüyüş rotası çizildi (${km} km, ~${route.durationMinutes} dk).`,
        false
      );
    } catch {
      this.detailHUD.setRoutingState(false);
      this.notificationToast.show('Yürüyüş rotası hesaplanırken hata oluştu.', true);
    }
  }

  private clearActiveRoute(): void {
    this.navHUD.hide();
    this.mapEngine.clearRoute();
    if (this.assemblyPoints.length > 0) {
      const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
      if (nearest.length > 0) {
        this.mapEngine.drawRoute(this.userCoords, nearest[0].point.coordinates, this.obstacles);
      }
    }
  }

  private focusEarthquake(eq: Earthquake): void {
    this.mapEngine.flyTo(eq.coordinates, 12, 60, 0);
    this.seismicFeedHUD.show(this.earthquakes);
  }

  private handleSearch(input: string): void {
    const query = input.trim().toLowerCase();
    if (query.length < 2) {
      this.headerHUD.clearSearchResults();
      this.mapEngine.setAssemblyPoints(this.assemblyPoints);
      this.mapEngine.setEmergencyFacilities(this.facilities, this.onlyDutyPharmacies);
      return;
    }

    const matchedAssembly: SearchResultItem[] = [];
    for (const p of this.assemblyPoints) {
      if (
        p.name.toLowerCase().includes(query) ||
        p.district.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query)
      ) {
        const distKm = haversineDistanceMeters(this.userCoords, p.coordinates) / 1000;
        matchedAssembly.push({
          id: p.id,
          name: p.name,
          category: 'assembly',
          district: p.district,
          city: p.city,
          distanceKm: distKm,
          raw: p
        });
        if (matchedAssembly.length >= 15) break;
      }
    }

    const matchedFacilities: SearchResultItem[] = [];
    for (const f of this.facilities) {
      if (
        f.name.toLowerCase().includes(query) ||
        f.district.toLowerCase().includes(query) ||
        f.city.toLowerCase().includes(query)
      ) {
        const distKm = haversineDistanceMeters(this.userCoords, f.coordinates) / 1000;
        matchedFacilities.push({
          id: f.id,
          name: f.name,
          category: f.category === 'hospital' ? 'hospital' : 'pharmacy',
          district: f.district,
          city: f.city,
          distanceKm: distKm,
          raw: f
        });
        if (matchedFacilities.length >= 10) break;
      }
    }

    const combined = [...matchedAssembly, ...matchedFacilities]
      .sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999))
      .slice(0, 8);

    this.headerHUD.renderSearchResults(combined, (selected) => {
      this.focusPoint(selected);
    });
  }

  private handleProvinceSelect(province: string): void {
    if (!province) {
      document.title = 'afet.live — Türkiye Deprem, Sel, Afet ve Toplanma Alanları Haritası';
      this.mapEngine.setAssemblyPoints(this.assemblyPoints);
      this.mapEngine.setEmergencyFacilities(this.facilities, this.onlyDutyPharmacies);
      this.mapEngine.flyTo([35.2433, 38.9637], 6, 30, 0);
      return;
    }

    const norm = (str: string) =>
      str
        .toLowerCase()
        .trim()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');

    const searchNorm = norm(province);
    const foundPoint =
      this.assemblyPoints.find((p) => norm(p.city) === searchNorm) ||
      this.facilities.find((f) => norm(f.city) === searchNorm);

    const actualProvinceName = foundPoint ? foundPoint.city : province;

    // Dinamik SEO Title ve Açıklama
    document.title = `${actualProvinceName} Deprem, Sel ve Toplanma Alanları — afet.live`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        `${actualProvinceName} genelinde AFAD toplanma alanları, acil servis hastaneleri, nöbetçi eczaneler ve diri fay hattı analizi. afet.live ile internetsiz çevrimdışı harita.`
      );
    }

    const filteredAssembly = this.assemblyPoints.filter((p) => norm(p.city) === searchNorm);
    const filteredFacilities = this.facilities.filter((f) => norm(f.city) === searchNorm);

    this.mapEngine.setAssemblyPoints(filteredAssembly);
    this.mapEngine.setEmergencyFacilities(filteredFacilities, this.onlyDutyPharmacies);

    if (filteredAssembly.length > 0) {
      this.mapEngine.flyTo(filteredAssembly[0].coordinates, 11, 45, -10);
    } else if (filteredFacilities.length > 0) {
      this.mapEngine.flyTo(filteredFacilities[0].coordinates, 11, 45, -10);
    }

    this.refreshLiveDutyPharmacies(actualProvinceName);
  }

  private handleLayerToggle(layerKey: string, visible: boolean): void {
    const map = this.mapEngine.getMapInstance();
    if (!map) return;

    const layerMap: Record<string, string[]> = {
      assembly: ['assembly-glow', 'assembly-core', 'assembly-label', 'assembly-3d-extrusions'],
      faults: ['fault-lines-glow', 'fault-lines-core', 'fault-lines-label'],
      earthquakes: [],
      hospitals: ['facility-glow', 'facility-core', 'facility-label'],
      pharmacies: ['facility-glow', 'facility-core', 'facility-label'],
      dutyOnly: []
    };

    if (layerKey === 'dutyOnly') {
      this.onlyDutyPharmacies = visible;
      this.mapEngine.setEmergencyFacilities(this.facilities, visible);
      this.updateUserContextCalculations();
      return;
    }

    if (layerKey === 'hospitals') {
      this.mapEngine.updateFacilityFilters({ showHospitals: visible });
      return;
    }

    if (layerKey === 'pharmacies') {
      this.mapEngine.updateFacilityFilters({ showPharmacies: visible });
      return;
    }

    const targetLayerIds = layerMap[layerKey] || [layerKey];
    for (const lid of targetLayerIds) {
      if (map.getLayer(lid)) {
        map.setLayoutProperty(lid, 'visibility', visible ? 'visible' : 'none');
      }
    }
  }

  private toggleSeismicDrawer(): void {
    this.seismicFeedHUD.show(this.earthquakes);
  }

  private openSOSModal(): void {
    let nearestPoint: AssemblyPoint | null = null;
    if (this.assemblyPoints.length > 0) {
      const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
      if (nearest.length > 0) nearestPoint = nearest[0].point;
    }

    this.sosModal.show({
      userCoords: this.userCoords,
      nearestPoint
    });
  }

  private openFamilyModal(): void {
    let nearestPoint: AssemblyPoint | null = null;
    if (this.assemblyPoints.length > 0) {
      const nearest = findNearestAssemblyPoints(this.userCoords, this.assemblyPoints, 1);
      if (nearest.length > 0) nearestPoint = nearest[0].point;
    }

    this.familyHUD.show({
      userCoords: this.userCoords,
      nearestPoint,
      onReportObstacle: () => this.addObstacleAtUserLocation()
    });
  }

  private addObstacleAtUserLocation(): void {
    const obs: ObstaclePoint = {
      id: `obs-${Date.now()}`,
      coordinates: [this.userCoords[0] + 0.001, this.userCoords[1] + 0.001],
      title: 'Enkaz / Kapalı Sokak',
      radiusMeters: 150,
      reportedAt: Date.now()
    };
    this.obstacles.push(obs);
    this.mapEngine.setObstacles(this.obstacles);
    this.updateUserContextCalculations();
    this.notificationToast.show('Enkaz eklendi. Rota alternatif sokaklardan güncellendi.', true);
  }

  private initFloatingBitChatButton(appEl: HTMLElement): void {
    const btn = document.createElement('button');
    btn.id = 'floating-bitchat-btn';
    btn.type = 'button';
    btn.title = 'BitChat P2P Afet Ağı & Nostr Kriz Odası';
    btn.setAttribute('aria-label', 'BitChat Kriz İletişim Ağı');
    btn.className =
      'fixed right-3.5 sm:right-5 bottom-32 sm:bottom-36 z-30 flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-2xl bg-obsidian-950/85 hover:bg-obsidian-900 border border-cyan-500/35 hover:border-cyan-400/70 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-xl text-cyan-300 active:scale-95 transition-all group pointer-events-auto';

    btn.innerHTML = `
      <span class="relative flex items-center justify-center w-7 h-7 rounded-xl bg-cyan-500/15 text-cyan-300 group-hover:bg-cyan-500/25 transition-colors">
        ${Icons.messages('w-4 h-4')}
        <span id="floating-bitchat-pulse" class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-obsidian-950"></span>
      </span>
      <span class="hidden sm:flex flex-col text-left leading-none">
        <span class="text-[11.5px] font-bold text-white tracking-wide">BitChat</span>
        <span id="floating-bitchat-sub" class="text-[9.5px] font-mono text-cyan-300/80">Canlı P2P</span>
      </span>
    `;

    btn.addEventListener('click', () => {
      this.crisisHUD.show();
    });

    appEl.appendChild(btn);

    // Dynamic network status subscription
    bitChatService.subscribeStatus(({ connectedRelays, meshPeers }) => {
      const pulseEl = btn.querySelector('#floating-bitchat-pulse');
      const subEl = btn.querySelector('#floating-bitchat-sub');
      const total = connectedRelays + meshPeers;
      if (total > 0) {
        if (pulseEl) {
          pulseEl.className = 'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-obsidian-950';
        }
        if (subEl) {
          subEl.textContent = `Ağ: ${total}`;
        }
      } else {
        if (pulseEl) {
          pulseEl.className = 'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-obsidian-950';
        }
        if (subEl) {
          subEl.textContent = 'Yerel Mesh';
        }
      }
    });
  }

  private registerPWA(): void {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new DisasterAtlasApp();
  app.bootstrap().catch(console.error);
});
