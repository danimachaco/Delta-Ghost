-- PS-23 · Tablas ruta, punto, sector y carrera de Ruta Fantasma (MySQL 8)
-- Ejecutar DESPUÉS de 01-usuario.sql (ruta y carrera apuntan a usuario).
-- Spring Boot ya las crea solo al arrancar (ddl-auto=update); este script es para
-- crearlas a mano en MySQL Workbench o como documentación.

USE ruta_fantasma;

-- Recorrido guardado por un usuario
CREATE TABLE IF NOT EXISTS ruta (
  id             BIGINT      NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(60) NOT NULL,
  usuario_id     BIGINT      NOT NULL,
  fecha_creacion DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_ruta_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id)
) ENGINE = InnoDB;

-- Puntos GPS de la ruta, en orden, con el tiempo de la "sombra" en cada uno
CREATE TABLE IF NOT EXISTS punto (
  id              BIGINT NOT NULL AUTO_INCREMENT,
  ruta_id         BIGINT NOT NULL,
  orden           INT    NOT NULL,          -- 0, 1, 2...
  latitud         DOUBLE NOT NULL,
  longitud        DOUBLE NOT NULL,
  tiempo_segundos BIGINT NOT NULL,          -- segundos desde la salida
  PRIMARY KEY (id),
  CONSTRAINT uk_punto_ruta_orden UNIQUE (ruta_id, orden),
  CONSTRAINT fk_punto_ruta FOREIGN KEY (ruta_id) REFERENCES ruta (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Tramos de la ruta (como los sectores de un circuito de F1)
CREATE TABLE IF NOT EXISTS sector (
  id           BIGINT NOT NULL AUTO_INCREMENT,
  ruta_id      BIGINT NOT NULL,
  numero       INT    NOT NULL,             -- 1, 2, 3...
  punto_inicio INT    NOT NULL,             -- orden del punto donde empieza
  punto_fin    INT    NOT NULL,             -- orden del punto donde termina
  PRIMARY KEY (id),
  CONSTRAINT uk_sector_ruta_numero UNIQUE (ruta_id, numero),
  CONSTRAINT fk_sector_ruta FOREIGN KEY (ruta_id) REFERENCES ruta (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- Cada vez que un usuario corre una ruta. La más rápida es la "sombra".
CREATE TABLE IF NOT EXISTS carrera (
  id                    BIGINT      NOT NULL AUTO_INCREMENT,
  ruta_id               BIGINT      NOT NULL,
  usuario_id            BIGINT      NOT NULL,
  fecha                 DATETIME(6) NOT NULL,
  tiempo_total_segundos BIGINT      NOT NULL,
  mejor_marca           BIT(1)      NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_carrera_ruta    FOREIGN KEY (ruta_id)    REFERENCES ruta (id) ON DELETE CASCADE,
  CONSTRAINT fk_carrera_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id)
) ENGINE = InnoDB;

