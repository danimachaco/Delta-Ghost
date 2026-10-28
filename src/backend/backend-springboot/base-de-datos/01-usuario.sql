-- PS-18 · Tabla usuario de Ruta Fantasma (MySQL 8)
-- Spring Boot ya crea esta tabla sola al arrancar (spring.jpa.hibernate.ddl-auto=update).
-- Este script sirve para crearla a mano desde MySQL Workbench o para entregarla como documentación.

CREATE DATABASE IF NOT EXISTS ruta_fantasma
  CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;

USE ruta_fantasma;

CREATE TABLE IF NOT EXISTS usuario (
  id             BIGINT       NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(40)  NOT NULL,
  email          VARCHAR(100) NOT NULL,
  password_hash  VARCHAR(100) NOT NULL,   -- nunca la contraseña en claro, solo su hash BCrypt
  fecha_registro DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_usuario_email UNIQUE (email)
) ENGINE = InnoDB;
