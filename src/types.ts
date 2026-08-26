export type ActiveScreen = 'dashboard' | 'benchmarks';

export type PipelineStage = 'listening' | 'wake_detected' | 'streaming' | 'transcribing' | 'complete';

export interface LogEntry {
  id: string;
  time: string;
  tag: 'SYS' | 'KWS' | 'ASR' | 'AUDIO';
  message: string;
  type: 'dim' | 'normal' | 'primary' | 'secondary' | 'pending';
}

export interface TranscriptEntry {
  id: string;
  time: string;
  text: string;
  status: 'streaming' | 'complete';
  confidence: number;
}

export interface LiveMetrics {
  ramUsedKb: number;
  ramMaxKb: number;
  cpuIdlePercent: number;
  streamLatencyMs: number;
  falseActivations: string;
  totalLatencyMs: number;
  keyword: string;
  confidence: number;
  inferenceLatencyMs: number;
  networkLatencyMs: number;
}

export interface BenchmarkTelemetryRow {
  id: string;
  metric: string;
  target: string;
  latestResult: string;
  status: 'Pass' | 'Warning' | 'Fail';
  notes: string;
}

export interface NoiseEnvironment {
  id: string;
  title: string;
  icon: string;
  oneMeterAccuracy: number;
  threeMeterAccuracy: number;
  accentColor: 'secondary' | 'primary' | 'tertiary' | 'error';
}

export interface HardwareConfig {
  chipset: string;
  dspCore: string;
  audioFrontend: string;
  sampleRateHz: number;
  bitDepth: number;
  quantization: string;
  vadSensitivity: number;
  beamforming: boolean;
}
