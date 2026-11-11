/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import {
  Zap,
  Sun,
  Battery,
  BatteryCharging,
  FileText,
  Printer,
  Download,
  RefreshCw,
  CheckCircle2,
  Sliders,
  MapPin,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Info,
  FolderArchive,
  Trash2,
  Plus,
  Search,
  X,
  Clock,
  ChevronRight
} from 'lucide-react';

// Saved quotation data structure
export interface SavedQuotation {
  id: string;
  savedAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  siteAddress: string;
  quoteReference: string;
  engineerName: string;
  quoteDate: string;
  usageMode: 'KWH' | 'BILL';
  electricityRate: number;
  monthlyUsageKwh: number;
  billAmountInput: number;
  selectedPackageId: string;
  installedSolarKwp: number;
  installedBatteryKwh: number;
  daytimeLoadPercent: number;
  nighttimeLoadPercent: number;
  peakSunHours?: number;
  dodPercent?: number;
  systemLossBuffer?: number;
  derateFactor?: number;
  costPerKwp?: number;
  costPerBatteryKwh?: number;
  packageName?: string;
}

const STORAGE_KEY = 'powershift_saved_quotations_v1';

const INITIAL_SAVED_QUOTATIONS: SavedQuotation[] = [
  {
    id: 'quote-001',
    savedAt: 'Nov 9, 2026, 04:30 PM',
    clientName: 'Roberto D. Alcantara',
    clientEmail: 'roberto.alcantara@solardrive.ph',
    clientPhone: '+63 917 842 9918',
    siteAddress: 'Lot 14 Block 8, Ayala Alabang Village, Muntinlupa City, Metro Manila',
    quoteReference: 'PS-2026-0419',
    engineerName: 'Engr. M. Ramos (Lead Systems Architect)',
    quoteDate: 'April 19, 2026',
    usageMode: 'KWH',
    electricityRate: 12.0,
    monthlyUsageKwh: 940,
    billAmountInput: 11280,
    selectedPackageId: 'pkg-10kw',
    installedSolarKwp: 10.0,
    installedBatteryKwh: 27.0,
    daytimeLoadPercent: 40,
    nighttimeLoadPercent: 60,
    peakSunHours: 5.0,
    dodPercent: 80,
    systemLossBuffer: 20,
    derateFactor: 15,
    costPerKwp: 52000,
    costPerBatteryKwh: 18500,
    packageName: '10kW Package',
  },
  {
    id: 'quote-002',
    savedAt: 'Nov 8, 2026, 02:15 PM',
    clientName: 'Atty. Maria Elena Santos',
    clientEmail: 'maria.santos@lawchambers.ph',
    clientPhone: '+63 918 554 2190',
    siteAddress: '34 Mercedes St., Bel-Air Village, Makati City',
    quoteReference: 'PS-2026-0412',
    engineerName: 'Engr. M. Ramos (Lead Systems Architect)',
    quoteDate: 'April 12, 2026',
    usageMode: 'KWH',
    electricityRate: 12.5,
    monthlyUsageKwh: 720,
    billAmountInput: 9000,
    selectedPackageId: 'pkg-8kw',
    installedSolarKwp: 8.0,
    installedBatteryKwh: 15.0,
    daytimeLoadPercent: 35,
    nighttimeLoadPercent: 65,
    peakSunHours: 5.0,
    dodPercent: 80,
    systemLossBuffer: 20,
    derateFactor: 15,
    costPerKwp: 52000,
    costPerBatteryKwh: 18500,
    packageName: '8kW Package',
  },
  {
    id: 'quote-003',
    savedAt: 'Nov 6, 2026, 11:00 AM',
    clientName: 'Dr. David K. Tan',
    clientEmail: 'david.tan@medicalgroup.com.ph',
    clientPhone: '+63 920 331 8872',
    siteAddress: 'Phase 2 Block 5, Maria Luisa Estate Park, Banilad, Cebu City',
    quoteReference: 'PS-2026-0398',
    engineerName: 'Engr. M. Ramos (Lead Systems Architect)',
    quoteDate: 'April 05, 2026',
    usageMode: 'BILL',
    electricityRate: 11.8,
    monthlyUsageKwh: 1850,
    billAmountInput: 21830,
    selectedPackageId: 'pkg-16kw',
    installedSolarKwp: 16.0,
    installedBatteryKwh: 40.0,
    daytimeLoadPercent: 45,
    nighttimeLoadPercent: 55,
    peakSunHours: 4.4,
    dodPercent: 80,
    systemLossBuffer: 20,
    derateFactor: 15,
    costPerKwp: 52000,
    costPerBatteryKwh: 18500,
    packageName: '16kW Package',
  },
];

// Preset standard packages (5, 6, 7, 8, 9, 10, 12, 16, 20 kW)
interface SolarPackage {
  id: string;
  name: string;
  kwp: number;
  batteryKwh: number;
  recommendedForKwh: [number, number];
  description: string;
  approxTurnkeyCost: number; // in PHP
}

const SOLAR_PACKAGES: SolarPackage[] = [
  {
    id: 'pkg-5kw',
    name: '5kW Package',
    kwp: 5.0,
    batteryKwh: 10.0,
    recommendedForKwh: [300, 520],
    description: 'Residential Starter Hybrid (5kW PV + 10kWh ESS)',
    approxTurnkeyCost: 450000,
  },
  {
    id: 'pkg-6kw',
    name: '6kW Package',
    kwp: 6.0,
    batteryKwh: 12.0,
    recommendedForKwh: [521, 640],
    description: 'Residential Compact Hybrid (6kW PV + 12kWh ESS)',
    approxTurnkeyCost: 540000,
  },
  {
    id: 'pkg-7kw',
    name: '7kW Package',
    kwp: 7.0,
    batteryKwh: 15.0,
    recommendedForKwh: [641, 760],
    description: 'Mid-Residential Hybrid (7kW PV + 15kWh ESS)',
    approxTurnkeyCost: 630000,
  },
  {
    id: 'pkg-8kw',
    name: '8kW Package',
    kwp: 8.0,
    batteryKwh: 16.0,
    recommendedForKwh: [761, 880],
    description: 'Executive Residential Hybrid (8kW PV + 16kWh ESS)',
    approxTurnkeyCost: 710000,
  },
  {
    id: 'pkg-9kw',
    name: '9kW Package',
    kwp: 9.0,
    batteryKwh: 20.0,
    recommendedForKwh: [881, 980],
    description: 'High-Demand Residential (9kW PV + 20kWh ESS)',
    approxTurnkeyCost: 820000,
  },
  {
    id: 'pkg-10kw',
    name: '10kW Package',
    kwp: 10.0,
    batteryKwh: 27.0,
    recommendedForKwh: [981, 1200],
    description: 'Heavy Residential / Executive Villa (10kW PV + 27kWh ESS)',
    approxTurnkeyCost: 985000,
  },
  {
    id: 'pkg-12kw',
    name: '12kW Package',
    kwp: 12.0,
    batteryKwh: 30.0,
    recommendedForKwh: [1201, 1600],
    description: 'Large Residential / Estate (12kW PV + 30kWh ESS)',
    approxTurnkeyCost: 1190000,
  },
  {
    id: 'pkg-16kw',
    name: '16kW Package',
    kwp: 16.0,
    batteryKwh: 40.0,
    recommendedForKwh: [1601, 2300],
    description: 'Commercial Starter / Cold Storage (16kW PV + 40kWh ESS)',
    approxTurnkeyCost: 1580000,
  },
  {
    id: 'pkg-20kw',
    name: '20kW Package',
    kwp: 20.0,
    batteryKwh: 50.0,
    recommendedForKwh: [2301, 3500],
    description: 'Commercial Multi-Phase Hybrid (20kW PV + 50kWh ESS)',
    approxTurnkeyCost: 1980000,
  },
  {
    id: 'pkg-25kw',
    name: '25kW Package',
    kwp: 25.0,
    batteryKwh: 60.0,
    recommendedForKwh: [3501, 4800],
    description: 'Commercial Three-Phase Hybrid (25kW PV + 60kWh ESS)',
    approxTurnkeyCost: 2450000,
  },
  {
    id: 'pkg-30kw',
    name: '30kW Package',
    kwp: 30.0,
    batteryKwh: 80.0,
    recommendedForKwh: [4801, 7500],
    description: 'Industrial High-Capacity Hybrid (30kW PV + 80kWh ESS)',
    approxTurnkeyCost: 2950000,
  },
  {
    id: 'pkg-custom',
    name: 'Custom Package',
    kwp: 10.0,
    batteryKwh: 27.0,
    recommendedForKwh: [0, 99999],
    description: 'Custom Tailored PV & ESS Sizing',
    approxTurnkeyCost: 985000,
  },
];

