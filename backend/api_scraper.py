import logging
from typing import Optional, List, Union, Dict
from urllib.parse import urlparse
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class PokerNowAPIScraper:
    def __init__(self,
                 player_name: str,
                 game_urls: List[str],
                 aliases: List[str] = None,
                 games_in_cents: Dict[str, bool] = None,
                 max_retries=3,
                 backoff_factor=0.5):
        self.player_name = player_name
        self.game_urls = game_urls
        self.aliases = aliases or []
        self.games_in_cents = games_in_cents or {}

        self.session = requests.Session()

        # Configure retry strategy
        retry_strategy = Retry(
            total=max_retries,
            backoff_factor=backoff_factor,
            status_forcelist=[500, 502, 503, 504, 429],  # HTTP status codes to retry on
        )

        # Mount the retry adapter to both HTTP and HTTPS requests
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

        # Set up logging
        self.logger = logging.getLogger("PokerNowAPIScraper")

    def get_results(self) -> Dict:
        """Get the latest results for all games."""
        self.logger.info(f"Starting to fetch results for {len(self.game_urls)} games")
        
        results = {
            'results': {},
            'total_profit': 0.0,
            'has_errors': False
        }

        if not self.game_urls:
            self.logger.warning("No game URLs provided")
            results['has_errors'] = True
            return results

        for game_url in self.game_urls:
            try:
                self.logger.info(f"Processing game: {game_url}")
                profit = self.scrape_game(game_url, self.player_name, self.aliases)

                # Handle error cases
                if isinstance(profit, str) and profit.startswith('ERROR'):
                    self.logger.warning(f"Error for game {game_url}: {profit}")
                    results['results'][game_url] = profit
                    results['has_errors'] = True
                    continue

                results['total_profit'] += profit
                results['results'][game_url] = profit
                self.logger.info(f"Successfully processed game {game_url}: {profit}")

            except Exception as e:
                self.logger.error(f"Error processing game {game_url}: {str(e)}", exc_info=True)
                results['results'][game_url] = f"ERROR: Unexpected error - {str(e)}"
                results['has_errors'] = True

        return results

    def extract_game_id(self, game_url: str) -> Optional[str]:
        """Extract the game ID from a PokerNow URL."""
        try:
            # Parse the URL and split the path
            parsed = urlparse(game_url)
            path_parts = parsed.path.split('/')

            # The game ID should be the last part of the path
            if 'games' in path_parts:
                games_index = path_parts.index('games')
                if len(path_parts) > games_index + 1:
                    game_id = path_parts[games_index + 1]
                    self.logger.debug(f"Extracted game ID: {game_id}")
                    return game_id
            self.logger.warning(f"Could not extract game ID from URL: {game_url}")
            return None
        except Exception as e:
            self.logger.error(f"Error extracting game ID: {e}")
            return None

    def scrape_game(self, game_url: str, player_name: str, aliases: List[str]) -> Union[float, str]:
        """
        Fetch game data using the PokerNow API and return profit/loss for the player.

        Args:
            game_url: URL of the PokerNow game
            player_name: Name of the player to look for
            aliases: List of alternative names for the player

        Returns:
            The raw profit/loss amount as a float, or an error message as a string
        """
        try:
            # Extract game ID from URL
            game_id = self.extract_game_id(game_url)
            if not game_id:
                return "ERROR: Invalid game URL format"

            # Construct API endpoint URL
            api_url = f"https://www.pokernow.club/games/{game_id}/players_sessions"

            # Make the API request with automatic retries
            self.logger.info(f"Fetching data from: {api_url}")
            try:
                response = self.session.get(api_url, timeout=10)  # Add timeout
                response.raise_for_status()
            except requests.exceptions.Timeout:
                self.logger.warning(f"Request timed out for game: {game_url}")
                return "ERROR: Request timed out"
            except requests.exceptions.RequestException as e:
                self.logger.warning(f"Network error for game {game_url}: {str(e)}")
                return f"ERROR: Network error - {str(e)}"

            # Parse the JSON response
            try:
                data = response.json()
            except ValueError as e:
                self.logger.warning(f"Invalid JSON response for game {game_url}: {str(e)}")
                return f"ERROR: Invalid response format - {str(e)}"

            # Create a list of all names to search for (player name + aliases)
            search_names = [player_name.lower()]
            if aliases:
                search_names.extend([alias.lower() for alias in aliases])
            self.logger.debug(f"Searching for names: {search_names}")

            # Search through players
            for player_id, player_data in data['playersInfos'].items():
                player_names = [name.lower() for name in player_data['names']]

                # Check if any of the player's names match our search names
                if any(search_name in player_names for search_name in search_names):
                    net_result = float(player_data['net'])
                    self.logger.info(
                        f"Found player {player_data['names']} with net result: {net_result}"
                    )
                    return net_result

            self.logger.warning(f"Player not found in game: {game_url}")
            return "ERROR: Player not found in game"

        except Exception as e:
            self.logger.error(f"Unexpected error for {game_url}: {e}", exc_info=True)
            return f"ERROR: Unexpected error - {str(e)}"

    def close(self):
        """Close the session"""
        self.session.close()
