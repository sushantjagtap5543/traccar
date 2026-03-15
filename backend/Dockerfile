FROM openjdk:17-jdk-slim

WORKDIR /opt/traccar

# Copy backend files
COPY . .

# Expose port for backend
EXPOSE 8082

# Entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
