import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Activity,
  UploadCloud,
  FileText,
  CheckCheck,
  Radio,
  Volume2,
  Sparkles,
  Copy,
  Trash2,
  Check,
  Play,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  AlertCircle,
  Cpu,
  MemoryStick,
  Radio as RadioIcon,
  HardDrive,
  Gauge,
  TimerReset,
  Hash,
  Loader2,
  XCircle,
  Package,
} from 'lucide-react';
import {
  PipelineStage,
  LogEntry,
  TranscriptEntry,
  LiveMetrics,
  ActivationSession,
  ConnectionState,
  DataMode,
} from '../types';
import { AudioVisualizer } from './AudioVisualizer';

interface LiveDashboardProps {
  uptimeSeconds: number;
  isListening: boolean;
  onToggleListening: () => void;
  onSimulateTrigger: (customCommand?: string) => void;
  currentStage: PipelineStage;
  logs: LogEntry[];
  onClearLogs: () => void;
  transcripts: TranscriptEntry[];
  metrics: LiveMetrics;
  isRealAudioActive: boolean;
  realAudioLevel?: number;
  dataMode?: DataMode;
  connectionState?: ConnectionState;
  privacyGateOpen?: boolean;
  session?: ActivationSession | null;
  sessionCount?: number;
  lastUpdate?: Date | null;
  hookError?: string | null;
}

function demoBadge(show: boolean): React.ReactNode {
  if (!show) return null;
  return (
    <span className="text-[#ffd29f] text-[10px] font-bold tracking-wider ml-1.5 border border-[#ffd29f]/30 bg-[#ffd29f]/5 px-1.5 py-0.5 rounded">
      DEMO
    </span>
  );
}

