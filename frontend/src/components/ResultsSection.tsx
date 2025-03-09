import { useState, useEffect, useCallback } from 'react';
import { Game, TrackingResults } from '../types';
import GamesList from './GamesList';
import AliasList from './AliasList';
import ResultsTable from './ResultsTable';
import ProfitGraph from './ProfitGraph';
import LoadingSpinner from './LoadingSpinner';
import * as api from '../services/api';

interface ResultsSectionProps {
  games: Game[];
  setGames: (games: Game[]) => void;
  aliases: string[];
  setAliases: (aliases: string[]) => void;
  playerName: string;
  onStopTracking: () => void;
}

interface GameProfitInfo {
  profit: number;
  isInCents: boolean;
  lastUpdated: string;
}

export default function ResultsSection({
  games,
  setGames,
  aliases,
  setAliases,
  playerName,
  onStopTracking,
}: ResultsSectionProps) {
  const [gameUrl, setGameUrl] = useState('');
  const [playerAlias, setPlayerAlias] = useState('');
  const [trackingResults, setTrackingResults] = useState<TrackingResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastPollTime, setLastPollTime] = useState<number>(0);
  const [profitHistory, setProfitHistory] = useState<{ timestamps: string[], total_profits: number[] }>({
    timestamps: [],
    total_profits: []
  });
  const [lastGameSettings, setLastGameSettings] = useState<Record<string, GameProfitInfo>>({});
  const [debugMode, setDebugMode] = useState(false);

  const logDebug = useCallback((message: string, details?: unknown) => {
    if (debugMode) {
      console.log(`[Debug] ${message}`, details || '');
    }
  }, [debugMode]);

  // Validate profit value and handle edge cases
  const validateAndConvertProfit = useCallback((profit: number | string, gameUrl: string): number => {
    if (typeof profit === 'string') {
      if (profit.startsWith('ERROR')) {
        logDebug(`Error value received for game ${gameUrl}:`, profit);
        return 0;
      }
      const parsed = parseFloat(profit);
      if (isNaN(parsed)) {
        logDebug(`Invalid profit value for game ${gameUrl}:`, profit);
        return 0;
      }
      return parsed;
    }
    return profit;
  }, [logDebug]);

  // Calculate total profit with cents conversion and validation
  const calculateTotalProfit = useCallback((results: Record<string, number | string>) => {
    return Object.entries(results).reduce((total, [gameUrl, profit]) => {
      try {
        const game = games.find(g => g.url === gameUrl);
        if (!game) {
          logDebug(`Game not found for URL: ${gameUrl}`);
          return total;
        }

        const profitValue = validateAndConvertProfit(profit, gameUrl);
        const convertedProfit = game.isInCents ? profitValue / 100 : profitValue;

        // Log significant changes in profit
        const lastProfit = lastGameSettings[gameUrl]?.profit;
        if (lastProfit !== undefined && Math.abs(profitValue - lastProfit) > 1000) {
          logDebug(`Large profit change detected for ${gameUrl}:`, {
            previous: lastProfit,
            current: profitValue,
            isInCents: game.isInCents
          });
        }

        return total + convertedProfit;
      } catch (error) {
        logDebug(`Error calculating profit for ${gameUrl}:`, error);
        return total;
      }
    }, 0);
  }, [games, lastGameSettings, logDebug, validateAndConvertProfit]);

  const pollResults = useCallback(async () => {
    const now = Date.now();
    if (now - lastPollTime < 4500) {
      return;
    }
    setLastPollTime(now);

    if (!trackingResults || Object.keys(trackingResults?.results || {}).length === 0) {
      setIsLoading(true);
    }

    try {
      const data = await api.getResults(playerName, games, aliases);
      setIsLoading(false);

      if (data.results) {
        // Update tracking results
        setTrackingResults(data.results);

        // Update last game settings for change detection
        const newGameSettings: Record<string, GameProfitInfo> = {};
        Object.entries(data.results.results).forEach(([gameUrl, profit]) => {
          const game = games.find(g => g.url === gameUrl);
          if (game && typeof profit === 'number') {
            newGameSettings[gameUrl] = {
              profit,
              isInCents: game.isInCents,
              lastUpdated: new Date().toISOString()
            };
          }
        });
        setLastGameSettings(newGameSettings);

        // Update profit history
        const currentTime = new Date().toISOString();
        const currentProfit = calculateTotalProfit(data.results.results);

        // If this is the first point, add a $0 starting point 5 minutes before
        if (profitHistory.timestamps.length === 0) {
          const startTime = new Date(new Date(currentTime).getTime() - 5 * 60000).toISOString();
          setProfitHistory({
            timestamps: [startTime, currentTime],
            total_profits: [0, currentProfit]
          });
          logDebug('Initialized profit history with $0 starting point:', { startTime, currentTime, profit: currentProfit });
        } else {
          const shouldAddPoint = 
            profitHistory.total_profits[profitHistory.total_profits.length - 1] !== currentProfit ||
            (new Date(currentTime).getTime() - new Date(profitHistory.timestamps[profitHistory.timestamps.length - 1]).getTime()) >= 60000;

          if (shouldAddPoint) {
            setProfitHistory(prev => ({
              timestamps: [...prev.timestamps, currentTime],
              total_profits: [...prev.total_profits, currentProfit]
            }));
            logDebug('Added new profit history point:', { time: currentTime, profit: currentProfit });
          }
        }

        setError(null);
      } else {
        logDebug('No results received from API');
        setError('No results received');
      }

      if (data.error) {
        logDebug('API returned error:', data.error);
        setError(data.error);
      }
    } catch (error) {
      console.error('Error polling results:', error);
      setError('Error connecting to server: ' + (error as Error).message);
      setIsLoading(false);
    }
  }, [lastPollTime, trackingResults, playerName, games, aliases, profitHistory, calculateTotalProfit, logDebug]);

  // Effect to recalculate profit history when games' isInCents settings change
  useEffect(() => {
    if (trackingResults) {
      const changedGames = Object.entries(lastGameSettings).filter(([gameUrl, info]) => {
        const game = games.find(g => g.url === gameUrl);
        return game && game.isInCents !== info.isInCents;
      });

      if (changedGames.length > 0) {
        logDebug('Games with changed cents settings:', changedGames);
        
        // Clear existing history and recalculate with $0 starting point
        const currentTime = new Date().toISOString();
        const startTime = new Date(new Date(currentTime).getTime() - 5 * 60000).toISOString();
        const currentProfit = calculateTotalProfit(trackingResults.results);
        
        const newHistory = {
          timestamps: [startTime, currentTime],
          total_profits: [0, currentProfit]
        };

        setProfitHistory(newHistory);
        logDebug('Profit history reset with $0 starting point due to cents setting change');
      }
    }
  }, [games, trackingResults, calculateTotalProfit, lastGameSettings, logDebug]);

  useEffect(() => {
    pollResults();
    const pollInterval = setInterval(pollResults, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [pollResults]);

  const handleAddGame = () => {
    const trimmedUrl = gameUrl.trim();

    if (!trimmedUrl) {
      setError('Please enter a game URL');
      return;
    }

    if (!trimmedUrl.includes('pokernow.club/games/')) {
      setError('URL must be from pokernow.club/games/');
      return;
    }

    if (!games.some(game => game.url === trimmedUrl)) {
      const newGames = [...games, { url: trimmedUrl, isInCents: false }];
      setGames(newGames);
      setGameUrl('');
      setError(null);
      logDebug('Added new game:', trimmedUrl);
    } else {
      setError('This game URL is already in your list');
    }
  };

  const handleAddAlias = () => {
    const trimmedAlias = playerAlias.trim();
    if (trimmedAlias && !aliases.includes(trimmedAlias)) {
      const newAliases = [...aliases, trimmedAlias];
      setAliases(newAliases);
      setPlayerAlias('');
      setError(null);
      logDebug('Added new alias:', trimmedAlias);
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

  // Toggle debug mode with keyboard shortcut (Ctrl/Cmd + Shift + D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDebugMode(prev => !prev);
        console.log(`Debug mode ${!debugMode ? 'enabled' : 'disabled'}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debugMode]);

  return (
    <div id="results-section" className="section">
      <h2 className="section-title">Tracking Results</h2>

      {debugMode && (
        <div className="debug-info" style={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          background: 'rgba(0,0,0,0.8)', 
          color: '#0f0', 
          padding: 10, 
          borderRadius: 5,
          fontSize: 12,
          maxWidth: 300,
          maxHeight: 200,
          overflow: 'auto'
        }}>
          <h4>Debug Info</h4>
          <pre>
            {JSON.stringify({
              gamesCount: games.length,
              lastPoll: new Date(lastPollTime).toISOString(),
              historyPoints: profitHistory.timestamps.length,
              lastProfit: profitHistory.total_profits[profitHistory.total_profits.length - 1],
              errors: error
            }, null, 2)}
          </pre>
        </div>
      )}

      <div className="graphs-section">
        <div className="graph-title">
          <span id="player-name-title">{playerName}</span> Profit/Loss
        </div>
        <div className="main-graph">
          {trackingResults && (
            <ProfitGraph history={profitHistory} />
          )}
        </div>
      </div>

      <LoadingSpinner isVisible={isLoading} />

      {trackingResults && (
        <ResultsTable
          results={trackingResults.results}
          hasErrors={trackingResults.has_errors}
          games={games}
        />
      )}

      {error && (
        <div className="error-message" style={{ marginTop: '20px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div className="game-management-panel" style={{ marginTop: '30px' }}>
        <div className="form-row">
          <div className="form-group" style={{ flex: 3 }}>
            <label htmlFor="game-url-results">Add Game URL</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="url"
                id="game-url-results"
                value={gameUrl}
                onChange={(e) => setGameUrl(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAddGame)}
                placeholder="https://www.pokernow.club/games/..."
              />
              <button onClick={handleAddGame}>Add</button>
            </div>
          </div>

          <div className="form-group" style={{ flex: 2 }}>
            <label htmlFor="player-alias-results">Add Player Alias</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                id="player-alias-results"
                value={playerAlias}
                onChange={(e) => setPlayerAlias(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleAddAlias)}
                placeholder="Alternative player name"
              />
              <button onClick={handleAddAlias}>Add</button>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="current-games">
            <h4>Current Games</h4>
            <GamesList
              games={games}
              setGames={setGames}
              isResults={true}
              onUpdateGames={() => setError(null)}
            />
          </div>

          <div className="current-aliases">
            <h4>Current Aliases</h4>
            <AliasList
              aliases={aliases}
              setAliases={setAliases}
              onUpdateAliases={() => setError(null)}
              isResults={true}
            />
          </div>
        </div>

        <div className="form-row" style={{ justifyContent: 'center', marginTop: '20px' }}>
          <button className="stop" onClick={onStopTracking}>
            Stop Tracking
          </button>
        </div>
      </div>
    </div>
  );
} 