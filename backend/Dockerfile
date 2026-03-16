# Production stage
FROM traccar/traccar:latest
USER root
WORKDIR /opt/traccar

# Copy custom assets (if they exist in the context)
COPY web ./web
COPY conf/traccar.xml ./conf/traccar.xml
COPY entrypoint.sh .

RUN chmod +x entrypoint.sh
EXPOSE 8082

# The entrypoint.sh will start the traccar-server.jar which is already in the base image
ENTRYPOINT ["./entrypoint.sh"]
