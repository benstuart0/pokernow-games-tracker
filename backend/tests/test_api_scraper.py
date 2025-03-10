import pytest
from api_scraper import PokerNowAPIScraper
from unittest.mock import patch, MagicMock
import requests

@pytest.fixture
def mock_session():
    with patch('requests.Session') as mock:
        session = MagicMock()
        mock.return_value = session
        yield session

@pytest.fixture
def scraper(mock_session):
    return PokerNowAPIScraper(
        player_name="TestPlayer",
        game_urls=["https://www.pokernow.club/games/test1"],
        aliases=["TestAlias"]
    )

def test_extract_game_id_valid_url(scraper):
    """Test game ID extraction from valid URL"""
    game_id = scraper.extract_game_id("https://www.pokernow.club/games/abcd1234")
    assert game_id == "abcd1234"

def test_extract_game_id_invalid_url(scraper):
    """Test game ID extraction from invalid URL"""
    game_id = scraper.extract_game_id("https://invalid-url.com")
    assert game_id is None

def test_scrape_game_invalid_url(scraper):
    """Test scraping with invalid game URL"""
    result = scraper.scrape_game("invalid-url", "TestPlayer", [])
    assert isinstance(result, str)
    assert result.startswith("ERROR")

def test_scrape_game_api_timeout(scraper, mock_session):
    """Test handling of API timeout"""
    mock_session.get.side_effect = requests.exceptions.Timeout()
    result = scraper.scrape_game("https://www.pokernow.club/games/test1", "TestPlayer", [])
    assert isinstance(result, str)
    assert "ERROR: Request timed out" in result

def test_scrape_game_player_not_found(scraper, mock_session):
    """Test handling of player not found in game"""
    mock_response = MagicMock()
    mock_response.json.return_value = {"playersInfos": {}}
    mock_session.get.return_value = mock_response
    
    result = scraper.scrape_game("https://www.pokernow.club/games/test1", "TestPlayer", [])
    assert result == "ERROR: Player not found in game"

def test_scrape_game_successful(scraper, mock_session):
    """Test successful game scraping"""
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "playersInfos": {
            "player1": {
                "names": ["TestPlayer"],
                "net": "100"
            }
        }
    }
    mock_session.get.return_value = mock_response
    
    result = scraper.scrape_game("https://www.pokernow.club/games/test1", "TestPlayer", [])
    assert result == 100.0

def test_scrape_game_with_alias(scraper, mock_session):
    """Test successful game scraping using player alias"""
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "playersInfos": {
            "player1": {
                "names": ["TestAlias"],
                "net": "100"
            }
        }
    }
    mock_session.get.return_value = mock_response
    
    result = scraper.scrape_game("https://www.pokernow.club/games/test1", "TestPlayer", ["TestAlias"])
    assert result == 100.0

def test_get_results_empty_urls(scraper):
    """Test get_results with empty game URLs"""
    scraper.game_urls = []
    results = scraper.get_results()
    assert results['has_errors'] is True
    assert results['total_profit'] == 0.0
    assert results['results'] == {} 