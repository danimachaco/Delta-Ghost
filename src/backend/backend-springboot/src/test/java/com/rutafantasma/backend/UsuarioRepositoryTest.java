package com.rutafantasma.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import com.rutafantasma.backend.modelo.Usuario;
import com.rutafantasma.backend.repositorio.UsuarioRepository;

/** Comprueba que la tabla "usuario" se crea y funciona como se espera. */
@DataJpaTest
class UsuarioRepositoryTest {

    @Autowired
    private UsuarioRepository repositorio;

    @Test
    void guardaUnUsuarioConIdYFechaDeRegistro() {
        Usuario guardado = repositorio.saveAndFlush(new Usuario("Ana", "ana@correo.com", "hash"));

        assertThat(guardado.getId()).isNotNull();
        assertThat(guardado.getFechaRegistro()).isNotNull();
    }

    @Test
    void buscaPorEmailSinImportarMayusculas() {
        repositorio.saveAndFlush(new Usuario("Ana", "ana@correo.com", "hash"));

        assertThat(repositorio.findByEmailIgnoreCase("ANA@correo.com")).isPresent();
        assertThat(repositorio.existsByEmailIgnoreCase("otro@correo.com")).isFalse();
    }

    @Test
    void noPermiteDosUsuariosConElMismoEmail() {
        repositorio.saveAndFlush(new Usuario("Ana", "ana@correo.com", "hash"));

        assertThatThrownBy(() -> repositorio.saveAndFlush(new Usuario("Otra Ana", "ana@correo.com", "hash")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
