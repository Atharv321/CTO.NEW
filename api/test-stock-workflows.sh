#!/bin/bash

set -e

API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"

echo "=== Stock Workflows API Test Suite ==="
echo ""

echo "1. Testing /api/stock/receive endpoint..."
curl -s -X POST "$API_BASE_URL/api/stock/receive" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "item-olive-oil",
    "locationId": "loc-kitchen-east",
    "quantity": 10,
    "reason": "Test shipment",
    "userId": "test-user",
    "barcodeReference": "TEST-001"
  }' | jq '.'
echo ""

echo "2. Testing /api/stock/consume endpoint..."
curl -s -X POST "$API_BASE_URL/api/stock/consume" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "item-olive-oil",
    "locationId": "loc-kitchen-east",
    "quantity": 5,
    "reason": "Test consumption",
    "userId": "test-chef"
  }' | jq '.'
echo ""

echo "3. Testing /api/stock/adjust endpoint..."
curl -s -X POST "$API_BASE_URL/api/stock/adjust" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "item-flour",
    "locationId": "loc-kitchen-east",
    "quantity": 15,
    "reason": "Test adjustment",
    "userId": "test-manager"
  }' | jq '.'
echo ""

echo "4. Testing /api/stock/movements endpoint..."
curl -s "$API_BASE_URL/api/stock/movements?itemId=item-olive-oil&limit=5" | jq '.'
echo ""

echo "5. Testing /api/audit-logs endpoint..."
curl -s "$API_BASE_URL/api/audit-logs?limit=3" | jq '.'
echo ""

echo "6. Testing /api/stock/low-stock endpoint..."
curl -s "$API_BASE_URL/api/stock/low-stock" | jq '.'
echo ""

echo "7. Testing /api/stock/threshold/compute endpoint..."
curl -s -X POST "$API_BASE_URL/api/stock/threshold/compute" \
  -H "Content-Type: application/json" \
  -d '{
    "reorderPoint": 20,
    "leadTime": 14,
    "safetyStock": 5
  }' | jq '.'
echo ""

echo "8. Testing /api/inventory/status endpoint..."
curl -s "$API_BASE_URL/api/inventory/status?locationId=loc-kitchen-east" | jq '.'
echo ""

echo "=== Test Suite Complete ==="
