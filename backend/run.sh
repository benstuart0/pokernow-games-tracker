#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${YELLOW}PokerNow Games Tracker Backend Setup${NC}"

# Check if venv exists, if not create it
if [ ! -d "../venv" ]; then
  echo "${YELLOW}Creating virtual environment...${NC}"
  python3 -m venv ../venv
  if [ $? -ne 0 ]; then
    echo "${RED}Failed to create virtual environment. Please ensure Python 3.6+ is installed.${NC}"
    exit 1
  fi
  echo "${GREEN}Virtual environment created successfully.${NC}"
else
  echo "${GREEN}Using existing virtual environment.${NC}"
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source ../venv/bin/activate
if [ $? -ne 0 ]; then
  echo "${RED}Failed to activate virtual environment.${NC}"
  exit 1
fi

# Check if requirements are installed
echo "Checking dependencies..."
if ! pip show flask > /dev/null 2>&1; then
  echo "${YELLOW}Installing requirements...${NC}"
  pip install -r requirements.txt
  if [ $? -ne 0 ]; then
    echo "${RED}Failed to install requirements.${NC}"
    exit 1
  fi
  echo "${GREEN}Dependencies installed successfully.${NC}"
else
  echo "${GREEN}Dependencies already installed.${NC}"
fi

# Create drivers directory if it doesn't exist
if [ ! -d "drivers" ]; then
  echo "${YELLOW}Creating drivers directory...${NC}"
  mkdir -p drivers
fi

# Run the application with a helpful message about the port
echo ""
echo "${GREEN}Starting PokerNow Tracker Backend...${NC}"
echo "The API will attempt to start on port 8080."
echo "If port 8080 is in use, it will try port 8090."
echo "Press Ctrl+C to stop the server."

python app.py

# Deactivate the virtual environment on exit
deactivate 