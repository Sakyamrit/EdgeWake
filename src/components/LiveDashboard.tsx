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
  RotateCcw 
} from 'lucide-react';
import { PipelineStage, LogEntry, TranscriptEntry, LiveMetrics } from '../types';
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
}) => {
  const [copiedLogs, setCopiedLogs] = useState(false);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

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

  // Stage timeline mapping
  const stages: { id: PipelineStage; label: string; icon: React.ReactNode }[] = [
    { id: 'listening', label: 'Listening', icon: <Mic className="w-4 h-4" /> },
    { id: 'wake_detected', label: 'Wake Detected', icon: <Activity className="w-4 h-4" /> },
    { id: 'streaming', label: 'Streaming', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'transcribing', label: 'Transcribing', icon: <FileText className="w-4 h-4" /> },
    { id: 'complete', label: 'Complete', icon: <CheckCheck className="w-4 h-4" /> },
  ];

  const getStageIndex = (stage: PipelineStage) => {
    return stages.findIndex(s => s.id === stage);
  };

  const currentStageIndex = getStageIndex(currentStage);
  const progressPercent = currentStage === 'listening' ? 12 : Math.min(100, ((currentStageIndex + 1) / stages.length) * 100);

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 flex flex-col max-w-[1440px] mx-auto w-full">
      {/* Hero State Section */}
      <section 
        id="hero-state-section"
        className="bg-[#1a211f] rounded-xl border border-[#3c4a46] p-4 lg:p-6 relative overflow-hidden shadow-sm"
      >
        {/* Ambient background glow */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#2dd4bf] via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-3 h-3 rounded-full bg-[#4edea3] animate-pulse-soft shadow-[0_0_10px_rgba(78,222,163,0.8)]" />
              <h2 className="text-xl md:text-2xl font-semibold text-[#57f1db] tracking-tight">
                {currentStage === 'listening' 
                  ? 'System State: Active' 
                  : currentStage === 'wake_detected'
                    ? 'System State: Wake Word Triggered'
                    : currentStage === 'streaming'
                      ? 'System State: ASR Streaming'
                      : currentStage === 'transcribing'
                        ? 'System State: Neural Inference'
                        : 'System State: Command Processed'}
              </h2>
            </div>
            <p className="text-xs md:text-sm text-[#bacac5]">
              {currentStage === 'listening'
                ? 'Awaiting primary wake word "Hi Edge". Neural engine active.'
                : currentStage === 'wake_detected'
                  ? 'Wake signature verified with 96.4% confidence. Opening uplink socket.'
                  : currentStage === 'streaming'
                    ? 'Transmitting PCM-16 chunk stream to edge broker.'
                    : currentStage === 'transcribing'
                      ? 'Decoupled transformer decoder active.'
                      : 'End-to-end activation loop resolved successfully.'}
            </p>
          </div>

          {/* Uptime Box */}
          <div className="bg-[#2f3634] px-4 py-2 rounded-lg border border-[#3c4a46] flex items-center gap-4 self-start md:self-auto shadow-xs">
            <span className="font-mono text-[#57f1db] metric-value text-lg font-semibold tracking-wider">
              {formatUptime(uptimeSeconds)}
            </span>
            <div className="w-px h-6 bg-[#3c4a46]" />
            <span className="text-xs text-[#bacac5] uppercase tracking-wider font-medium">
              Uptime
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
              className="absolute left-6 top-1/2 -translate-y-1/2 h-[2px] bg-[#57f1db] transition-all duration-300 -z-10 shadow-[0_0_8px_rgba(87,241,219,0.5)]"
              style={{ width: `calc(${progressPercent}% - 3rem)` }}
            />

            {stages.map((stage, idx) => {
              const isActive = idx === currentStageIndex;
              const isPast = idx < currentStageIndex;
              const isCompleted = currentStage === 'complete' && idx === stages.length - 1;

              return (
                <div key={stage.id} className="flex flex-col items-center gap-1.5 z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isActive || isCompleted
                        ? 'bg-[#57f1db]/20 border-2 border-[#57f1db] text-[#57f1db] shadow-[0_0_12px_rgba(87,241,219,0.4)] scale-110'
                        : isPast
                          ? 'bg-[#4edea3]/20 border-2 border-[#4edea3] text-[#4edea3]'
                          : 'bg-[#0e1513] border-2 border-[#859490]/50 text-[#859490] opacity-60'
                    }`}
                  >
                    {stage.icon}
                  </div>
                  <span
                    className={`text-[11px] font-bold tracking-wider uppercase transition-colors text-center ${
                      isActive || isCompleted
                        ? 'text-[#57f1db]'
                        : isPast
                          ? 'text-[#4edea3]'
                          : 'text-[#859490] opacity-60'
                    }`}
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
          {/* Edge Node Control */}
          <section 
            id="edge-node-control-card"
            className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-4 flex flex-col gap-4 shadow-sm"
          >
            <div className="flex justify-between items-center border-b border-[#3c4a46] pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5]">
                EDGE NODE CONTROL
              </h3>
              <span className="text-[10px] text-[#57f1db] font-mono">DSP v2.4</span>
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
                className={`w-32 h-32 rounded-full border flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 group relative ${
                  currentStage !== 'listening'
                    ? 'bg-[#4edea3]/20 border-[#4edea3] text-[#4edea3] shadow-[0_0_24px_rgba(78,222,163,0.4)]'
                    : isListening
                      ? 'bg-[#57f1db]/10 border-[#57f1db] text-[#57f1db] hover:bg-[#57f1db]/20 shadow-[0_0_18px_rgba(87,241,219,0.25)]'
                      : 'bg-[#2f3634] border-[#859490] text-[#859490]'
                }`}
                title="Click to simulate wake word recognition or speak into your mic"
              >
                <Mic className={`w-12 h-12 transition-transform duration-200 group-hover:scale-110 ${
                  currentStage !== 'listening' ? 'animate-bounce' : ''
                }`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {currentStage === 'listening' ? 'Tap To Trigger' : 'Processing'}
                </span>
              </button>

              {/* Audio Wave Visualizer */}
              <div className="w-full mt-3 px-2">
                <AudioVisualizer 
                  isActive={isListening} 
                  isTriggered={currentStage !== 'listening'} 
                  audioLevel={isRealAudioActive ? realAudioLevel : 0.4}
                />
              </div>
            </div>

            {/* Status Rows */}
            <div className="flex flex-col gap-2 pt-1 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-[#3c4a46]/30">
                <span className="text-[#bacac5]">Edge KWS Status</span>
                <span className="font-mono text-[#57f1db] flex items-center gap-1.5 font-medium">
                  <div className="w-2 h-2 rounded-full bg-[#57f1db] animate-pulse-soft" />
                  {currentStage === 'listening' ? 'Listening' : 'Detected (Active)'}
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
                      ? 'Streaming (42ms)' 
                      : 'Uplink Synced'}
                </span>
              </div>
            </div>

            {/* Quick Demo Utterances */}
            <div className="pt-2 border-t border-[#3c4a46]/40 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[#bacac5] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#57f1db]" />
                Test Utterance Presets:
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
            </div>
          </section>

          {/* Evaluation Metrics */}
          <section 
            id="evaluation-metrics-card"
            className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-4 flex flex-col gap-3 shadow-sm"
          >
            <div className="flex justify-between items-center border-b border-[#3c4a46] pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5]">
                EVALUATION METRICS
              </h3>
              <span className="text-[10px] text-[#859490] font-bold tracking-wider">
                DEMO DATA
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* RAM Footprint */}
              <div className="bg-[#2f3634] p-2.5 rounded border border-[#3c4a46]/50 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#bacac5] uppercase tracking-wider mb-1">
                  RAM Footprint
                </span>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[#dde4e1] text-xs font-semibold">
                    {metrics.ramUsedKb} / {metrics.ramMaxKb} KB
                  </span>
                  <div className="w-full bg-[#161d1b] rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-[#57f1db] h-full rounded-full transition-all duration-300"
                      style={{ width: `${(metrics.ramUsedKb / metrics.ramMaxKb) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* CPU (Idle) */}
              <div className="bg-[#2f3634] p-2.5 rounded border border-[#3c4a46]/50 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#bacac5] uppercase tracking-wider mb-1">
                  CPU (Idle)
                </span>
                <div className="flex flex-col">
                  <span className="font-mono text-[#dde4e1] text-sm font-semibold">
                    {metrics.cpuIdlePercent.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-[#859490]">
                    ({metrics.cpuIdlePercent <= 10 ? '10% target' : 'Above target'})
                  </span>
                </div>
              </div>

              {/* False Activations */}
              <div className="bg-[#2f3634] p-2.5 rounded border border-[#3c4a46]/50 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#bacac5] uppercase tracking-wider mb-1">
                  False Activations
                </span>
                <span className="font-mono text-xs text-[#859490] italic">
                  {metrics.falseActivations}
                </span>
              </div>

              {/* Stream Latency */}
              <div className="bg-[#2f3634] p-2.5 rounded border border-[#3c4a46]/50 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#bacac5] uppercase tracking-wider mb-1">
                  Stream Latency
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-[#dde4e1] text-sm font-semibold">
                    {metrics.streamLatencyMs}
                  </span>
                  <span className="text-xs text-[#bacac5]">ms</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (Wide) */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* ASR Real-Time Transcript Panel */}
          <section 
            id="asr-transcript-panel"
            className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-4 flex flex-col gap-3 h-64 shadow-sm"
          >
            <div className="flex justify-between items-center border-b border-[#3c4a46] pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5]">
                ASR REAL-TIME TRANSCRIPT
              </h3>
              <span className="text-[10px] text-[#859490] font-bold tracking-wider">
                DEMO DATA
              </span>
            </div>

            <div className="flex-1 bg-[#09100e] rounded border border-[#3c4a46]/50 p-4 flex flex-col overflow-y-auto">
              {transcripts.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center h-full text-center gap-2 opacity-60 my-auto">
                  <Volume2 className="w-9 h-9 text-[#859490]" />
                  <p className="text-sm text-[#bacac5] max-w-sm">
                    Start the edge listener, then say 'Hi Edge' followed by your command.
                  </p>
                </div>
              ) : (
                /* Transcript List */
                <div className="flex flex-col gap-3">
                  {transcripts.map((entry) => (
                    <div key={entry.id} className="flex gap-3 items-start animate-fade-in">
                      <span className="font-mono text-[#859490] text-xs mt-1 shrink-0">
                        {entry.time}
                      </span>
                      <div className="flex flex-col bg-[#2f3634] p-3 rounded-lg rounded-tl-none border border-[#3c4a46]/40 max-w-xl">
                        <span className="text-sm text-[#dde4e1] font-medium leading-relaxed">
                          {entry.text}
                        </span>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#3c4a46]/30 text-[10px]">
                          <span className="text-[#bacac5]">Confidence: {(entry.confidence * 100).toFixed(1)}%</span>
                          <span className="font-bold text-[#4edea3] uppercase tracking-wider flex items-center gap-1">
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
                  {copiedLogs ? <Check className="w-3 h-3 text-[#4edea3]" /> : <Copy className="w-3 h-3" />}
                  {copiedLogs ? 'COPIED' : 'COPY LOGS'}
                </button>
              </div>
            </div>

            {/* Log Stream */}
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1.5 pr-2 select-text">
              {logs.length === 0 ? (
                <div className="text-[#859490] italic py-4 text-center">No logs generated yet.</div>
              ) : (
                logs.map((log) => {
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

      {/* Metrics Grid (Total Latency + Telemetry) */}
      <section 
        id="metrics-grid-section"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 mt-2"
      >
        {/* Highlighted Total Latency */}
        <div className="col-span-2 md:col-span-4 lg:col-span-7 bg-[#57f1db]/10 border border-[#57f1db]/30 rounded-lg p-4 flex flex-col justify-between relative overflow-hidden group shadow-xs">
          <div className="flex justify-between items-center mb-1 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#57f1db]">
              Total Latency
              <span className="text-[#859490] text-[10px] ml-1.5">DEMO DATA</span>
            </span>
            <span className="text-[10px] text-[#4edea3] font-mono bg-[#4edea3]/10 px-2 py-0.5 rounded border border-[#4edea3]/20">
              TARGET: &lt;1000ms (PASS)
            </span>
          </div>

          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl md:text-4xl font-semibold text-[#57f1db] metric-value">
              {metrics.totalLatencyMs}
            </span>
            <span className="text-base text-[#57f1db]/70 font-medium">ms</span>
            <span className="text-xs text-[#bacac5] ml-4 hidden sm:inline">
              (Inference: {metrics.inferenceLatencyMs}ms + Uplink: {metrics.networkLatencyMs}ms + Buffer: {metrics.totalLatencyMs - metrics.inferenceLatencyMs - metrics.networkLatencyMs}ms)
            </span>
          </div>
        </div>

        {/* Keyword */}
        <div className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] mb-1">
            Keyword <span className="text-[#859490] text-[10px] ml-1">DEMO</span>
          </span>
          <span className="text-lg font-semibold text-[#dde4e1] metric-value">
            {metrics.keyword}
          </span>
        </div>

        {/* Confidence */}
        <div className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] mb-1">
            Confidence <span className="text-[#859490] text-[10px] ml-1">DEMO</span>
          </span>
          <span className="text-lg font-semibold text-[#4edea3] metric-value">
            {(metrics.confidence * 100).toFixed(1)}%
          </span>
        </div>

        {/* Inference */}
        <div className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] mb-1">
            Inference <span className="text-[#859490] text-[10px] ml-1">DEMO</span>
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-[#dde4e1] metric-value">
              {metrics.inferenceLatencyMs}
            </span>
            <span className="text-xs text-[#bacac5]">ms</span>
          </div>
        </div>

        {/* Network Latency */}
        <div className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] mb-1">
            Network Latency <span className="text-[#859490] text-[10px] ml-1">DEMO</span>
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-[#dde4e1] metric-value">
              {metrics.networkLatencyMs}
            </span>
            <span className="text-xs text-[#bacac5]">ms</span>
          </div>
        </div>

        {/* RAM */}
        <div className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] mb-1">
            RAM <span className="text-[#859490] text-[10px] ml-1">DEMO</span>
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-[#dde4e1] metric-value">
              {metrics.ramUsedKb}
            </span>
            <span className="text-xs text-[#bacac5]">/ {metrics.ramMaxKb} KB</span>
          </div>
        </div>

        {/* CPU */}
        <div className="bg-[#1a211f] rounded-lg border border-[#3c4a46] p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#bacac5] mb-1">
            CPU <span className="text-[#859490] text-[10px] ml-1">DEMO</span>
          </span>
          <span className="text-lg font-semibold text-[#dde4e1] metric-value">
            {metrics.cpuIdlePercent.toFixed(1)}%
          </span>
        </div>
      </section>
    </main>
  );
};
