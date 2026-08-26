import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  isTriggered: boolean;
  audioLevel?: number; // 0 to 1
  barsCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isActive,
  isTriggered,
  audioLevel = 0,
  barsCount = 24,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const barWidth = (width / barsCount) - 3;

      for (let i = 0; i < barsCount; i++) {
        let barHeight = 4;

        if (isActive) {
          // Dynamic wave based on audio level or harmonic oscillation
          const wave = Math.sin(phase + i * 0.45) * 0.5 + 0.5;
          const randomJitter = Math.random() * 0.3;
          const energy = Math.max(0.15, audioLevel > 0.05 ? audioLevel * 1.8 : wave * 0.4 + randomJitter);
          
          barHeight = Math.min(height * 0.85, energy * (height - 8));
        }

        const x = i * (barWidth + 3) + 2;
        const y = centerY - barHeight / 2;

        const isPeak = isTriggered;
        ctx.fillStyle = isPeak 
          ? '#4edea3' 
          : isActive 
            ? '#57f1db' 
            : '#3c4a46';

        // Rounded bar
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(2, barWidth), Math.max(3, barHeight), 2);
        ctx.fill();
      }

      phase += 0.08;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, isTriggered, audioLevel, barsCount]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={48}
      className="w-full h-12 rounded"
    />
  );
};
