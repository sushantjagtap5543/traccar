#!/bin/sh
set -e
set -x

# Apply environment variables to traccar.xml
sed -i "s#<DB_HOST>#$DB_HOST#g" conf/traccar.xml
sed -i "s#<DB_PORT>#$DB_PORT#g" conf/traccar.xml
sed -i "s#<DB_NAME>#$DB_NAME#g" conf/traccar.xml
sed -i "s#<DB_USER>#$DB_USER#g" conf/traccar.xml
sed -i "s#<DB_PASSWORD>#$DB_PASSWORD#g" conf/traccar.xml

# Check if jar exists
if [ ! -f "tracker-server.jar" ]; then
    echo "Error: tracker-server.jar not found in $(pwd)"
    ls -la
    exit 1
fi

echo "Starting Traccar with configuration:"
cat conf/traccar.xml

# Start backend
exec /opt/traccar/jre/bin/java -jar tracker-server.jar conf/traccar.xml
