package com.rutafantasma.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rutafantasma.backend.repositorio.AmistadRepository;
import com.rutafantasma.backend.repositorio.UsuarioRepository;

/** Pruebas de la API de amigos: /api/amigos y /api/amigos/solicitudes (PS-56). */
@SpringBootTest
@AutoConfigureMockMvc
class AmigoControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private AmistadRepository amistades;

    @Autowired
    private UsuarioRepository usuarios;

    private String tokenAna;
    private String tokenLuis;

    @BeforeEach
    void preparar() throws Exception {
        limpiar();
        tokenAna = registrar("Ana", "ana@correo.com");
        tokenLuis = registrar("Luis", "luis@correo.com");
    }

    /** Se borran las amistades antes que los usuarios por las claves foráneas */
    @AfterEach
    void limpiar() {
        amistades.deleteAll();
        usuarios.deleteAll();
    }

    private String registrar(String nombre, String email) throws Exception {
        String cuerpo = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"" + nombre + "\",\"email\":\"" + email + "\",\"password\":\"secreta1\"}"))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(cuerpo).get("token").asText();
    }

    private ResultActions enviar(String token, String email) throws Exception {
        return mvc.perform(post("/api/amigos/solicitudes").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"" + email + "\"}"));
    }

    private ResultActions aceptar(String token, String id) throws Exception {
        return mvc.perform(post("/api/amigos/solicitudes/" + id + "/aceptar").header("Authorization", "Bearer " + token));
    }

    private ResultActions pedir(String token, String ruta) throws Exception {
        return mvc.perform(get(ruta).header("Authorization", "Bearer " + token));
    }

    /** Ana envía una solicitud a Luis y devuelve su id */
    private String anaPideALuis() throws Exception {
        String respuesta = enviar(tokenAna, "luis@correo.com").andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(respuesta).get("id").asText();
    }

    @Test
    void enviaUnaSolicitudPorEmail() throws Exception {
        enviar(tokenAna, "LUIS@correo.com")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.estado").value("PENDIENTE"))
                .andExpect(jsonPath("$.usuario.nombre").value("Luis"))
                .andExpect(jsonPath("$.fecha").isNotEmpty());
    }

    @Test
    void cadaUnoVeSusSolicitudesRecibidasYEnviadas() throws Exception {
        anaPideALuis();

        pedir(tokenLuis, "/api/amigos/solicitudes")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recibidas.length()").value(1))
                .andExpect(jsonPath("$.recibidas[0].usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.enviadas.length()").value(0));
        pedir(tokenAna, "/api/amigos/solicitudes")
                .andExpect(jsonPath("$.recibidas.length()").value(0))
                .andExpect(jsonPath("$.enviadas[0].usuario.nombre").value("Luis"));
    }

    @Test
    void alAceptarLaSolicitudLosDosSonAmigos() throws Exception {
        String id = anaPideALuis();
        // Antes de aceptar todavía no son amigos
        pedir(tokenAna, "/api/amigos").andExpect(jsonPath("$.length()").value(0));

        aceptar(tokenLuis, id)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("ACEPTADA"))
                .andExpect(jsonPath("$.usuario.nombre").value("Ana"));

        pedir(tokenAna, "/api/amigos")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].usuario.nombre").value("Luis"))
                .andExpect(jsonPath("$[0].usuario.password").doesNotExist());
        pedir(tokenLuis, "/api/amigos").andExpect(jsonPath("$[0].usuario.nombre").value("Ana"));
        // Ya no queda ninguna solicitud pendiente
        pedir(tokenLuis, "/api/amigos/solicitudes").andExpect(jsonPath("$.recibidas.length()").value(0));
    }

    @Test
    void soloElDestinatarioPuedeAceptarYSoloUnaVez() throws Exception {
        String id = anaPideALuis();
        String tokenEva = registrar("Eva", "eva@correo.com");

        aceptar(tokenAna, id).andExpect(status().isNotFound()).andExpect(jsonPath("$.error").exists());
        aceptar(tokenEva, id).andExpect(status().isNotFound());
        aceptar(tokenLuis, id).andExpect(status().isOk());
        aceptar(tokenLuis, id).andExpect(status().isNotFound());
        aceptar(tokenLuis, "999999").andExpect(status().isNotFound());
    }

    @Test
    void siYaTeHabiaPedidoAmistadSeAceptaDirectamente() throws Exception {
        anaPideALuis();
        enviar(tokenLuis, "ana@correo.com")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("ACEPTADA"));
        pedir(tokenAna, "/api/amigos").andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void noSeRepitenSolicitudesNiAmistades() throws Exception {
        String id = anaPideALuis();
        enviar(tokenAna, "luis@correo.com")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Ya le has enviado una solicitud de amistad"));

        aceptar(tokenLuis, id);
        enviar(tokenAna, "luis@correo.com").andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Ya sois amigos"));
        enviar(tokenLuis, "ana@correo.com").andExpect(status().isConflict());
    }

    @Test
    void rechazaEmailsIncorrectosDesconocidosYElPropio() throws Exception {
        enviar(tokenAna, "no-es-un-email").andExpect(status().isBadRequest()).andExpect(jsonPath("$.email").exists());
        enviar(tokenAna, "nadie@correo.com").andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("No hay ningún corredor registrado con ese email"));
        enviar(tokenAna, "ana@correo.com").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("No puedes enviarte una solicitud de amistad a ti mismo"));
    }

    @Test
    void sinTokenDevuelve401() throws Exception {
        mvc.perform(get("/api/amigos")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/amigos/solicitudes")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/amigos/solicitudes").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"luis@correo.com\"}")).andExpect(status().isUnauthorized());
    }
}
