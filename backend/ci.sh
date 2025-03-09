#!/bin/bash

# Exit on any error
set -e

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${YELLOW}PokerNow Games Tracker Backend CI Verification${NC}"

# Create drivers directory if it doesn't exist
if [ ! -d "drivers" ]; then
    echo "${YELLOW}Creating drivers directory...${NC}"
    mkdir -p drivers
fi

# Export necessary environment variables
export FLASK_APP=app.py
export FLASK_ENV=testing

# Start the application with gunicorn
echo ""
echo "${GREEN}Starting PokerNow Tracker Backend with gunicorn...${NC}"
exec gunicorn --bind 0.0.0.0:5000 app:app 