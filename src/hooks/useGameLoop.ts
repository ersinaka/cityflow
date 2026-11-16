import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export function useGameLoop() {
  const raf = useRef<number>(0);
  const last = useRef<number>(0);

  useEffect(() => {
    const loop = (t: number) => {
      if (!last.current) last.current = t;
      const dt = Math.min(100, t - last.current);
      last.current = t;
      useGameStore.getState().simulationTick(dt);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);
}
