import { useState, useEffect, useCallback, useRef } from 'react';
import { EdgeWakeSocket } from '../api/websocket';
import {
  ConnectionState,
  DataMode,
  PipelineStage,
  LiveMetrics,
  LogEntry,
  TranscriptEntry,
  ActivationSession,
  TelemetryEvent,
} from '../types';

// Deterministic Demo Data
const DEMO_METRICS: LiveMetrics = {
  ramUsedKb: 184,
  ramMaxKb: 256,
  flashUsedKb: 420,
  cpuIdlePercent: 8.2,
  rssi: -47,
  keyword: 'Hi Edge',
  confidence: 0.964,
  inferenceLatencyMs: 42,
  packetsStreamed: 37,
  networkLatencyMs: 120,
  asrLatencyMs: 421,
  totalLatencyMs: 583,
  falseActivationsPerHour: null,
};

const STALE_TIMEOUT_MS = 10000; // 10 seconds without telemetry marks data as stale

export function useEdgeWake() {
  const [dataMode, setDataMode] = useState<DataMode>('demo');
  const [connectionState, setConnectionState] = useState<ConnectionState>('demo');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('listening');
  const [metrics, setMetrics] = useState<LiveMetrics>({
    ramUsedKb: 0,
    ramMaxKb: 256,
    flashUsedKb: null,
    cpuIdlePercent: 0,
    rssi: null,
    keyword: '—',
    confidence: 0,
    inferenceLatencyMs: 0,
    packetsStreamed: 0,
    networkLatencyMs: null,
    asrLatencyMs: null,
    totalLatencyMs: null,
    falseActivationsPerHour: null,
  });
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [session, setSession] = useState<ActivationSession | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(true);

  const socketRef = useRef<EdgeWakeSocket | null>(null);
  const demoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const demoSequenceRef = useRef<NodeJS.Timeout[]>([]);

  // Computed state
  const privacyGateOpen = pipelineStage === 'streaming' || pipelineStage === 'wake_detected';

  // Format current time HH:MM:SS
  const getCurrentTime = useCallback(() => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  }, []);

  const addLog = useCallback((tag: LogEntry['tag'], message: string, type: LogEntry['type']) => {
    setLogs(prev => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        time: getCurrentTime(),
        tag,
        message,
        type,
      };
      return [...prev.slice(-99), newLog]; // Keep last 100 logs
    });
  }, [getCurrentTime]);

  const clearDemoSequence = useCallback(() => {
    demoSequenceRef.current.forEach(clearTimeout);
    demoSequenceRef.current = [];
  }, []);

  // --- WebSocket Initialization ---
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_EDGEWAKE_WS_URL;
    if (!wsUrl) {
      setDataMode('demo');
      setConnectionState('demo');
      return;
    }

    setDataMode('live');
    const socket = new EdgeWakeSocket(wsUrl);
    socketRef.current = socket;

    socket.onStateChange = (state) => {
      setConnectionState(state);
      if (state === 'error') {
        setError('WebSocket connection error');
        setPipelineStage('error');
      } else if (state === 'connected') {
        setError(null);
        addLog('SYS', 'Telemetry WebSocket connected.', 'normal');
      } else if (state === 'disconnected') {
        addLog('SYS', 'Telemetry WebSocket disconnected.', 'dim');
      }
    };

    socket.onMessage = (event: TelemetryEvent) => {
      setLastUpdate(new Date());

      switch (event.type) {
        case 'device_state':
          setPipelineStage(event.state);
          addLog('SYS', `Device state changed: ${event.state}`, 'dim');
          if (event.state === 'listening' && session && session.finalState !== 'error') {
              // Finish session if returning to listening from a non-error completion
              setSession(prev => prev ? { ...prev, completedAt: new Date() } : null);
          }
          break;
        case 'wake_detected':
          setPipelineStage('wake_detected');
          setMetrics(prev => ({
            ...prev,
            confidence: event.confidence,
            inferenceLatencyMs: event.inference_ms,
            keyword: 'Hi Edge', // Default or from event if available later
          }));
          const newSessionId = String(sessionCount + 1).padStart(4, '0');
          setSessionCount(prev => prev + 1);
          setSession({
            id: `#${newSessionId}`,
            isLocalId: true,
            startedAt: new Date(),
            confidence: event.confidence,
            inferenceMs: event.inference_ms,
            packetsStreamed: 0,
            transcript: null,
            asrMs: null,
            totalMs: null,
            finalState: 'wake_detected'
          });
          addLog('KWS', `Wake word detected: (Confidence: ${(event.confidence * 100).toFixed(1)}%) in ${event.inference_ms}ms`, 'secondary');
          break;
        case 'stream_started':
          setPipelineStage('streaming');
          setMetrics(prev => ({ ...prev, packetsStreamed: event.packet_count }));
          setSession(prev => prev ? { ...prev, packetsStreamed: event.packet_count, finalState: 'streaming' } : null);
          addLog('AUDIO', `Stream started: ${event.packet_count} packets.`, 'primary');
          break;
        case 'metrics':
          setMetrics(prev => ({
            ...prev,
            ramUsedKb: event.ram_kb,
            flashUsedKb: event.flash_kb ?? prev.flashUsedKb,
            cpuIdlePercent: event.cpu_pct,
            rssi: event.rssi ?? prev.rssi,
          }));
          break;
        case 'asr_partial':
          setPipelineStage('transcribing');
          setSession(prev => prev ? { ...prev, transcript: event.text, finalState: 'transcribing' } : null);
          addLog('ASR', `Partial: "${event.text}"`, 'dim');
          break;
        case 'asr_final':
          setPipelineStage('complete');
          setSession(prev => prev ? { 
            ...prev, 
            transcript: event.text, 
            asrMs: event.asr_ms,
            finalState: 'complete' 
          } : null);
          setMetrics(prev => ({ ...prev, asrLatencyMs: event.asr_ms }));
          setTranscripts(prev => [
            {
              id: Math.random().toString(36).substring(2, 9),
              time: getCurrentTime(),
              text: event.text,
              status: 'complete',
              confidence: session?.confidence ?? 0,
            },
            ...prev.slice(0, 9)
          ]);
          addLog('ASR', `Final Transcript: "${event.text}" in ${event.asr_ms}ms`, 'normal');
          break;
        case 'error':
          setPipelineStage('error');
          setError(`[${event.code}] ${event.message}`);
          setSession(prev => prev ? { ...prev, finalState: 'error', errorCode: event.code, errorMessage: event.message, completedAt: new Date() } : null);
          addLog('SYS', `Error: [${event.code}] ${event.message}`, 'error');
          break;
        default:
           console.warn('[EdgeWake WS] Unknown telemetry event:', event);
      }
    };

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [getCurrentTime, sessionCount]); // Intentionally not including session to avoid recreating on every event

  // --- Stale Telemetry Check ---
  useEffect(() => {
    if (dataMode !== 'live' || !lastUpdate) return;

    const checkStale = setInterval(() => {
      if (new Date().getTime() - lastUpdate.getTime() > STALE_TIMEOUT_MS) {
        // Only mark stale if we are connected but haven't received data.
        if (socketRef.current) {
            // we could update a stale state here if needed, but connectionState + lastUpdate is usually enough
        }
      }
    }, 1000);

    return () => clearInterval(checkStale);
  }, [dataMode, lastUpdate]);


  // --- Demo Sequence Logic ---
  const runDemo = useCallback(() => {
    if (dataMode !== 'demo' || !isListening) return;

    clearDemoSequence();
    setError(null);
    setMetrics(DEMO_METRICS);
    setLastUpdate(new Date());

    const t = getCurrentTime();
    const sessionId = `#${String(sessionCount + 1).padStart(4, '0')}`;
    setSessionCount(prev => prev + 1);

    // 1. Wake detected
    setPipelineStage('wake_detected');
    setSession({
      id: sessionId,
      isLocalId: true,
      startedAt: new Date(),
      confidence: DEMO_METRICS.confidence,
      inferenceMs: DEMO_METRICS.inferenceLatencyMs,
      packetsStreamed: 0,
      transcript: null,
      asrMs: null,
      totalMs: null,
      finalState: 'wake_detected'
    });
    addLog('KWS', `Wake word detected: ${DEMO_METRICS.keyword} (Confidence: ${(DEMO_METRICS.confidence * 100).toFixed(1)}%)`, 'secondary');

    // 2. Streaming (after 300ms)
    demoSequenceRef.current.push(setTimeout(() => {
      setPipelineStage('streaming');
      setSession(prev => prev ? { ...prev, packetsStreamed: DEMO_METRICS.packetsStreamed, finalState: 'streaming' } : null);
      addLog('SYS', 'Triggering ASR uplink socket to broker...', 'dim');
      addLog('ASR', `Streaming audio payload (PCM-16 / 16kHz) - ${DEMO_METRICS.packetsStreamed} packets...`, 'primary');
    }, 300));

    // 3. Transcribing (after 700ms)
    demoSequenceRef.current.push(setTimeout(() => {
      setPipelineStage('transcribing');
      setSession(prev => prev ? { ...prev, transcript: "Turn on the...", finalState: 'transcribing' } : null);
      addLog('ASR', `Speech recognition partial: "Turn on the..."`, 'primary');
    }, 700));

    // 4. Complete (after 1100ms)
    demoSequenceRef.current.push(setTimeout(() => {
      setPipelineStage('complete');
      const finalCommand = "Turn on the lights in the living room.";
      setSession(prev => prev ? { 
        ...prev, 
        transcript: finalCommand, 
        asrMs: DEMO_METRICS.asrLatencyMs,
        totalMs: DEMO_METRICS.totalLatencyMs,
        finalState: 'complete',
        completedAt: new Date()
      } : null);
      addLog('ASR', `Transcription verified: "${finalCommand}"`, 'secondary');
      addLog('SYS', `End-to-end activation complete in ${DEMO_METRICS.totalLatencyMs}ms`, 'dim');

      setTranscripts(prev => [
        {
          id: Math.random().toString(36).substring(2, 9),
          time: t,
          text: finalCommand,
          status: 'complete',
          confidence: DEMO_METRICS.confidence,
          isDemo: true
        },
        ...prev.slice(0, 9)
      ]);
    }, 1100));

    // 5. Return to listening (after 2800ms)
    demoSequenceRef.current.push(setTimeout(() => {
      setPipelineStage('listening');
      addLog('KWS', 'Neural engine reset. Awaiting next wake signature.', 'dim');
    }, 2800));

  }, [dataMode, isListening, sessionCount, getCurrentTime, addLog, clearDemoSequence]);

  const stopDemo = useCallback(() => {
    clearDemoSequence();
    setPipelineStage('listening');
  }, [clearDemoSequence]);

  const toggleListening = useCallback(() => {
      setIsListening(!isListening);
  }, [isListening]);


  return {
    connectionState,
    dataMode,
    pipelineStage,
    metrics,
    transcripts,
    logs,
    privacyGateOpen,
    session,
    sessionCount,
    lastUpdate,
    error,
    runDemo,
    stopDemo,
    toggleListening,
    isListening,
    clearLogs: () => setLogs([])
  };
}
