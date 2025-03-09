from flask import Flask, render_template, request, jsonify
import threading
import time
from api_scraper import PokerNowAPIScraper
import logging
import datetime
from collections import defaultdict

app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Global variables
game_urls = []
player_name = None
player_aliases = []
tracking_active = False
tracking_thread = None
tracking_results = {
    "total_profit": 0,
    "games": {},
    "has_errors": False,
    "last_update": None,
    "history": {
        "timestamps": [],
        "total_profits": [],
        "game_profits": defaultdict(list)
    }
}
scraper = None
tracking_lock = threading.Lock()
MAX_HISTORY_POINTS = 1000  # Store up to 1000 data points


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/start_tracking', methods=['POST'])
def start_tracking():
    global tracking_active, tracking_thread, game_urls, player_name, player_aliases, scraper

    data = request.json
    if not data.get('games') or not data.get('playerName'):
        return jsonify({"error": "Missing game URLs or player name"}), 400

    # Update tracking information
    game_urls = [game['url'] for game in data['games']]  # Extract URLs from game objects
    player_name = data['playerName']
    player_aliases = data.get('aliases', [])

    if tracking_active:
        return jsonify({"message": "Tracking already active"}), 200

    # Initialize the scraper
    scraper = PokerNowAPIScraper()

    # Start tracking
    tracking_active = True
    tracking_thread = threading.Thread(target=tracking_job)
    tracking_thread.daemon = True
    tracking_thread.start()

    return jsonify({"message": "Tracking started"}), 200


def update_tracking_data():
    """Update tracking data for all games"""
    global tracking_results, scraper

    total_profit = 0
    has_errors = False
    current_time = datetime.datetime.now().isoformat()

    # Store the timestamp for this update
    tracking_results["history"]["timestamps"].append(current_time)

    # Trim history if it exceeds maximum points
    if len(tracking_results["history"]["timestamps"]) > MAX_HISTORY_POINTS:
        # Trim history timestamps
        timestamps = tracking_results["history"]["timestamps"]
        tracking_results["history"]["timestamps"] = timestamps[-MAX_HISTORY_POINTS:]

        # Trim total profits history
        total_profits = tracking_results["history"]["total_profits"]
        tracking_results["history"]["total_profits"] = total_profits[-MAX_HISTORY_POINTS:]

        # Trim individual game profit histories
        for game_url in tracking_results["history"]["game_profits"]:
            game_profits = tracking_results["history"]["game_profits"][game_url]
            tracking_results["history"]["game_profits"][game_url] = game_profits[-MAX_HISTORY_POINTS:]

    for game_url in game_urls:
        try:
            # Get profit for this game
            result = scraper.scrape_game(game_url, player_name, player_aliases)

            # Update results
            if isinstance(result, (int, float)):
                tracking_results["games"][game_url] = result
                total_profit += result
                # Store historical data for this game
                tracking_results["history"]["game_profits"][game_url].append(result)
            else:  # Error message
                tracking_results["games"][game_url] = result
                has_errors = True
                logging.error(f"Error for game {game_url}: {result}")
                # Store None for error cases
                tracking_results["history"]["game_profits"][game_url].append(None)

        except Exception as e:
            error_msg = f"ERROR: Unexpected error - {str(e)}"
            tracking_results["games"][game_url] = error_msg
            has_errors = True
            logging.error(f"Exception for game {game_url}: {e}")
            tracking_results["history"]["game_profits"][game_url].append(None)

    # Update total profit and error status
    tracking_results["total_profit"] = total_profit
    tracking_results["has_errors"] = has_errors
    tracking_results["last_update"] = current_time
    tracking_results["history"]["total_profits"].append(total_profit)


def tracking_job():
    """Background job to update tracking data every minute"""
    global tracking_active, tracking_results, scraper

    while tracking_active:
        with tracking_lock:
            update_tracking_data()

        # Wait before next update (1 minute)
        time.sleep(60)


@app.route('/stop_tracking', methods=['POST'])
def stop_tracking():
    global tracking_active, tracking_thread, scraper

    if tracking_active:
        tracking_active = False
        if tracking_thread:
            tracking_thread.join(timeout=5)  # Wait up to 5 seconds for thread to finish
        if scraper:
            scraper.close()
            scraper = None

    return jsonify({"message": "Tracking stopped"}), 200


@app.route('/get_results')
def get_results():
    """Get current tracking results"""
    with tracking_lock:
        current_time = datetime.datetime.now()
        time_since_scrape = None
        if tracking_results.get("last_update"):
            last_update_dt = datetime.datetime.fromisoformat(tracking_results["last_update"])
            time_since_scrape = (current_time - last_update_dt).total_seconds()

        return jsonify({
            "tracking_results": {
                "results": tracking_results["games"],
                "total_profit": tracking_results["total_profit"],
                "has_errors": tracking_results["has_errors"],
                "history": tracking_results["history"]
            },
            "last_scrape_time": tracking_results.get("last_update"),
            "time_since_scrape_seconds": time_since_scrape
        })


if __name__ == '__main__':
    # Try port 8080 first, fall back to 8090 if 8080 is in use
    try:
        app.run(port=8080)
    except OSError:
        app.run(port=8090)
