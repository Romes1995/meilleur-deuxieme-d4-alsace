#!/bin/bash
# Lance le backend et le frontend en parallèle
echo "🚀 Démarrage D4 Alsace..."

cd "$(dirname "$0")"

# Backend
(cd backend && uvicorn main:app --reload --port 8001) &
BACKEND_PID=$!

# Frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "✅ Backend  : http://localhost:8001"
echo "✅ Frontend : http://localhost:5175"
echo ""
echo "Ctrl+C pour arrêter"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