function fmtNum(v: number | null | undefined, unit = '', dash = '—'): string {
  if (v == null) return dash;
  return `${v}${unit}`;
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({
  uptimeSeconds,
  isListening,
  onToggleListening,
  onSimulateTrigger,
  currentStage,
  logs,
  onClearLogs,
  transcripts,
  metrics,
  isRealAudioActive,
  realAudioLevel = 0,
  dataMode = 'demo',
  connectionState = 'demo',
  privacyGateOpen = false,
  session = null,
  sessionCount = 0,
  lastUpdate = null,
  hookError = null,
}) => {
  const [copiedLogs, setCopiedLogs] = useState(false);
  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const isDemo = dataMode === 'demo';

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Format uptime HH:MM:SS
  const formatUptime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const handleCopyLogs = () => {
    const logText = logs.map(l => `${l.time} [${l.tag}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(logText);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  // Stage timeline mapping (includes error stage)
  const stages: { id: PipelineStage; label: string; icon: React.ReactNode; error?: boolean }[] = [
    { id: 'listening', label: 'Listening', icon: <Mic className="w-4 h-4" /> },
    { id: 'wake_detected', label: 'Wake Detected', icon: <Activity className="w-4 h-4" /> },
    { id: 'streaming', label: 'Streaming', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'transcribing', label: 'Transcribing', icon: <FileText className="w-4 h-4" /> },
    { id: 'complete', label: 'Complete', icon: <CheckCheck className="w-4 h-4" /> },
    { id: 'error', label: 'Error', icon: <XCircle className="w-4 h-4" />, error: true },
  ];

  const getStageIndex = (stage: PipelineStage) => {
    return stages.findIndex(s => s.id === stage);
  };

  const currentStageIndex = getStageIndex(currentStage);
  const pipelineActiveLength = stages.length - 1; // error is a terminal alternative to complete
  const progressPercent =
    currentStage === 'listening'
      ? 10
      : currentStage === 'error'
        ? 100
        : Math.min(100, ((currentStageIndex + 1) / pipelineActiveLength) * 100);

  // Latency breakdown (KWS / Network / ASR)
  const kwsMs = metrics.inferenceLatencyMs ?? null;
  const netMs = metrics.networkLatencyMs ?? null;
  const asrMs = metrics.asrLatencyMs ?? null;
  const totalMs = metrics.totalLatencyMs ?? null;
  const measuredTotal = (kwsMs ?? 0) + (netMs ?? 0) + (asrMs ?? 0);
  const displayTotal = (totalMs ?? measuredTotal) || null;

  // Hero section body copy
  const heroTitle =
    currentStage === 'listening'
      ? 'System State: Active'
      : currentStage === 'wake_detected'
        ? 'System State: Wake Word Triggered'
        : currentStage === 'streaming'
          ? 'System State: ASR Streaming'
          : currentStage === 'transcribing'
            ? 'System State: Neural Inference'
            : currentStage === 'error'
              ? 'System State: Telemetry Error'
              : 'System State: Command Processed';

  const heroSubtitle =
    currentStage === 'listening'
      ? 'Awaiting primary wake word "Hi Edge". Neural engine active.'
      : currentStage === 'wake_detected'
        ? `Wake signature verified with ${(metrics.confidence * 100).toFixed(1)}% confidence. Opening uplink socket.`
        : currentStage === 'streaming'
          ? 'Transmitting PCM-16 chunk stream to edge broker.'
          : currentStage === 'transcribing'
            ? 'Decoupled transformer decoder active.'
            : currentStage === 'error'
              ? hookError ?? 'Pipeline error. See event logs for details.'
              : 'End-to-end activation loop resolved successfully.';

  const isError = currentStage === 'error';

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 flex flex-col max-w-[1440px] mx-auto w-full">
      {/* Hero State Section */}
      <section
        id="hero-state-section"
        className={`rounded-xl border p-4 lg:p-6 relative overflow-hidden shadow-sm ${
          isError
            ? 'bg-[#1a0f0f] border-[#ffb4ab]/40'
            : 'bg-[#1a211f] border-[#3c4a46]'
        }`}
      >
        {/* Ambient background glow */}
        <div
          className={`absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] via-transparent to-transparent pointer-events-none ${
            isError
              ? 'from-[#ffb4ab]'
              : 'from-[#2dd4bf]'
          }`}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <div
                className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)] ${
                  isError
                    ? 'bg-[#ffb4ab] animate-blink-soft'
                    : 'bg-[#4edea3] animate-pulse-soft shadow-[0_0_10px_rgba(78,222,163,0.8)]'
                }`}
              />
              <h2
                className={`text-xl md:text-2xl font-semibold tracking-tight ${
                  isError ? 'text-[#ffb4ab]' : 'text-[#57f1db]'
                }`}
              >
                {heroTitle}
              </h2>
              {/* Mode banner in hero */}
              <div
                className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ml-1 ${
                  isDemo
                    ? 'text-[#ffd29f] border-[#ffd29f]/40 bg-[#ffd29f]/10'
                    : 'text-[#4edea3] border-[#4edea3]/40 bg-[#4edea3]/10'
                }`}
              >
                {isDemo ? '● DEMO / SIMULATED' : '● LIVE TELEMETRY'}
              </div>
              {!isDemo && hookError && (
                <div className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffb4ab]">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  {hookError}
                </div>
              )}
            </div>
            <p className={`text-xs md:text-sm ${isError ? 'text-[#ffb4ab]/80' : 'text-[#bacac5]'}`}>
              {heroSubtitle}
            </p>
          </div>

          {/* Uptime Box */}
          <div className="bg-[#2f3634] px-4 py-2 rounded-lg border border-[#3c4a46] flex items-center gap-4 self-start md:self-auto shadow-xs">
            <span className="font-mono text-[#57f1db] metric-value text-lg font-semibold tracking-wider">
              {formatUptime(uptimeSeconds)}
            </span>
            <div className="w-px h-6 bg-[#3c4a46]" />
            <span className="text-xs text-[#bacac5] uppercase tracking-wider font-medium">
              Uptime {isDemo && demoBadge(true)}
            </span>
          </div>
        </div>

        {/* Timeline Progression */}
        <div className="mt-6 pt-5 border-t border-[#3c4a46]/50">
          <div className="flex items-center justify-between relative px-2 sm:px-6">
            {/* Background line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-[#3c4a46]/40 -z-10" />

            {/* Active progress line */}
            <div
              className={`absolute left-6 top-1/2 -translate-y-1/2 h-[2px] transition-all duration-300 -z-10 ${
                isError
                  ? 'bg-[#ffb4ab] shadow-[0_0_8px_rgba(255,180,171,0.5)]'
                  : 'bg-[#57f1db] shadow-[0_0_8px_rgba(87,241,219,0.5)]'
              }`}
              style={{ width: `calc(${progressPercent}% - 3rem)` }}
            />

            {stages.map((stage, idx) => {
              const isActive = idx === currentStageIndex;
              const isPast = idx < currentStageIndex && !isError;
              const isCompleted = currentStage === 'complete' && idx === stages.length - 2;
              const showError = isError && (idx === currentStageIndex || idx === stages.length - 1);

              let nodeClass =
                'bg-[#0e1513] border-2 border-[#859490]/50 text-[#859490] opacity-60';
              if (isCompleted || isPast) {
                nodeClass =
                  'bg-[#4edea3]/20 border-2 border-[#4edea3] text-[#4edea3]';
              }
              if (isActive && !isError) {
                nodeClass =
                  'bg-[#57f1db]/20 border-2 border-[#57f1db] text-[#57f1db] shadow-[0_0_12px_rgba(87,241,219,0.4)] scale-110';
              }
              if (showError) {
                nodeClass =
                  'bg-[#ffb4ab]/20 border-2 border-[#ffb4ab] text-[#ffb4ab] shadow-[0_0_12px_rgba(255,180,171,0.4)] scale-110';
              }

              const labelClass =
                showError
                  ? 'text-[#ffb4ab]'
                  : isActive || isCompleted
                    ? 'text-[#57f1db]'
                    : isPast
                      ? 'text-[#4edea3]'
                      : 'text-[#859490] opacity-60';

              return (
                <div key={stage.id} className="flex flex-col items-center gap-1.5 z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${nodeClass}`}
                  >
                    {stage.icon}
                  </div>
                  <span
                    className={`text-[11px] font-bold tracking-wider uppercase transition-colors text-center ${labelClass}`}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Left Column (Narrow) */}
        <div className="w-full lg:w-[350px] flex flex-col gap-6 shrink-0">
          {/* Privacy Gate Card */}
          <section
            id="privacy-gate-card"
            className={`rounded-lg border p-4 flex flex-col gap-3 shadow-sm ${
              privacyGateOpen
                ? 'bg-[#4edea3]/5 border-[#4edea3]/40'
                : 'bg-[#1a211f] border-[#3c4a46]'
            }`}
          >
            <div className="flex justify-between items-center border-b border-[#3c4a46]/50 pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#57f1db]" />
                PRIVACY GATE
                {isDemo && <span className="text-[#ffd29f] text-[10px]">DEMO</span>}
              </h3>
              <span
                className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${
                  privacyGateOpen
                    ? 'text-[#4edea3] border-[#4edea3]/40 bg-[#4edea3]/10'
                    : 'text-[#859490] border-[#3c4a46] bg-[#2f3634]'
                }`}
              >
                {privacyGateOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
            <div className="flex items-center gap-3 py-1">
              {privacyGateOpen ? (
                <ShieldCheck className="w-8 h-8 text-[#4edea3] animate-pulse-soft" />
              ) : (
                <ShieldOff className="w-8 h-8 text-[#859490]" />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#dde4e1]">
                  {privacyGateOpen
                    ? 'Audio uplink authorized'
                    : 'No audio leaving the device'}
                </span>
                <span className="text-[11px] text-[#bacac5]">
                  {privacyGateOpen
                    ? 'Privacy gate open — PCM-16/16kHz streaming to ASR server only.'
                    : 'Privacy gate closed — ESP32 listening locally, uplink socket idle.'}
                </span>
              </div>
            </div>
          </section>

          {/* Edge Node Control */}
          <section
            id="edge-node-control-card"
            className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-4 flex flex-col gap-4 shadow-sm"
          >
            <div className="flex justify-between items-center border-b border-[#3c4a46] pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5]">
                EDGE NODE CONTROL
              </h3>
              <span className="text-[10px] text-[#57f1db] font-mono">
                DSP v2.4 {isDemo && '· DEMO'}
              </span>
            </div>

            {/* Central Big Mic Button with visualizer waves */}
            <div className="flex flex-col items-center py-3 relative">
              {/* Outer pulsing ring when triggered or listening */}
              {isListening && (
                <div className="absolute w-36 h-36 rounded-full border border-[#57f1db]/30 animate-ping-slow pointer-events-none" />
              )}

              <button
                id="btn-main-mic-trigger"
                onClick={() => onSimulateTrigger()}
                disabled={!isDemo && currentStage !== 'listening'}
                className={`w-32 h-32 rounded-full border flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 group relative ${
                  isError
                    ? 'bg-[#ffb4ab]/20 border-[#ffb4ab] text-[#ffb4ab] shadow-[0_0_24px_rgba(255,180,171,0.4)]'
                    : currentStage !== 'listening'
                      ? 'bg-[#4edea3]/20 border-[#4edea3] text-[#4edea3] shadow-[0_0_24px_rgba(78,222,163,0.4)]'
                      : isListening
                        ? 'bg-[#57f1db]/10 border-[#57f1db] text-[#57f1db] hover:bg-[#57f1db]/20 shadow-[0_0_18px_rgba(87,241,219,0.25)]'
                        : 'bg-[#2f3634] border-[#859490] text-[#859490]'
                } ${!isDemo ? 'opacity-70' : ''}`}
                title={
                  isDemo
                    ? 'Run Demo Pipeline (simulate wake + streaming + ASR)'
                    : 'Live telemetry mode — device triggers are driven by ESP32 events.'
                }
              >
                {currentStage === 'error' ? (
                  <AlertTriangle className="w-12 h-12 animate-bounce" />
                ) : !isDemo && connectionState === 'connecting' ? (
                  <Loader2 className="w-12 h-12 animate-spin" />
                ) : (
                  <Mic
                    className={`w-12 h-12 transition-transform duration-200 group-hover:scale-110 ${
                      currentStage !== 'listening' ? 'animate-bounce' : ''
                    }`}
                  />
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-center px-2">
                  {currentStage === 'error'
                    ? 'Pipeline Error'
                    : !isDemo
                      ? connectionState === 'connecting'
                        ? 'Connecting...'
                        : currentStage === 'listening'
                          ? 'Awaiting Device'
                          : 'Processing'
                      : currentStage === 'listening'
                        ? isDemo
                          ? 'Run Demo'
                          : 'Tap To Trigger'
                        : 'Processing'}
                </span>
              </button>

              {/* Audio Wave Visualizer */}
              <div className="w-full mt-3 px-2">
                <AudioVisualizer
                  isActive={isListening}
                  isTriggered={currentStage !== 'listening'}
                  audioLevel={isRealAudioActive ? realAudioLevel : isDemo ? 0.4 : 0}
                />
              </div>
            </div>

            {/* Status Rows */}
            <div className="flex flex-col gap-2 pt-1 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-[#3c4a46]/30">
                <span className="text-[#bacac5]">Edge KWS Status</span>
                <span className="font-mono text-[#57f1db] flex items-center gap-1.5 font-medium">
                  <div className={`w-2 h-2 rounded-full ${
                    currentStage === 'error'
                      ? 'bg-[#ffb4ab]'
                      : 'bg-[#57f1db] animate-pulse-soft'
                  }`} />
                  {currentStage === 'error'
                    ? 'Halted'
                    : currentStage === 'listening'
                      ? 'Listening'
                      : 'Detected (Active)'}
                  {isDemo && <span className="text-[#ffd29f] text-[10px] ml-1">DEMO</span>}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-[#3c4a46]/30">
                <span className="text-[#bacac5]">Wake Word</span>
                <span className="font-mono text-[#dde4e1]">
                  {currentStage === 'listening' ? 'Hi Edge - Waiting' : 'Hi Edge - Triggered'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-[#bacac5]">ASR Link</span>
                <span className="font-mono text-[#859490]">
                  {currentStage === 'listening'
                    ? 'Idle'
                    : currentStage === 'streaming'
                      ? `Streaming ${netMs ?? '—'}ms`
                      : currentStage === 'error'
                        ? 'Aborted'
                        : 'Uplink Synced'}
                </span>
              </div>
            </div>

            {/* Quick Demo Utterances — only in demo mode */}
            {isDemo && (
              <div className="pt-2 border-t border-[#3c4a46]/40 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-[#bacac5] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#57f1db]" />
                  Demo Utterance Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => onSimulateTrigger("NOVA, turn on the lights in the living room.")}
                    className="text-[11px] bg-[#2f3634] hover:bg-[#3c4a46] text-[#dde4e1] px-2 py-1 rounded border border-[#3c4a46] transition-colors cursor-pointer"
                  >
                    "Lights in living room"
                  </button>
                  <button
                    onClick={() => onSimulateTrigger("Set conference room thermostat to 72 degrees.")}
                    className="text-[11px] bg-[#2f3634] hover:bg-[#3c4a46] text-[#dde4e1] px-2 py-1 rounded border border-[#3c4a46] transition-colors cursor-pointer"
                  >
                    "Set thermostat"
                  </button>
                  <button
                    onClick={() => onSimulateTrigger("Check telemetry signal and battery health.")}
                    className="text-[11px] bg-[#2f3634] hover:bg-[#3c4a46] text-[#dde4e1] px-2 py-1 rounded border border-[#3c4a46] transition-colors cursor-pointer"
                  >
                    "Check telemetry"
                  </button>
                </div>
                <p className="text-[10px] text-[#859490] italic pt-0.5">
                  Presets run the deterministic demo sequence with fixed metric values.
                </p>
              </div>
            )}
            {!isDemo && (
              <div className="pt-2 border-t border-[#3c4a46]/40">
                <p className="text-[10px] text-[#859490] italic">
                  Live mode: demo presets hidden. Events are driven by the ESP32 telemetry socket.
                </p>
              </div>
            )}
          </section>

          {/* Evaluation Metrics — updated grid */}
          <section
            id="evaluation-metrics-card"
            className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-4 flex flex-col gap-3 shadow-sm"
          >
            <div className="flex justify-between items-center border-b border-[#3c4a46] pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5]">
                EVALUATION METRICS
              </h3>
              <span className="text-[10px] font-bold tracking-wider">
                {isDemo ? (
                  <span className="text-[#ffd29f] border border-[#ffd29f]/30 bg-[#ffd29f]/5 px-2 py-0.5 rounded">
                    DEMO DATA
                  </span>
                ) : (
                  <span className="text-[#4edea3] border border-[#4edea3]/30 bg-[#4edea3]/5 px-2 py-0.5 rounded">
                    LIVE TELEMETRY
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* RAM Footprint */}
              <div className="bg-[#2f3634] p-2.5 rounded border border-[#3c4a46]/50 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#bacac5] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MemoryStick className="w-3 h-3 text-[#57f1db]" />
                  RAM
                  {isDemo && <span className="text-[#ffd29f]">D</span>}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[#dde4e1] text-xs font-semibold">
                    {metrics.ramUsedKb} / {metrics.ramMaxKb} KB
                  </span>
                  <div className="w-full bg-[#161d1b] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#57f1db] h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, (metrics.ramUsedKb / metrics.ramMaxKb) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Idle CPU */}
              <div className="bg-[#2f3634] p-2.5 rounded border border-[#3c4a46]/50 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#bacac5] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#57f1db]" />
                  Idle CPU
                  {isDemo && <span className="text-[#ffd29f]">D</span>}
                </span>
                <div className="flex flex-col">
                  <span className="font-mono text-[#dde4e1] text-sm font-semibold">
                    {fmtNum(Number(metrics.cpuIdlePercent.toFixed(1)))}%
                  </span>
                  <span className="text-[10px] text-[#859490]">
                    ({metrics.cpuIdlePercent <= 10 ? '≤ 10% target' : 'Above target'})
                  </span>
                </div>
              </div>

              {/* Flash used */}
              <div className="bg-[#2f3634] p-2.5 rounded border border-[#3c4a46]/50 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#bacac5] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-[#57f1db]" />
                  Flash
                  {isDemo && <span className="text-[#ffd29f]">D</span>}
                </span>
                <div className="flex flex-col">
                  <span className="font-mono text-[#dde4e1] text-sm font-semibold">
                    {fmtNum(metrics.flashUsedKb)}
                    {metrics.flashUsedKb != null ? ' KB' : ''}
                  </span>
                  <span className="text-[10px] text-[#859490]">
                    {metrics.flashUsedKb == null
                      ? 'Device not reporting'
                      : 'firmware + weights'}
                  </span>
                </div>
              </div>

              {/* RSSI */}
              <div className="bg-[#2f3634] p-2.5 rounded border border-[#3c4a46]/50 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#bacac5] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <RadioIcon className="w-3 h-3 text-[#57f1db]" />
                  RSSI
                  {isDemo && <span className="text-[#ffd29f]">D</span>}
                </span>
                <div className="flex flex-col">
                  <span className="font-mono text-[#dde4e1] text-sm font-semibold">
                    {metrics.rssi == null ? '—' : `${metrics.rssi} dBm`}
                  </span>
                  <span className="text-[10px] text-[#859490]">
                    {metrics.rssi == null
                      ? 'Device not reporting'
                      : metrics.rssi > -55
                        ? 'Excellent'
                        : metrics.rssi > -70
                          ? 'Good'
                          : 'Marginal'}
                  </span>
                </div>
              </div>

              {/* Packets streamed */}
              <div className="bg-[#2f3634] p-2.5 rounded border border-[#3c4a46]/50 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#bacac5] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Package className="w-3 h-3 text-[#57f1db]" />
                  Packets
                  {isDemo && <span className="text-[#ffd29f]">D</span>}
                </span>
                <div className="flex flex-col">
                  <span className="font-mono text-[#dde4e1] text-sm font-semibold">
                    {fmtNum(metrics.packetsStreamed)}
                  </span>
                  <span className="text-[10px] text-[#859490]">Audio chunks uplinked</span>
                </div>
              </div>

              {/* False activations */}
              <div className="bg-[#2f3634] p-2.5 rounded border border-[#3c4a46]/50 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#bacac5] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-[#57f1db]" />
                  False Act/hr
                  {isDemo && <span className="text-[#ffd29f]">D</span>}
                </span>
                <div className="flex flex-col">
                  <span className="font-mono text-[#dde4e1] text-sm font-semibold">
                    {metrics.falseActivationsPerHour == null
                      ? '—'
                      : `${metrics.falseActivationsPerHour.toFixed(1)}`}
                  </span>
                  <span className="text-[10px] text-[#859490]">
                    {metrics.falseActivationsPerHour == null
                      ? 'Awaiting measured data'
                      : 'Target: ≤ 1/hr'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (Wide) */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* ActivationSession tracker — new */}
          <section
            id="session-tracker-card"
            className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-4 flex flex-col gap-3 shadow-sm"
          >
            <div className="flex justify-between items-center border-b border-[#3c4a46]/50 pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#57f1db]" />
                ACTIVATION SESSION
              </h3>
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#57f1db]">
                Sessions this run: {sessionCount.toString().padStart(3, '0')}
                {isDemo && <span className="text-[#ffd29f] ml-1.5">DEMO</span>}
              </span>
            </div>
            {session == null ? (
              <div className="flex items-center justify-center py-6 gap-2 text-[#bacac5] text-xs italic">
                {isDemo
                  ? 'No demo activation yet. Press "Run Demo" or tap a preset utterance.'
                  : connectionState === 'connected'
                    ? 'Awaiting first wake-word event from ESP32...'
                    : connectionState === 'connecting'
                      ? 'Opening telemetry socket...'
                      : 'Live telemetry offline. Configure VITE_EDGEWAKE_WS_URL to enable.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
                <div className="bg-[#2f3634] rounded border border-[#3c4a46]/50 p-2.5 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#bacac5] tracking-wider mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-[#57f1db]" />
                    Session
                  </span>
                  <span className="font-mono font-semibold text-[#dde4e1]">
                    {session.id}
                    {session.isLocalId && (
                      <span className="text-[#859490] text-[10px] ml-1">(local)</span>
                    )}
                  </span>
                  <span className="text-[10px] text-[#859490] capitalize">{session.finalState}</span>
                </div>
                <div className="bg-[#2f3634] rounded border border-[#3c4a46]/50 p-2.5 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#bacac5] tracking-wider mb-1">
                    Wake / Packets
                  </span>
                  <span className="font-mono font-semibold text-[#4edea3] leading-tight">
                    {(session.confidence * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-[#859490]">
                    {session.inferenceMs ?? '—'}ms · {session.packetsStreamed ?? '—'} pkts
                  </span>
                </div>
                <div className="bg-[#2f3634] rounded border border-[#3c4a46]/50 p-2.5 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#bacac5] tracking-wider mb-1">
                    ASR / Total
                  </span>
                  <span className="font-mono font-semibold text-[#dde4e1] leading-tight">
                    {session.asrMs ?? '—'} / {session.totalMs ?? '—'} ms
                  </span>
                  <span className="text-[10px] text-[#859490] truncate">
                    {session.transcript == null
                      ? 'Transcript pending...'
                      : session.transcript}
                  </span>
                </div>
                <div className="bg-[#2f3634] rounded border border-[#3c4a46]/50 p-2.5 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#bacac5] tracking-wider mb-1">
                    Result
                  </span>
                  <span
                    className={`font-semibold leading-tight ${
                      session.finalState === 'complete'
                        ? 'text-[#4edea3]'
                        : session.finalState === 'error'
                          ? 'text-[#ffb4ab]'
                          : 'text-[#57f1db]'
                    }`}
                  >
                    {session.finalState === 'complete'
                      ? 'Command delivered'
                      : session.finalState === 'error'
                        ? 'Activation aborted'
                        : `In progress (${session.finalState})`}
                  </span>
                  <span className="text-[10px] text-[#859490]">
                    {session.completedAt
                      ? session.completedAt.toLocaleTimeString()
                      : session.startedAt.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* ASR Real-Time Transcript Panel */}
          <section
            id="asr-transcript-panel"
            className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-4 flex flex-col gap-3 h-64 shadow-sm"
          >
            <div className="flex justify-between items-center border-b border-[#3c4a46] pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5]">
                ASR REAL-TIME TRANSCRIPT
              </h3>
              <span className="text-[10px] font-bold tracking-wider">
                {isDemo ? (
                  <span className="text-[#ffd29f] border border-[#ffd29f]/30 bg-[#ffd29f]/5 px-2 py-0.5 rounded">
                    DEMO DATA
                  </span>
                ) : (
                  <span className="text-[#4edea3] border border-[#4edea3]/30 bg-[#4edea3]/5 px-2 py-0.5 rounded">
                    LIVE TELEMETRY
                  </span>
                )}
              </span>
            </div>

            <div className="flex-1 bg-[#09100e] rounded border border-[#3c4a46]/50 p-4 flex flex-col overflow-y-auto">
              {transcripts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2 opacity-60 my-auto">
                  <Volume2 className="w-9 h-9 text-[#859490]" />
                  <p className="text-sm text-[#bacac5] max-w-sm">
                    {isDemo
                      ? "Press 'Run Demo' or tap a preset utterance to generate a demo transcript."
                      : 'Start the edge listener, then say "Hi Edge" followed by your command.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {transcripts.map(entry => (
                    <div key={entry.id} className="flex gap-3 items-start animate-fade-in">
                      <span className="font-mono text-[#859490] text-xs mt-1 shrink-0">
                        {entry.time}
                      </span>
                      <div className="flex flex-col bg-[#2f3634] p-3 rounded-lg rounded-tl-none border border-[#3c4a46]/40 max-w-xl w-full">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#57f1db]">
                            Transcript
                          </span>
                          {entry.isDemo === true && (
                            <span className="text-[10px] font-bold tracking-wider text-[#ffd29f] border border-[#ffd29f]/30 bg-[#ffd29f]/5 px-1.5 py-0.5 rounded">
                              [DEMO]
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-[#dde4e1] font-medium leading-relaxed">
                          {entry.text}
                        </span>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#3c4a46]/30 text-[10px]">
                          <span className="text-[#bacac5]">Confidence: {(entry.confidence * 100).toFixed(1)}%</span>
                          <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-[#4edea3]">
                            <Check className="w-3 h-3" />
                            {entry.status === 'complete' ? 'ASR COMPLETE' : 'STREAMING...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Pipeline Event Logs */}
          <section
            id="pipeline-event-logs-panel"
            className="bg-[#050807] rounded-lg border border-[#3c4a46] p-4 flex flex-col gap-3 flex-1 min-h-[250px] shadow-sm"
          >
            <div className="flex justify-between items-center border-b border-[#3c4a46]/40 pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5]">
                PIPELINE EVENT LOGS
              </h3>
              <div className="flex items-center gap-3">
                {isDemo && (
                  <span className="text-[10px] text-[#ffd29f] font-bold tracking-wider border border-[#ffd29f]/30 bg-[#ffd29f]/5 px-2 py-0.5 rounded">
                    DEMO LOGS
                  </span>
                )}
                <button
                  onClick={onClearLogs}
                  className="text-[11px] font-bold uppercase tracking-wider text-[#57f1db] hover:text-[#62fae3] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  CLEAR
                </button>
                <button
                  onClick={handleCopyLogs}
                  className="text-[11px] font-bold uppercase tracking-wider text-[#57f1db] hover:text-[#62fae3] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedLogs ? (
                    <Check className="w-3 h-3 text-[#4edea3]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copiedLogs ? 'COPIED' : 'COPY LOGS'}
                </button>
              </div>
            </div>

            {/* Log Stream */}
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1.5 pr-2 select-text">
              {logs.length === 0 ? (
                <div className="text-[#859490] italic py-4 text-center">
                  {isDemo
                    ? 'No demo logs generated yet.'
                    : 'No live telemetry events received yet — waiting for ESP32.'}
                </div>
              ) : (
                logs.map(log => {
                  let textColor = 'text-[#bacac5]';
                  if (log.type === 'dim') textColor = 'text-[#859490]';
                  if (log.type === 'primary') textColor = 'text-[#57f1db]';
                  if (log.type === 'secondary') textColor = 'text-[#4edea3]';
                  if (log.type === 'pending') textColor = 'text-[#859490] animate-pulse';

                  return (
                    <div key={log.id} className={`flex gap-3 items-baseline ${textColor}`}>
                      <span className="w-16 shrink-0 text-[#859490] text-[11px]">{log.time}</span>
                      <span className="font-semibold shrink-0 text-[11px]">[{log.tag}]</span>
                      <span className="leading-snug break-all">{log.message}</span>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </section>
        </div>
      </div>

      {/* Metrics Grid — Total Latency + per-component breakdown */}
      <section
        id="metrics-grid-section"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 mt-2"
      >
        {/* Highlighted Total Latency */}
        <div className="col-span-2 md:col-span-4 lg:col-span-7 bg-[#57f1db]/10 border border-[#57f1db]/30 rounded-lg p-4 flex flex-col justify-between relative overflow-hidden group shadow-xs">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-1 relative z-10">
            <div className="flex items-center">
              <Gauge className="w-4 h-4 text-[#57f1db] mr-1.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#57f1db]">
                Total Latency
                {isDemo && <span className="text-[#ffd29f] text-[10px] ml-1.5">DEMO DATA</span>}
              </span>
            </div>
            <span className="text-[10px] font-mono bg-[#4edea3]/10 px-2 py-0.5 rounded border border-[#4edea3]/20 text-[#4edea3]">
              TARGET: &lt;1000ms
            </span>
          </div>

          <div className="flex items-baseline gap-2 relative z-10 flex-wrap">
            <span className="text-3xl md:text-4xl font-semibold text-[#57f1db] metric-value">
              {displayTotal == null ? '—' : displayTotal}
            </span>
            {displayTotal != null && <span className="text-base text-[#57f1db]/70 font-medium">ms</span>}
            {/* Breakdown */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 ml-auto text-xs text-[#bacac5] pl-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#57f1db]" />
                KWS: {kwsMs == null ? '—' : `${kwsMs}ms`}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                Network: {netMs == null ? '—' : `${netMs}ms`}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ffd29f]" />
                ASR: {asrMs == null ? '—' : `${asrMs}ms`}
              </span>
              {netMs == null && (
                <span className="text-[10px] text-[#859490] italic pl-2 border-l border-[#3c4a46]">
                  Network latency not measured — requires synchronized clocks or explicit
                  reporting via telemetry.
                </span>
              )}
            </div>
          </div>

          {/* Proportional bar */}
          {(kwsMs != null || netMs != null || asrMs != null) && (
            <div className="mt-3 flex h-2 w-full rounded overflow-hidden bg-[#0e1513] relative z-10">
              {kwsMs != null && (
                <div
                  className="bg-[#57f1db] border-r border-[#0e1513]"
                  style={{ flex: kwsMs }}
                  title={`KWS ${kwsMs}ms`}
                />
              )}
              {netMs != null && (
                <div
                  className="bg-[#4edea3] border-r border-[#0e1513]"
                  style={{ flex: netMs }}
                  title={`Network ${netMs}ms`}
                />
              )}
              {asrMs != null && (
                <div
                  className="bg-[#ffd29f]"
                  style={{ flex: asrMs }}
                  title={`ASR ${asrMs}ms`}
                />
              )}
            </div>
          )}
        </div>

        {/* Keyword */}
        <div className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] mb-1">
            Keyword {demoBadge(isDemo)}
          </span>
          <span className="text-lg font-semibold text-[#dde4e1] metric-value">
            {metrics.keyword}
          </span>
        </div>

        {/* Confidence */}
        <div className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] mb-1">
            Confidence {demoBadge(isDemo)}
          </span>
          <span className="text-lg font-semibold text-[#4edea3] metric-value">
            {(metrics.confidence * 100).toFixed(1)}%
          </span>
        </div>

        {/* KWS / Inference */}
        <div className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] mb-1">
            KWS (Inference) {demoBadge(isDemo)}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-[#dde4e1] metric-value">
              {fmtNum(kwsMs)}
            </span>
            {kwsMs != null && <span className="text-xs text-[#bacac5]">ms</span>}
          </div>
        </div>

        {/* Network Latency */}
        <div className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] mb-1">
            Network {demoBadge(isDemo)}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-[#dde4e1] metric-value">
              {fmtNum(netMs)}
            </span>
            {netMs != null && <span className="text-xs text-[#bacac5]">ms</span>}
          </div>
        </div>

        {/* ASR Latency */}
        <div className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] mb-1">
            ASR {demoBadge(isDemo)}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-[#dde4e1] metric-value">
              {fmtNum(asrMs)}
            </span>
            {asrMs != null && <span className="text-xs text-[#bacac5]">ms</span>}
          </div>
        </div>

        {/* RAM */}
        <div className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] mb-1">
            RAM {demoBadge(isDemo)}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-[#dde4e1] metric-value">
              {metrics.ramUsedKb}
            </span>
            <span className="text-xs text-[#bacac5]">/ {metrics.ramMaxKb} KB</span>
          </div>
        </div>

        {/* Idle CPU */}
        <div className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] mb-1">
            Idle CPU {demoBadge(isDemo)}
          </span>
          <span className="text-lg font-semibold text-[#dde4e1] metric-value">
            {metrics.cpuIdlePercent.toFixed(1)}%
          </span>
        </div>
      </section>
    </main>
  );
};
