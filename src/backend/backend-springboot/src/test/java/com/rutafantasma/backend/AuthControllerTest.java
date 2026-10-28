package com.rutafantasma.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.rutafantasma.backend.repositorio.UsuarioRepository;

/** Pruebas de POST /api/auth/registro y POST /api/auth/login con la aplicación completa. */
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UsuarioRepository usuarios;

    @BeforeEach
    void limpiar() {
        usuarios.deleteAll();
    }

    private void registrarAna() throws Exception {
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Ana\",\"email\":\"ana@correo.com\",\"password\":\"secreta1\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void registroDevuelveTokenYUsuarioSinContrasena() throws Exception {
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Ana\",\"email\":\"Ana@Correo.com\",\"password\":\"secreta1\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.usuario.id").isString())
                .andExpect(jsonPath("$.usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.usuario.email").value("ana@correo.com"))
                .andExpect(jsonPath("$.usuario.password").doesNotExist());

        // En la base de datos se guarda el hash, no la contraseña
        String hash = usuarios.findByEmailIgnoreCase("ana@correo.com").orElseThrow().getPasswordHash();
        assertThat(hash).isNotEqualTo("secreta1").startsWith("$2");
    }

    @Test
    void registroConEmailRepetidoDevuelve409() throws Exception {
        registrarAna();
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Otra\",\"email\":\"ANA@correo.com\",\"password\":\"secreta1\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Ya existe una cuenta con ese email"));
    }

    @Test
    void registroConDatosIncorrectosDevuelve400PorCampo() throws Exception {
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"\",\"email\":\"no-es-email\",\"password\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.nombre").exists())
                .andExpect(jsonPath("$.email").exists())
                .andExpect(jsonPath("$.password").exists());
    }

    @Test
    void loginCorrectoDevuelveToken() throws Exception {
        registrarAna();
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ana@correo.com\",\"password\":\"secreta1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.usuario.nombre").value("Ana"));
    }

    @Test
    void loginConContrasenaIncorrectaDevuelve401() throws Exception {
        registrarAna();
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ana@correo.com\",\"password\":\"mala\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("El email o la contraseña no son correctos"));
    }

    @Test
    void loginConEmailQueNoExisteDevuelve401() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"nadie@correo.com\",\"password\":\"secreta1\"}"))
                .andExpect(status().isUnauthorized());
    }
}
