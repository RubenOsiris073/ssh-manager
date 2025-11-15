#!/bin/bash

# Script para probar las APIs del SSH Manager
# Uso: ./test-api.sh

CONTAINER_NAME="ssh-manager-container"
BASE_URL="http://localhost:3000/api"

echo "🧪 SSH Manager - Backend API Testing"
echo "====================================="

# Verificar que el contenedor esté corriendo
if ! docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Container '$CONTAINER_NAME' is not running"
    echo "Run './dev.sh' first to start the development environment"
    exit 1
fi

echo "✅ Container is running"
echo ""

# Test 1: Obtener todas las conexiones
echo "📋 Test 1: GET /api/ssh/connections"
curl -s "$BASE_URL/ssh/connections" | python3 -m json.tool || echo "❌ Failed"
echo ""

# Test 2: Crear una nueva conexión de prueba
echo "🆕 Test 2: POST /api/ssh/connections (Test Connection)"
TEST_CONNECTION='{
  "name": "Test Server",
  "host": "test.example.com",
  "port": 22,
  "username": "testuser",
  "password": "testpass"
}'

RESPONSE=$(curl -s -X POST "$BASE_URL/ssh/connections" \
  -H "Content-Type: application/json" \
  -d "$TEST_CONNECTION")

echo "$RESPONSE" | python3 -m json.tool || echo "❌ Failed"

# Extraer el ID de la conexión creada
CONNECTION_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('connection', {}).get('id', ''))" 2>/dev/null)

if [ -n "$CONNECTION_ID" ]; then
    echo "✅ Connection created with ID: $CONNECTION_ID"
else
    echo "❌ Failed to extract connection ID"
fi
echo ""

# Test 3: Obtener la conexión específica
if [ -n "$CONNECTION_ID" ]; then
    echo "📖 Test 3: GET /api/ssh/connections/$CONNECTION_ID"
    curl -s "$BASE_URL/ssh/connections/$CONNECTION_ID" | python3 -m json.tool || echo "❌ Failed"
    echo ""
fi

# Test 4: Probar conexión (debería fallar ya que es un servidor ficticio)
echo "🔗 Test 4: POST /api/ssh/test (Should fail - fake server)"
curl -s -X POST "$BASE_URL/ssh/test" \
  -H "Content-Type: application/json" \
  -d "$TEST_CONNECTION" | python3 -m json.tool || echo "❌ Failed"
echo ""

# Test 5: Intentar conectar (debería fallar)
if [ -n "$CONNECTION_ID" ]; then
    echo "🔌 Test 5: POST /api/ssh/connections/$CONNECTION_ID/connect (Should fail)"
    curl -s -X POST "$BASE_URL/ssh/connections/$CONNECTION_ID/connect" | python3 -m json.tool || echo "❌ Failed"
    echo ""
fi

# Test 6: Eliminar la conexión de prueba
if [ -n "$CONNECTION_ID" ]; then
    echo "🗑️  Test 6: DELETE /api/ssh/connections/$CONNECTION_ID"
    curl -s -X DELETE "$BASE_URL/ssh/connections/$CONNECTION_ID" | python3 -m json.tool || echo "❌ Failed"
    echo ""
fi

echo "🏁 API Testing Complete!"
echo ""
echo "📝 Notes:"
echo "- Connection and test endpoints should work (even if connection fails)"
echo "- SSH connections will fail unless you have real SSH servers configured"
echo "- Check the app at: http://localhost:3000"