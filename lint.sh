#!/bin/bash

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

echo "🔍 Running autopep8 to fix formatting issues..."
# Run autopep8 on all Python files recursively
# --in-place: modify files in place
# --aggressive: enable non-whitespace changes (level 1)
# --aggressive: enable more aggressive changes (level 2)
# --max-line-length=120: match our flake8 config
# --exclude: skip virtual environment and other non-source directories
autopep8 --in-place --aggressive --aggressive --max-line-length=120 \
    --exclude="venv/*,__pycache__/*,drivers/*,example_ledger_outputs/*" \
    ./**/*.py ./*.py

echo "🔍 Running flake8 to check for remaining issues..."
# Run flake8 (will use settings from .flake8 config file)
flake8

# Check if flake8 found any issues
if [ $? -eq 0 ]; then
    echo "✅ All checks passed!"
    exit 0
else
    echo "❌ Some issues require manual fixes. See above for details."
    exit 1
fi 