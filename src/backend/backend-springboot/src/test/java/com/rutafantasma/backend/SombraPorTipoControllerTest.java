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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rutafantasma.backend.repositorio.AmistadRepository;
import com.rutafantasma.backend.repositorio.CarreraRepository;
import com.rutafantasma.backend.repositorio.RutaRepository;
import com.rutafantasma.backend.repositorio.UsuarioRepository;

/** Pruebas de GET /api/rutas/{id}/sombra/{tipo}: propia, record y amigo (PS-70). */
@SpringBootTest
@AutoConfigureMockMvc
class SombraPorTipoControllerTest {

    /** Ruta de Ana grabada en 260 s */
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
    private AmistadRepository amistades;

    @Autowired
    private CarreraRepository carreras;

    @Autowired
    private RutaRepository rutas;

    @Autowired
    private UsuarioRepository usuarios;

    private JsonNode ana;
    private JsonNode luis;
    private JsonNode eva;
    private String rutaId;

    /** Ana tiene la ruta y es amiga de Luis; Eva todavía no es amiga de nadie */
    @BeforeEach
    void preparar() throws Exception {
        limpiar();
        ana = registrar("Ana", "ana@correo.com");
        luis = registrar("Luis", "luis@correo.com");
        eva = registrar("Eva", "eva@correo.com");
        hacerAmigos(ana, luis);

        String respuesta = mvc.perform(post("/api/rutas").header("Authorization", "Bearer " + token(ana))
                .contentType(MediaType.APPLICATION_JSON).content(RUTA))
                .andReturn().getResponse().getContentAsString();
        rutaId = json.readTree(respuesta).get("id").asText();
    }

    /** Se borra en orden por las claves foráneas */
    @AfterEach
    void limpiar() {
        carreras.deleteAll();
        rutas.deleteAll();
        amistades.deleteAll();
        usuarios.deleteAll();
    }

    /** Registra un usuario y devuelve la respuesta { token, usuario } */
    private JsonNode registrar(String nombre, String email) throws Exception {
        String cuerpo = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"" + nombre + "\",\"email\":\"" + email + "\",\"password\":\"secreta1\"}"))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(cuerpo);
    }

    private static String token(JsonNode quien) {
        return quien.get("token").asText();
    }

    private static String id(JsonNode quien) {
        return quien.get("usuario").get("id").asText();
    }

    private void hacerAmigos(JsonNode uno, JsonNode otro) throws Exception {
        String solicitud = mvc.perform(post("/api/amigos/solicitudes").header("Authorization", "Bearer " + token(uno))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + otro.get("usuario").get("email").asText() + "\"}"))
                .andReturn().getResponse().getContentAsString();
        mvc.perform(post("/api/amigos/solicitudes/" + json.readTree(solicitud).get("id").asText() + "/aceptar")
                .header("Authorization", "Bearer " + token(otro)));
    }

    private String correr(JsonNode quien, long tiempoFinal) throws Exception {
        String cuerpo = """
                {"puntos":[
                  {"latitud":40.4153,"longitud":-3.6845,"tiempoSegundos":0},
                  {"latitud":40.4170,"longitud":-3.6858,"tiempoSegundos":80},
                  {"latitud":40.4188,"longitud":-3.6872,"tiempoSegundos":160},
                  {"latitud":40.4200,"longitud":-3.6890,"tiempoSegundos":%d}]}
                """.formatted(tiempoFinal);
        String respuesta = mvc.perform(post("/api/rutas/" + rutaId + "/carreras").header("Authorization", "Bearer " + token(quien))
                .contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(respuesta).get("id").asText();
    }

    private ResultActions sombra(JsonNode quien, String tipoYParametros) throws Exception {
        return mvc.perform(get("/api/rutas/" + rutaId + "/sombra/" + tipoYParametros)
                .header("Authorization", "Bearer " + token(quien)));
    }

    @Test
    void elRecordEsLaMejorMarcaDeTodos() throws Exception {
        // Sin carreras, el récord es la grabación de Ana
        sombra(luis, "record")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("record"))
                .andExpect(jsonPath("$.usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.carreraId").doesNotExist())
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(260));

        String carreraLuis = correr(luis, 240);
        correr(ana, 250);
        sombra(ana, "record")
                .andExpect(jsonPath("$.usuario.nombre").value("Luis"))
                .andExpect(jsonPath("$.carreraId").value(carreraLuis))
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(240))
                .andExpect(jsonPath("$.puntos.length()").value(4))
                .andExpect(jsonPath("$.sectores.length()").value(3))
                .andExpect(jsonPath("$.sectores[2].tiempoSegundos").value(240));
    }

    @Test
    void laPropiaEsTuMejorMarcaAunqueOtroSeaMasRapido() throws Exception {
        correr(luis, 240);
        sombra(ana, "propia")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("propia"))
                .andExpect(jsonPath("$.usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(260));
        // El endpoint de siempre (PS-36) devuelve la sombra propia
        mvc.perform(get("/api/rutas/" + rutaId + "/sombra").header("Authorization", "Bearer " + token(ana)))
                .andExpect(jsonPath("$.tipo").value("propia"))
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(260));
    }

    @Test
    void siAunNoHasCorridoLaRutaTuSombraPropiaEsLaGrabacion() throws Exception {
        sombra(luis, "propia")
                .andExpect(jsonPath("$.usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.carreraId").doesNotExist());
    }

    @Test
    void laDeUnAmigoEsSuMejorMarcaEnLaRuta() throws Exception {
        String carreraLuis = correr(luis, 245);
        correr(luis, 290);

        sombra(ana, "amigo?amigoId=" + id(luis))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("amigo"))
                .andExpect(jsonPath("$.usuario.nombre").value("Luis"))
                .andExpect(jsonPath("$.carreraId").value(carreraLuis))
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(245));
        // Y al revés: la de Ana es su grabación
        sombra(luis, "amigo?amigoId=" + id(ana))
                .andExpect(jsonPath("$.usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(260));
    }

    @Test
    void laDeUnAmigoNecesitaUnAmigoQueHayaCorridoLaRuta() throws Exception {
        sombra(ana, "amigo")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Para correr contra un amigo indica cuál con ?amigoId="));
        // Eva no es amiga de Ana
        sombra(ana, "amigo?amigoId=" + id(eva))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("No tienes ningún amigo con id " + id(eva)));
        // Ahora sí lo es, pero todavía no ha corrido la ruta
        hacerAmigos(ana, eva);
        sombra(ana, "amigo?amigoId=" + id(eva))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Tu amigo todavía no ha corrido esta ruta"));
    }

    @Test
    void elTipoTieneQueExistirPeroDaIgualMayusculas() throws Exception {
        sombra(ana, "fantasma")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("El tipo de sombra \"fantasma\" no existe: usa propia, record o amigo"));
        sombra(ana, "RECORD").andExpect(status().isOk()).andExpect(jsonPath("$.tipo").value("record"));
    }

    @Test
    void quienNoPuedeVerLaRutaRecibe404YSinToken401() throws Exception {
        sombra(eva, "record").andExpect(status().isNotFound());
        mvc.perform(get("/api/rutas/" + rutaId + "/sombra/record")).andExpect(status().isUnauthorized());
    }
}
