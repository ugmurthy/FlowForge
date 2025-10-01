#!/bin/bash

# Start FlowForge Development Environment
# This script starts both the server and client for viewing workflows

echo "🚀 Starting FlowForge Development Environment"
echo "============================================="

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Initialize database if needed
if [ ! -f "packages/server/prisma/flowforge.db" ]; then
    echo "🗄️  Initializing database..."
    cd packages/server && pnpm db:push
    cd ../..
fi

echo ""
echo "Starting servers..."
echo "📡 Server will run on: http://localhost:3001"
echo "🌐 Client will run on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start server in background
cd packages/server && pnpm dev &
SERVER_PID=$!

# Wait a bit for server to start
sleep 3

# Start client in background  
cd packages/client && pnpm dev &
CLIENT_PID=$!
echo Server PID: $SERVER_PID
echo Client PID: $CLIENT_PID
# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on exit
trap cleanup INT

# Wait for both processes
wait $SERVER_PID $CLIENT_PID
echo Server PID: $SERVER_PID
echo Client PID: $CLIENT_PID
# Kill by process name
## pkill -f "pnpm dev"

# Or kill by port
## lsof -ti:3001 | xargs kill -9  # server
## lsof -ti:3000 | xargs kill -9  # client