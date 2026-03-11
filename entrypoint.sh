#!/bin/sh
# Substitute environment variables in traccar.xml template
# We expect traccar.xml to have ${VAR} placeholders
# In a real setup, we might copy a template to the final location
# For this task, we assume traccar.xml is the template or used directly if environment supports it.

# If we were using envsubst, it would look like this:
# envsubst < /app/traccar.xml > /opt/traccar/conf/traccar.xml

# For now, we'll just start the app as requested by the user's logic
exec "$@"
