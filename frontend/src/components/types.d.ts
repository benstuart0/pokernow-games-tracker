import { FC } from 'react';
import { Game } from '../types';

declare module './ResultsTable' {
  interface ResultsTableProps {
    results: Record<string, number | string>;
    hasErrors: boolean;
    games: Game[];
  }
  
  const ResultsTable: FC<ResultsTableProps>;
  export default ResultsTable;
}

declare module './ProfitGraph' {
  interface ProfitGraphProps {
    history: {
      timestamps: string[];
      total_profits: number[];
    };
  }
  
  const ProfitGraph: FC<ProfitGraphProps>;
  export default ProfitGraph;
}

declare module './LoadingSpinner' {
  interface LoadingSpinnerProps {
    isVisible: boolean;
  }
  
  const LoadingSpinner: FC<LoadingSpinnerProps>;
  export default LoadingSpinner;
}

declare module './GamesList' {
  interface GamesListProps {
    games: Game[];
    setGames: (games: Game[]) => void;
    isResults: boolean;
    onUpdateGames: () => void;
  }
  
  const GamesList: FC<GamesListProps>;
  export default GamesList;
}

declare module './AliasList' {
  interface AliasListProps {
    aliases: string[];
    setAliases: (aliases: string[]) => void;
    onUpdateAliases: () => void;
    isResults: boolean;
  }
  
  const AliasList: FC<AliasListProps>;
  export default AliasList;
} 