#!/bin/bash
# Initialize backend

# Apply environment variables
sed -i "s|<TRACCAR_ADMIN_USER>|$TRACCAR_ADMIN_USER|g" conf/traccar.xml
sed -i "s|<TRACCAR_ADMIN_PASS>|$TRACCAR_ADMIN_PASS|g" conf/traccar.xml

# Start backend
java -jar tracker-server.jar conf/traccar.xml
