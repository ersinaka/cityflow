import { useGameStore } from '../store/gameStore';
import { formatMoney } from '../game/economy';

export function GameOver() {
  const gameOver = useGameStore((s) => s.gameOver);
  const reason = useGameStore((s) => s.gameOverReason);
  const lifetime = useGameStore((s) => s.lifetime);
  const day = useGameStore((s) => s.day);
  const restart = useGameStore((s) => s.restart);

  if (!gameOver) return null;

  return (
    <div className="overlay">
      <div className="overlay-card game-over-card">
        <p className="overlay-kicker">Network collapsed</p>
        <h1>Game Over</h1>
        <p className="overlay-reason">{reason}</p>
        <dl className="end-stats">
          <div>
            <dt>Days survived</dt>
            <dd>{day}</dd>
          </div>
          <div>
            <dt>Deliveries completed</dt>
            <dd>{lifetime.totalDeliveries}</dd>
          </div>
          <div>
            <dt>Failed deliveries</dt>
            <dd>{lifetime.totalFailed}</dd>
          </div>
          <div>
            <dt>Total revenue</dt>
            <dd>{formatMoney(lifetime.totalRevenue)}</dd>
          </div>
          <div>
            <dt>Best success rate</dt>
            <dd>{Math.round(lifetime.bestSuccessRate * 100)}%</dd>
          </div>
        </dl>
        <button type="button" className="primary-btn" onClick={restart}>
          Restart city
        </button>
      </div>
    </div>
  );
}
