import requests
import sys
from datetime import datetime

# To verify production endpoint is working


def check_health(url):
    """Check the health of the API endpoint"""
    try:
        response = requests.get(f"{url}/api/health")
        response.raise_for_status()
        data = response.json()

        print(f"Status: {data['status']}")
        print(f"Timestamp: {data['timestamp']}")
        print(f"Response Time: {response.elapsed.total_seconds():.3f}s")
        print(f"Checked at: {datetime.now().isoformat()}")

        return True
    except requests.exceptions.RequestException as e:
        print(f"Error: {str(e)}")
        return False


if __name__ == "__main__":
    url = "https://pokernow-games-tracker-production.up.railway.app"
    print(f"Checking health of {url}...")
    success = check_health(url)
    sys.exit(0 if success else 1)
