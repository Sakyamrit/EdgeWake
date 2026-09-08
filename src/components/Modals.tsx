import React, { useState } from 'react';
import {
  X,
  ArrowUpCircle,
  CheckCircle2,
  Cpu,
  Shield,
  List,
  HelpCircle,
  FileText,
  Volume2,
  RotateCw,
  Check,
  ExternalLink,
  Copy,
  Zap,
  Lock,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { LogEntry, HardwareConfig, DataMode } from '../types';

interface ModalsProps {
  activeModal: 'deploy' | 'logs' | 'hardware' | 'security' | 'support' | 'docs' | 'audio' | null;
  onClose: () => void;
  logs: LogEntry[];
  onClearLogs: () => void;
  onDeploySuccess?: () => void;
  dataMode?: DataMode;
}

export const Modals: React.FC<ModalsProps> = ({
  activeModal,
  onClose,
  logs,
  onClearLogs,
  onDeploySuccess,
  dataMode = 'demo',
}) => {
  const isDemo = dataMode === 'demo';

  // Deploy state
  const [deployStep, setDeployStep] = useState<'idle' | 'flashing' | 'verifying' | 'done'>('idle');
  const [deployProgress, setDeployProgress] = useState(0);
  const [selectedFirmware, setSelectedFirmware] = useState('v2.4.2-quant-int8');

  // Hardware state — values labelled as static config, not live device parameters
  const [hwConfig, setHwConfig] = useState<HardwareConfig>({
    chipset: 'ESP32-S3',
    dspCore: 'Xtensa LX7 Dual-Core 240 MHz',
    audioFrontend: 'INMP441 Single MEMS Mic (I²S)',
    sampleRateHz: 16000,
    bitDepth: 16,
    quantization: 'INT8 Symmetric Per-Tensor',
    vadSensitivity: 85,
    beamforming: true,
  });
  const [hwSaved, setHwSaved] = useState(false);

  // Security state
  const [secSettings, setSecSettings] = useState({
    tlsPinning: true,
    ephemeralAudioBuffer: true,
    onDeviceVoiceprintHashing: true,
    telemetryAnonymization: true,
    localModelEncryption: true,
  });
  const [secSaved, setSecSaved] = useState(false);

  // Filter logs
  const [logFilter, setLogFilter] = useState<'ALL' | 'SYS' | 'KWS' | 'ASR'>('ALL');
  const [logSearch, setLogSearch] = useState('');

  if (!activeModal) return null;

  // Demo-mode disclaimer banner (top of body for any non-logs modal)
  const DemoBanner: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-start gap-2 rounded-lg border border-[#ffd29f]/30 bg-[#ffd29f]/5 p-2.5 text-[11px] text-[#ffd29f] mb-1">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        <span className="font-bold tracking-wider uppercase mr-1">Demo action</span>
        {message}
      </div>
    </div>
  );

  const startDeploy = () => {
    setDeployStep('flashing');
    setDeployProgress(15);
    const interval = setInterval(() => {
      setDeployProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          setDeployStep('verifying');
          setTimeout(() => {
            setDeployStep('done');
            onDeploySuccess?.();
          }, 800);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const handleSaveHw = (e: React.FormEvent) => {
    e.preventDefault();
    setHwSaved(true);
    setTimeout(() => {
      setHwSaved(false);
      onClose();
    }, 800);
  };

  const handleSaveSec = (e: React.FormEvent) => {
    e.preventDefault();
    setSecSaved(true);
    setTimeout(() => {
      setSecSaved(false);
      onClose();
    }, 800);
  };

  const filteredLogs = logs.filter(l => {
    if (logFilter !== 'ALL' && l.tag !== logFilter) return false;
    if (logSearch && !l.message.toLowerCase().includes(logSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        className="bg-[#161d1b] border border-[#3c4a46] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#3c4a46] flex items-center justify-between bg-[#1a211f]">
          <div className="flex items-center gap-2.5">
            {activeModal === 'deploy' && <ArrowUpCircle className="w-5 h-5 text-[#57f1db]" />}
            {activeModal === 'hardware' && <Cpu className="w-5 h-5 text-[#57f1db]" />}
            {activeModal === 'security' && <Shield className="w-5 h-5 text-[#57f1db]" />}
            {activeModal === 'logs' && <List className="w-5 h-5 text-[#57f1db]" />}
            {activeModal === 'support' && <HelpCircle className="w-5 h-5 text-[#57f1db]" />}
            {activeModal === 'docs' && <FileText className="w-5 h-5 text-[#57f1db]" />}
            {activeModal === 'audio' && <Volume2 className="w-5 h-5 text-[#57f1db]" />}

            <h3 className="font-semibold text-lg text-[#dde4e1]">
              {activeModal === 'deploy' && 'Deploy Edge Firmware & Neural Weights'}
              {activeModal === 'hardware' && 'Hardware & DSP Configuration'}
              {activeModal === 'security' && 'Edge Node Security Settings'}
              {activeModal === 'logs' && 'System Log Inspector'}
              {activeModal === 'support' && 'Technical Support & Edge Diagnostics'}
              {activeModal === 'docs' && 'EDGEWAKE Integration Documentation'}
              {activeModal === 'audio' && 'On-Device Audio Diagnostics'}
            </h3>
          </div>

          <button 
            onClick={onClose}
            className="text-[#bacac5] hover:text-[#dde4e1] p-1 rounded hover:bg-[#2f3634] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-[#dde4e1]">
          {/* DEPLOY MODAL */}
          {activeModal === 'deploy' && (
            <div className="space-y-4">
              {isDemo && (
                <DemoBanner message="OTA not connected to live device. Clicking 'Begin OTA Flashing Sequence' will simulate a flashed firmware update and tweak demo metrics only — no device is contacted." />
              )}
              <p className="text-xs text-[#bacac5]">
                Flash optimized keyword spotting (KWS) acoustic models and DSP firmware directly to connected node <strong className="text-[#57f1db]">EdgeWake-01</strong> over secure BLE / UART channel.
              </p>

              {deployStep === 'idle' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#bacac5]">
                      Select Neural Model Artifact
                    </label>
                    <select
                      value={selectedFirmware}
                      onChange={(e) => setSelectedFirmware(e.target.value)}
                      className="w-full bg-[#1a211f] border border-[#3c4a46] rounded-lg p-2.5 text-xs text-[#57f1db] font-mono"
                    >
                      <option value="v2.4.2-quant-int8">v2.4.2-quant-int8 (184 KB) — Production Default [97.5% Acc]</option>
                      <option value="v2.5.0-rc1-fast">v2.5.0-rc1-fast (162 KB) — Ultra Low-Latency (32ms inference)</option>
                      <option value="v2.3.0-high-snr">v2.3.0-high-snr (210 KB) — Maximum Noise Suppression</option>
                    </select>
                  </div>

                  <div className="bg-[#1a211f] p-3.5 rounded-lg border border-[#3c4a46] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#bacac5]">Target Memory:</span>
                      <span className="font-mono text-[#dde4e1]">184 KB / 256 KB SRAM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#bacac5]">Flash ROM Size:</span>
                      <span className="font-mono text-[#dde4e1]">1.2 MB Partition</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#bacac5]">Checksum (SHA-256):</span>
                      <span className="font-mono text-[#57f1db] text-[11px]">8f2a...c09e</span>
                    </div>
                  </div>

                  <button
                    onClick={startDeploy}
                    className="w-full bg-[#2dd4bf] text-[#003731] font-semibold py-2.5 rounded-lg hover:bg-[#57f1db] transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Begin OTA Flashing Sequence</span>
                  </button>
                </div>
              )}

              {(deployStep === 'flashing' || deployStep === 'verifying') && (
                <div className="py-8 flex flex-col items-center justify-center space-y-4">
                  <RotateCw className="w-10 h-10 text-[#57f1db] animate-spin" />
                  <div className="text-center">
                    <div className="font-semibold text-base text-[#dde4e1]">
                      {deployStep === 'flashing' ? 'Flashing OTA Firmware Image...' : 'Verifying Cryptographic Signatures...'}
                    </div>
                    <div className="text-xs text-[#bacac5] mt-1 font-mono">
                      Partition /dev/mtdblock0 @ 115200 baud
                    </div>
                  </div>

                  <div className="w-full max-w-md bg-[#2f3634] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#57f1db] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${deployProgress}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-[#57f1db]">{deployProgress}%</span>
                </div>
              )}

              {deployStep === 'done' && (
                <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#4edea3]/20 border-2 border-[#4edea3] flex items-center justify-center text-[#4edea3]">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base text-[#4edea3]">OTA Deployment Successful</h4>
                    <p className="text-xs text-[#bacac5] mt-1">
                      Node EdgeWake-01 re-initialized with model {selectedFirmware}.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="bg-[#2dd4bf] text-[#003731] font-semibold px-6 py-2 rounded-lg hover:bg-[#57f1db] transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}

          {/* HARDWARE CONFIG MODAL */}
          {activeModal === 'hardware' && (
            <form onSubmit={handleSaveHw} className="space-y-4">
              {isDemo && (
                <DemoBanner message="Static configuration preview. Changes here are NOT written to a live device — saving simulates an apply action only." />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-[#bacac5] uppercase">Target SoC Platform</label>
                  <input
                    type="text"
                    value={hwConfig.chipset}
                    readOnly
                    className="w-full bg-[#1a211f] border border-[#3c4a46] rounded p-2 text-[#dde4e1] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#bacac5] uppercase">DSP Processing Core</label>
                  <input
                    type="text"
                    value={hwConfig.dspCore}
                    readOnly
                    className="w-full bg-[#1a211f] border border-[#3c4a46] rounded p-2 text-[#dde4e1] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#bacac5] uppercase">Audio Frontend</label>
                  <input
                    type="text"
                    value={hwConfig.audioFrontend}
                    readOnly
                    className="w-full bg-[#1a211f] border border-[#3c4a46] rounded p-2 text-[#dde4e1] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#bacac5] uppercase">Audio Sample Rate</label>
                  <select
                    value={hwConfig.sampleRateHz}
                    onChange={(e) => setHwConfig({ ...hwConfig, sampleRateHz: Number(e.target.value) })}
                    className="w-full bg-[#1a211f] border border-[#3c4a46] rounded p-2 text-[#57f1db] font-mono"
                  >
                    <option value={16000}>16,000 Hz (Optimal KWS)</option>
                    <option value={8000}>8,000 Hz (Ultra Low Power)</option>
                    <option value={44100}>44,100 Hz (Wideband Studio)</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-baseline justify-between">
                    <label className="font-bold text-[#bacac5] uppercase">VAD Sensitivity Threshold</label>
                    <span className="text-[10px] text-[#859490] italic">
                      Illustrative only — not currently applied to device firmware.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={hwConfig.vadSensitivity}
                      onChange={(e) => setHwConfig({ ...hwConfig, vadSensitivity: Number(e.target.value) })}
                      className="flex-1 accent-[#57f1db]"
                    />
                    <span className="font-mono text-[#57f1db] w-8">{hwConfig.vadSensitivity}%</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#3c4a46] flex items-start justify-between gap-3">
                <label className="flex items-start gap-2 cursor-pointer text-xs items-center">
                  <input
                    type="checkbox"
                    checked={hwConfig.beamforming}
                    onChange={(e) => setHwConfig({ ...hwConfig, beamforming: e.target.checked })}
                    className="accent-[#57f1db] rounded"
                  />
                  <div className="flex flex-col">
                    <span>Enable Dual-Mic Acoustic Beamforming &amp; Noise Suppression</span>
                    <span className="text-[10px] text-[#859490] italic">
                      Reserved — BOM currently uses a single INMP441 mic; beamforming requires a second mic channel on the hardware.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#2f3634] text-[#dde4e1] rounded-lg hover:bg-[#3c4a46] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2dd4bf] text-[#003731] font-semibold rounded-lg hover:bg-[#57f1db] cursor-pointer flex items-center gap-1.5"
                >
                  {hwSaved ? <Check className="w-4 h-4" /> : null}
                  <span>{hwSaved ? 'Saved & Synced' : 'Apply Configuration'}</span>
                </button>
              </div>
            </form>
          )}

          {/* SECURITY SETTINGS MODAL */}
          {activeModal === 'security' && (
            <form onSubmit={handleSaveSec} className="space-y-4">
              <div className="space-y-3 text-xs">
                <label className="flex items-start gap-3 p-3 bg-[#1a211f] rounded-lg border border-[#3c4a46] cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={secSettings.tlsPinning} 
                    onChange={(e) => setSecSettings({ ...secSettings, tlsPinning: e.target.checked })}
                    className="accent-[#57f1db] mt-0.5 rounded"
                  />
                  <div>
                    <div className="font-semibold text-[#dde4e1]">Mutual TLS Certificate Pinning (mTLS)</div>
                    <div className="text-[#bacac5] text-[11px] mt-0.5">Enforce hardware ECC-256 client certificate validation on every uplink connection.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-[#1a211f] rounded-lg border border-[#3c4a46] cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={secSettings.ephemeralAudioBuffer} 
                    onChange={(e) => setSecSettings({ ...secSettings, ephemeralAudioBuffer: e.target.checked })}
                    className="accent-[#57f1db] mt-0.5 rounded"
                  />
                  <div>
                    <div className="font-semibold text-[#dde4e1]">Zero-Retention Ephemeral Ring Buffer</div>
                    <div className="text-[#bacac5] text-[11px] mt-0.5">Audio frames older than 1.5 seconds are overwritten immediately in SRAM without persistent flash storage.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-[#1a211f] rounded-lg border border-[#3c4a46] cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={secSettings.onDeviceVoiceprintHashing} 
                    onChange={(e) => setSecSettings({ ...secSettings, onDeviceVoiceprintHashing: e.target.checked })}
                    className="accent-[#57f1db] mt-0.5 rounded"
                  />
                  <div>
                    <div className="font-semibold text-[#dde4e1]">On-Device Biometric Hash Matching</div>
                    <div className="text-[#bacac5] text-[11px] mt-0.5">Only activate wake word triggers matching the local authorized speaker embeddings.</div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#2f3634] text-[#dde4e1] rounded-lg hover:bg-[#3c4a46] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2dd4bf] text-[#003731] font-semibold rounded-lg hover:bg-[#57f1db] cursor-pointer flex items-center gap-1.5"
                >
                  {secSaved ? <Check className="w-4 h-4" /> : null}
                  <span>{secSaved ? 'Applied' : 'Save Security Policy'}</span>
                </button>
              </div>
            </form>
          )}

          {/* LOGS MODAL */}
          {activeModal === 'logs' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  {(['ALL', 'SYS', 'KWS', 'ASR'] as const).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setLogFilter(tag)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                        logFilter === tag 
                          ? 'bg-[#57f1db] text-[#003731]' 
                          : 'bg-[#1a211f] text-[#bacac5] hover:text-[#dde4e1] border border-[#3c4a46]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <input 
                  type="text"
                  placeholder="Filter logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="bg-[#1a211f] border border-[#3c4a46] rounded px-3 py-1 text-xs text-[#dde4e1] font-mono focus:border-[#57f1db] outline-hidden"
                />
              </div>

              <div className="bg-[#050807] border border-[#3c4a46] rounded-lg p-3 font-mono text-xs h-72 overflow-y-auto space-y-1">
                {filteredLogs.length === 0 ? (
                  <div className="text-[#859490] italic py-8 text-center">No logs match the current criteria.</div>
                ) : (
                  filteredLogs.map((l) => (
                    <div key={l.id} className="flex gap-2">
                      <span className="text-[#859490] shrink-0">{l.time}</span>
                      <span className="text-[#57f1db] shrink-0 font-semibold">[{l.tag}]</span>
                      <span className="text-[#dde4e1] break-all">{l.message}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-[#bacac5]">Total Entries: {filteredLogs.length}</span>
                <button
                  onClick={onClearLogs}
                  className="text-[#ffb4ab] hover:underline cursor-pointer"
                >
                  Clear Buffer
                </button>
              </div>
            </div>
          )}

          {/* AUDIO DIAGNOSTICS MODAL */}
          {activeModal === 'audio' && (
            <div className="space-y-4">
              <p className="text-xs text-[#bacac5]">
                Configure on-device microphone acquisition properties, sampling rate, and live audio level monitoring.
              </p>

              <div className="bg-[#1a211f] p-4 rounded-lg border border-[#3c4a46] space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#bacac5]">Audio Ingest:</span>
                  <span className="font-mono text-[#57f1db]">I2S Direct DMA Buffer</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#bacac5]">Channel Configuration:</span>
                  <span className="font-mono text-[#dde4e1]">Stereo Differential (Ch 0 + Ch 1)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#bacac5]">Dynamic Noise Floor:</span>
                  <span className="font-mono text-[#4edea3]">-68.4 dBFS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#bacac5]">PCM Chunk Window:</span>
                  <span className="font-mono text-[#dde4e1]">20ms / 320 Samples</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-[#2dd4bf] text-[#003731] font-semibold py-2 rounded-lg hover:bg-[#57f1db] cursor-pointer"
              >
                Close Diagnostics
              </button>
            </div>
          )}

          {/* SUPPORT & DOCS MODALS */}
          {(activeModal === 'support' || activeModal === 'docs') && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="bg-[#1a211f] p-4 rounded-lg border border-[#3c4a46] space-y-2">
                <h4 className="font-semibold text-sm text-[#57f1db]">
                  {activeModal === 'support' ? 'EDGEWAKE Field Diagnostics & SLA' : 'Architecture & API Reference'}
                </h4>
                <p className="text-[#bacac5]">
                  EDGEWAKE provides sub-50ms wake word recognition on resource-constrained microcontrollers (&lt;256KB RAM).
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[#dde4e1] mt-2">
                  <li>Pipeline Latency: ~42ms acoustic inference + 120ms network handoff</li>
                  <li>True positive threshold: 97.5% at SNR &gt; 10dB</li>
                  <li>Supported Wake Words: "Hi Edge", "Hey Edge", "Nova"</li>
                  <li>OTA Channel: AES-GCM Encrypted WebSocket & Bluetooth Low Energy</li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={onClose}
                  className="bg-[#2dd4bf] text-[#003731] font-semibold px-4 py-2 rounded-lg hover:bg-[#57f1db] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
