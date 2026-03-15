#!/bin/bash
# Initialize backend

# Apply environment variables
sed -i "s|<TRACCAR_ADMIN_USER>|$TRACCAR_ADMIN_USER|g" traccar.xml
sed -i "s|<TRACCAR_ADMIN_PASS>|$TRACCAR_ADMIN_PASS|g" traccar.xml

# Start backend
java -jar traccar-server.jar conf/traccar.xml
