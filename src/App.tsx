import React, { useState, useEffect, useRef } from 'react';
import { ActiveScreen } from './types';
import { useEdgeWake } from './hooks/useEdgeWake';
import { Sidebar } from './components/Sidebar';
import { TopAppBar } from './components/TopAppBar';
import { LiveDashboard } from './components/LiveDashboard';
import { Benchmarks } from './components/Benchmarks';
import { Modals } from './components/Modals';

export default function App() {
  // ── UI / layout state (preserved locally) ────────────────────────────────
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'deploy' | 'logs' | 'hardware' | 'security' | 'support' | 'docs' | 'audio' | null>(null);
  const [uptimeSeconds, setUptimeSeconds] = useState(862);

  // ── Single source of truth: useEdgeWake ──────────────────────────────────
  const edge = useEdgeWake();

  // ── Browser microphone capture (local device, not ESP32) ─────────────────
  const [isRealAudioActive, setIsRealAudioActive] = useState(false);
  const [realAudioLevel, setRealAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // ── Uptime ticker ────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format current time HH:MM:SS
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  // ── Browser microphone toggle ────────────────────────────────────────────
  //  NOTE: This captures audio from the host's browser microphone for demo
  //        purposes only. It never streams PCM to the dashboard, and the
  //        telemetry channel remains JSON-only per the EdgeWake event contract.
  const toggleRealAudio = async () => {
    if (isRealAudioActive) {
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
      edge.addLog('AUDIO', 'Browser microphone audio capture stopped.', 'dim');
    } else {
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
        edge.addLog('AUDIO', 'Browser microphone input stream acquired: local demo channel.', 'primary');

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

          // Audio energy peak → triggers demo sequence (only in demo mode)
          if (avg > 0.45 && !triggerCooldown && edge.dataMode === 'demo') {
            triggerCooldown = true;
            edge.runDemo("Live voice captured via browser microphone.");
            setTimeout(() => {
              triggerCooldown = false;
            }, 3500);
          }

          animFrameRef.current = requestAnimationFrame(updateAudio);
        };
        updateAudio();
      } catch (err) {
        console.warn("Mic access not granted or unavailable.", err);
        edge.addLog('AUDIO', 'Browser microphone permission skipped or unavailable. Demo trigger active.', 'dim');
        setIsRealAudioActive(true);
        setTimeout(() => setIsRealAudioActive(false), 3000);
      }
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const rssi = edge.metrics.rssi;

  return (
    <div className="bg-[#0e1513] text-[#dde4e1] min-h-screen flex antialiased selection:bg-[#2dd4bf] selection:text-[#003731]">
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        onOpenModal={setActiveModal}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 lg:ml-[260px] min-h-screen">
        <TopAppBar
          activeScreen={activeScreen}
          onSelectScreen={setActiveScreen}
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          isRealAudioActive={isRealAudioActive}
          onToggleRealAudio={toggleRealAudio}
          onOpenAudioSettings={() => setActiveModal('audio')}
          deviceRssi={rssi ?? undefined}
          connectionState={edge.connectionState}
          dataMode={edge.dataMode}
          lastUpdate={edge.lastUpdate}
          error={edge.error}
        />

        {activeScreen === 'dashboard' ? (
          <LiveDashboard
            uptimeSeconds={uptimeSeconds}
            isListening={edge.isListening}
            onToggleListening={edge.toggleListening}
            onSimulateTrigger={(cmd) => edge.runDemo(cmd)}
            currentStage={edge.pipelineStage}
            logs={edge.logs}
            onClearLogs={edge.clearLogs}
            transcripts={edge.transcripts}
            metrics={edge.metrics}
            isRealAudioActive={isRealAudioActive}
            realAudioLevel={realAudioLevel}
            dataMode={edge.dataMode}
            connectionState={edge.connectionState}
            privacyGateOpen={edge.privacyGateOpen}
            session={edge.session}
            sessionCount={edge.sessionCount}
            lastUpdate={edge.lastUpdate}
            hookError={edge.error}
          />
        ) : (
          <Benchmarks />
        )}
      </div>

      <Modals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        logs={edge.logs}
        onClearLogs={edge.clearLogs}
        onDeploySuccess={() => {
          edge.simulateDemoOta();
        }}
        dataMode={edge.dataMode}
      />
    </div>
  );
}
