import React from 'react';
import { 
  Radio, 
  BarChart2, 
  List, 
  Cpu, 
  Shield, 
  ArrowUpCircle, 
  HelpCircle, 
  FileText,
  X
} from 'lucide-react';
import { ActiveScreen } from '../types';

interface SidebarProps {
  activeScreen: ActiveScreen;
  onSelectScreen: (screen: ActiveScreen) => void;
  onOpenModal: (modalName: 'deploy' | 'logs' | 'hardware' | 'security' | 'support' | 'docs') => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  onOpenModal,
  mobileOpen = false,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside 
        id="main-sidebar"
        className={`bg-[#161d1b] fixed left-0 top-0 h-full flex flex-col py-6 w-[260px] border-r border-[#3c4a46] z-40 transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#57f1db]/10 flex items-center justify-center border border-[#57f1db]/30 text-[#57f1db]">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold text-2xl text-[#57f1db] tracking-tight leading-none">
                EDGEWAKE
              </h1>
              <p className="text-[11px] font-bold tracking-wider text-[#bacac5] uppercase mt-1">
                Low-Latency Voice Activator
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="lg:hidden text-[#bacac5] hover:text-white p-1"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#3c4a46] mx-4 mb-2" />

        {/* Primary Navigation */}
        <nav className="flex-1 flex flex-col gap-1 py-1" aria-label="Main Navigation">
          <button
            id="nav-realtime-monitoring"
            onClick={() => {
              onSelectScreen('dashboard');
              onCloseMobile?.();
            }}
            className={`flex items-center gap-3.5 pl-4 py-3 text-left font-medium text-sm transition-all duration-150 cursor-pointer ${
              activeScreen === 'dashboard'
                ? 'bg-transparent text-[#57f1db] border-l-2 border-[#57f1db]'
                : 'text-[#bacac5] hover:text-[#dde4e1] hover:bg-[#2f3634]/30'
            }`}
          >
            <Radio className="w-4 h-4 shrink-0" />
            <span>Real-time Monitoring</span>
          </button>

          <button
            id="nav-performance-metrics"
            onClick={() => {
              onSelectScreen('benchmarks');
              onCloseMobile?.();
            }}
            className={`flex items-center gap-3.5 pl-4 py-3 text-left font-medium text-sm transition-all duration-150 cursor-pointer ${
              activeScreen === 'benchmarks'
                ? 'bg-transparent text-[#57f1db] border-l-2 border-[#57f1db]'
                : 'text-[#bacac5] hover:text-[#dde4e1] hover:bg-[#2f3634]/30'
            }`}
          >
            <BarChart2 className="w-4 h-4 shrink-0" />
            <span>Performance Metrics</span>
          </button>

          <button
            id="nav-system-logs"
            onClick={() => onOpenModal('logs')}
            className="flex items-center gap-3.5 pl-4 py-3 text-left font-medium text-sm text-[#bacac5] hover:text-[#dde4e1] hover:bg-[#2f3634]/30 transition-all duration-150 cursor-pointer"
          >
            <List className="w-4 h-4 shrink-0" />
            <span>System Logs</span>
          </button>

          <button
            id="nav-hardware-config"
            onClick={() => onOpenModal('hardware')}
            className="flex items-center gap-3.5 pl-4 py-3 text-left font-medium text-sm text-[#bacac5] hover:text-[#dde4e1] hover:bg-[#2f3634]/30 transition-all duration-150 cursor-pointer"
          >
            <Cpu className="w-4 h-4 shrink-0" />
            <span>Hardware Config</span>
          </button>

          <button
            id="nav-security-settings"
            onClick={() => onOpenModal('security')}
            className="flex items-center gap-3.5 pl-4 py-3 text-left font-medium text-sm text-[#bacac5] hover:text-[#dde4e1] hover:bg-[#2f3634]/30 transition-all duration-150 cursor-pointer"
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Security Settings</span>
          </button>
        </nav>

        {/* Footer & Quick Actions */}
        <div className="mt-auto flex flex-col gap-1 pt-4">
          <div className="px-4 mb-3">
            <button
              id="btn-deploy-update"
              onClick={() => onOpenModal('deploy')}
              className="w-full bg-[#2dd4bf] text-[#003731] font-semibold text-sm py-2 px-3 rounded flex items-center justify-center gap-2 hover:bg-[#57f1db] hover:shadow-[0_0_12px_rgba(87,241,219,0.3)] transition-all cursor-pointer active:scale-98"
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Deploy Update</span>
            </button>
          </div>

          <div className="border-t border-[#3c4a46] pt-2 flex flex-col gap-1">
            <button
              id="btn-support"
              onClick={() => onOpenModal('support')}
              className="flex items-center gap-3.5 pl-4 py-3 text-left text-sm text-[#bacac5] hover:text-[#dde4e1] hover:bg-[#2f3634]/30 transition-all duration-150 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Support</span>
            </button>
            <button
              id="btn-documentation"
              onClick={() => onOpenModal('docs')}
              className="flex items-center gap-3.5 pl-4 py-3 text-left text-sm text-[#bacac5] hover:text-[#dde4e1] hover:bg-[#2f3634]/30 transition-all duration-150 cursor-pointer"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Documentation</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
