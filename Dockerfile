FROM openjdk:17-jdk-slim

WORKDIR /app

COPY build/libs/traccar-server.jar app.jar

EXPOSE 8082
EXPOSE 5000-5150

ENTRYPOINT ["java","-jar","/app/app.jar"]
