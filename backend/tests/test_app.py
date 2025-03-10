import pytest
from app import app
import json


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_health_check(client):
    """Test the health check endpoint"""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'
    assert 'timestamp' in data


def test_get_results_invalid_request(client):
    """Test get_results endpoint with invalid request data"""
    response = client.post('/api/get_results', json={})
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['error'] == 'No data provided'


def test_get_results_missing_player_name(client):
    """Test get_results endpoint with missing player name"""
    response = client.post('/api/get_results', json={'games': []})
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Player name is required' in data['error']


def test_get_results_invalid_games_format(client):
    """Test get_results endpoint with invalid games format"""
    response = client.post('/api/get_results', json={
        'playerName': 'TestPlayer',
        'games': [{'invalid': 'format'}]
    })
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Each game must have a url and isInCents field' in data['error']


def test_get_results_invalid_aliases(client):
    """Test get_results endpoint with invalid aliases format"""
    response = client.post('/api/get_results', json={
        'playerName': 'TestPlayer',
        'games': [],
        'aliases': 'not-a-list'
    })
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Aliases must be a list of strings' in data['error']


def test_rate_limiting(client):
    """Test rate limiting functionality"""
    # Make multiple requests to trigger rate limit
    for _ in range(61):  # One more than the limit
        response = client.post('/api/get_results', json={
            'playerName': 'TestPlayer',
            'games': []
        })

    assert response.status_code == 429
    data = json.loads(response.data)
    assert 'Rate limit exceeded' in data['error']
