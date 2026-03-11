#!/bin/sh
set -e

# Substitute environment variables in traccar.xml template
# Input: /app/traccar.xml.template
# Output: /app/traccar.xml (Used directly by Java command)

if [ -f "/app/traccar.xml.template" ]; then
    echo "⚙️ Substituting environment variables into /app/traccar.xml..."
    envsubst < /app/traccar.xml.template > /app/traccar.xml
fi

exec "$@"
