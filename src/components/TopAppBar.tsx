import React from 'react';
import { Menu, Mic, MicOff, Wifi, Volume2, CheckCircle2 } from 'lucide-react';
import { ActiveScreen } from '../types';

interface TopAppBarProps {
  activeScreen: ActiveScreen;
  onSelectScreen: (screen: ActiveScreen) => void;
  onToggleMobileMenu: () => void;
  isRealAudioActive: boolean;
  onToggleRealAudio: () => void;
  onOpenAudioSettings: () => void;
  deviceRssi?: number;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  activeScreen,
  onSelectScreen,
  onToggleMobileMenu,
  isRealAudioActive,
  onToggleRealAudio,
  onOpenAudioSettings,
  deviceRssi = -65,
}) => {
  return (
    <header 
      id="top-app-bar"
      className="bg-[#0e1513] sticky top-0 z-20 flex justify-between items-center w-full px-4 md:px-6 h-16 border-b border-[#3c4a46]"
    >
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

      {/* Right: Device Status Pill + On-Device Audio Button */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Device Status */}
        <div 
          className="hidden sm:flex items-center gap-2 text-[#bacac5] font-mono text-xs bg-[#1a211f] px-3 py-1.5 rounded-full border border-[#3c4a46]/50 select-none shadow-xs"
          title="Edge node device telemetry status"
        >
          <span className="w-2 h-2 rounded-full bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.7)] animate-pulse" />
          <span>EdgeWake-01 • Online • {deviceRssi}dBm</span>
        </div>

        {/* On-Device Audio Button */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-on-device-audio"
            onClick={onToggleRealAudio}
            className={`px-3 sm:px-4 py-1.5 rounded text-xs sm:text-sm font-medium flex items-center gap-2 cursor-pointer transition-all duration-150 border ${
              isRealAudioActive
                ? 'bg-[#57f1db]/15 border-[#57f1db] text-[#57f1db] shadow-[0_0_12px_rgba(87,241,219,0.2)]'
                : 'bg-[#1a211f] border-[#3c4a46] text-[#dde4e1] hover:text-[#57f1db] hover:border-[#57f1db]'
            }`}
            title={isRealAudioActive ? "Microphone input capturing" : "Toggle microphone capture"}
          >
            {isRealAudioActive ? (
              <>
                <Mic className="w-3.5 h-3.5 text-[#57f1db] animate-pulse" />
                <span className="font-semibold">Mic Live</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-[#bacac5]" />
                <span>On-Device Audio</span>
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
    </header>
  );
};
