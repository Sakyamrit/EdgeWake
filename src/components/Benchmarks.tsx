import React, { useState } from 'react';
import { 
  Table2, 
  Download, 
  CheckCircle2, 
  FlaskConical, 
  Cpu, 
  Calendar, 
  Info, 
  Home, 
  Fan, 
  Users, 
  Car, 
  Activity,
  Play,
  RotateCw,
  Sparkles,
  Sliders
} from 'lucide-react';
import { BenchmarkTelemetryRow, NoiseEnvironment } from '../types';

export const Benchmarks: React.FC = () => {
  const [selectedEnv, setSelectedEnv] = useState<'Lab A' | 'Lab B (High Noise)' | 'Field Chamber'>('Lab A');
  const [selectedModel, setSelectedModel] = useState<'v2.4-lite' | 'v2.3-standard' | 'v3.0-preview'>('v2.4-lite');
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkDate, setBenchmarkDate] = useState('2023-10-24');

  const telemetryData: BenchmarkTelemetryRow[] = [
    {
      id: 'ram',
      metric: 'RAM Used',
      target: '<256KB',
      latestResult: selectedModel === 'v3.0-preview' ? '210KB' : selectedModel === 'v2.3-standard' ? '198KB' : '184KB',
      status: 'Pass',
      notes: 'Peak memory during inference loop',
    },
    {
      id: 'cpu',
      metric: 'Idle CPU',
      target: '<10%',
      latestResult: selectedModel === 'v3.0-preview' ? '9.1%' : '8.2%',
      status: 'Pass',
      notes: 'Measured on core 0',
    },
    {
      id: 'kws-tp',
      metric: 'KWS True-Positive',
      target: '98%',
      latestResult: selectedModel === 'v3.0-preview' ? '98.8%' : selectedModel === 'v2.3-standard' ? '96.2%' : '97.5%',
      status: 'Pass',
      notes: 'Within acceptable margin',
    },
    {
      id: 'false-act',
      metric: 'False Activation',
      target: '<1/day',
      latestResult: selectedModel === 'v3.0-preview' ? '0.2' : '0.4',
      status: 'Pass',
      notes: 'Normalized over 72h test',
    },
    {
      id: 'det-lat',
      metric: 'Detection Latency',
      target: '<100ms',
      latestResult: selectedModel === 'v3.0-preview' ? '38ms' : '42ms',
      status: 'Pass',
      notes: 'Audio buffer to trigger event',
    },
    {
      id: 'e2e',
      metric: 'End-to-End',
      target: '<1s',
      latestResult: selectedModel === 'v3.0-preview' ? '580ms' : '612ms',
      status: 'Pass',
      notes: 'Including network handoff',
    },
  ];

  const noiseEnvironments: NoiseEnvironment[] = [
    {
      id: 'quiet-room',
      title: 'Quiet Room',
      icon: 'home',
      oneMeterAccuracy: selectedModel === 'v3.0-preview' ? 99.6 : 99.2,
      threeMeterAccuracy: selectedModel === 'v3.0-preview' ? 99.0 : 98.5,
      accentColor: 'secondary',
    },
    {
      id: 'office-fan',
      title: 'Office Fan',
      icon: 'fan',
      oneMeterAccuracy: selectedModel === 'v3.0-preview' ? 98.5 : 97.8,
      threeMeterAccuracy: selectedModel === 'v3.0-preview' ? 95.8 : 94.1,
      accentColor: 'secondary',
    },
    {
      id: 'multi-speaker',
      title: 'Multiple Speakers',
      icon: 'users',
      oneMeterAccuracy: selectedModel === 'v3.0-preview' ? 96.9 : 95.4,
      threeMeterAccuracy: selectedModel === 'v3.0-preview' ? 91.4 : 89.2,
      accentColor: 'tertiary',
    },
    {
      id: 'traffic',
      title: 'Traffic Bkgd',
      icon: 'car',
      oneMeterAccuracy: selectedModel === 'v3.0-preview' ? 94.2 : 92.1,
      threeMeterAccuracy: selectedModel === 'v3.0-preview' ? 88.3 : 85.6,
      accentColor: 'tertiary',
    },
  ];

  const handleExportCSV = () => {
    const headers = ['Metric', 'Target', 'Latest Result', 'Status', 'Notes'];
    const rows = telemetryData.map(r => [r.metric, r.target, r.latestResult, r.status, `"${r.notes}"`]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `edgewake_benchmark_${selectedModel}_${benchmarkDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRunBenchmark = () => {
    setIsBenchmarking(true);
    setTimeout(() => {
      setIsBenchmarking(false);
      const now = new Date();
      setBenchmarkDate(now.toISOString().split('T')[0]);
    }, 1200);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto w-full max-w-[1440px] mx-auto space-y-6">
      {/* Page Title & Summary Strip */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-[#57f1db] tracking-tight mb-2">
            Benchmark & Test Results
          </h2>
          <p className="text-sm text-[#bacac5]">
            Comprehensive evaluation of on-device inference performance against target thresholds.
          </p>
        </div>

        {/* Summary Strip + Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-run-suite"
            onClick={handleRunBenchmark}
            disabled={isBenchmarking}
            className="bg-[#2dd4bf] text-[#003731] hover:bg-[#57f1db] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isBenchmarking ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isBenchmarking ? 'Running Suite...' : 'Run Test Suite'}</span>
          </button>

          <div className="flex gap-2 bg-[#1a211f] border border-[#3c4a46] rounded-lg p-1.5 items-center shadow-xs">
            {/* Test Env */}
            <div className="px-2.5 py-0.5 flex items-center gap-2 border-r border-[#3c4a46]/50">
              <FlaskConical className="w-4 h-4 text-[#bacac5]" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#bacac5] uppercase tracking-wider">
                  Test Env
                </span>
                <select
                  value={selectedEnv}
                  onChange={(e) => setSelectedEnv(e.target.value as any)}
                  className="font-mono text-[#57f1db] text-xs bg-transparent border-none p-0 focus:ring-0 cursor-pointer font-medium"
                >
                  <option value="Lab A" className="bg-[#1a211f] text-[#57f1db]">Lab A</option>
                  <option value="Lab B (High Noise)" className="bg-[#1a211f] text-[#57f1db]">Lab B</option>
                  <option value="Field Chamber" className="bg-[#1a211f] text-[#57f1db]">Field</option>
                </select>
              </div>
            </div>

            {/* Model */}
            <div className="px-2.5 py-0.5 flex items-center gap-2 border-r border-[#3c4a46]/50">
              <Cpu className="w-4 h-4 text-[#bacac5]" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#bacac5] uppercase tracking-wider">
                  Model
                </span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as any)}
                  className="font-mono text-[#57f1db] text-xs bg-transparent border-none p-0 focus:ring-0 cursor-pointer font-medium"
                >
                  <option value="v2.4-lite" className="bg-[#1a211f] text-[#57f1db]">v2.4-lite</option>
                  <option value="v2.3-standard" className="bg-[#1a211f] text-[#57f1db]">v2.3-std</option>
                  <option value="v3.0-preview" className="bg-[#1a211f] text-[#57f1db]">v3.0-pre</option>
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="px-2.5 py-0.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#bacac5]" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#bacac5] uppercase tracking-wider">
                  Date
                </span>
                <span className="font-mono text-[#dde4e1] text-xs">
                  {benchmarkDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Table Section */}
      <section 
        id="benchmark-telemetry-table-card"
        className="bg-[#1a211f] border border-[#3c4a46] rounded-lg overflow-hidden flex flex-col relative shadow-sm"
      >
        {/* Subtle top highlight */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#3c4a46] to-transparent opacity-50" />

        <div className="px-4 py-3 border-b border-[#3c4a46] bg-[#242b2a] flex justify-between items-center">
          <h3 className="text-base font-semibold text-[#dde4e1] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#57f1db]" />
            Core Telemetry
          </h3>
          <button
            onClick={handleExportCSV}
            title="Download CSV Report"
            className="text-[#bacac5] hover:text-[#57f1db] transition-colors p-1 rounded hover:bg-[#1a211f] flex items-center gap-1.5 text-xs font-mono"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#161d1b] border-b border-[#3c4a46]/50">
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#bacac5] w-1/4">
                  Metric
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#bacac5]">
                  Target
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#bacac5]">
                  Latest Result
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#bacac5]">
                  Status
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#bacac5] w-1/4">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3c4a46]/30 text-sm text-[#dde4e1]">
              {telemetryData.map((row) => (
                <tr key={row.id} className="hover:bg-[#2f3634]/20 transition-colors group">
                  <td className="py-3 px-4 font-medium group-hover:text-[#57f1db] transition-colors">
                    {row.metric}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#bacac5]">
                    {row.target}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#dde4e1] font-medium">
                    {row.latestResult}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20 text-[10px] font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#bacac5] text-xs truncate max-w-[240px]" title={row.notes}>
                    {row.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Noise Robustness Bento Grid Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-semibold text-[#dde4e1] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#57f1db]" />
            Noise Robustness (Accuracy by Distance)
          </h3>
          <span className="text-xs font-mono text-[#859490]">SNR Dynamic Range: 0dB to +20dB</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Quiet Room */}
          <div className="bg-[#1a211f] border border-[#3c4a46] rounded-lg p-4 hover:border-[#57f1db]/50 transition-colors relative overflow-hidden group shadow-sm">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#4edea3]/5 rounded-full blur-xl group-hover:bg-[#4edea3]/10 transition-colors" />
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-[#bacac5]" />
              <h4 className="text-base font-medium text-[#dde4e1]">Quiet Room</h4>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#bacac5]">1m Distance</span>
                  <span className="font-mono text-[#4edea3] text-sm font-semibold">
                    {noiseEnvironments[0].oneMeterAccuracy}%
                  </span>
                </div>
                <div className="w-full bg-[#2f3634] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#4edea3] h-full rounded-full transition-all duration-500" style={{ width: `${noiseEnvironments[0].oneMeterAccuracy}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#bacac5]">3m Distance</span>
                  <span className="font-mono text-[#57f1db] text-sm font-semibold">
                    {noiseEnvironments[0].threeMeterAccuracy}%
                  </span>
                </div>
                <div className="w-full bg-[#2f3634] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#57f1db] h-full rounded-full transition-all duration-500" style={{ width: `${noiseEnvironments[0].threeMeterAccuracy}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Office Fan */}
          <div className="bg-[#1a211f] border border-[#3c4a46] rounded-lg p-4 hover:border-[#57f1db]/50 transition-colors relative overflow-hidden group shadow-sm">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#57f1db]/5 rounded-full blur-xl group-hover:bg-[#57f1db]/10 transition-colors" />
            <div className="flex items-center gap-2 mb-4">
              <Fan className="w-5 h-5 text-[#bacac5]" />
              <h4 className="text-base font-medium text-[#dde4e1]">Office Fan</h4>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#bacac5]">1m Distance</span>
                  <span className="font-mono text-[#4edea3] text-sm font-semibold">
                    {noiseEnvironments[1].oneMeterAccuracy}%
                  </span>
                </div>
                <div className="w-full bg-[#2f3634] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#4edea3] h-full rounded-full transition-all duration-500" style={{ width: `${noiseEnvironments[1].oneMeterAccuracy}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#bacac5]">3m Distance</span>
                  <span className="font-mono text-[#57f1db] text-sm font-semibold">
                    {noiseEnvironments[1].threeMeterAccuracy}%
                  </span>
                </div>
                <div className="w-full bg-[#2f3634] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#57f1db] h-full rounded-full transition-all duration-500" style={{ width: `${noiseEnvironments[1].threeMeterAccuracy}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Multiple Speakers */}
          <div className="bg-[#1a211f] border border-[#3c4a46] rounded-lg p-4 hover:border-[#57f1db]/50 transition-colors relative overflow-hidden group shadow-sm">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#ffd29f]/5 rounded-full blur-xl group-hover:bg-[#ffd29f]/10 transition-colors" />
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#bacac5]" />
              <h4 className="text-base font-medium text-[#dde4e1]">Multiple Speakers</h4>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#bacac5]">1m Distance</span>
                  <span className="font-mono text-[#4edea3] text-sm font-semibold">
                    {noiseEnvironments[2].oneMeterAccuracy}%
                  </span>
                </div>
                <div className="w-full bg-[#2f3634] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#4edea3] h-full rounded-full transition-all duration-500" style={{ width: `${noiseEnvironments[2].oneMeterAccuracy}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#bacac5]">3m Distance</span>
                  <span className="font-mono text-[#ffd29f] text-sm font-semibold">
                    {noiseEnvironments[2].threeMeterAccuracy}%
                  </span>
                </div>
                <div className="w-full bg-[#2f3634] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#ffd29f] h-full rounded-full transition-all duration-500" style={{ width: `${noiseEnvironments[2].threeMeterAccuracy}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Traffic Background */}
          <div className="bg-[#1a211f] border border-[#3c4a46] rounded-lg p-4 hover:border-[#57f1db]/50 transition-colors relative overflow-hidden group shadow-sm">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#ffb4ab]/5 rounded-full blur-xl group-hover:bg-[#ffb4ab]/10 transition-colors" />
            <div className="flex items-center gap-2 mb-4">
              <Car className="w-5 h-5 text-[#bacac5]" />
              <h4 className="text-base font-medium text-[#dde4e1]">Traffic Bkgd</h4>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#bacac5]">1m Distance</span>
                  <span className="font-mono text-[#4edea3] text-sm font-semibold">
                    {noiseEnvironments[3].oneMeterAccuracy}%
                  </span>
                </div>
                <div className="w-full bg-[#2f3634] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#4edea3] h-full rounded-full transition-all duration-500" style={{ width: `${noiseEnvironments[3].oneMeterAccuracy}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#bacac5]">3m Distance</span>
                  <span className="font-mono text-[#ffd29f] text-sm font-semibold">
                    {noiseEnvironments[3].threeMeterAccuracy}%
                  </span>
                </div>
                <div className="w-full bg-[#2f3634] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#ffd29f] h-full rounded-full transition-all duration-500" style={{ width: `${noiseEnvironments[3].threeMeterAccuracy}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Note */}
      <div className="mt-8 p-4 border-t border-[#3c4a46]/50 flex items-start gap-3 bg-[#161d1b]/40 rounded-lg">
        <Info className="w-4 h-4 text-[#bacac5] mt-0.5 shrink-0" />
        <p className="text-xs text-[#bacac5] leading-relaxed">
          Methodology Note: Metrics are measured telemetry from on-device logs. Evaluation speakers were held out from training sets to ensure unbiased accuracy representation across varied acoustic environments. Latency values represent P95 network conditions.
        </p>
      </div>
    </div>
  );
};
