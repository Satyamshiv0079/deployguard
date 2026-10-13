# Multi-stage Dockerfile for DeployGuard Spring Boot Backend
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /workspace/app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src src
RUN mvn clean package -DskipTests

# Runtime Stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Install curl for HEALTHCHECK
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Non-root secure user
RUN addgroup --system deployguard && adduser --system --ingroup deployguard deployguard
USER deployguard:deployguard

COPY --from=builder --chown=deployguard:deployguard /workspace/app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