export default function App() {
  const customKwpInputId = useId();
  // 1. Client & Admin Proposal Metadata
  const [clientName, setClientName] = useState('Roberto D. Alcantara');
  const [clientEmail, setClientEmail] = useState('roberto.alcantara@solardrive.ph');
  const [clientPhone, setClientPhone] = useState('+63 917 842 9918');
  const [siteAddress, setSiteAddress] = useState('Lot 14 Block 8, Ayala Alabang Village, Muntinlupa City, Metro Manila');
  const [quoteReference, setQuoteReference] = useState('PS-2026-0419');
  const [engineerName, setEngineerName] = useState('Engr. M. Ramos (Lead Systems Architect)');
  const [quoteDate, setQuoteDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  });

  // 2. Electricity Tariff & Usage Configuration
  const [usageMode, setUsageMode] = useState<'KWH' | 'BILL'>('KWH');
  const [electricityRate, setElectricityRate] = useState<number>(12.0); // ₱/kWh (elecRate: ₱12.00/kWh)
  const [monthlyUsageKwh, setMonthlyUsageKwh] = useState<number>(940); // kWh/month
  const [billAmountInput, setBillAmountInput] = useState<number>(11280); // ₱/month

  // 3. Hardware Configuration
  const [configTab, setConfigTab] = useState<'STANDARD' | 'ADVANCED'>('STANDARD');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg-10kw');
  const [installedSolarKwp, setInstalledSolarKwp] = useState<number>(10.0);
  const [installedBatteryKwh, setInstalledBatteryKwh] = useState<number>(27.0);
  const [daytimeLoadPercent, setDaytimeLoadPercent] = useState<number>(40); // 40% AM (amRatio: 0.40)
  const [nighttimeLoadPercent, setNighttimeLoadPercent] = useState<number>(60); // 60% PM (pmRatio: 0.60)

  // Default Engineering Constants & Advanced Technical Parameters
  const [peakSunHours, setPeakSunHours] = useState<number>(5.0); // 5.0 peak sun hours/day
  const [dodPercent, setDodPercent] = useState<number>(80); // 80% usable Depth of Discharge for LiFePO4 (dodUsableRatio: 0.80)
  const [systemLossBuffer, setSystemLossBuffer] = useState<number>(20); // 20% loss factor for recommended system size
  const [derateFactor, setDerateFactor] = useState<number>(15); // 15% thermal and DC line losses (efficiencyLossRatio: 0.15)
  const [panelWattage] = useState<number>(550); // 550W Monocrystalline Module
  const [costPerKwp, setCostPerKwp] = useState<number>(52000); // ₱/kWp
  const [costPerBatteryKwh, setCostPerBatteryKwh] = useState<number>(18500); // ₱/kWh

  // UI state
  const [viewMode, setViewMode] = useState<'split' | 'calculator' | 'proposal'>('split');
  const [copied, setCopied] = useState<boolean>(false);
  const [updateFeedback, setUpdateFeedback] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const proposalSheetRef = useRef<HTMLDivElement>(null);

  // Saved Client Records & Quotations State
  const [savedQuotations, setSavedQuotations] = useState<SavedQuotation[]>(() => {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved quotes from localStorage', e);
    }
    return INITIAL_SAVED_QUOTATIONS;
  });

  const [activeMainTab, setActiveMainTab] = useState<'calculator' | 'saved_records'>('calculator');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLoadedId, setActiveLoadedId] = useState<string>('quote-001');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Save current quotation to localStorage & state
  const handleSaveCurrentQuotation = () => {
    const currentPkg = SOLAR_PACKAGES.find((p) => p.id === selectedPackageId)?.name || 'Custom Package';
    const newRecord: SavedQuotation = {
      id: `quote-${Date.now()}`,
      savedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      clientName: clientName.trim() || 'Unnamed Client',
      clientEmail,
      clientPhone,
      siteAddress,
      quoteReference,
      engineerName,
      quoteDate,
      usageMode,
      electricityRate,
      monthlyUsageKwh,
      billAmountInput,
      selectedPackageId,
      installedSolarKwp,
      installedBatteryKwh,
      daytimeLoadPercent,
      nighttimeLoadPercent,
      peakSunHours,
      dodPercent,
      systemLossBuffer,
      derateFactor,
      costPerKwp,
      costPerBatteryKwh,
      packageName: currentPkg,
    };

    const updatedList = [newRecord, ...savedQuotations];
    setSavedQuotations(updatedList);
    setActiveLoadedId(newRecord.id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }

    setSaveToast(`Quotation for "${newRecord.clientName}" saved to records!`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Load quotation into active dashboard
  const handleLoadQuotation = (record: SavedQuotation) => {
    setClientName(record.clientName);
    setClientEmail(record.clientEmail || '');
    setClientPhone(record.clientPhone || '');
    setSiteAddress(record.siteAddress || '');
    setQuoteReference(record.quoteReference || 'PS-2026-0000');
    setEngineerName(record.engineerName || 'Engr. M. Ramos (Lead Systems Architect)');
    setQuoteDate(record.quoteDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    setUsageMode(record.usageMode || 'KWH');
    setElectricityRate(record.electricityRate || 12.0);
    setMonthlyUsageKwh(record.monthlyUsageKwh || 940);
    setBillAmountInput(record.billAmountInput || 11280);
    setSelectedPackageId(record.selectedPackageId || 'pkg-10kw');
    setInstalledSolarKwp(record.installedSolarKwp || 10.0);
    setInstalledBatteryKwh(record.installedBatteryKwh || 27.0);
    setDaytimeLoadPercent(record.daytimeLoadPercent ?? 40);
    setNighttimeLoadPercent(record.nighttimeLoadPercent ?? 60);

    if (record.peakSunHours) setPeakSunHours(record.peakSunHours);
    if (record.dodPercent) setDodPercent(record.dodPercent);
    if (record.systemLossBuffer) setSystemLossBuffer(record.systemLossBuffer);
    if (record.derateFactor) setDerateFactor(record.derateFactor);
    if (record.costPerKwp) setCostPerKwp(record.costPerKwp);
    if (record.costPerBatteryKwh) setCostPerBatteryKwh(record.costPerBatteryKwh);

    setActiveLoadedId(record.id);
    setActiveMainTab('calculator');
    setIsSidebarOpen(false);
    setSaveToast(`Loaded quotation for "${record.clientName}" into Calculator`);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Delete quotation
  const handleDeleteQuotation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedQuotations.filter((q) => q.id !== id);
    setSavedQuotations(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update localStorage', err);
    }
    if (activeLoadedId === id) {
      setActiveLoadedId('');
    }
  };

  // Restore default demo clients
  const handleRestoreDefaults = () => {
    setSavedQuotations(INITIAL_SAVED_QUOTATIONS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAVED_QUOTATIONS));
    } catch (err) {
      console.error(err);
    }
    setSaveToast('Sample client records restored!');
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Sync between kWh and Bill Amount Modes
  const handleRateChange = (newRate: number) => {
    const safeRate = Math.max(1, newRate);
    setElectricityRate(safeRate);
    if (usageMode === 'KWH') {
      setBillAmountInput(Math.round(monthlyUsageKwh * safeRate));
    } else {
      setMonthlyUsageKwh(Math.round(billAmountInput / safeRate));
    }
  };

  const handleKwhChange = (newKwh: number) => {
    const safeKwh = Math.max(10, newKwh);
    setMonthlyUsageKwh(safeKwh);
    setBillAmountInput(Math.round(safeKwh * electricityRate));
  };

  const handleBillChange = (newBill: number) => {
    const safeBill = Math.max(100, newBill);
    setBillAmountInput(safeBill);
    setMonthlyUsageKwh(Math.round(safeBill / (electricityRate || 1)));
  };

  const handleDaytimePercentChange = (val: number) => {
    const clamped = Math.min(100, Math.max(0, isNaN(val) ? 0 : val));
    setDaytimeLoadPercent(clamped);
    setNighttimeLoadPercent(100 - clamped);
  };

  const handleNighttimePercentChange = (val: number) => {
    const clamped = Math.min(100, Math.max(0, isNaN(val) ? 0 : val));
    setNighttimeLoadPercent(clamped);
    setDaytimeLoadPercent(100 - clamped);
  };

  // =========================================================================
  // Step 2 & 3: PACKAGE AUTO-MATCHING (Based on exact user formula)
  // =========================================================================
  const autoMatchPackage = () => {
    const days = 30;
    const dailyKwh = monthlyUsageKwh / days;
    const dailyWh = dailyKwh * 1000;
    const efficiencyLossRatio = derateFactor / 100;
    const bufferedDailyWh = dailyWh * (1 + efficiencyLossRatio);

    // Raw required PV capacity:
    const rawRequiredKw = bufferedDailyWh / (peakSunHours * (1 - efficiencyLossRatio) * 1000);
    // Required kW with safety margin:
    const reqKwWithMargin = rawRequiredKw * (1 + efficiencyLossRatio);

    // Commercial tier selection ([5, 6, 8, 9, 10, 12, 16, 20, 25, 30] kW):
    const standardCommercialTiers = [5, 6, 8, 9, 10, 12, 16, 20, 25, 30];
    let optimalKw = standardCommercialTiers.find((t) => t >= reqKwWithMargin);
    if (!optimalKw) {
      optimalKw = reqKwWithMargin > 30 ? Math.ceil(reqKwWithMargin / 5) * 5 : 5;
    }

    // Step 3: Battery Sizing
    const pmRatio = nighttimeLoadPercent / 100;
    const dodUsableRatio = dodPercent / 100;
    const nightKwh = (dailyKwh * pmRatio) * (1 + efficiencyLossRatio);
    let optimalBattKwh = Math.round((nightKwh / dodUsableRatio) * 10) / 10;
    if (optimalBattKwh < 5) optimalBattKwh = 5.0;

    const matched = SOLAR_PACKAGES.find((pkg) => pkg.kwp === optimalKw && pkg.id !== 'pkg-custom');
    if (matched) {
      setSelectedPackageId(matched.id);
      setInstalledSolarKwp(matched.kwp);
      setInstalledBatteryKwh(matched.batteryKwh);
    } else {
      setSelectedPackageId('pkg-custom');
      setInstalledSolarKwp(optimalKw);
      setInstalledBatteryKwh(optimalBattKwh);
    }
  };

  const handlePackageSelect = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    const pkg = SOLAR_PACKAGES.find((p) => p.id === pkgId);
    if (pkg && pkgId !== 'pkg-custom') {
      setInstalledSolarKwp(pkg.kwp);
      setInstalledBatteryKwh(pkg.batteryKwh);
    }
  };

  // =========================================================================
  // CORE ENGINEERING CALCULATIONS (Exact & Reactive to User Specifications)
  // =========================================================================
  // Default Engineering Constants
  const days = 30; // 30 days/month
  const elecRate = electricityRate; // ₱12.00/kWh default
  const efficiencyLossRatio = derateFactor / 100; // 0.15 (15% thermal and DC line losses)
  const amRatio = daytimeLoadPercent / 100; // 0.40 (40% daytime power consumption)
  const pmRatio = nighttimeLoadPercent / 100; // 0.60 (60% nighttime power consumption)
  const dodUsableRatio = dodPercent / 100; // 0.80 (80% usable Depth of Discharge for LiFePO4 battery banks)

  // Step 1: Daily Consumption & Derated Buffered Load
  const activeMonthlyKwh = monthlyUsageKwh;
  const activeMonthlyBill = activeMonthlyKwh * elecRate;
  const dailyKwh = activeMonthlyKwh / days;
  const dailyWh = dailyKwh * 1000;
  const averageDailyLoad = dailyKwh; // Alias for UI compatibility

  // Add 15% efficiency loss buffer:
  const lossBufferWh = dailyWh * efficiencyLossRatio;
  const bufferedDailyWh = dailyWh * (1 + efficiencyLossRatio);
  const bufferedDailyKwh = bufferedDailyWh / 1000;

  // Split Day (AM) vs Night (PM) demand:
  const amRequirementKwh = dailyKwh * amRatio;
  const daytimeLoadKwh = amRequirementKwh; // Alias for UI
  const pmRequirementKwh = dailyKwh * pmRatio;
  const nighttimeLoadKwh = pmRequirementKwh; // Alias for UI
  const pmRequirementWh = pmRequirementKwh * 1000;

  // Step 2: Required Solar PV Capacity & Package Auto-Matching
  const rawRequiredKw = bufferedDailyWh / (peakSunHours * (1 - efficiencyLossRatio) * 1000);
  const reqKwWithMargin = rawRequiredKw * (1 + efficiencyLossRatio);

  const solarWatts = installedSolarKwp * 1000;
  // Recommended Size After Loss (+20% loss factor):
  const recommendedSystemSizeAfterLoss = (solarWatts / 1000) * 1.20;
  const recommendedSizeAfterLoss = recommendedSystemSizeAfterLoss; // Alias
  const panelCount = Math.ceil(solarWatts / panelWattage);

  // Step 3: Battery Energy Storage System (BESS) Sizing
  // Nighttime energy demand with 15% loss buffer:
  const nightKwh = (dailyKwh * pmRatio) * (1 + efficiencyLossRatio);

  // Usable capacity calculation at 80% DoD (Minimum floor of 5.0 kWh):
  let optimalBattKwh = Math.round((nightKwh / dodUsableRatio) * 10) / 10;
  if (optimalBattKwh < 5) optimalBattKwh = 5.0;

  // Installed vs usable battery distribution:
  const totalBatteryWh = installedBatteryKwh * 1000;
  const usableCapacityWh = totalBatteryWh * dodUsableRatio;
  const reserveCapacityWh = totalBatteryWh * (1 - dodUsableRatio);
  const usableBatteryCapacity = usableCapacityWh / 1000; // in kWh
  const reserveBatteryCapacity = reserveCapacityWh / 1000; // in kWh

  // Remaining grid dependency (if battery cannot cover the entire nighttime load):
  const remainingGridDependencyWh = Math.max(0, pmRequirementWh - usableCapacityWh);
  const remainingGridDependencyKwh = remainingGridDependencyWh / 1000;
  const isSelfSufficient = remainingGridDependencyWh <= 0;
  const isFullySelfSufficient = isSelfSufficient; // Alias
  const nighttimeGridImportNeeded = remainingGridDependencyKwh;
  const nightAutonomyPercentage = pmRequirementWh > 0 ? Math.min(100, (usableCapacityWh / pmRequirementWh) * 100) : 100;

  // Step 4: Solar Generation & Financial ROI
  // Net peak solar power after thermal and wiring losses:
  const efficiencyLossWatts = solarWatts * efficiencyLossRatio;
  const netPeakWatts = solarWatts - efficiencyLossWatts;
  const netPeakGenerationAcOutput = netPeakWatts / 1000; // Net kW AC output

  // Daily generation:
  const dailyGenWh = netPeakWatts * peakSunHours;
  const dailyGenKwh = dailyGenWh / 1000;
  const estDailySolarGeneration = dailyGenKwh; // in kWh/day

  // Monthly generation & bill savings:
  const pkgCapacityKw = installedSolarKwp;
  const estMonthlyGenKwh = (pkgCapacityKw * 1000 * (1 - efficiencyLossRatio) * peakSunHours * days) / 1000;
  const monthlySolarGeneration = estMonthlyGenKwh;
  const estMonthlySavings = Math.min(estMonthlyGenKwh, activeMonthlyKwh) * elecRate;
  const monthlyFinancialSavings = estMonthlySavings;
  const estAnnualSavings = estMonthlySavings * 12;
  const annualSavings = estAnnualSavings;

  // System Cost & Payback period (Years):
  const estimatedSystemCost =
    selectedPackageId !== 'pkg-custom'
      ? SOLAR_PACKAGES.find((p) => p.id === selectedPackageId)?.approxTurnkeyCost || (installedSolarKwp * costPerKwp + installedBatteryKwh * costPerBatteryKwh)
      : installedSolarKwp * costPerKwp + installedBatteryKwh * costPerBatteryKwh;
  const hybridPackagePrice = estimatedSystemCost;

  const estPaybackYears = estAnnualSavings > 0
    ? (hybridPackagePrice / estAnnualSavings).toFixed(1)
    : 'N/A';
  const simplePaybackYears = estAnnualSavings > 0 ? (hybridPackagePrice / estAnnualSavings) : 0;
  const lifetimeSavings25Years = annualSavings * 25 * 1.25; // 25 years with conservative tariff escalation
  const annualCo2OffsetTons = (monthlySolarGeneration * 12 * 0.68) / 1000; // ~0.68 kg CO2 per kWh Philippines grid mix

  // Action handlers
  const handleUpdateCalculations = () => {
    setUpdateFeedback(true);
    setTimeout(() => setUpdateFeedback(false), 1800);
  };

  // Generate & Download PDF Proposal using html2canvas & jsPDF
  const handlePrintProposal = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      // Ensure calculator view & proposal preview are mounted and visible
      if (activeMainTab !== 'calculator') {
        setActiveMainTab('calculator');
      }
      if (viewMode === 'calculator') {
        setViewMode('split');
      }

      // Small delay to allow React to paint the proposal element
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Find the proposal sheet DOM element (either via ref or querySelector)
      const element = proposalSheetRef.current || document.querySelector<HTMLElement>('.pdf-report-root');
      if (!element) {
        window.print();
        setIsGeneratingPdf(false);
        return;
      }

      // Capture using html-to-image which natively supports CSS oklch, lab, gradients & variables via SVG foreignObject
      const dataUrl = await toPng(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#FFFFFF',
        filter: (node: HTMLElement) => {
          return !node.classList?.contains('no-print');
        },
      });

      // Load into an HTMLImage to get natural dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = reject;
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfPageWidth = 210;
      const pdfPageHeight = 297;

      // Full bleed edge-to-edge whole page with no border limits or margins
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfPageWidth, pdfPageHeight, undefined, 'FAST');

      const safeClient = clientName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Client';
      const safeRef = quoteReference.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Quote';
      const fileName = `PowerShift_Proposal_${safeRef}_${safeClient}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF with jsPDF/html-to-image, opening browser print dialog as fallback', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopySummary = () => {
    const text = `
