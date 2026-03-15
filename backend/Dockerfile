# Build stage
FROM maven:3-eclipse-temurin-17 AS builder
WORKDIR /app
COPY . .
# Maven package to build the JAR (skipping tests for speed)
RUN mvn clean package -DskipTests

# Final stage
FROM traccar/traccar:latest
WORKDIR /opt/traccar
# Copy the built JAR from builder stage
COPY --from=builder /app/target/traccar-server.jar .
# Copy custom assets
COPY web ./web
COPY conf ./conf
COPY entrypoint.sh .

RUN chmod +x entrypoint.sh
EXPOSE 8082
ENTRYPOINT ["./entrypoint.sh"]
