import { Game } from '../types';

interface GamesListProps {
  games: Game[];
  setGames: (games: Game[]) => void;
  isResults: boolean;
  onUpdateGames?: () => void;
}

export default function GamesList({
  games,
  setGames,
  isResults,
  onUpdateGames,
}: GamesListProps) {
  const handleRemoveGame = (index: number) => {
    const newGames = games.filter((_, i) => i !== index);
    setGames(newGames);
    if (isResults && onUpdateGames) {
      onUpdateGames();
    }
  };

  const handleToggleCents = (index: number) => {
    const newGames = games.map((game, i) =>
      i === index ? { ...game, isInCents: !game.isInCents } : game
    );
    setGames(newGames);
    if (isResults && onUpdateGames) {
      onUpdateGames();
    }
  };

  return (
    <ul className={`games-list ${isResults ? 'games-list-compact' : ''}`}>
      {games.map((game, index) => (
        <li key={game.url} className="game-item">
          <div className="game-link">{game.url}</div>
          
          <div className="cents-toggle">
            <label className="cents-label">
              <input
                type="checkbox"
                className="cents-checkbox"
                checked={game.isInCents}
                onChange={() => handleToggleCents(index)}
              />
              Uses cents
            </label>
          </div>
          
          <button
            className="remove"
            onClick={() => handleRemoveGame(index)}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
} 