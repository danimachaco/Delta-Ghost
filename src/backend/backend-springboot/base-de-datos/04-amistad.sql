-- PS-56 · Tabla amistad de Ruta Fantasma (MySQL 8)
-- Ejecutar DESPUÉS de 01-usuario.sql (amistad apunta dos veces a usuario).
-- Spring Boot ya la crea solo al arrancar (ddl-auto=update); este script es para
-- crearla a mano en MySQL Workbench o como documentación.

USE ruta_fantasma;

-- Solicitudes de amistad (PENDIENTE) y amistades confirmadas (ACEPTADA).
-- Una fila por pareja y sentido: quien la envía es solicitante y quien la recibe, destinatario.
CREATE TABLE IF NOT EXISTS amistad (
  id              BIGINT      NOT NULL AUTO_INCREMENT,
  solicitante_id  BIGINT      NOT NULL,
  destinatario_id BIGINT      NOT NULL,
  estado          VARCHAR(10) NOT NULL,     -- 'PENDIENTE' o 'ACEPTADA'
  fecha_solicitud DATETIME(6) NOT NULL,
  fecha_aceptada  DATETIME(6) NULL,         -- NULL mientras está pendiente
  PRIMARY KEY (id),
  CONSTRAINT uk_amistad_pareja UNIQUE (solicitante_id, destinatario_id),
  CONSTRAINT fk_amistad_solicitante  FOREIGN KEY (solicitante_id)  REFERENCES usuario (id) ON DELETE CASCADE,
  CONSTRAINT fk_amistad_destinatario FOREIGN KEY (destinatario_id) REFERENCES usuario (id) ON DELETE CASCADE
) ENGINE = InnoDB;
