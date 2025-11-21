#!/bin/bash
# Helper script to update MongoDB password in .env file
# Usage: ./update_mongo_password.sh YOUR_PASSWORD

if [ -z "$1" ]; then
  echo "Usage: ./update_mongo_password.sh YOUR_PASSWORD"
  echo "Or manually edit .env and replace <db_password> with your actual password"
  exit 1
fi

PASSWORD=$(echo -n "$1" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read()))")
sed -i '' "s|<db_password>|${PASSWORD}|g" .env
echo "Password updated in .env file"
