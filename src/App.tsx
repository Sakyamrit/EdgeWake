import React, { useState, useEffect, useRef } from 'react';
import { ActiveScreen, PipelineStage, LogEntry, TranscriptEntry, LiveMetrics } from './types';
import { Sidebar } from './components/Sidebar';
import { TopAppBar } from './components/TopAppBar';
import { LiveDashboard } from './components/LiveDashboard';
import { Benchmarks } from './components/Benchmarks';
import { Modals } from './components/Modals';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'deploy' | 'logs' | 'hardware' | 'security' | 'support' | 'docs' | 'audio' | null>(null);

  // Uptime state (starts at 14 mins 22 sec as in the mockup 00:14:22)
  const [uptimeSeconds, setUptimeSeconds] = useState(862);

  // System Pipeline State
  const [isListening, setIsListening] = useState(true);
  const [currentStage, setCurrentStage] = useState<PipelineStage>('listening');

  // Logs state seeded with initial mockup logs
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', time: '10:41:50', tag: 'SYS', message: 'Initialization sequence complete', type: 'dim' },
    { id: '2', time: '10:41:51', tag: 'SYS', message: 'System ready. Awaiting listener start.', type: 'normal' },
    { id: '3', time: '10:42:00', tag: 'KWS', message: 'Listener started. Mic array active.', type: 'primary' },
    { id: '4', time: '10:42:01', tag: 'KWS', message: 'Wake word detected: Hi Edge (Confidence: 96.4%)', type: 'secondary' },
    { id: '5', time: '10:42:01', tag: 'SYS', message: 'Triggering ASR uplink...', type: 'dim' },
    { id: '6', time: '10:42:01', tag: 'ASR', message: 'Connection pending...', type: 'pending' },
  ]);

  // Transcript state
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([
    {
      id: 't-1',
      time: '10:42:01',
      text: 'NOVA, turn on the lights in the living room.',
      status: 'complete',
      confidence: 0.964,
    }
  ]);

  // Live Metrics state
  const [metrics, setMetrics] = useState<LiveMetrics>({
    ramUsedKb: 184,
    ramMaxKb: 256,
    cpuIdlePercent: 8.2,
    streamLatencyMs: 42,
    falseActivations: 'Awaiting test data',
    totalLatencyMs: 612,
    keyword: 'Hi Edge',
    confidence: 0.964,
    inferenceLatencyMs: 42,
    networkLatencyMs: 120,
  });

  // Real Audio Capture
  const [isRealAudioActive, setIsRealAudioActive] = useState(false);
  const [realAudioLevel, setRealAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Uptime ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
      // subtle CPU idle jitter
      setMetrics(prev => ({
        ...prev,
        cpuIdlePercent: Math.max(7.4, Math.min(9.1, prev.cpuIdlePercent + (Math.random() * 0.4 - 0.2)))
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format current time HH:MM:SS
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  // Helper to append log
  const addLog = (tag: 'SYS' | 'KWS' | 'ASR' | 'AUDIO', message: string, type: LogEntry['type']) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time: getCurrentTime(),
      tag,
      message,
      type,
    };
    setLogs(prev => [...prev.slice(-40), newLog]);
  };

  // Trigger wake word sequence
  const handleSimulateTrigger = (customCommand?: string) => {
    if (currentStage !== 'listening') return;

    const command = customCommand || (
      Math.random() > 0.5 
        ? 'NOVA, turn on the lights in the living room.' 
        : Math.random() > 0.5
          ? 'Set conference room thermostat to 72 degrees.'
          : 'Check telemetry signal and battery health.'
    );

    const time = getCurrentTime();
    const conf = Number((0.95 + Math.random() * 0.04).toFixed(3));
    const inference = Math.floor(38 + Math.random() * 8);
    const network = Math.floor(110 + Math.random() * 25);
    const total = inference + network + 450;

    // 1. Wake detected
    setCurrentStage('wake_detected');
    addLog('KWS', `Wake word detected: Hi Edge (Confidence: ${(conf * 100).toFixed(1)}%)`, 'secondary');

    setMetrics(prev => ({
      ...prev,
      confidence: conf,
      inferenceLatencyMs: inference,
      networkLatencyMs: network,
      totalLatencyMs: total,
    }));

    // 2. Streaming (after 300ms)
    setTimeout(() => {
      setCurrentStage('streaming');
      addLog('SYS', 'Triggering ASR uplink socket to broker...', 'dim');
      addLog('ASR', 'Streaming audio payload (PCM-16 / 16kHz)...', 'primary');
    }, 300);

    // 3. Transcribing (after 700ms)
    setTimeout(() => {
      setCurrentStage('transcribing');
      addLog('ASR', `Speech recognition partial: "${command.slice(0, 18)}..."`, 'primary');
    }, 700);

    // 4. Complete (after 1100ms)
    setTimeout(() => {
      setCurrentStage('complete');
      addLog('ASR', `Transcription verified: "${command}"`, 'secondary');
      addLog('SYS', `End-to-end activation complete in ${total}ms`, 'dim');

      // Add to transcript list
      setTranscripts(prev => [
        {
          id: Math.random().toString(36).substring(2, 9),
          time,
          text: command,
          status: 'complete',
          confidence: conf,
        },
        ...prev.slice(0, 9)
      ]);
    }, 1100);

    // 5. Return to listening (after 2800ms)
    setTimeout(() => {
      setCurrentStage('listening');
      addLog('KWS', 'Neural engine reset. Awaiting next wake signature.', 'dim');
    }, 2800);
  };

  // Toggle Live Microphone Audio
  const toggleRealAudio = async () => {
    if (isRealAudioActive) {
      // Stop
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      setIsRealAudioActive(false);
      setRealAudioLevel(0);
      addLog('AUDIO', 'Microphone audio capture stopped.', 'dim');
    } else {
      // Start
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyserRef.current = analyser;

        setIsRealAudioActive(true);
        addLog('AUDIO', 'Microphone input stream acquired: 16kHz DMA channel.', 'primary');

        const buffer = new Uint8Array(analyser.frequencyBinCount);
        let triggerCooldown = false;

        const updateAudio = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(buffer);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i];
          }
          const avg = sum / buffer.length / 255;
          setRealAudioLevel(avg);

          // Audio energy peak trigger simulation
          if (avg > 0.45 && !triggerCooldown && currentStage === 'listening') {
            triggerCooldown = true;
            handleSimulateTrigger("Live voice captured via on-device mic.");
            setTimeout(() => {
              triggerCooldown = false;
            }, 3500);
          }

          animFrameRef.current = requestAnimationFrame(updateAudio);
        };
        updateAudio();
      } catch (err) {
        console.warn("Mic access not granted or unavailable, using simulated audio.", err);
        addLog('AUDIO', 'Microphone permission request skipped or unavailable. Simulation active.', 'dim');
        // Still toggle active visual feedback
        setIsRealAudioActive(true);
        setTimeout(() => setIsRealAudioActive(false), 3000);
      }
    }
  };

  return (
    <div className="bg-[#0e1513] text-[#dde4e1] min-h-screen flex antialiased selection:bg-[#2dd4bf] selection:text-[#003731]">
      {/* Side Navigation */}
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        onOpenModal={setActiveModal}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 lg:ml-[260px] min-h-screen">
        {/* Global Top App Bar */}
        <TopAppBar
          activeScreen={activeScreen}
          onSelectScreen={setActiveScreen}
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          isRealAudioActive={isRealAudioActive}
          onToggleRealAudio={toggleRealAudio}
          onOpenAudioSettings={() => setActiveModal('audio')}
        />

        {/* Screen Switcher */}
        {activeScreen === 'dashboard' ? (
          <LiveDashboard
            uptimeSeconds={uptimeSeconds}
            isListening={isListening}
            onToggleListening={() => setIsListening(!isListening)}
            onSimulateTrigger={handleSimulateTrigger}
            currentStage={currentStage}
            logs={logs}
            onClearLogs={() => setLogs([])}
            transcripts={transcripts}
            metrics={metrics}
            isRealAudioActive={isRealAudioActive}
            realAudioLevel={realAudioLevel}
          />
        ) : (
          <Benchmarks />
        )}
      </div>

      {/* Interactive Modals */}
      <Modals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        logs={logs}
        onClearLogs={() => setLogs([])}
        onDeploySuccess={() => {
          addLog('SYS', 'OTA firmware update committed. Neural weights flashed.', 'primary');
          setMetrics(prev => ({
            ...prev,
            ramUsedKb: 178,
            inferenceLatencyMs: 36,
            totalLatencyMs: 580,
          }));
        }}
      />
    </div>
  );
}
