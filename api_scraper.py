import logging
from typing import Optional, List, Union
from urllib.parse import urlparse
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class PokerNowAPIScraper:
    def __init__(self, max_retries=3, backoff_factor=0.5):
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
                    return path_parts[games_index + 1]
            return None
        except Exception as e:
            self.logger.error(f"Error extracting game ID: {e}")
            return None

    def scrape_game(self, game_url: str, player_name: str, aliases: List[str]) -> Union[float, str]:
        """
        Fetch game data using the PokerNow API and return profit/loss for the player.

        Args:
            game_url (str): URL of the PokerNow game
            player_name (str): Name of the player to look for
            aliases (List[str]): List of alternative names for the player

        Returns:
            Union[float, str]: The profit/loss amount as a float, or an error message as a string
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
            response = self.session.get(api_url, timeout=10)  # Add timeout
            response.raise_for_status()  # Raise exception for bad status codes

            # Parse the JSON response
            data = response.json()

            # Create a list of all names to search for (player name + aliases)
            search_names = [player_name.lower()]
            if aliases:
                search_names.extend([alias.lower() for alias in aliases])

            # Search through players
            for player_id, player_data in data['playersInfos'].items():
                player_names = [name.lower() for name in player_data['names']]

                # Check if any of the player's names match our search names
                if any(search_name in player_names for search_name in search_names):
                    net_result = float(player_data['net'])
                    self.logger.info(f"Found player: {player_data['names']} with net result: ${net_result:,.2f}")
                    return net_result

            return "ERROR: Player not found in game"

        except requests.exceptions.Timeout:
            self.logger.error(f"Timeout error for {game_url}")
            return "ERROR: Request timed out"
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Network error for {game_url}: {e}")
            return f"ERROR: Network error - {str(e)}"
        except ValueError as e:
            self.logger.error(f"Error parsing response for {game_url}: {e}")
            return f"ERROR: Invalid response format - {str(e)}"
        except Exception as e:
            self.logger.error(f"Unexpected error for {game_url}: {e}")
            return f"ERROR: Unexpected error - {str(e)}"

    def close(self):
        """Close the session"""
        self.session.close()
