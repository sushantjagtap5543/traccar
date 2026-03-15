#!/bin/bash

echo "Starting GPS Platform..."

docker-compose pull

docker-compose build

docker-compose up -d

echo "Waiting for server..."

sleep 10

echo "Opening dashboard..."

xdg-open http://localhost
