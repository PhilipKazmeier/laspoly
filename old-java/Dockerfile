# Production image: Gradle build → Jersey API + static download site (nginx).
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /src
COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle
COPY libs ./libs
COPY src ./src
RUN chmod +x gradlew && ./gradlew jar serverJar -q

FROM eclipse-temurin:21-jre-jammy
RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx curl \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

WORKDIR /app
COPY --from=build /src/dist/LasPoly-server.jar /app/server.jar
COPY --from=build /src/dist/LasPoly.jar /var/www/laspoly/download/LasPoly.jar
COPY web /var/www/laspoly
COPY docker/nginx.conf /etc/nginx/conf.d/laspoly.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV LASPOLY_BASE_URI=http://127.0.0.1:8080/laspoly/
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS http://127.0.0.1/laspoly/games >/dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
