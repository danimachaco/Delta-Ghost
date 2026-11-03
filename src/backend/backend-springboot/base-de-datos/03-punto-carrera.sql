-- PS-33 · Tabla punto_carrera de Ruta Fantasma (MySQL 8)
-- Ejecutar DESPUÉS de 02-ruta-punto-sector-carrera.sql (punto_carrera apunta a carrera).
-- Spring Boot ya la crea solo al arrancar (ddl-auto=update); este script es para
-- crearla a mano en MySQL Workbench o como documentación.

USE ruta_fantasma;

-- Puntos GPS grabados en cada carrera, en orden, con el tiempo de ESA carrera.
-- Los de la carrera con mejor_marca = 1 son los que sigue la sombra.
CREATE TABLE IF NOT EXISTS punto_carrera (
  id              BIGINT NOT NULL AUTO_INCREMENT,
  carrera_id      BIGINT NOT NULL,
  orden           INT    NOT NULL,          -- 0, 1, 2...
  latitud         DOUBLE NOT NULL,
  longitud        DOUBLE NOT NULL,
  tiempo_segundos BIGINT NOT NULL,          -- segundos desde la salida
  PRIMARY KEY (id),
  CONSTRAINT uk_punto_carrera_orden UNIQUE (carrera_id, orden),
  CONSTRAINT fk_punto_carrera_carrera FOREIGN KEY (carrera_id) REFERENCES carrera (id) ON DELETE CASCADE
) ENGINE = InnoDB;
