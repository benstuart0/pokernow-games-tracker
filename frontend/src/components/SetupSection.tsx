import { useState } from 'react';
import { Game } from '../types';
import GamesList from './GamesList';
import AliasList from './AliasList';
import * as api from '../services/api';
import { trackStartTracking, trackError, trackGameAdded } from '../services/analytics';

interface SetupSectionProps {
  games: Game[];
  setGames: (games: Game[]) => void;
  aliases: string[];
  setAliases: (aliases: string[]) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  onStartTracking: () => void;
}

export default function SetupSection({
  games,
  setGames,
  aliases,
  setAliases,
  playerName,
  setPlayerName,
  onStartTracking,
}: SetupSectionProps) {
  const [gameUrl, setGameUrl] = useState('');
  const [playerAlias, setPlayerAlias] = useState('');
  const [gameUrlError, setGameUrlError] = useState('');
  const [playerNameError, setPlayerNameError] = useState('');

  const handleAddGame = () => {
    const trimmedUrl = gameUrl.trim();
    setGameUrlError('');

    if (!trimmedUrl) {
      setGameUrlError('Please enter a game URL');
      return;
    }

    if (!trimmedUrl.includes('pokernow.club/games/')) {
      setGameUrlError('URL must be from pokernow.club/games/');
      return;
    }

    if (!games.some(game => game.url === trimmedUrl)) {
      const isInCents = false;
      setGames([...games, { url: trimmedUrl, isInCents }]);
      setGameUrl('');
      trackGameAdded(trimmedUrl, isInCents);
    } else {
      setGameUrlError('This game URL is already in your list');
    }
  };

  const handleAddAlias = () => {
    const trimmedAlias = playerAlias.trim();
    if (trimmedAlias && !aliases.includes(trimmedAlias)) {
      setAliases([...aliases, trimmedAlias]);
      setPlayerAlias('');
    }
  };

  const handleStartTracking = async () => {
    const trimmedName = playerName.trim();
    setPlayerNameError('');

    if (!trimmedName) {
      setPlayerNameError('Please enter your player name');
      return;
    }

    if (games.length === 0) {
      setGameUrlError('Please add at least one game URL');
      return;
    }

    try {
      // Verify we can get results before starting tracking
      const data = await api.getResults(trimmedName, games, aliases);
      if (data.error) {
        setPlayerNameError(data.error);
        trackError(data.error, { playerName: trimmedName, games, aliases });
        return;
      }

      // Track the start tracking event
      trackStartTracking({
        playerName: trimmedName,
        gamesCount: games.length,
        aliasesCount: aliases.length,
        gameUrls: games.map(g => g.url),
        isInCents: games.map(g => g.isInCents)
      });

      onStartTracking();
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = 'Error starting tracking: ' + (error as Error).message;
      setPlayerNameError(errorMessage);
      trackError(errorMessage, { playerName: trimmedName, games, aliases });
    }
  };

  const handleKeyPress = (
    e: React.KeyboardEvent,
    action: () => void
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div id="setup-section" className="section">
      <h2 className="section-title">Game Setup</h2>

      <div className="form-group">
        <label htmlFor="game-url">Add Game URL</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="url"
            id="game-url"
            value={gameUrl}
            onChange={(e) => setGameUrl(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleAddGame)}
            placeholder="https://www.pokernow.club/games/..."
          />
          <button onClick={handleAddGame}>Add</button>
        </div>
        {gameUrlError && (
          <div className="error-message">{gameUrlError}</div>
        )}
      </div>

      <GamesList
        games={games}
        setGames={setGames}
        isResults={false}
      />

      <div className="form-group" style={{ marginTop: '20px' }}>
        <label htmlFor="player-name">Player Name to Track</label>
        <input
          type="text"
          id="player-name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your player name"
        />
        {playerNameError && (
          <div className="error-message">{playerNameError}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="player-alias">Add Player Alias (optional)</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            id="player-alias"
            value={playerAlias}
            onChange={(e) => setPlayerAlias(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleAddAlias)}
            placeholder="Alternative player name"
          />
          <button onClick={handleAddAlias}>Add</button>
        </div>
      </div>

      <AliasList
        aliases={aliases}
        setAliases={setAliases}
        isResults={false}
      />

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button
          className="start"
          onClick={handleStartTracking}
        >
          Start Tracking
        </button>
      </div>
    </div>
  );
} 