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
import com.rutafantasma.backend.repositorio.CarreraRepository;
import com.rutafantasma.backend.repositorio.RutaRepository;
import com.rutafantasma.backend.repositorio.UsuarioRepository;

/** Pruebas de GET /api/rutas/{id}/sombra (PS-36). */
@SpringBootTest
@AutoConfigureMockMvc
class SombraControllerTest {

    /** Ruta de 7 puntos grabada en 260 s: sectores 0→2, 2→4 y 4→6 */
    private static final String RUTA = """
            {"nombre":"Parque del Retiro","puntos":[
              {"latitud":40.4153,"longitud":-3.6845,"tiempoSegundos":0},
              {"latitud":40.4160,"longitud":-3.6850,"tiempoSegundos":40},
              {"latitud":40.4170,"longitud":-3.6858,"tiempoSegundos":85},
              {"latitud":40.4180,"longitud":-3.6865,"tiempoSegundos":130},
              {"latitud":40.4188,"longitud":-3.6872,"tiempoSegundos":172},
              {"latitud":40.4195,"longitud":-3.6880,"tiempoSegundos":215},
              {"latitud":40.4200,"longitud":-3.6890,"tiempoSegundos":260}]}
            """;

    /** Carrera más rápida (240 s) con solo 4 puntos, grabados cerca de los puntos 0, 2, 4 y 6 de la ruta */
    private static final String CARRERA_RAPIDA = """
            {"puntos":[
              {"latitud":40.41531,"longitud":-3.68451,"tiempoSegundos":0},
              {"latitud":40.41701,"longitud":-3.68581,"tiempoSegundos":78},
              {"latitud":40.41879,"longitud":-3.68719,"tiempoSegundos":160},
              {"latitud":40.42001,"longitud":-3.68901,"tiempoSegundos":240}]}
            """;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private CarreraRepository carreras;

    @Autowired
    private RutaRepository rutas;

    @Autowired
    private UsuarioRepository usuarios;

    private String tokenAna;
    private String rutaId;

    @BeforeEach
    void preparar() throws Exception {
        limpiar();
        tokenAna = registrar("Ana", "ana@correo.com");
        String respuesta = mvc.perform(post("/api/rutas").header("Authorization", "Bearer " + tokenAna)
                .contentType(MediaType.APPLICATION_JSON).content(RUTA))
                .andReturn().getResponse().getContentAsString();
        rutaId = json.readTree(respuesta).get("id").asText();
    }

    /** Se borran en orden por las claves foráneas: carreras → rutas → usuarios */
    @AfterEach
    void limpiar() {
        carreras.deleteAll();
        rutas.deleteAll();
        usuarios.deleteAll();
    }

    private String registrar(String nombre, String email) throws Exception {
        String cuerpo = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"" + nombre + "\",\"email\":\"" + email + "\",\"password\":\"secreta1\"}"))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(cuerpo).get("token").asText();
    }

    private String subirCarrera(String cuerpo) throws Exception {
        String respuesta = mvc.perform(post("/api/rutas/" + rutaId + "/carreras").header("Authorization", "Bearer " + tokenAna)
                .contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(respuesta).get("id").asText();
    }

    private ResultActions pedirSombra(String token, String id) throws Exception {
        return mvc.perform(get("/api/rutas/" + id + "/sombra").header("Authorization", "Bearer " + token));
    }

    @Test
    void sinCarrerasLaSombraEsLaGrabacionDeLaRuta() throws Exception {
        pedirSombra(tokenAna, rutaId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rutaId").value(rutaId))
                .andExpect(jsonPath("$.carreraId").doesNotExist())
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(260))
                .andExpect(jsonPath("$.puntos.length()").value(7))
                .andExpect(jsonPath("$.sectores.length()").value(3))
                .andExpect(jsonPath("$.sectores[0].tiempoSegundos").value(85))
                .andExpect(jsonPath("$.sectores[1].tiempoSegundos").value(172))
                .andExpect(jsonPath("$.sectores[2].tiempoSegundos").value(260));
    }

    @Test
    void laSombraEsLaCarreraConMejorMarca() throws Exception {
        String rapida = subirCarrera(CARRERA_RAPIDA);
        // Una carrera más lenta después no cambia la sombra
        subirCarrera(CARRERA_RAPIDA.replace("\"tiempoSegundos\":240", "\"tiempoSegundos\":300"));

        pedirSombra(tokenAna, rutaId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.carreraId").value(rapida))
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(240))
                .andExpect(jsonPath("$.puntos.length()").value(4))
                .andExpect(jsonPath("$.puntos[1].tiempoSegundos").value(78))
                // Los sectores siguen siendo los de la ruta, con el tiempo del punto de la sombra más cercano
                .andExpect(jsonPath("$.sectores[0].puntoFin").value(2))
                .andExpect(jsonPath("$.sectores[0].tiempoSegundos").value(78))
                .andExpect(jsonPath("$.sectores[1].tiempoSegundos").value(160))
                .andExpect(jsonPath("$.sectores[2].tiempoSegundos").value(240));
    }

    @Test
    void noSeDescargaLaSombraDeUnaRutaAjenaOInexistente() throws Exception {
        String tokenLuis = registrar("Luis", "luis@correo.com");
        pedirSombra(tokenLuis, rutaId)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
        pedirSombra(tokenAna, "999999").andExpect(status().isNotFound());
    }

    @Test
    void sinTokenDevuelve401() throws Exception {
        mvc.perform(get("/api/rutas/" + rutaId + "/sombra")).andExpect(status().isUnauthorized());
    }
}
