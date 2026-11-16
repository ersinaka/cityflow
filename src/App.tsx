import { TopBar } from './components/TopBar';
import { LeftToolbar } from './components/LeftToolbar';
import { CityMap } from './components/CityMap';
import { RightPanel } from './components/RightPanel';
import { BottomPanel } from './components/BottomPanel';
import { Tutorial } from './components/Tutorial';
import { GameOver } from './components/GameOver';
import { TitleScreen } from './components/TitleScreen';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameStore } from './store/gameStore';
import './styles/game.css';

function GameShell() {
  useGameLoop();
  const started = useGameStore((s) => s.started);

  if (!started) return <TitleScreen />;

  return (
    <div className="game-shell">
      <TopBar />
      <div className="game-body">
        <LeftToolbar />
        <main className="map-area">
          <CityMap />
          <Tutorial />
        </main>
        <RightPanel />
      </div>
      <BottomPanel />
      <GameOver />
    </div>
  );
}

export default function App() {
  return <GameShell />;
}
