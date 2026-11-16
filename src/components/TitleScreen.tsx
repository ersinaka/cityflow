import { useGameStore } from '../store/gameStore';

export function TitleScreen() {
  const started = useGameStore((s) => s.started);
  const startGame = useGameStore((s) => s.startGame);
  const loadGame = useGameStore((s) => s.loadGame);
  const hasSave = useGameStore((s) => s.hasSave);

  if (started) return null;

  return (
    <div className="overlay title-overlay">
      <div className="title-card">
        <div className="title-visual" aria-hidden>
          <svg viewBox="0 0 320 160" className="title-svg">
            <path d="M140 10 C150 40,135 70,148 100 C158 125,140 145,150 160 L175 160 C165 145,185 125,172 100 C160 70,175 40,165 10 Z" fill="#b9d7ea" opacity="0.9" />
            <path d="M0 130 C60 120,120 140,160 135 C200 130,260 145,320 138 L320 160 L0 160 Z" fill="#9ec5db" opacity="0.75" />
            <circle cx="70" cy="85" r="16" fill="#7EB8A8" />
            <circle cx="120" cy="55" r="18" fill="#5B8DEF" />
            <circle cx="230" cy="90" r="15" fill="#E8A87C" />
            <line x1="85" y1="80" x2="108" y2="62" stroke="#95a5a6" strokeWidth="2" />
            <line x1="138" y1="60" x2="218" y2="85" stroke="#95a5a6" strokeWidth="2" />
            <rect x="112" y="48" width="12" height="9" rx="3" fill="#334155">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 90 30; 0 0"
                dur="4s"
                repeatCount="indefinite"
              />
            </rect>
          </svg>
        </div>
        <h1 className="title-brand">CITYFLOW</h1>
        <p className="title-tagline">
          İstanbul semtlerine ambari kur, rotalar çiz, şehri tedarik et.
        </p>
        <div className="title-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={() => startGame(true)}
          >
            New game
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => startGame(false)}
          >
            Skip tutorial
          </button>
          {hasSave() && (
            <button
              type="button"
              className="secondary-btn"
              onClick={() => loadGame()}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
