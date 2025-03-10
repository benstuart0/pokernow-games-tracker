import { Game } from '../types';

interface GamesListProps {
  games: Game[];
  setGames: (games: Game[]) => void;
  isResults: boolean;
  onUpdateGames?: () => void;
  onRemoveGame?: (gameUrl: string) => void;
  onToggleCents?: (gameUrl: string, isInCents: boolean) => void;
}

export default function GamesList({
  games,
  setGames,
  isResults,
  onUpdateGames,
  onRemoveGame,
  onToggleCents,
}: GamesListProps) {
  const handleRemoveGame = (index: number) => {
    const gameUrl = games[index].url;
    const newGames = games.filter((_, i) => i !== index);
    setGames(newGames);
    if (isResults && onUpdateGames) {
      onUpdateGames();
    }
    if (onRemoveGame) {
      onRemoveGame(gameUrl);
    }
  };

  const handleToggleCents = (index: number) => {
    const game = games[index];
    const newGames = games.map((g, i) =>
      i === index ? { ...g, isInCents: !g.isInCents } : g
    );
    setGames(newGames);
    if (isResults && onUpdateGames) {
      onUpdateGames();
    }
    if (onToggleCents) {
      onToggleCents(game.url, !game.isInCents);
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