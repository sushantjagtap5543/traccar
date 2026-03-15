FROM eclipse-temurin:17-jdk-jammy

WORKDIR /opt/traccar

# Copy backend files
COPY . .

# Expose port for backend
EXPOSE 8082

# Entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
