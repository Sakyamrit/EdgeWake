export type ActiveScreen = 'dashboard' | 'benchmarks';

export type PipelineStage =
  | 'listening'
  | 'wake_detected'
  | 'streaming'
  | 'transcribing'
  | 'complete'
  | 'error';

export type DataMode = 'live' | 'demo';

export type ConnectionState =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'error'
  | 'demo';

export interface LogEntry {
  id: string;
  time: string;
  tag: 'SYS' | 'KWS' | 'ASR' | 'AUDIO';
  message: string;
  type: 'dim' | 'normal' | 'primary' | 'secondary' | 'pending' | 'error';
}

export interface TranscriptEntry {
  id: string;
  time: string;
  text: string;
  status: 'streaming' | 'complete';
  confidence: number;
  isDemo?: boolean;
}

export interface LiveMetrics {
  // Device resources
  ramUsedKb: number;
  ramMaxKb: number;
  flashUsedKb: number | null;
  cpuIdlePercent: number;
  rssi: number | null;

  // KWS
  keyword: string;
  confidence: number;
  inferenceLatencyMs: number;

  // Stream
  packetsStreamed: number;

  // Latency
  networkLatencyMs: number | null; // Cannot measure without synchronized clocks
  asrLatencyMs: number | null;     // From asr_final event
  totalLatencyMs: number | null;   // Cannot compute without network component in live mode

  // Accuracy (test data only)
  falseActivationsPerHour: number | null;
}

export interface ActivationSession {
  id: string;           // e.g. "#0001"
  isLocalId: true;      // always true — locally generated, never from backend
  startedAt: Date;
  completedAt?: Date;
  confidence: number | null;
  inferenceMs: number | null;
  packetsStreamed: number;
  transcript: string | null;
  asrMs: number | null;
  totalMs: number | null;
  finalState: PipelineStage;
  errorCode?: string;
  errorMessage?: string;
}

export interface BenchmarkTelemetryRow {
  id: string;
  metric: string;
  target: string;
  latestResult: string | null; // null = not measured
  status: 'Pass' | 'Warning' | 'Fail' | 'NOT_MEASURED';
  notes: string;
}

export interface NoiseEnvironment {
  id: string;
  title: string;
  icon: string;
  oneMeterAccuracy: number | null;    // null = not measured
  threeMeterAccuracy: number | null;  // null = not measured
  accentColor: 'secondary' | 'primary' | 'tertiary' | 'error';
}

export interface HardwareConfig {
  chipset: string;
  dspCore: string;
  audioFrontend: string;
  sampleRateHz: number;
  bitDepth: number;
  quantization: string;
}

// ── Telemetry wire-protocol event types ──────────────────────────────────────

export interface DeviceStateEvent {
  type: 'device_state';
  state: PipelineStage;
}

export interface WakeDetectedEvent {
  type: 'wake_detected';
  confidence: number;
  inference_ms: number;
}

export interface StreamStartedEvent {
  type: 'stream_started';
  packet_count: number;
}

export interface MetricsEvent {
  type: 'metrics';
  ram_kb: number;
  flash_kb?: number;
  cpu_pct: number;
  rssi?: number;
}

export interface AsrPartialEvent {
  type: 'asr_partial';
  text: string;
}

export interface AsrFinalEvent {
  type: 'asr_final';
  text: string;
  asr_ms: number;
}

export interface TelemetryErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export type TelemetryEvent =
  | DeviceStateEvent
  | WakeDetectedEvent
  | StreamStartedEvent
  | MetricsEvent
  | AsrPartialEvent
  | AsrFinalEvent
  | TelemetryErrorEvent;
