import React from 'react';
import { Menu, Mic, MicOff, Wifi, Volume2, CheckCircle2, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { ActiveScreen, ConnectionState, DataMode } from '../types';

interface TopAppBarProps {
  activeScreen: ActiveScreen;
  onSelectScreen: (screen: ActiveScreen) => void;
  onToggleMobileMenu: () => void;
  isRealAudioActive: boolean;
  onToggleRealAudio: () => void;
  onOpenAudioSettings: () => void;
  deviceRssi?: number;
  connectionState?: ConnectionState;
  dataMode?: DataMode;
  lastUpdate?: Date | null;
  error?: string | null;
}

function formatFreshness(lastUpdate: Date | null | undefined): { label: string; stale: boolean } {
  if (!lastUpdate) return { label: 'Waiting for telemetry', stale: false };
  const ms = Date.now() - lastUpdate.getTime();
  if (ms > 10000) return { label: 'Telemetry stale', stale: true };
  const s = (ms / 1000).toFixed(2);
  return { label: `${s} s ago`, stale: false };
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  activeScreen,
  onSelectScreen,
  onToggleMobileMenu,
  isRealAudioActive,
  onToggleRealAudio,
  onOpenAudioSettings,
  deviceRssi,
  connectionState = 'demo',
  dataMode = 'demo',
  lastUpdate = null,
  error = null,
}) => {
  const fresh = formatFreshness(lastUpdate);

  let statusColor = 'text-[#859490] border-[#3c4a46]';
  let statusDot = 'bg-[#859490]';
  let statusAnim = '';
  let statusLabel = 'Unknown';
  let statusSubLabel = '';

  if (dataMode === 'demo') {
    statusColor = 'text-[#ffd29f] border-[#ffd29f]/40 bg-[#ffd29f]/5';
    statusDot = 'bg-[#ffd29f]';
    statusAnim = 'animate-pulse-soft';
    statusLabel = 'DEMO DATA';
    statusSubLabel = '· Live device unavailable';
  } else {
    switch (connectionState) {
      case 'connected':
        statusColor = 'text-[#4edea3] border-[#4edea3]/40 bg-[#4edea3]/5';
        statusDot = 'bg-[#4edea3]';
        statusAnim = 'animate-pulse-soft';
        statusLabel = 'LIVE TELEMETRY';
        statusSubLabel = '· ESP32-S3 · Connected';
        break;
      case 'connecting':
        statusColor = 'text-[#57f1db] border-[#57f1db]/40 bg-[#57f1db]/5';
        statusDot = 'bg-[#57f1db]';
        statusAnim = 'animate-blink-soft';
        statusLabel = 'CONNECTING…';
        statusSubLabel = '· Opening telemetry socket';
        break;
      case 'disconnected':
        statusColor = 'text-[#ffb4ab] border-[#ffb4ab]/40 bg-[#ffb4ab]/5';
        statusDot = 'bg-[#ffb4ab]';
        statusLabel = 'DISCONNECTED';
        statusSubLabel = '· Reconnect pending';
        break;
      case 'error':
        statusColor = 'text-[#ffb4ab] border-[#ffb4ab]/40 bg-[#ffb4ab]/5';
        statusDot = 'bg-[#ffb4ab]';
        statusAnim = 'animate-blink-soft';
        statusLabel = 'TELEMETRY ERROR';
        statusSubLabel = error ? `· ${error}` : '· Check server';
        break;
    }
  }

  return (
    <header 
      id="top-app-bar"
      className="bg-[#0e1513] sticky top-0 z-20 flex flex-col w-full border-b border-[#3c4a46]"
    >
      <div className="flex justify-between items-center w-full px-4 md:px-6 h-16">
        {/* Left: Mobile Toggle + Nav Tabs */}
        <div className="flex items-center h-full gap-3 md:gap-6">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-[#bacac5] hover:text-[#57f1db] hover:bg-[#1a211f] rounded transition-colors"
            aria-label="Open sidebar navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-6 h-full" aria-label="Screen Tabs">
            <button
              id="tab-live-dashboard"
              onClick={() => onSelectScreen('dashboard')}
              className={`h-full flex items-center px-1 font-semibold text-sm transition-all duration-200 cursor-pointer ${
                activeScreen === 'dashboard'
                  ? 'text-[#57f1db] border-b-2 border-[#57f1db]'
                  : 'text-[#bacac5] font-medium hover:text-[#57f1db]'
              }`}
            >
              Live Dashboard
            </button>

            <button
              id="tab-benchmarks"
              onClick={() => onSelectScreen('benchmarks')}
              className={`h-full flex items-center px-1 font-semibold text-sm transition-all duration-200 cursor-pointer ${
                activeScreen === 'benchmarks'
                  ? 'text-[#57f1db] border-b-2 border-[#57f1db]'
                  : 'text-[#bacac5] font-medium hover:text-[#57f1db]'
              }`}
            >
              Benchmarks
            </button>
          </nav>
        </div>

        {/* Right: Status + freshness + On-Device Audio Button */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Mode / Connection status pill */}
          <div 
            className={`hidden sm:flex flex-col items-end leading-tight px-3 py-1.5 rounded-full border font-mono text-[11px] select-none shadow-xs ${statusColor}`}
            title={error ? `Status: ${error}` : `Telemetry status: ${connectionState} / ${dataMode}`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor/40%] ${statusDot} ${statusAnim}`} />
              <span className="font-bold tracking-wider">{statusLabel}</span>
              {connectionState === 'connecting' && <Loader2 className="w-3 h-3 animate-spin opacity-70" />}
              {connectionState === 'error' && <XCircle className="w-3 h-3 opacity-70" />}
              {connectionState === 'disconnected' && <AlertCircle className="w-3 h-3 opacity-70" />}
              {connectionState === 'connected' && <CheckCircle2 className="w-3 h-3 opacity-70" />}
            </div>
            <div className="flex items-center gap-1 text-[10px] opacity-80">
              <span>{statusSubLabel}</span>
              {dataMode === 'live' && deviceRssi != null && (
                <span className="flex items-center gap-0.5">
                  · <Wifi className="w-2.5 h-2.5" /> {deviceRssi} dBm
                </span>
              )}
            </div>
          </div>

          {/* Freshness readout */}
          {dataMode === 'live' && (
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#3c4a46]/50 bg-[#1a211f] font-mono text-[10px] ${
              fresh.stale ? 'text-[#ffd29f] border-[#ffd29f]/30 animate-blink-soft' : 'text-[#bacac5]'
            }`}>
              {fresh.stale && <AlertCircle className="w-3 h-3" />}
              <span>{fresh.label}</span>
            </div>
          )}

          {/* Browser Mic Demo Button */}
          <div className="flex items-center gap-1.5">
            <button
              id="btn-on-device-audio"
              onClick={onToggleRealAudio}
              className={`px-3 sm:px-4 py-1.5 rounded text-xs sm:text-sm font-medium flex items-center gap-2 cursor-pointer transition-all duration-150 border ${
                isRealAudioActive
                  ? 'bg-[#ffd29f]/15 border-[#ffd29f]/50 text-[#ffd29f] shadow-[0_0_12px_rgba(255,210,159,0.2)]'
                  : 'bg-[#1a211f] border-[#3c4a46] text-[#dde4e1] hover:text-[#ffd29f] hover:border-[#ffd29f]/50'
              }`}
              title={isRealAudioActive
                ? "Browser microphone input active (demo trigger only — NOT connected to ESP32 mic)"
                : "Toggle browser microphone input (local demo trigger, not ESP32 device audio)"}
            >
              {isRealAudioActive ? (
                <>
                  <Mic className="w-3.5 h-3.5 text-[#ffd29f] animate-pulse" />
                  <span className="font-semibold">Mic Live (Demo)</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5 text-[#bacac5]" />
                  <span>Browser Mic Demo</span>
                </>
              )}
            </button>

            <button
              id="btn-audio-settings"
              onClick={onOpenAudioSettings}
              className="p-1.5 bg-[#1a211f] border border-[#3c4a46] text-[#bacac5] hover:text-[#57f1db] hover:border-[#57f1db] rounded transition-colors"
              title="Audio Hardware & VAD Options"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom status strip: mode + freshness on small screens */}
      <div className={`flex sm:hidden items-center justify-between px-4 py-1.5 border-t border-[#3c4a46]/50 text-[10px] font-mono ${statusColor} bg-transparent border-x-0 rounded-none`}>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot} ${statusAnim}`} />
          <span className="font-bold tracking-wider">{statusLabel}</span>
        </div>
        <div className="text-[#bacac5]">
          {dataMode === 'live' ? fresh.label : 'Simulation active'}
          {dataMode === 'live' && deviceRssi != null && ` · ${deviceRssi} dBm`}
        </div>
      </div>
    </header>
  );
};
