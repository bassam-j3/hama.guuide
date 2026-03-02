#!/usr/bin/env sh
set -e

echo "Starting ...."
docker-compose down -v
echo "Building....."
docker-compose up --build
