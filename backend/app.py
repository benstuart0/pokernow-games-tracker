from flask import Flask, request, jsonify
from flask_cors import CORS
from api_scraper import PokerNowAPIScraper
import logging
from functools import wraps
import time
from collections import defaultdict
from datetime import datetime
import os
import sys

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging with proper levels and formatting
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Set log levels for various loggers to reduce noise
logging.getLogger('werkzeug').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)

# Simple rate limiting
RATE_LIMIT = 60  # requests per minute
rate_limit_data = defaultdict(lambda: {'count': 0, 'reset_time': 0})


def rate_limit(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get client IP
        ip = request.remote_addr
        current_time = time.time()

        # Reset counter if minute has passed
        if current_time - rate_limit_data[ip]['reset_time'] >= 60:
            rate_limit_data[ip] = {'count': 0, 'reset_time': current_time}

        # Check rate limit
        if rate_limit_data[ip]['count'] >= RATE_LIMIT:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return jsonify({'error': 'Rate limit exceeded. Please wait a minute.'}), 429

        # Increment counter
        rate_limit_data[ip]['count'] += 1
        logger.debug(f"Request count for IP {ip}: {rate_limit_data[ip]['count']}")

        return f(*args, **kwargs)
    return decorated_function


def validate_request_data(data):
    """Validate the incoming request data"""
    if not data:
        return 'No data provided'

    player_name = data.get('playerName')
    if not player_name or not isinstance(player_name, str) or len(player_name.strip()) == 0:
        return 'Player name is required and must be a non-empty string'

    aliases = data.get('aliases', [])
    if not isinstance(aliases, list):
        return 'Aliases must be a list of strings'
    if any(not isinstance(alias, str) for alias in aliases):
        return 'All aliases must be strings'

    games = data.get('games', [])
    if not isinstance(games, list) or len(games) == 0:
        return 'At least one game URL is required'

    for game in games:
        if not isinstance(game, dict) or 'url' not in game or 'isInCents' not in game:
            return 'Each game must have a url and isInCents field'
        if not isinstance(game['url'], str) or not isinstance(game['isInCents'], bool):
            return 'Game url must be a string and isInCents must be a boolean'

    return None


@app.route('/api/get_results', methods=['POST'])
@rate_limit
def get_results():
    try:
        data = request.get_json()
        logger.info(f"Processing request for player: {data.get('playerName', 'unknown')}")

        # Validate request data
        error = validate_request_data(data)
        if error:
            logger.warning(f"Invalid request data: {error}")
            return jsonify({'error': error}), 400

        player_name = data['playerName']
        games = data['games']
        aliases = data.get('aliases', [])

        logger.info(f"Fetching results for {len(games)} games")
        logger.debug(f"Game URLs: {[game['url'] for game in games]}")

        # Create a new scraper instance for this request
        scraper = PokerNowAPIScraper(
            player_name=player_name,
            game_urls=[game['url'] for game in games],
            aliases=aliases,
            games_in_cents={game['url']: game['isInCents'] for game in games}
        )

        try:
            results = scraper.get_results()
            if results.get('has_errors'):
                logger.warning(f"Some games had errors: {results['results']}")
            else:
                logger.info(f"Successfully processed all games for {player_name}")
            
            return jsonify({
                'error': None,
                'results': results
            })
        finally:
            scraper.close()

    except Exception as e:
        logger.error(f"Error in get_results: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'results': {
                'total_profit': 0.0,
                'results': {},
                'has_errors': True
            }
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for Railway deployment"""
    logger.debug("Health check requested")
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    }), 200


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
