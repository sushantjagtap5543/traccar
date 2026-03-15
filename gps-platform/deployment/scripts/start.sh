#!/bin/bash
docker-compose down
docker-compose pull
docker-compose up -d
echo "Platform started successfully!"
