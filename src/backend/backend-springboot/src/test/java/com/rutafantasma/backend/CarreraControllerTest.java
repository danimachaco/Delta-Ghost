package com.rutafantasma.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

/** Pruebas de POST /api/rutas/{id}/carreras (PS-33). */
@SpringBootTest
@AutoConfigureMockMvc
class CarreraControllerTest {

    /** Ruta grabada en 260 segundos: es la primera sombra */
    private static final String RUTA = """
            {"nombre":"Parque del Retiro","puntos":[
              {"latitud":40.4153,"longitud":-3.6845,"tiempoSegundos":0},
              {"latitud":40.4170,"longitud":-3.6858,"tiempoSegundos":85},
              {"latitud":40.4188,"longitud":-3.6872,"tiempoSegundos":172},
              {"latitud":40.4200,"longitud":-3.6890,"tiempoSegundos":260}]}
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

    /** Carrera de 4 puntos por la misma ruta que termina en el tiempo indicado */
    private static String carrera(long tiempoFinal) {
        return """
                {"puntos":[
                  {"latitud":40.4153,"longitud":-3.6845,"tiempoSegundos":0},
                  {"latitud":40.4170,"longitud":-3.6858,"tiempoSegundos":80},
                  {"latitud":40.4188,"longitud":-3.6872,"tiempoSegundos":160},
                  {"latitud":40.4200,"longitud":-3.6890,"tiempoSegundos":%d}]}
                """.formatted(tiempoFinal);
    }

    private ResultActions subir(String token, String id, String cuerpo) throws Exception {
        return mvc.perform(post("/api/rutas/" + id + "/carreras").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(cuerpo));
    }

    @Test
    void subeUnaCarreraConSusPuntos() throws Exception {
        subir(tokenAna, rutaId, carrera(250))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.rutaId").value(rutaId))
                .andExpect(jsonPath("$.fecha").isNotEmpty())
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(250))
                .andExpect(jsonPath("$.puntos.length()").value(4))
                .andExpect(jsonPath("$.puntos[1].tiempoSegundos").value(80));
    }

    @Test
    void soloEsMejorMarcaSiBajaElTiempoDeLaSombra() throws Exception {
        // La grabación de la ruta tardó 260 s: una carrera más lenta no es mejor marca
        subir(tokenAna, rutaId, carrera(300)).andExpect(jsonPath("$.mejorMarca").value(false));
        subir(tokenAna, rutaId, carrera(250)).andExpect(jsonPath("$.mejorMarca").value(true));
        subir(tokenAna, rutaId, carrera(255)).andExpect(jsonPath("$.mejorMarca").value(false));
        subir(tokenAna, rutaId, carrera(240)).andExpect(jsonPath("$.mejorMarca").value(true));

        // La de 250 s ha dejado de ser la mejor: solo hay una mejor marca por corredor y ruta
        long mejores = carreras.findAll().stream().filter(c -> c.isMejorMarca()).count();
        assertEquals(1, mejores);
        Long ana = usuarios.findByEmailIgnoreCase("ana@correo.com").orElseThrow().getId();
        assertEquals(240, carreras.findFirstByRutaIdAndUsuarioIdAndMejorMarcaTrue(Long.valueOf(rutaId), ana)
                .orElseThrow().getTiempoTotalSegundos());
    }

    @Test
    void noSePuedeSubirUnaCarreraARutaAjenaOInexistente() throws Exception {
        String tokenLuis = registrar("Luis", "luis@correo.com");
        subir(tokenLuis, rutaId, carrera(250))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
        subir(tokenAna, "999999", carrera(250)).andExpect(status().isNotFound());
    }

    @Test
    void sinTokenDevuelve401() throws Exception {
        mvc.perform(post("/api/rutas/" + rutaId + "/carreras")
                .contentType(MediaType.APPLICATION_JSON).content(carrera(250)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validaLosPuntosDeLaCarrera() throws Exception {
        subir(tokenAna, rutaId, "{\"puntos\":[{\"latitud\":100,\"longitud\":-3.0,\"tiempoSegundos\":0}]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.puntos").exists())
                .andExpect(jsonPath("$['puntos[0].latitud']").exists());

        String tiemposMal = """
                {"puntos":[
                  {"latitud":40.0,"longitud":-3.0,"tiempoSegundos":50},
                  {"latitud":40.1,"longitud":-3.1,"tiempoSegundos":10}]}
                """;
        subir(tokenAna, rutaId, tiemposMal)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El tiempo del punto 1 es menor que el del punto anterior"));
    }
}