=== POWERSHIFT SOLAR PV & STORAGE PROPOSAL SUMMARY ===
Quotation Ref: ${quoteReference}
Client: ${clientName} (${clientEmail} | ${clientPhone})
Site Location: ${siteAddress}
Date: ${quoteDate}

[CONSUMPTION PROFILE]
Electricity Tariff: ₱${electricityRate.toFixed(2)}/kWh
Monthly Usage: ${activeMonthlyKwh.toLocaleString()} kWh/mo (₱${activeMonthlyBill.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo)
Daily Average Load: ${averageDailyLoad.toFixed(2)} kWh/day (Daytime: ${daytimeLoadKwh.toFixed(2)} kWh | Night: ${nighttimeLoadKwh.toFixed(2)} kWh)

[RECOMMENDED SYSTEM]
Package: ${SOLAR_PACKAGES.find((p) => p.id === selectedPackageId)?.name || 'Custom Package'}
Est. Daily Generation: ${estDailySolarGeneration.toFixed(2)} kWh/day (${monthlySolarGeneration.toLocaleString()} kWh/mo)
Usable Battery Capacity: ${usableBatteryCapacity.toFixed(2)} kWh (${dodPercent}% DoD)
Night Grid Import Required: ${nighttimeGridImportNeeded.toFixed(2)} kWh/day
Status: ${isFullySelfSufficient ? 'FULLY SELF-SUFFICIENT (100% Off-Grid Night Coverage)' : `PARTIAL GRID INDEPENDENCE (${nightAutonomyPercentage.toFixed(1)}% Night Coverage)`}

[FINANCIAL METRICS]
Est. System Turnkey Cost: ₱${estimatedSystemCost.toLocaleString()}
Annual Grid Savings: ₱${annualSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}/year
Estimated Simple Payback: ~${simplePaybackYears.toFixed(1)} Years
25-Year Lifetime Savings: ₱${lifetimeSavings25Years.toLocaleString('en-US', { minimumFractionDigits: 2 })}
CO2 Emissions Offset: ~${annualCo2OffsetTons.toFixed(2)} Tons/year
Prepared by: ${engineerName}
======================================================
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Export standalone single-file HTML proposal
  const handleDownloadStandaloneHtml = () => {
    const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PowerShift Engineering Proposal - ${clientName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background-color: #F3F6F3; color: #1E293B; line-height: 1.5; padding: 24px; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .container { max-width: 900px; margin: 0 auto; background: #FFFFFF; border: 1px solid #CBD5E1; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header-bar { background-color: #0A3A1E; color: #FFFFFF; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #D4AF37; }
    .content { padding: 32px; }
    .section-title { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0A3A1E; border-bottom: 2px solid #0A3A1E; padding-bottom: 6px; margin-bottom: 16px; margin-top: 24px; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .metric-box { background: #F9FBF9; border: 1px solid #E2E8F0; padding: 12px 16px; border-radius: 4px; }
    .metric-label { font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 600; }
    .metric-val { font-size: 18px; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: #0A3A1E; margin-top: 4px; }
    .banner-gold { background: #0A3A1E; color: #FFFFFF; border: 2px solid #D4AF37; padding: 16px 20px; border-radius: 6px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; }
    .table-data { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
    .table-data th, .table-data td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #E2E8F0; }
    .table-data th { background: #F3F6F3; color: #0A3A1E; font-weight: 700; font-size: 12px; text-transform: uppercase; }
    .table-data td.numeric { text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600; }
    .row-highlight-green { background: #E6F4EA !important; font-weight: 700; color: #0A3A1E; }
    .row-highlight-neutral { background: #F8FAFC !important; font-weight: 600; }
    .footer-bar { border-top: 3px solid #0A3A1E; padding: 20px 32px; background: #F9FBF9; font-size: 11px; color: #475569; display: flex; justify-content: space-between; align-items: center; margin-top: 32px; }
    @media print {
      body { background: white; padding: 0; }
      .container { border: none; box-shadow: none; max-width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 900px; margin: 0 auto 16px; text-align: right;">
    <button onclick="window.print()" style="background: #0A3A1E; color: #D4AF37; border: 1px solid #D4AF37; padding: 10px 20px; font-weight: bold; cursor: pointer; border-radius: 4px;">Print to PDF</button>
  </div>
  <div class="container">
    <div class="header-bar">
      <div>
        <img src="/powershift-logo.png" alt="PowerShift - Driving Global Change" style="height: 52px; width: auto; object-fit: contain;" />
      </div>
      <div style="text-align: right; font-size: 12px; line-height: 1.4;">
        <div><strong>DATE:</strong> ${quoteDate}</div>
        <div><strong>CLIENT:</strong> ${clientName}</div>
        <div><strong>REF:</strong> ${quoteReference}</div>
      </div>
    </div>
    <div class="content">

      <div class="section-title">Section 1: Customer Consumption Profile & Tariff</div>
      <div class="grid-3">
        <div class="metric-box">
          <div class="metric-label">Monthly Consumption</div>
          <div class="metric-val">${activeMonthlyKwh.toLocaleString()} kWh/mo</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Avg Daily Usage</div>
          <div class="metric-val">${averageDailyLoad.toFixed(2)} kWh/day</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Grid Electricity Rate</div>
          <div class="metric-val">₱${electricityRate.toFixed(2)} / kWh</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Est. Monthly Bill</div>
          <div class="metric-val">₱${activeMonthlyBill.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Daytime Load (AM)</div>
          <div class="metric-val">${daytimeLoadPercent}% (${daytimeLoadKwh.toFixed(1)} kWh)</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Nighttime Load (PM)</div>
          <div class="metric-val">${nighttimeLoadPercent}% (${nighttimeLoadKwh.toFixed(1)} kWh)</div>
        </div>
      </div>

      <div class="banner-gold">
        <div>
          <div style="font-size: 11px; color: #D4AF37; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">System Package Recommendation</div>
          <div style="font-size: 18px; font-weight: 800; color: #FFFFFF; margin-top: 2px;">${SOLAR_PACKAGES.find((p) => p.id === selectedPackageId)?.name || 'Custom Package'}</div>
          <div style="font-size: 12px; color: #E2E8F0; margin-top: 4px;">${isFullySelfSufficient ? '100% Net Energy Self-Sufficient with Zero Nighttime Grid Dependency' : 'Substantial Grid Cost Reduction with High Energy Security'}</div>
        </div>
      </div>

      <div class="section-title">Section 2: Recommended System & Generation Performance</div>
      <table class="table-data">
        <thead>
          <tr>
            <th>Engineering Parameter</th>
            <th>Specification & Design Factor</th>
            <th style="text-align: right;">Calculated Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Installed Solar PV Capacity</strong></td>
            <td>Tier-1 550W Monocrystalline TOPCon (${panelCount} Modules)</td>
            <td class="numeric">${installedSolarKwp.toFixed(2)} kWp</td>
          </tr>
          <tr>
            <td>Recommended System Size After Loss</td>
            <td>(solarWatts ÷ 1000) × 1.20 (+20% loss factor)</td>
            <td class="numeric">${recommendedSystemSizeAfterLoss.toFixed(2)} kWp (+20%)</td>
          </tr>
          <tr>
            <td>Thermal & Wiring Loss Factor</td>
            <td>15% thermal and DC line losses (-${(efficiencyLossWatts / 1000).toFixed(2)} kW)</td>
            <td class="numeric">-${(efficiencyLossWatts / 1000).toFixed(2)} kWp</td>
          </tr>
          <tr>
            <td>Net Peak Generation Output</td>
            <td>Effective AC continuous export after 15% loss</td>
            <td class="numeric">${netPeakGenerationAcOutput.toFixed(2)} kW AC</td>
          </tr>
          <tr>
            <td>Daytime (AM) Load Allocation</td>
            <td>Direct solar consumption during sunlight hours (${daytimeLoadPercent}%)</td>
            <td class="numeric">${amRequirementKwh.toFixed(2)} kWh/day</td>
          </tr>
          <tr class="row-highlight-green">
            <td><strong>Est. Daily Solar Generation</strong></td>
            <td><strong>${netPeakGenerationAcOutput.toFixed(2)} kW AC × ${peakSunHours} Peak Sun Hours/day</strong></td>
            <td class="numeric" style="color: #0A3A1E; font-size: 14px;"><strong>${dailyGenKwh.toFixed(2)} kWh/day</strong></td>
          </tr>
          <tr class="row-highlight-neutral">
            <td><strong>Avg Daily Usage</strong></td>
            <td>Baseline 24-hour client electricity consumption (monthly ÷ 30)</td>
            <td class="numeric" style="font-size: 14px;"><strong>${dailyKwh.toFixed(2)} kWh/day</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">Section 3: Battery Solar Storage & Grid Dependency</div>
      <table class="table-data">
        <thead>
          <tr>
            <th>Storage Metric</th>
            <th>Safety & Operational Standard</th>
            <th style="text-align: right;">Calculated Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Installed Battery Storage Capacity</strong></td>
            <td>Ultra-Safe LiFePO4 Lithium Iron Phosphate Storage</td>
            <td class="numeric">${installedBatteryKwh.toFixed(2)} kWh</td>
          </tr>
          <tr>
            <td>Usable Battery Capacity (${dodPercent}% DoD)</td>
            <td>Recommended depth of discharge for 6,000+ cycle life</td>
            <td class="numeric">${usableBatteryCapacity.toFixed(2)} kWh</td>
          </tr>
          <tr>
            <td>Nighttime (PM) Load Allocation</td>
            <td>Energy required when solar panels are inactive (${nighttimeLoadPercent}%)</td>
            <td class="numeric">${nighttimeLoadKwh.toFixed(2)} kWh/day</td>
          </tr>
          <tr>
            <td>Emergency Reserve Buffer (${100 - dodPercent}%)</td>
            <td>Dedicated blackout & UPS emergency power reserve</td>
            <td class="numeric">${reserveBatteryCapacity.toFixed(2)} kWh</td>
          </tr>
          <tr class="row-highlight-green">
            <td><strong>Estimated Nighttime Grid Import Needed</strong></td>
            <td><strong>Grid draw needed after battery discharge</strong></td>
            <td class="numeric" style="color: ${nighttimeGridImportNeeded <= 0 ? '#059669' : '#C69214'}; font-size: 14px;">
              <strong>${nighttimeGridImportNeeded <= 0 ? '0 kWh / day (100% Off-Grid Ready)' : `${nighttimeGridImportNeeded.toFixed(2)} kWh / day (Import Needed)`}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <div style="border-top: 2px solid #0A3A1E; padding-top: 14px; margin-top: 24px; font-size: 11px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 800; text-transform: uppercase; color: #0A3A1E;">CONTACT OUR ENGINEERING DESK TO GET A DETAILED PROPOSAL</div>
          <div style="margin-top: 2px;">Email: <strong>c2r2gsm@gmail.com</strong> | Phone: <strong>0935 479 6321</strong> | Web: <strong>www.powershift.asia</strong></div>
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #94A3B8;">Page 1 of 1</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PowerShift_Proposal_${quoteReference}_${clientName.replace(/\s+/g, '_')}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredSavedQuotations = savedQuotations.filter((q) => {
    if (!searchQuery.trim()) return true;
    const qLower = searchQuery.toLowerCase();
    return (
      q.clientName.toLowerCase().includes(qLower) ||
      q.siteAddress.toLowerCase().includes(qLower) ||
      q.quoteReference.toLowerCase().includes(qLower) ||
      (q.clientPhone && q.clientPhone.toLowerCase().includes(qLower)) ||
      (q.clientEmail && q.clientEmail.toLowerCase().includes(qLower)) ||
      (q.packageName && q.packageName.toLowerCase().includes(qLower))
    );
  });

  return (
    <div className="min-h-screen bg-[#F3F6F3] text-[#1E293B] flex flex-col font-sans">
      {/* TOP BRAND HEADER (Deep Forest Green #0A3A1E) */}
      <header className="no-print bg-[#0A3A1E] text-white border-b-2 border-[#D4AF37] px-4 md:px-8 py-3.5 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center">
            <img
              src="/powershift-logo.png"
              alt="PowerShift - Driving Global Change"
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </div>

          {/* Switch Button at Top Right of Navigation Bar: Calculator & Quotation vs Saved Records */}
          <div className="flex items-center bg-[#063217] p-1 rounded-lg border border-[#D4AF37]/50 shadow-inner">
            <button
              onClick={() => setActiveMainTab('calculator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeMainTab === 'calculator'
                  ? 'bg-[#D4AF37] text-[#0A3A1E] shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-[#0A3A1E]/80'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Calculator & Quotation</span>
            </button>

            <button
              onClick={() => setActiveMainTab('saved_records')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeMainTab === 'saved_records'
                  ? 'bg-[#D4AF37] text-[#0A3A1E] shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-[#0A3A1E]/80'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Saved Records</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeMainTab === 'saved_records'
                    ? 'bg-[#0A3A1E] text-[#D4AF37]'
                    : 'bg-[#E6F4EA] text-[#059669]'
                }`}
              >
                {savedQuotations.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {activeMainTab === 'saved_records' ? (
          /* SAVED CLIENT RECORDS & QUOTATIONS MANAGER VIEW */
          <div className="no-print space-y-6 animate-fade-in">
            {/* Top Toolbar */}
            <div className="bg-[#0A3A1E] text-white p-5 rounded-lg border-2 border-[#D4AF37] shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#063217] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37]">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold uppercase tracking-wider text-white">
                    Saved Client Records & Quotations History
                  </h2>
                  <p className="text-xs text-emerald-200/90 font-medium">
                    Manage, search, reload, or export previous client solar energy engineering proposals
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                <button
                  onClick={handleSaveCurrentQuotation}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded bg-[#D4AF37] text-[#0A3A1E] hover:bg-[#E5C158] transition-colors shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-[#0A3A1E]" />
                  <span>Save Quotation</span>
                </button>
              </div>
            </div>

            {/* Filter & Summary Bar */}
            <div className="bg-white border border-[#CBD5E1] rounded-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by client name, address, reference..."
                  className="w-full bg-[#F8FAFC] border border-slate-300 rounded pl-9 pr-8 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">
                  Showing {filteredSavedQuotations.length} of {savedQuotations.length} Saved Proposals
                </span>
                {activeLoadedId && (
                  <span className="hidden sm:inline px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                    Active: {savedQuotations.find((q) => q.id === activeLoadedId)?.clientName || 'Loaded'}
                  </span>
                )}
              </div>
            </div>

            {/* Grid of Saved Records */}
            {filteredSavedQuotations.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
                <FolderArchive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No saved quotation records found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  {searchQuery
                    ? `No proposals match "${searchQuery}". Clear your search query to see all records.`
                    : 'You currently have no saved quotations. Save your current calculator configuration to populate this list.'}
                </p>
                <div className="flex justify-center gap-2">
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-3.5 py-1.5 text-xs font-bold bg-[#0A3A1E] text-white rounded"
                    >
                      Clear Search
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveCurrentQuotation}
                        className="px-3.5 py-1.5 text-xs font-bold bg-[#0A3A1E] text-[#D4AF37] rounded border border-[#D4AF37]"
                      >
                        Save Quotation
                      </button>
                      <button
                        onClick={handleRestoreDefaults}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded border border-slate-300"
                      >
                        Restore Sample Records
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSavedQuotations.map((record) => {
                  const isActive = activeLoadedId === record.id;

                  return (
                    <div
                      key={record.id}
                      className={`bg-white rounded-lg border flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
                        isActive
                          ? 'border-[#059669] ring-2 ring-[#059669]/30'
                          : 'border-slate-300 hover:border-[#0A3A1E]'
                      }`}
                    >
                      <div className="p-4">
                        {/* Top Row: Client Name & Status */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-sm text-slate-900">{record.clientName}</h4>
                              {isActive && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#059669] text-white uppercase tracking-wider">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                              Ref: {record.quoteReference}
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleDeleteQuotation(record.id, e)}
                            title="Delete this quotation"
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Location & Details */}
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 text-[11px]">{record.siteAddress}</span>
                          </div>
                          {record.clientPhone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                              <Phone className="w-3.5 h-3.5 text-[#0A3A1E] shrink-0" />
                              <span className="truncate">{record.clientPhone}</span>
                            </div>
                          )}
                          {record.clientEmail && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{record.clientEmail}</span>
                            </div>
                          )}
                        </div>

                        {/* Hardware Sizing Specs */}
                        <div className="mt-3 p-2.5 rounded bg-[#F9FBF9] border border-slate-200 space-y-1 text-xs">
                          <div className="flex items-center justify-between font-bold text-[#0A3A1E]">
                            <span className="flex items-center gap-1">
                              <Sun className="w-3.5 h-3.5 text-[#D4AF37]" />
                              {record.packageName || `${record.installedSolarKwp}kW`}
                            </span>
                            <span className="font-mono text-xs">
                              {record.installedSolarKwp.toFixed(1)} kWp PV
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 text-[11px]">
                            <span className="flex items-center gap-1">
                              <Battery className="w-3.5 h-3.5 text-emerald-600" />
                              Battery Storage
                            </span>
                            <span className="font-mono font-semibold">
                              {record.installedBatteryKwh.toFixed(1)} kWh ({record.dodPercent || 80}% DoD)
                            </span>
                          </div>
                        </div>

                        </div>

                      {/* Card Action Buttons */}
                      <div className="p-3 bg-[#F9FBF9] border-t border-slate-200 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {record.savedAt}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleLoadQuotation(record)}
                            className="px-3 py-1.5 text-xs font-bold rounded bg-[#0A3A1E] text-[#D4AF37] hover:bg-[#063217] transition-all shadow-xs flex items-center gap-1"
                          >
                            <span>Load into Calculator</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* CALCULATOR & PROPOSAL SPLIT VIEW */
          <div className={`grid gap-6 ${viewMode === 'split' ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
          {/* ========================================================================= */}
          {/* LEFT COLUMN: ADMIN CONTROLS & CALCULATOR ENGINE (7 COLS in split view)     */}
          {/* ========================================================================= */}
          <div
            className={`space-y-6 no-print ${
              viewMode === 'proposal' ? 'hidden' : viewMode === 'split' ? 'lg:col-span-6 xl:col-span-6' : 'w-full'
            }`}
          >
            {/* ------------------------------------------------------------- */}
            {/* SECTION 0: CLIENT INFO & ADMIN CONTROLS BLOCK                */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-[#F9FBF9] border border-[#CBD5E1] rounded-lg p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#0A3A1E]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#0A3A1E]">
                    Client Information & Admin Controls
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500">Ref: {quoteReference}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Client Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded pl-8 pr-3 py-1.5 font-medium text-slate-900 focus:outline-none focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]"
                      placeholder="e.g. Engr. Roberto D. Alcantara"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded pl-8 pr-3 py-1.5 font-medium text-slate-900 focus:outline-none focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]"
                      placeholder="client@domain.ph"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded pl-8 pr-3 py-1.5 font-medium text-slate-900 focus:outline-none focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]"
                      placeholder="+63 917 000 0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Proposal Date</label>
                  <input
                    type="text"
                    value={quoteDate}
                    onChange={(e) => setQuoteDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 font-medium text-slate-900 focus:outline-none focus:border-[#0A3A1E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-medium mb-1">Site Location Address</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={siteAddress}
                      onChange={(e) => setSiteAddress(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded pl-8 pr-3 py-1.5 font-medium text-slate-900 focus:outline-none focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]"
                      placeholder="Property address, Subdivision, City"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center flex-wrap gap-2">
                  <button
                    onClick={handleSaveCurrentQuotation}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-[#0A3A1E] text-[#D4AF37] hover:bg-[#063217] border border-[#D4AF37] transition-all shadow-sm active:scale-95"
                    title="Save current inputs, calculations, and client details into history"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Save Quotation</span>
                  </button>

                  <button
                    onClick={handleUpdateCalculations}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    title="Recompute all engineering yields, battery sizing, and financial ROI"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#0A3A1E] ${updateFeedback ? 'animate-spin' : ''}`} />
                    <span>Recalculate System</span>
                  </button>

                  {updateFeedback && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 animate-fade-in">
                      <Check className="w-3 h-3" /> Recomputed & Live Bound
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintProposal}
                    disabled={isGeneratingPdf}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors shadow-sm ${
                      isGeneratingPdf
                        ? 'bg-amber-200 text-amber-900 cursor-wait'
                        : 'text-[#0A3A1E] bg-[#D4AF37] hover:bg-[#E5C158]'
                    }`}
                  >
                    {isGeneratingPdf ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-[#0A3A1E] animate-spin" />
                        <span>Exporting PDF...</span>
                      </>
                    ) : (
                      <>
                        <Printer className="w-3.5 h-3.5 text-[#0A3A1E]" />
                        <span>Export PDF Proposal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PANEL 1: ELECTRICITY TARIFF & USAGE CONFIGURATION PANEL       */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-[#F9FBF9] border border-[#CBD5E1] rounded-lg shadow-sm overflow-hidden">
              {/* Header Bar */}
              <div className="bg-[#0A3A1E] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2.5 border-b border-[#063217]">
                <div className="flex items-center gap-2 min-w-0">
                  <Zap className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-white">
                    Tariff & Usage Configuration
                  </h3>
                </div>

                <div className="flex items-center justify-end ml-auto shrink-0">
                  {/* Mode Toggle */}
                  <div className="flex items-center bg-[#063217] p-0.5 rounded border border-emerald-900 text-[11px] shadow-inner">
                    <button
                      onClick={() => setUsageMode('KWH')}
                      className={`px-2.5 py-1 rounded transition-colors font-semibold ${
                        usageMode === 'KWH' ? 'bg-[#D4AF37] text-[#0A3A1E] shadow-xs' : 'text-emerald-100 hover:text-white'
                      }`}
                    >
                      KWH MODE
                    </button>
                    <button
                      onClick={() => setUsageMode('BILL')}
                      className={`px-2.5 py-1 rounded transition-colors font-semibold ${
                        usageMode === 'BILL' ? 'bg-[#D4AF37] text-[#0A3A1E] shadow-xs' : 'text-emerald-100 hover:text-white'
                      }`}
                    >
                      BILL MODE
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Layout with 3 Distinct Input/Output Cards */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CARD 1: Electricity Rate (₱/kWh) */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Electricity Rate
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        Tariff
                      </span>
                    </div>

                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2.5 font-mono text-base font-bold text-slate-400">₱</span>
                      <input
                        type="number"
                        step="0.10"
                        min="1"
                        max="50"
                        value={electricityRate}
                        onChange={(e) => handleRateChange(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded pl-7 pr-16 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]"
                      />
                      <span className="absolute right-3 top-3 text-xs font-medium text-slate-500">/ kWh</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Grid electric power rate per kilowatt-hour
                    </p>
                  </div>
                </div>

                {/* CARD 2: Monthly Electric Usage */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Monthly Electric Usage
                      </span>
                      {usageMode === 'BILL' && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1 rounded">
                          Calculated
                        </span>
                      )}
                    </div>

                    <div className="relative mt-1">
                      <input
                        type="number"
                        step="10"
                        min="50"
                        max="20000"
                        disabled={usageMode === 'BILL'}
                        value={monthlyUsageKwh}
                        onChange={(e) => handleKwhChange(parseFloat(e.target.value) || 0)}
                        className={`w-full border rounded pl-3 pr-16 py-2 text-lg font-mono font-bold focus:outline-none ${
                          usageMode === 'BILL'
                            ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed'
                            : 'bg-[#F8FAFC] text-slate-900 border-slate-300 focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]'
                        }`}
                      />
                      <span className="absolute right-3 top-3 text-xs font-medium text-slate-500">kWh/mo</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">Daily Average Load:</span>
                      <span className="font-mono font-bold text-[#0A3A1E]">{averageDailyLoad.toFixed(1)} kWh/day</span>
                    </div>
                  </div>
                </div>

                {/* CARD 3: Calculated Monthly Bill */}
                <div className="bg-gradient-to-br from-[#F9FBF9] to-[#E6F4EA] border border-emerald-300 rounded-lg p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#0A3A1E] uppercase tracking-wider">
                        Monthly Bill
                      </span>
                    </div>

                    {usageMode === 'BILL' ? (
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-2.5 font-mono text-base font-bold text-slate-400">₱</span>
                        <input
                          type="number"
                          step="100"
                          value={billAmountInput}
                          onChange={(e) => handleBillChange(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-emerald-400 rounded pl-7 pr-14 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0A3A1E]"
                        />
                        <span className="absolute right-3 top-3 text-xs font-medium text-slate-500">/ mo</span>
                      </div>
                    ) : (
                      <div className="mt-1 py-1.5">
                        <div className="text-xl md:text-2xl font-mono font-extrabold text-[#0A3A1E]">
                          ₱{activeMonthlyBill.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-xs font-normal text-slate-600 ml-1">/ mo</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-emerald-200/80">
                    <p className="text-[11px] font-mono text-slate-600">
                      Formula: {activeMonthlyKwh} kWh × ₱{electricityRate.toFixed(2)}/kWh
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PANEL 2: ACTIVE HARDWARE CONFIGURATION PANEL                 */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-[#F9FBF9] border border-[#CBD5E1] rounded-lg shadow-sm overflow-hidden">
              {/* Header Bar */}
              <div className="bg-[#0A3A1E] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2.5 border-b border-[#063217]">
                <div className="flex items-center gap-2 min-w-0">
                  <BatteryCharging className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-white">
                    Active Hardware Configuration
                  </h3>
                </div>

                <div className="flex items-center justify-end ml-auto shrink-0">
                  {/* Tab Switch */}
                  <div className="flex items-center bg-[#063217] p-0.5 rounded border border-emerald-900 text-[11px] shadow-inner">
                    <button
                      onClick={() => setConfigTab('STANDARD')}
                      className={`px-3 py-1 rounded transition-colors font-semibold ${
                        configTab === 'STANDARD' ? 'bg-[#D4AF37] text-[#0A3A1E] shadow-xs' : 'text-emerald-100 hover:text-white'
                      }`}
                    >
                      STANDARD
                    </button>
                    <button
                      onClick={() => setConfigTab('ADVANCED')}
                      className={`px-3 py-1 rounded transition-colors font-semibold ${
                        configTab === 'ADVANCED' ? 'bg-[#D4AF37] text-[#0A3A1E] shadow-xs' : 'text-emerald-100 hover:text-white'
                      }`}
                    >
                      ADVANCED
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Layout with 4 Controls */}
              <div className="p-5">
                {configTab === 'STANDARD' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Control 1: Solar Packages Select */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Solar Packages
                          </label>
                          <button
                            onClick={autoMatchPackage}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline"
                          >
                            Auto-Match Size
                          </button>
                        </div>

                        <select
                          value={selectedPackageId}
                          onChange={(e) => handlePackageSelect(e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-slate-300 rounded px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0A3A1E]"
                        >
                          {SOLAR_PACKAGES.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name}
                            </option>
                          ))}
                        </select>

                        {selectedPackageId === 'pkg-custom' && (
                          <div className="mt-2.5">
                            <label htmlFor={customKwpInputId} className="text-[11px] text-slate-500 font-medium">Custom Solar kWp:</label>
                            <input
                              id={customKwpInputId}
                              type="number"
                              step="0.5"
                              value={installedSolarKwp}
                              onChange={(e) => setInstalledSolarKwp(parseFloat(e.target.value) || 0)}
                              className="w-full mt-1 border border-slate-300 rounded px-2.5 py-1 text-sm font-mono font-bold"
                            />
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500">Daily Solar Output:</span>
                        <span className="font-mono font-bold text-[#0A3A1E]">
                          ~{estDailySolarGeneration.toFixed(1)} kWh/day
                        </span>
                      </div>
                    </div>

                    {/* Control 2: Battery Capacity Input */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Battery Capacity
                          </label>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {dodPercent}% DoD
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="200"
                            value={installedBatteryKwh}
                            onChange={(e) => setInstalledBatteryKwh(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#F8FAFC] border border-slate-300 rounded pl-3 pr-14 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0A3A1E]"
                          />
                          <span className="absolute right-3 top-3 text-xs font-medium text-slate-500">kWh</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <p className="text-[11px] font-mono text-slate-600">
                          Usable storage: <strong className="text-[#0A3A1E]">{usableBatteryCapacity.toFixed(1)} kWh</strong> ({dodPercent}% DoD)
                        </p>
                      </div>
                    </div>

                    {/* Control 3: Daytime Load % (AM) */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Daytime Load % (AM)
                          </label>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                            AM Load
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={daytimeLoadPercent}
                            onChange={(e) => handleDaytimePercentChange(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#F8FAFC] border border-slate-300 rounded pl-3 pr-10 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]"
                          />
                          <span className="absolute right-3 top-3 text-xs font-medium text-slate-500">%</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500">Daytime Requirement:</span>
                        <span className="font-mono font-bold text-[#0A3A1E]">
                          ~{daytimeLoadKwh.toFixed(1)} kWh/day
                        </span>
                      </div>
                    </div>

                    {/* Control 4: Nighttime Load % (PM) */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Nighttime Load % (PM)
                          </label>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                            PM Load
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={nighttimeLoadPercent}
                            onChange={(e) => handleNighttimePercentChange(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#F8FAFC] border border-slate-300 rounded pl-3 pr-10 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]"
                          />
                          <span className="absolute right-3 top-3 text-xs font-medium text-slate-500">%</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500">Night Energy Needed:</span>
                        <span className="font-mono font-bold text-[#0A3A1E]">
                          ~{nighttimeLoadKwh.toFixed(1)} kWh/day
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ADVANCED CONFIGURATIONS TAB */
                  <div>
                    {/* Primary 4-Card Grid (matches Standard Configurations layout, with numeric Solar Package input) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Control 1: Solar Packages (Numeric Input) */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Solar Packages
                            </label>
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                              Numeric Input
                            </span>
                          </div>

                          <div className="relative">
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="500"
                              value={installedSolarKwp}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setInstalledSolarKwp(val);
                                const matchingPkg = SOLAR_PACKAGES.find((p) => p.kwp === val && p.id !== 'pkg-custom');
                                setSelectedPackageId(matchingPkg ? matchingPkg.id : 'pkg-custom');
                              }}
                              className="w-full bg-[#F8FAFC] border border-slate-300 rounded pl-3 pr-14 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]"
                              placeholder="e.g. 10.0"
                            />
                            <span className="absolute right-3 top-3 text-xs font-medium text-slate-500">kWp</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-500">Daily Solar Output:</span>
                          <span className="font-mono font-bold text-[#0A3A1E]">
                            ~{estDailySolarGeneration.toFixed(1)} kWh/day
                          </span>
                        </div>
                      </div>

                      {/* Control 2: Battery Capacity (Numeric Input) */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Battery Capacity
                            </label>
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {dodPercent}% DoD
                            </span>
                          </div>

                          <div className="relative">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              max="300"
                              value={installedBatteryKwh}
                              onChange={(e) => setInstalledBatteryKwh(parseFloat(e.target.value) || 0)}
                              className="w-full bg-[#F8FAFC] border border-slate-300 rounded pl-3 pr-14 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]"
                            />
                            <span className="absolute right-3 top-3 text-xs font-medium text-slate-500">kWh</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100">
                          <p className="text-[11px] font-mono text-slate-600">
                            Usable storage: <strong className="text-[#0A3A1E]">{usableBatteryCapacity.toFixed(1)} kWh</strong> ({dodPercent}% DoD)
                          </p>
                        </div>
                      </div>

                      {/* Control 3: Daytime Load % (AM) */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Daytime Load % (AM)
                            </label>
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                              AM Load
                            </span>
                          </div>

                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={daytimeLoadPercent}
                              onChange={(e) => handleDaytimePercentChange(parseFloat(e.target.value) || 0)}
                              className="w-full bg-[#F8FAFC] border border-slate-300 rounded pl-3 pr-10 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]"
                            />
                            <span className="absolute right-3 top-3 text-xs font-medium text-slate-500">%</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-500">Daytime Requirement:</span>
                          <span className="font-mono font-bold text-[#0A3A1E]">
                            ~{daytimeLoadKwh.toFixed(1)} kWh/day
                          </span>
                        </div>
                      </div>

                      {/* Control 4: Nighttime Load % (PM) */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Nighttime Load % (PM)
                            </label>
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                              PM Load
                            </span>
                          </div>

                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={nighttimeLoadPercent}
                              onChange={(e) => handleNighttimePercentChange(parseFloat(e.target.value) || 0)}
                              className="w-full bg-[#F8FAFC] border border-slate-300 rounded pl-3 pr-10 py-2 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]"
                            />
                            <span className="absolute right-3 top-3 text-xs font-medium text-slate-500">%</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-500">Night Energy Needed:</span>
                          <span className="font-mono font-bold text-[#0A3A1E]">
                            ~{nighttimeLoadKwh.toFixed(1)} kWh/day
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Technical Tuning & System Loss Multipliers */}
                    <div className="mt-4 pt-3.5 border-t border-slate-200">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[#0A3A1E]" />
                        <span>Engineering Multipliers & Cost Rates</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <label className="block text-[11px] text-slate-600 font-medium mb-1">Peak Sun (hrs)</label>
                          <input
                            type="number"
                            step="0.05"
                            min="2.5"
                            max="6.5"
                            value={peakSunHours}
                            onChange={(e) => setPeakSunHours(parseFloat(e.target.value) || 5.0)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-[#0A3A1E]"
                          />
                          <span className="text-[9px] text-slate-400 mt-0.5 block">Default: 5.0h</span>
                        </div>

                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <label className="block text-[11px] text-slate-600 font-medium mb-1">Battery DoD %</label>
                          <input
                            type="number"
                            step="5"
                            min="50"
                            max="95"
                            value={dodPercent}
                            onChange={(e) => setDodPercent(parseFloat(e.target.value) || 80)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-[#0A3A1E]"
                          />
                          <span className="text-[9px] text-slate-400 mt-0.5 block">LiFePO4: 80%</span>
                        </div>

                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <label className="block text-[11px] text-slate-600 font-medium mb-1">Loss Buffer (+%)</label>
                          <input
                            type="number"
                            step="5"
                            min="5"
                            max="35"
                            value={systemLossBuffer}
                            onChange={(e) => setSystemLossBuffer(parseFloat(e.target.value) || 20)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-[#0A3A1E]"
                          />
                          <span className="text-[9px] text-slate-400 mt-0.5 block">Oversize: +20%</span>
                        </div>

                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <label className="block text-[11px] text-slate-600 font-medium mb-1">Line Derate %</label>
                          <input
                            type="number"
                            step="1"
                            min="5"
                            max="30"
                            value={derateFactor}
                            onChange={(e) => setDerateFactor(parseFloat(e.target.value) || 15)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-[#0A3A1E]"
                          />
                          <span className="text-[9px] text-slate-400 mt-0.5 block">Thermal: -15%</span>
                        </div>

                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <label className="block text-[11px] text-slate-600 font-medium mb-1">PV Rate (₱/kWp)</label>
                          <input
                            type="number"
                            step="1000"
                            value={costPerKwp}
                            onChange={(e) => setCostPerKwp(parseFloat(e.target.value) || 52000)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-[#0A3A1E]"
                          />
                          <span className="text-[9px] text-slate-400 mt-0.5 block">₱52,000/kWp</span>
                        </div>

                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <label className="block text-[11px] text-slate-600 font-medium mb-1">ESS Rate (₱/kWh)</label>
                          <input
                            type="number"
                            step="500"
                            value={costPerBatteryKwh}
                            onChange={(e) => setCostPerBatteryKwh(parseFloat(e.target.value) || 18500)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-[#0A3A1E]"
                          />
                          <span className="text-[9px] text-slate-400 mt-0.5 block">₱18,500/kWh</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PANEL 3: SELF-SUFFICIENCY & PERFORMANCE SUMMARY PANEL        */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-[#F9FBF9] border border-[#CBD5E1] rounded-lg shadow-sm overflow-hidden">
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-[#0A3A1E] via-[#063217] to-[#0A3A1E] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#D4AF37]">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-white">
                    System Self-Sufficiency & Performance
                  </h3>
                </div>
              </div>

              {/* Two Sub-Cards Side-by-Side */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SUB-CARD 1: Daily Power Balance */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <span className="text-xs font-bold text-[#0A3A1E] uppercase tracking-wider flex items-center gap-1.5">
                        <Sun className="w-4 h-4 text-[#D4AF37]" />
                        Daily Power Balance
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-slate-500">
                        {monthlyUsageKwh} kWh/mo
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600">Monthly Usage:</span>
                        <span className="font-mono font-semibold text-slate-900">{activeMonthlyKwh.toLocaleString()} kWh/mo</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600">Average Daily Load:</span>
                        <span className="font-mono font-semibold text-slate-900">{averageDailyLoad.toFixed(2)} kWh/day</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600">Daytime Load ({daytimeLoadPercent}%):</span>
                        <span className="font-mono font-semibold text-slate-900">{daytimeLoadKwh.toFixed(2)} kWh/day</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600">Nighttime Load ({nighttimeLoadPercent}%):</span>
                        <span className="font-mono font-semibold text-slate-900">{nighttimeLoadKwh.toFixed(2)} kWh/day</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600">Recommended Size After Loss:</span>
                        <span className="font-mono font-semibold text-slate-900">{recommendedSizeAfterLoss.toFixed(2)} kWp (+{systemLossBuffer}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Highlighted Row */}
                  <div className="mt-4 p-3 rounded bg-[#E6F4EA] border border-emerald-300 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-emerald-800 uppercase">
                        Est. Daily Solar Generation
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        {installedSolarKwp} kWp × {peakSunHours} Sun Hours
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-mono font-extrabold text-[#0A3A1E]">
                        {estDailySolarGeneration.toFixed(2)} kWh/day
                      </div>
                      <div className="text-[10px] font-mono text-emerald-700">
                        ~{monthlySolarGeneration.toLocaleString()} kWh/month
                      </div>
                    </div>
                  </div>
                </div>

                {/* SUB-CARD 2: Battery Storage Performance */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <span className="text-xs font-bold text-[#0A3A1E] uppercase tracking-wider flex items-center gap-1.5">
                        <Battery className="w-4 h-4 text-[#D4AF37]" />
                        Battery Storage Performance
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-slate-500">
                        {installedBatteryKwh} kWh Installed
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600">Installed Capacity:</span>
                        <span className="font-mono font-semibold text-slate-900">{installedBatteryKwh.toFixed(1)} kWh</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600">Usable Battery ({dodPercent}% DoD):</span>
                        <span className="font-mono font-semibold text-emerald-700 font-bold">{usableBatteryCapacity.toFixed(2)} kWh</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600">Reserve Capacity ({100 - dodPercent}%):</span>
                        <span className="font-mono font-semibold text-slate-900">{reserveBatteryCapacity.toFixed(2)} kWh</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600">Nighttime Energy Needed:</span>
                        <span className="font-mono font-semibold text-slate-900">{nighttimeLoadKwh.toFixed(2)} kWh/day</span>
                      </div>
                    </div>
                  </div>

                  {/* Highlighted Row for Grid Import */}
                  <div className={`mt-4 p-3 rounded border flex items-center justify-between ${
                    nighttimeGridImportNeeded <= 0 ? 'bg-[#E6F4EA] border-emerald-300' : 'bg-amber-50 border-amber-300'
                  }`}>
                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-800">
                        Grid Import Required
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {nighttimeGridImportNeeded <= 0 ? 'Zero grid dependency during nighttime' : 'Supplemental grid power needed'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-base font-mono font-extrabold ${
                        nighttimeGridImportNeeded <= 0 ? 'text-[#059669]' : 'text-amber-800'
                      }`}>
                        {nighttimeGridImportNeeded.toFixed(2)} kWh/day
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {nighttimeGridImportNeeded <= 0 ? '100% OFF-GRID' : `₱${(nighttimeGridImportNeeded * electricityRate * 30).toFixed(0)}/mo import`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: DYNAMIC PDF PROPOSAL (A4 ENERGY ENGINEERING REPORT)         */}
          {/* ========================================================================= */}
          <div
            className={`w-full flex flex-col items-stretch justify-start ${
              viewMode === 'calculator' ? 'hidden' : viewMode === 'split' ? 'lg:col-span-6 xl:col-span-6' : 'w-full'
            }`}
          >
            {/* Live Proposal Display Title Bar */}
            <div className="no-print flex items-center justify-between mb-3 px-1 w-full">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0A3A1E]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A3A1E]">
                  Live Proposal Display
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={handlePrintProposal}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1 font-bold text-[#0A3A1E] hover:underline disabled:opacity-50"
                >
                  {isGeneratingPdf ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-[#0A3A1E] animate-spin" />
                      <span>Exporting PDF...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-3.5 h-3.5" />
                      <span>Export PDF Proposal</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PROPOSAL DISPLAY & DOWNLOADABLE PDF CONTAINER WRAPPER - Full Width Edge-to-Edge */}
            <div className="w-full pb-6">
              <div
                ref={proposalSheetRef}
                id="proposal-document-sheet"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                className="pdf-report-root w-full bg-white shadow-2xl rounded-none text-slate-900 transition-all box-border flex flex-col"
              >
                {/* ================================================================= */}
                {/* TOP HEADER BAR (Deep Forest Green #0A3A1E) - Full Bleed Edge      */}
                {/* ================================================================= */}
                <div className="bg-[#0A3A1E] text-white px-5 py-3 sm:px-6 sm:py-3.5 border-b-4 border-[#D4AF37] flex flex-row items-center justify-between gap-3 box-border rounded-none">
                  {/* Left: Brand Logo */}
                  <div className="flex items-center min-w-0">
                    <img
                      src="/powershift-logo.png"
                      alt="PowerShift - Driving Global Change"
                      className="h-12 sm:h-14 w-auto object-contain"
                    />
                  </div>

                  {/* Right: Date & Client */}
                  <div className="shrink-0 text-right text-[11px] leading-tight font-medium text-emerald-100 pl-2">
                    <div><strong className="text-[#D4AF37]">DATE:</strong> {quoteDate}</div>
                    <div className="mt-0.5 truncate max-w-[180px] sm:max-w-[240px]">
                      <strong className="text-[#D4AF37]">CLIENT:</strong> {clientName.trim() ? clientName : 'NON-APPLICABLE'}
                    </div>
                  </div>
                </div>

                {/* DOCUMENT BODY - Natural Spacing, No Stretched Gaps */}
                <div className="p-5 sm:p-7 space-y-4 box-border w-full flex flex-col">
                  {/* Introductory text */}
                  <p className="text-[12px] text-slate-700 leading-snug">
                    Thank you for choosing Powershift Solar. Below is your official solar PV and battery storage energy engineering report based on the parameters provided.
                  </p>

                  {/* =============================================================== */}
                  {/* 1. CUSTOMER CONSUMPTION PROFILE & TARIFF                         */}
                  {/* =============================================================== */}
                  <div className="page-break-avoid bg-[#F9FBF9] border border-slate-200 rounded p-3 sm:p-4 space-y-2.5 box-border w-full">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0A3A1E] border-b border-slate-200 pb-1 flex items-center justify-between">
                      <span>1. Customer Consumption Profile & Tariff</span>
                      <span className="text-[10px] text-slate-400 font-normal normal-case">Baseline Metrics</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
                      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between shadow-2xs min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate">
                          Monthly Consumption
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-[13px] mt-1 truncate">
                          {activeMonthlyKwh.toLocaleString()}{' '}
                          <span className="text-[10px] font-normal text-slate-500">kWh / mo</span>
                        </span>
                      </div>

                      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between shadow-2xs min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate">
                          Daytime Load (AM)
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-[13px] mt-1 truncate">
                          {amRequirementKwh.toFixed(2)}{' '}
                          <span className="text-[10px] font-normal text-slate-500">kWh ({daytimeLoadPercent}%)</span>
                        </span>
                      </div>

                      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between shadow-2xs min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate">
                          Electricity Rate
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-[13px] mt-1 truncate">
                          PHP {elecRate.toFixed(2)}{' '}
                          <span className="text-[10px] font-normal text-slate-500">/ kWh</span>
                        </span>
                      </div>

                      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between shadow-2xs min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate">
                          Avg Daily Usage
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-[13px] mt-1 truncate">
                          {dailyKwh.toFixed(2)}{' '}
                          <span className="text-[10px] font-normal text-slate-500">kWh / day</span>
                        </span>
                      </div>

                      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between shadow-2xs min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate">
                          Nighttime Load (PM)
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-[13px] mt-1 truncate">
                          {pmRequirementKwh.toFixed(2)}{' '}
                          <span className="text-[10px] font-normal text-slate-500">kWh ({nighttimeLoadPercent}%)</span>
                        </span>
                      </div>

                      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col justify-between shadow-2xs min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate">
                          Est. Monthly Bill
                        </span>
                        <span className="font-mono font-bold text-[#0A3A1E] text-xs sm:text-[13px] mt-1 truncate">
                          PHP {activeMonthlyBill.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                          <span className="text-[10px] font-normal text-slate-500">/ mo</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* =============================================================== */}
                  {/* SYSTEM PACKAGE RECOMMENDATION BANNER                             */}
                  {/* =============================================================== */}
                  <div className="bg-[#0A3A1E] text-white border-2 border-[#D4AF37] rounded-md px-4 py-3 flex flex-wrap justify-between items-center gap-3 page-break-avoid box-border w-full">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                        System Package Recommendation:
                      </div>
                      <div className="text-base sm:text-lg font-extrabold text-white mt-0.5 truncate">
                        {SOLAR_PACKAGES.find((p) => p.id === selectedPackageId)?.name || `${installedSolarKwp.toFixed(0)}kW Package`}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-bold text-white font-mono bg-[#063217] border border-[#D4AF37]/40 px-3 py-1.5 rounded shadow-inner">
                        Est. Savings: <span className="text-[#D4AF37]">PHP {Math.round(estMonthlySavings).toLocaleString()}/mo</span>
                        <span className="mx-2 text-slate-400">|</span>
                        Payback: <span className="text-[#D4AF37]">~{estPaybackYears} Yrs</span>
                      </div>
                    </div>
                  </div>

                  {/* =============================================================== */}
                  {/* 2. RECOMMENDED SYSTEM & GENERATION PERFORMANCE                   */}
                  {/* =============================================================== */}
                  <div className="page-break-avoid w-full">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0A3A1E] mb-1.5">
                      2. Recommended System & Generation Performance
                    </h4>

                    <div className="border border-slate-200 rounded overflow-hidden w-full">
                      <table className="w-full border-collapse text-left text-[11px] box-border">
                        <colgroup>
                          <col className="w-3/5 sm:w-7/12" />
                          <col className="w-2/5 sm:w-5/12" />
                        </colgroup>
                        <tbody className="divide-y divide-slate-200">
                          <tr className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-slate-700 font-medium">Installed Solar PV Capacity</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{installedSolarKwp.toFixed(2)} kWp</td>
                          </tr>
                          <tr className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-slate-700 font-medium">Recommended System Size After Loss</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-800 whitespace-nowrap">{recommendedSystemSizeAfterLoss.toFixed(2)} kWp (+20% loss factor)</td>
                          </tr>
                          <tr className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-slate-700 font-medium">Thermal & Wiring Loss Factor</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600 whitespace-nowrap">-{(efficiencyLossWatts / 1000).toFixed(2)} kW (15% loss)</td>
                          </tr>
                          <tr className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-slate-700 font-medium">Net Peak Generation Output</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{netPeakGenerationAcOutput.toFixed(2)} kW</td>
                          </tr>
                          <tr className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-slate-700 font-medium">Daytime (AM) Load Allocation</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-800 whitespace-nowrap">{amRequirementKwh.toFixed(2)} kWh / day ({daytimeLoadPercent}% daytime load)</td>
                          </tr>
                          {/* Highlighted Green Row: Est. Daily Solar Generation */}
                          <tr className="bg-[#E6F4EA] font-bold text-[#0A3A1E] border-t-2 border-b-2 border-emerald-400">
                            <td className="py-2.5 px-3">Est. Daily Solar Generation</td>
                            <td className="py-2.5 px-3 text-right font-mono text-xs sm:text-sm text-[#0A3A1E] whitespace-nowrap">
                              {dailyGenKwh.toFixed(2)} kWh / day
                            </td>
                          </tr>
                          {/* Highlighted Neutral Row: Avg Daily Usage */}
                          <tr className="bg-[#EEF2F6] font-bold text-slate-800 border-b border-slate-300">
                            <td className="py-2.5 px-3">Avg Daily Usage</td>
                            <td className="py-2.5 px-3 text-right font-mono text-xs sm:text-sm text-slate-800 whitespace-nowrap">
                              {dailyKwh.toFixed(2)} kWh / day
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* =============================================================== */}
                  {/* 3. BATTERY SOLAR STORAGE & GRID DEPENDENCY                       */}
                  {/* =============================================================== */}
                  <div className="page-break-avoid w-full">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#0A3A1E] mb-1.5">
                      3. Battery Solar Storage & Grid Dependency
                    </h4>

                    <div className="border border-slate-200 rounded overflow-hidden w-full">
                      <table className="w-full border-collapse text-left text-[11px] box-border">
                        <colgroup>
                          <col className="w-3/5 sm:w-7/12" />
                          <col className="w-2/5 sm:w-5/12" />
                        </colgroup>
                        <tbody className="divide-y divide-slate-200">
                          <tr className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-slate-700 font-medium">Installed Battery Storage Capacity</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{installedBatteryKwh.toFixed(1)} kWh</td>
                          </tr>
                          <tr className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-slate-700 font-medium">Usable Battery Capacity (80% DoD)</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">{usableBatteryCapacity.toFixed(2)} kWh</td>
                          </tr>
                          <tr className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-slate-700 font-medium">Nighttime (PM) Load Allocation</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-800 whitespace-nowrap">{pmRequirementKwh.toFixed(2)} kWh / day</td>
                          </tr>
                          <tr className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-slate-700 font-medium">Emergency Reserve Buffer (20%)</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700 whitespace-nowrap">{reserveBatteryCapacity.toFixed(2)} kWh</td>
                          </tr>
                          {/* Highlighted Result Row: Estimated Nighttime Grid Import Needed */}
                          <tr className={`border-t-2 font-bold ${
                            remainingGridDependencyKwh <= 0 ? 'bg-[#E6F4EA] border-emerald-400 text-[#0A3A1E]' : 'bg-amber-50 border-amber-300 text-amber-900'
                          }`}>
                            <td className="py-2.5 px-3">Estimated Nighttime Grid Import Needed</td>
                            <td className="py-2.5 px-3 text-right font-mono text-xs sm:text-sm whitespace-nowrap">
                              {remainingGridDependencyKwh <= 0
                                ? '0 kWh / day (100% Off-Grid Ready)'
                                : `${remainingGridDependencyKwh.toFixed(2)} kWh / day (Import Needed)`}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* =============================================================== */}
                  {/* FOOTER BAR                                                      */}
                  {/* =============================================================== */}
                  <div className="border-t-2 border-[#0A3A1E] pt-3 mt-4 text-[11px] text-slate-600 flex flex-wrap justify-between items-center gap-2 page-break-avoid w-full box-border">
                    <div className="min-w-0">
                      <div className="font-extrabold uppercase tracking-wide text-[#0A3A1E] text-[11px]">
                        CONTACT OUR ENGINEERING DESK TO GET A DETAILED PROPOSAL
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        Email: <strong>c2r2gsm@gmail.com</strong> | Phone: <strong>0935 479 6321</strong> | Web: <strong>www.powershift.asia</strong>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                      Page 1 of 1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>

      {/* ========================================================================= */}
      {/* 6. SAVED CLIENTS & QUOTATIONS MANAGER (Collapsible Drawer / Sidebar)       */}
      {/* ========================================================================= */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden no-print">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#F9FBF9] shadow-2xl flex flex-col border-l-2 border-[#D4AF37] animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="bg-[#0A3A1E] text-white p-4 flex items-center justify-between border-b-2 border-[#D4AF37]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-[#063217] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37]">
                    <FolderArchive className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Saved Client Records & Quotations
                    </h3>
                    <p className="text-[11px] text-emerald-200/90 font-medium">
                      Select any record to load into calculator & PDF
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E6F4EA] text-[#059669]">
                    {savedQuotations.length} Saved
                  </span>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 rounded text-emerald-200 hover:text-white hover:bg-[#063217] transition-colors"
                    title="Close Drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Action Toolbar & Search */}
              <div className="p-3.5 bg-white border-b border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveCurrentQuotation}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded bg-[#0A3A1E] text-[#D4AF37] hover:bg-[#063217] border border-[#D4AF37] transition-colors shadow-sm active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Save Quotation</span>
                  </button>
                  <button
                    onClick={handleRestoreDefaults}
                    title="Restore standard sample records"
                    className="px-2.5 py-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors whitespace-nowrap"
                  >
                    Restore Samples
                  </button>
                </div>

                {/* Search Filter */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search client, location, or reference..."
                    className="w-full bg-[#F8FAFC] border border-slate-300 rounded pl-8 pr-7 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0A3A1E] focus:ring-1 focus:ring-[#0A3A1E]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Saved Records List */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                {filteredSavedQuotations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <FolderArchive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No matching client quotations found</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {searchQuery ? 'Try clearing your search query.' : 'Click "Save Quotation" to save your first record.'}
                    </p>
                  </div>
                ) : (
                  filteredSavedQuotations.map((record) => {
                    const isActive = activeLoadedId === record.id;
                    return (
                      <div
                        key={record.id}
                        onClick={() => handleLoadQuotation(record)}
                        className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#E6F4EA] border-[#059669] shadow-sm ring-1 ring-[#059669]'
                            : 'bg-white border-slate-200 hover:border-[#0A3A1E] hover:shadow-xs'
                        }`}
                      >
                        {/* Top Row: Client Name & Delete Button */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 group-hover:text-[#0A3A1E] transition-colors">
                                {record.clientName}
                              </span>
                              {isActive && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#059669] text-white uppercase tracking-wider">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                              Ref: {record.quoteReference}
                            </div>
                          </div>

                          {/* Quick Delete Control */}
                          <button
                            onClick={(e) => handleDeleteQuotation(record.id, e)}
                            title="Delete this saved quotation"
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Location & Contact */}
                        <div className="space-y-1 text-[11px] text-slate-600 mt-2">
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span className="truncate">{record.siteAddress}</span>
                          </div>
                          {record.clientPhone && (
                            <div className="flex items-center gap-1 text-[10.5px] text-slate-700 font-medium">
                              <Phone className="w-3 h-3 text-[#0A3A1E] shrink-0" />
                              <span className="truncate">{record.clientPhone}</span>
                            </div>
                          )}
                        </div>

                        {/* Package Specs Badge */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#0A3A1E] flex items-center gap-1">
                            <Sun className="w-3 h-3 text-[#D4AF37]" />
                            {record.packageName || `${record.installedSolarKwp}kW`} ({record.installedSolarKwp.toFixed(1)} kWp · {record.installedBatteryKwh} kWh)
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            ₱{record.electricityRate.toFixed(2)}/kWh
                          </span>
                        </div>

                        {/* Saved Date */}
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {record.savedAt}
                          </span>
                          <span className="text-emerald-700 font-semibold group-hover:underline flex items-center gap-0.5">
                            Click to Load <ChevronRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-3 bg-white border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Stored in browser localStorage</span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="font-semibold text-[#0A3A1E] hover:underline"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A3A1E] text-white border-2 border-[#D4AF37] px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 no-print">
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
          <span>{saveToast}</span>
        </div>
      )}
    </div>
  );
}
