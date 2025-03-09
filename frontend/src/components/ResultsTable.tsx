import { Game } from '../types';

interface ResultsTableProps {
  results: Record<string, number | string>;
  hasErrors: boolean;
  games: Game[];
}

export default function ResultsTable({
  results,
  hasErrors,
  games,
}: ResultsTableProps) {
  const formatProfit = (value: number, isInCents: boolean): string => {
    const convertedValue = isInCents ? value / 100 : value;
    const prefix = convertedValue >= 0 ? '+' : '';
    return `${prefix}$${Math.abs(convertedValue).toFixed(2)}`;
  };

  // Calculate total profit with cents conversion
  const totalProfit = Object.entries(results).reduce((total, [gameUrl, profit]) => {
    if (typeof profit === 'number' || !isNaN(parseFloat(String(profit)))) {
      const game = games.find(g => g.url === gameUrl);
      const profitValue = typeof profit === 'number' ? profit : parseFloat(String(profit));
      const convertedProfit = game?.isInCents ? profitValue / 100 : profitValue;
      return total + convertedProfit;
    }
    return total;
  }, 0);

  return (
    <table className="results-table">
      <thead>
        <tr>
          <th>Game</th>
          <th>Profit/Loss</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(results).map(([gameUrl, profit]) => {
          const game = games.find(g => g.url === gameUrl);
          let displayProfit: string | number = profit;

          if (typeof profit === 'number' || !isNaN(parseFloat(String(profit)))) {
            const profitValue = typeof profit === 'number' ? profit : parseFloat(String(profit));
            displayProfit = formatProfit(profitValue, game?.isInCents || false);
          }

          const profitClass = (() => {
            if (typeof profit === 'string' && profit.startsWith('ERROR')) {
              return 'error';
            }
            if (typeof profit === 'number' || !isNaN(parseFloat(String(profit)))) {
              const profitValue = typeof profit === 'number' ? profit : parseFloat(String(profit));
              const convertedValue = game?.isInCents ? profitValue / 100 : profitValue;
              return convertedValue >= 0 ? 'positive' : 'negative';
            }
            return '';
          })();

          return (
            <tr key={gameUrl}>
              <td>{gameUrl}</td>
              <td className={`game-profit ${profitClass}`}>
                {displayProfit}
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className={`total-row ${totalProfit >= 0 ? 'positive' : 'negative'}`}>
          <td>TOTAL</td>
          <td>
            {formatProfit(totalProfit, false)}
            {hasErrors && ' (Some games had errors)'}
          </td>
        </tr>
      </tfoot>
    </table>
  );
} 