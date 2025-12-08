
import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  inputVolume: number; // 0-255 approx
  outputVolume: number; // 0-255 approx
  isActive: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ inputVolume, outputVolume, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  // Refs to hold latest props without triggering re-renders of the animation loop
  const inputVolRef = useRef(inputVolume);
  const outputVolRef = useRef(outputVolume);
  const isActiveRef = useRef(isActive);

  // Update refs when props change
  useEffect(() => {
    inputVolRef.current = inputVolume;
    outputVolRef.current = outputVolume;
    isActiveRef.current = isActive;
  }, [inputVolume, outputVolume, isActive]);
  
  // Smooth out values
  const smoothedInput = useRef<number>(0);
  const smoothedOutput = useRef<number>(0);
  
  // Visual state interpolation
  const currentR = useRef<number>(168); // Start with stone-400
  const currentG = useRef<number>(162);
  const currentB = useRef<number>(158);
  const currentRadius = useRef<number>(100);
  const activeRatio = useRef<number>(0); // 0 = idle, 1 = active

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing logic for high-DPI displays while maintaining aspect
    const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            const { width, height } = entry.contentRect;
            canvas.width = width;
            canvas.height = height;
        }
    });
    resizeObserver.observe(canvas);

    let time = 0;

    const animate = () => {
      // Use refs for current values
      const volIn = inputVolRef.current;
      const volOut = outputVolRef.current;
      const active = isActiveRef.current;

      // 1. Smooth Volume Inputs
      smoothedInput.current += (volIn - smoothedInput.current) * 0.1;
      smoothedOutput.current += (volOut - smoothedOutput.current) * 0.1;

      // 2. Determine State & Target Colors
      const isSpeaking = smoothedOutput.current > 10;
      const isListening = smoothedInput.current > 10;

      let targetR = 168, targetG = 162, targetB = 158; // Default: Stone-400
      
      if (isSpeaking) {
          targetR = 251; targetG = 146; targetB = 60;
      } else if (isListening) {
          targetR = 45; targetG = 212; targetB = 191;
      }

      currentR.current += (targetR - currentR.current) * 0.05;
      currentG.current += (targetG - currentG.current) * 0.05;
      currentB.current += (targetB - currentB.current) * 0.05;

      const targetActive = active ? 1 : 0;
      activeRatio.current += (targetActive - activeRatio.current) * 0.05;

      time += 0.05;
      // Responsive base radius based on canvas size
      const minDim = Math.min(canvas.width, canvas.height);
      const baseRadius = minDim * 0.2; // 20% of smallest dimension
      
      let pulse = 0;
      if (isSpeaking) {
         pulse = (smoothedOutput.current / 255) * (minDim * 0.1) * Math.sin(time * 2);
      } else if (isListening) {
         pulse = (smoothedInput.current / 255) * (minDim * 0.08) * Math.sin(time * 3);
      } else {
         pulse = Math.sin(time) * (minDim * 0.02);
      }

      const targetRadius = baseRadius + pulse + (active ? minDim * 0.05 : 0);
      currentRadius.current += (targetRadius - currentRadius.current) * 0.1;

      // CLEAR & DRAW
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const r = Math.round(currentR.current);
      const g = Math.round(currentG.current);
      const b = Math.round(currentB.current);
      const radius = Math.max(0, currentRadius.current);

      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
      gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.4)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      if (activeRatio.current > 0.01) {
        const ringOpacity = activeRatio.current * 0.2;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${ringOpacity})`;
        ctx.lineWidth = 2;
        
        const ringRadius1 = radius + (minDim * 0.05) + Math.sin(time * 1.5) * 10;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius1, 0, Math.PI * 2);
        ctx.stroke();

        const ringRadius2 = radius + (minDim * 0.1) + Math.cos(time * 1.2) * 10;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius2, 0, Math.PI * 2);
        ctx.stroke();
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full object-contain max-h-[50vh]"
    />
  );
};
