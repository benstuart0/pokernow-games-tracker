#!/bin/bash

# Text colors
YELLOW='\033[1;33m'
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running linting checks...${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  echo -e "${YELLOW}Creating virtual environment...${NC}"
  python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Backend checks
echo -e "\n${YELLOW}Checking backend code...${NC}"
cd backend

# Check for Python packages
if ! command_exists autopep8 || ! command_exists flake8; then
  echo -e "${YELLOW}Installing required Python packages...${NC}"
  python -m pip install autopep8 flake8
fi

echo -e "${YELLOW}Running autopep8 to fix formatting issues...${NC}"
autopep8 --in-place --recursive .

echo -e "${YELLOW}Running flake8 to check for remaining issues...${NC}"
flake8
BACKEND_STATUS=$?

cd ..

# Frontend checks
echo -e "\n${YELLOW}Checking frontend code...${NC}"
cd frontend

echo -e "${YELLOW}Running ESLint...${NC}"
npm run lint
FRONTEND_STATUS=$?

# Deactivate virtual environment
deactivate

# Check if any errors occurred
if [ $BACKEND_STATUS -eq 0 ] && [ $FRONTEND_STATUS -eq 0 ]; then
    echo -e "\n${GREEN}✅ All checks passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some issues require manual fixes. See above for details.${NC}"
    exit 1
fi 