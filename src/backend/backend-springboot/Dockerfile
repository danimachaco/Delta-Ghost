# Imagen del backend para publicarlo en la nube (Render).
# Dos etapas: la primera compila con Maven y la segunda solo lleva Java para ejecutar,
# así la imagen final es mucho más pequeña.

# ---- 1. Compilar ----
FROM maven:3.9-eclipse-temurin-17 AS compilacion
WORKDIR /app
# Primero solo el pom.xml: si no cambian las dependencias, Docker reutiliza esta capa
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
# Las pruebas ya se pasan antes de fusionar la Pull Request
RUN mvn -B -q package -DskipTests

# ---- 2. Ejecutar ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=compilacion /app/target/backend-mysql-*.jar app.jar
# Render indica el puerto con la variable PORT (application.properties la lee)
EXPOSE 8080
# MaxRAMPercentage: Java usa como mucho el 75 % de la memoria del contenedor (el plan gratis tiene poca)
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
