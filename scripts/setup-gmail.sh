#!/bin/bash
# Setup Google OAuth for Zed - run after creating Google Cloud credentials
set -e
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./scripts/setup-gmail.sh <GOOGLE_CLIENT_ID> <GOOGLE_CLIENT_SECRET> [SERVER_URL]"
  echo "Example: ./scripts/setup-gmail.sh 123xxx.apps.googleusercontent.com GOCSPX-xxx https://your-daytona-3000.preview.daytona.io"
  exit 1
fi
CLIENT_ID=$1
CLIENT_SECRET=$2
URL=${3:-$(grep SERVER_URL .env | cut -d= -f2)}
if [ -z "$URL" ]; then URL="http://localhost:3000"; fi

# Update .env
echo "Setting Gmail OAuth for SERVER_URL=$URL"
if grep -q "AUTH_GOOGLE_CLIENT_ID" .env; then
  sed -i "s#AUTH_GOOGLE_CLIENT_ID=.*#AUTH_GOOGLE_CLIENT_ID=$CLIENT_ID#g" .env
  sed -i "s#AUTH_GOOGLE_CLIENT_SECRET=.*#AUTH_GOOGLE_CLIENT_SECRET=$CLIENT_SECRET#g" .env
  sed -i "s#MESSAGING_PROVIDER_GMAIL_ENABLED=.*#MESSAGING_PROVIDER_GMAIL_ENABLED=true#g" .env
  sed -i "s#CALENDAR_PROVIDER_GOOGLE_ENABLED=.*#CALENDAR_PROVIDER_GOOGLE_ENABLED=true#g" .env
  sed -i "s#AUTH_GOOGLE_CALLBACK_URL=.*#AUTH_GOOGLE_CALLBACK_URL=$URL/auth/google/callback#g" .env
  sed -i "s#AUTH_GOOGLE_APIS_CALLBACK_URL=.*#AUTH_GOOGLE_APIS_CALLBACK_URL=$URL/auth/google-apis/callback#g" .env
  # also update SERVER_URL itself if provided
  if [ "$3" != "" ]; then
    sed -i "s#SERVER_URL=.*#SERVER_URL=$3#g" .env
  fi
else
  echo "AUTH_GOOGLE_CLIENT_ID=$CLIENT_ID" >> .env
  echo "AUTH_GOOGLE_CLIENT_SECRET=$CLIENT_SECRET" >> .env
fi
echo ".env updated. Restarting Zed..."
docker compose up -d
echo "Wait for healthy..."
until [ "$(docker inspect --format='{{.State.Health.Status}}' zed-server-1 2>/dev/null || docker inspect --format='{{.State.Health.Status}}' twenty-server-1 2>/dev/null)" = "healthy" ]; do sleep 2; done
echo "Zed Gmail SSO ready at $URL/auth/google"
