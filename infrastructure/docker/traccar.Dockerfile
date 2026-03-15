# Build stage for custom Traccar extensions
FROM traccar/traccar:latest AS traccar-base

FROM maven:3-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy the Traccar Core JAR from the base image to use as a dependency
COPY --from=traccar-base /opt/traccar/tracker-server.jar ./libs/

# Copy the pom.xml and source code
COPY infrastructure/docker/traccar.pom.xml ./pom.xml
COPY src/main/java ./src/main/java

# Build the custom extensions JAR
RUN mvn clean package -DskipTests

# Final stage
FROM traccar/traccar:latest

# Add the custom extensions JAR to the Traccar lib folder
COPY --from=builder /app/target/traccar-custom-1.0-SNAPSHOT.jar /opt/traccar/lib/

# Traccar will automatically pick up any JARs in the lib folder and add them to the classpath.
# The custom resources will then be available at /api/register and /api/session/login.
