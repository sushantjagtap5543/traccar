#!/bin/bash
if curl -s --head http://localhost:8082 | grep "200" > /dev/null
then
    echo "Traccar is UP"
else
    echo "Traccar is DOWN"
    # Optional: restart or alert logic
fi
