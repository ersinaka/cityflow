import { useGameStore } from '../store/gameStore';
import type { TutorialStep } from '../types';

const STEPS: { id: TutorialStep; title: string; body: string }[] = [
  {
    id: 'place_warehouse',
    title: '1. Place a warehouse',
    body: 'Select the Warehouse tool and click a neighborhood to build nearby.',
  },
  {
    id: 'connect_route',
    title: '2. Connect a route',
    body: 'Use the Route tool: click your warehouse, then a demand location.',
  },
  {
    id: 'assign_vehicle',
    title: '3. Assign a vehicle',
    body: 'Select the Vehicle tool and click your warehouse.',
  },
  {
    id: 'start_sim',
    title: '4. Start the simulation',
    body: 'Press Play in the top bar to begin daily logistics.',
  },
  {
    id: 'first_delivery',
    title: '5. Complete a delivery',
    body: 'Watch vehicles move along routes and fulfill orders.',
  },
];

export function Tutorial() {
  const active = useGameStore((s) => s.tutorialActive);
  const step = useGameStore((s) => s.tutorialStep);
  const skipTutorial = useGameStore((s) => s.skipTutorial);

  if (!active || step === 'done') return null;

  const idx = STEPS.findIndex((s) => s.id === step);
  const current = STEPS[Math.max(0, idx)];

  return (
    <div className="tutorial">
      <div className="tutorial-progress">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className={`dot ${i <= idx ? 'on' : ''} ${s.id === step ? 'current' : ''}`}
          />
        ))}
      </div>
      <h3>{current.title}</h3>
      <p>{current.body}</p>
      <button type="button" className="tutorial-skip" onClick={skipTutorial}>
        Skip tutorial
      </button>
    </div>
  );
}
