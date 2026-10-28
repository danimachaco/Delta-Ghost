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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rutafantasma.backend.repositorio.RutaRepository;
import com.rutafantasma.backend.repositorio.UsuarioRepository;

/** Pruebas de POST /api/rutas, GET /api/rutas y GET /api/rutas/{id}. */
@SpringBootTest
@AutoConfigureMockMvc
class RutaControllerTest {

    /** Ruta de 7 puntos (orden 0..6) sin indicar sectores: se dividirá en 3 */
    private static final String RUTA_PARQUE = """
            {"nombre":"Parque del Retiro","puntos":[
              {"latitud":40.4153,"longitud":-3.6845,"tiempoSegundos":0},
              {"latitud":40.4160,"longitud":-3.6850,"tiempoSegundos":40},
              {"latitud":40.4170,"longitud":-3.6858,"tiempoSegundos":85},
              {"latitud":40.4180,"longitud":-3.6865,"tiempoSegundos":130},
              {"latitud":40.4188,"longitud":-3.6872,"tiempoSegundos":172},
              {"latitud":40.4195,"longitud":-3.6880,"tiempoSegundos":215},
              {"latitud":40.4200,"longitud":-3.6890,"tiempoSegundos":260}]}
            """;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private RutaRepository rutas;

    @Autowired
    private UsuarioRepository usuarios;

    private String tokenAna;

    @BeforeEach
    void preparar() throws Exception {
        limpiar();
        tokenAna = registrar("Ana", "ana@correo.com");
    }

    /** Se borran las rutas antes que los usuarios por la clave foránea, y al terminar para no afectar a otras pruebas */
    @AfterEach
    void limpiar() {
        rutas.deleteAll();
        usuarios.deleteAll();
    }

    /** Registra un usuario y devuelve su token */
    private String registrar(String nombre, String email) throws Exception {
        String cuerpo = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"" + nombre + "\",\"email\":\"" + email + "\",\"password\":\"secreta1\"}"))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(cuerpo).get("token").asText();
    }

    private String crearRuta(String token, String cuerpo) throws Exception {
        String respuesta = mvc.perform(post("/api/rutas").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(respuesta).get("id").asText();
    }

    @Test
    void creaUnaRutaConSusPuntosYTresSectores() throws Exception {
        mvc.perform(post("/api/rutas").header("Authorization", "Bearer " + tokenAna)
                .contentType(MediaType.APPLICATION_JSON).content(RUTA_PARQUE))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.nombre").value("Parque del Retiro"))
                .andExpect(jsonPath("$.fecha").isNotEmpty())
                .andExpect(jsonPath("$.puntos.length()").value(7))
                .andExpect(jsonPath("$.puntos[6].tiempoSegundos").value(260))
                .andExpect(jsonPath("$.sectores.length()").value(3))
                .andExpect(jsonPath("$.sectores[0].puntoInicio").value(0))
                .andExpect(jsonPath("$.sectores[0].puntoFin").value(2))
                .andExpect(jsonPath("$.sectores[2].puntoFin").value(6));
    }

    @Test
    void nuncaHayMasSectoresQueTramos() throws Exception {
        String dosPuntos = """
                {"nombre":"Corta","numeroSectores":5,"puntos":[
                  {"latitud":40.0,"longitud":-3.0,"tiempoSegundos":0},
                  {"latitud":40.1,"longitud":-3.1,"tiempoSegundos":60}]}
                """;
        mvc.perform(post("/api/rutas").header("Authorization", "Bearer " + tokenAna)
                .contentType(MediaType.APPLICATION_JSON).content(dosPuntos))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sectores.length()").value(1));
    }

    @Test
    void listaSoloLasRutasDelUsuarioQueLlama() throws Exception {
        crearRuta(tokenAna, RUTA_PARQUE);
        String tokenLuis = registrar("Luis", "luis@correo.com");
        crearRuta(tokenLuis, RUTA_PARQUE.replace("Parque del Retiro", "Ruta de Luis"));

        mvc.perform(get("/api/rutas").header("Authorization", "Bearer " + tokenAna))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].nombre").value("Parque del Retiro"));
    }

    @Test
    void obtieneUnaRutaPorIdPeroNoLaDeOtroUsuario() throws Exception {
        String id = crearRuta(tokenAna, RUTA_PARQUE);
        mvc.perform(get("/api/rutas/" + id).header("Authorization", "Bearer " + tokenAna))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));

        String tokenLuis = registrar("Luis", "luis@correo.com");
        mvc.perform(get("/api/rutas/" + id).header("Authorization", "Bearer " + tokenLuis))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void sinTokenOConTokenFalsoDevuelve401() throws Exception {
        mvc.perform(get("/api/rutas"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Tienes que iniciar sesión para hacer esto"));
        mvc.perform(get("/api/rutas").header("Authorization", "Bearer token-inventado"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validaLosDatosDeLaRuta() throws Exception {
        mvc.perform(post("/api/rutas").header("Authorization", "Bearer " + tokenAna)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"\",\"puntos\":[{\"latitud\":100,\"longitud\":-3.0,\"tiempoSegundos\":0}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.nombre").exists())
                .andExpect(jsonPath("$.puntos").exists())
                .andExpect(jsonPath("$['puntos[0].latitud']").exists());
    }

    @Test
    void rechazaTiemposQueVanHaciaAtras() throws Exception {
        String tiemposMal = """
                {"nombre":"Mal","puntos":[
                  {"latitud":40.0,"longitud":-3.0,"tiempoSegundos":50},
                  {"latitud":40.1,"longitud":-3.1,"tiempoSegundos":10}]}
                """;
        mvc.perform(post("/api/rutas").header("Authorization", "Bearer " + tokenAna)
                .contentType(MediaType.APPLICATION_JSON).content(tiemposMal))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El tiempo del punto 1 es menor que el del punto anterior"));
    }
}
