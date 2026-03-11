#!/bin/sh
set -e

# Substitute environment variables in traccar.xml template
# traccar.xml.template should be at /app/traccar.xml.template
# output will be at /opt/traccar/conf/traccar.xml

if [ -f "/app/traccar.xml.template" ]; then
    echo "⚙️ Substituting environment variables in traccar.xml.template..."
    envsubst < /app/traccar.xml.template > /app/traccar.xml
    # If this is for the traccar container specifically, it might need to go to /opt/traccar/conf/
fi

exec "$@"
