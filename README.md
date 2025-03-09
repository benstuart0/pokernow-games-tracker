# PokerNow Games Tracker

A web application that tracks your profit/loss across multiple PokerNow.club games.

## Features

- Track profits and losses across multiple PokerNow.club games
- Support for player name aliases
- Automatic scraping every 5 minutes
- Real-time display of results and time since last update

## Requirements

- Python 3.7+
- Chrome/Chromium browser (for Selenium)

## Installation

1. Clone this repository:
```
git clone https://github.com/your-username/pokernow-games-tracker.git
cd pokernow-games-tracker
```

2. Install the required dependencies:
```
pip install -r requirements.txt
```

3. Run the application:
```
python app.py
```

4. Open your browser and navigate to http://localhost:5000

## Usage

1. Add PokerNow.club game URLs to the list
2. Enter your player name as it appears in the PokerNow ledger
3. Optionally add aliases if you've used different names
4. Click "Start Tracking" to begin monitoring your games
5. The application will automatically refresh data every 5 minutes

## Technical Details

- Built with Flask (Python web framework)
- Uses Selenium for web scraping
- Frontend built with HTML, CSS, and vanilla JavaScript

## License

MIT 