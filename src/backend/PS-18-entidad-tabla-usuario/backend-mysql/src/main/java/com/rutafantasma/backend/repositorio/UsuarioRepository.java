package com.rutafantasma.backend.repositorio;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rutafantasma.backend.modelo.Usuario;

/** Acceso a la tabla "usuario" de MySQL. Spring genera las consultas a partir del nombre del método. */
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
