#!/bin/sh
set -e

# Substitute environment variables in traccar.xml template
# Input: /app/traccar.xml.template
# Output: /app/traccar.xml (Used directly by Java command)

if [ -f "/app/traccar.xml.template" ]; then
    echo "⚙️ Substituting environment variables into /app/traccar.xml..."
    if command -v envsubst >/dev/null 2>&1; then
        envsubst < /app/traccar.xml.template > /app/traccar.xml
    else
        echo "⚠️ envsubst not found, using sed for DB_PASSWORD substitution"
        sed "s/\${DB_PASSWORD}/$DB_PASSWORD/g" /app/traccar.xml.template > /app/traccar.xml
    fi
fi

exec "$@"
