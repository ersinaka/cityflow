import { useGameStore } from '../store/gameStore';
import { formatMoney } from '../game/economy';
import type { GameSpeed } from '../types';

export function TopBar() {
  const day = useGameStore((s) => s.day);
  const money = useGameStore((s) => s.money);
  const dailyRevenue = useGameStore((s) => s.dailyRevenue);
  const dailyCosts = useGameStore((s) => s.dailyCosts);
  const successRate = useGameStore((s) => s.successRate);
  const paused = useGameStore((s) => s.paused);
  const speed = useGameStore((s) => s.speed);
  const togglePause = useGameStore((s) => s.togglePause);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const saveGame = useGameStore((s) => s.saveGame);

  const speeds: GameSpeed[] = [1, 2, 3];

  return (
    <header className="top-bar">
      <div className="brand">
        <span className="brand-mark" />
        <span className="brand-name">CITYFLOW</span>
      </div>

      <div className="stat-group">
        <div className="stat">
          <span className="stat-label">Day</span>
          <span className="stat-value">{day}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Balance</span>
          <span className={`stat-value ${money < 0 ? 'neg' : ''}`}>{formatMoney(money)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Revenue</span>
          <span className="stat-value pos">+{formatMoney(dailyRevenue)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Costs</span>
          <span className="stat-value">{formatMoney(dailyCosts)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Success</span>
          <span className="stat-value">{Math.round(successRate * 100)}%</span>
        </div>
      </div>

      <div className="controls">
        <button
          type="button"
          className={`ctrl-btn ${paused ? '' : 'active'}`}
          onClick={togglePause}
          aria-label={paused ? 'Play' : 'Pause'}
        >
          {paused ? '▶' : '❚❚'}
        </button>
        {speeds.map((sp) => (
          <button
            key={sp}
            type="button"
            className={`ctrl-btn ${!paused && speed === sp ? 'active' : ''}`}
            onClick={() => setSpeed(sp)}
          >
            {sp}×
          </button>
        ))}
        <button type="button" className="ctrl-btn" onClick={saveGame}>
          Save
        </button>
      </div>
    </header>
  );
}
