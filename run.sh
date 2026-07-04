#!/bin/bash
echo "--- Initializing House-of-Coral Infrastructure ---"

# 1. Start Core Services (Identity, Governance, Ledger, Wallet)
npm run start:core &

# 2. Start Pillars (GlobalLink, Stage, Rhythm, Bazaar, TerraHouse, Arena, Jubilee, HeartStrings)
npm run start:modules &

# 3. Initialize Border Control API Gateway
node server.js

echo "--- Ecosystem Live: All 8 Pillars Initialized ---"
