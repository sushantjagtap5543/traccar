#!/bin/bash
# Final Cleanup & Dependency Sync
echo "🚀 Starting final platform optimization..."

# Sync API dependencies
cd services/api-server
npm install @socket.io/redis-adapter redis @willsoto/nestjs-prometheus prom-client
npm update rimraf glob eslint

# Sync Frontend dependencies
cd ../../frontend/client-dashboard
npm install
cd ../admin-dashboard
npm install

echo "✅ All dependencies synchronized and updated."
echo "🔄 You can now run: docker-compose up --build"
