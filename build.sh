#!/bin/bash

# Build script for Render deployment
echo "Installing dependencies..."
pip install -r requirements.txt

echo "Initializing database..."
cd api
python3 -c "from index import init_db; init_db()"
cd ..

echo "Build complete!"
