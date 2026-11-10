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

/**
 * Pruebas de GET /api/rutas/{id}/sombra?tipo=… (PS-70): MEJOR, ULTIMA y ORIGINAL (contrato de la
 * pantalla "Elige sombra", PS-71) y RECORD y AMIGO para competir con otros corredores.
 */
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

    /** Pide la sombra con los parámetros indicados (por ejemplo "?tipo=ULTIMA") */
    private ResultActions sombra(JsonNode quien, String parametros) throws Exception {
        return mvc.perform(get("/api/rutas/" + rutaId + "/sombra" + parametros)
                .header("Authorization", "Bearer " + token(quien)));
    }

    @Test
    void sinTipoEsLaMejorMarcaYTraeElTipo() throws Exception {
        correr(ana, 250);
        correr(ana, 255);
        sombra(ana, "")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("MEJOR"))
                .andExpect(jsonPath("$.usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.usuario.email").doesNotExist())
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(250));
        sombra(ana, "?tipo=MEJOR").andExpect(jsonPath("$.tiempoTotalSegundos").value(250));
    }

    @Test
    void laMejorEsLaTuyaAunqueOtroSeaMasRapidoOLaGrabacionSiNoHasCorrido() throws Exception {
        correr(luis, 240);
        sombra(ana, "?tipo=MEJOR").andExpect(jsonPath("$.tiempoTotalSegundos").value(260));
        // Eva se hace amiga de Ana y aún no ha corrido: su mejor sombra es la grabación
        hacerAmigos(ana, eva);
        sombra(eva, "?tipo=MEJOR")
                .andExpect(jsonPath("$.usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.carreraId").doesNotExist());
    }

    @Test
    void laUltimaEsTuCarreraMasRecienteAunqueNoSeaLaMejor() throws Exception {
        correr(ana, 250);
        String ultima = correr(ana, 290);
        correr(luis, 200); // las carreras de otros no cuentan
        sombra(ana, "?tipo=ULTIMA")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("ULTIMA"))
                .andExpect(jsonPath("$.carreraId").value(ultima))
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(290))
                .andExpect(jsonPath("$.sectores.length()").value(3));
    }

    @Test
    void sinCarrerasNoHayUltimaYDevuelve404() throws Exception {
        sombra(ana, "?tipo=ULTIMA")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Todavía no has corrido esta ruta"));
    }

    @Test
    void laOriginalEsSiempreLaGrabacionDeLaRuta() throws Exception {
        correr(ana, 200);
        sombra(luis, "?tipo=ORIGINAL")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("ORIGINAL"))
                .andExpect(jsonPath("$.carreraId").doesNotExist())
                .andExpect(jsonPath("$.usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(260))
                .andExpect(jsonPath("$.sectores[0].tiempoSegundos").value(85));
    }

    @Test
    void elRecordEsLaMejorMarcaDeTodos() throws Exception {
        sombra(luis, "?tipo=RECORD").andExpect(jsonPath("$.usuario.nombre").value("Ana"));

        String carreraLuis = correr(luis, 240);
        correr(ana, 250);
        sombra(ana, "?tipo=record")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("RECORD"))
                .andExpect(jsonPath("$.usuario.nombre").value("Luis"))
                .andExpect(jsonPath("$.carreraId").value(carreraLuis))
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(240));
    }

    @Test
    void laDeUnAmigoEsSuMejorMarcaEnLaRuta() throws Exception {
        String carreraLuis = correr(luis, 245);
        correr(luis, 290);
        sombra(ana, "?tipo=AMIGO&amigoId=" + id(luis))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("AMIGO"))
                .andExpect(jsonPath("$.usuario.nombre").value("Luis"))
                .andExpect(jsonPath("$.carreraId").value(carreraLuis))
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(245));
    }

    @Test
    void laDeUnAmigoNecesitaUnAmigoQueHayaCorridoLaRuta() throws Exception {
        sombra(ana, "?tipo=AMIGO")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Para correr contra un amigo indica cuál con &amigoId="));
        sombra(ana, "?tipo=AMIGO&amigoId=" + id(eva))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("No tienes ningún amigo con id " + id(eva)));
        hacerAmigos(ana, eva);
        sombra(ana, "?tipo=AMIGO&amigoId=" + id(eva))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Tu amigo todavía no ha corrido esta ruta"));
    }

    @Test
    void unTipoQueNoExisteDevuelve400() throws Exception {
        sombra(ana, "?tipo=FANTASMA")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error")
                        .value("El tipo de sombra \"FANTASMA\" no existe: usa MEJOR, ULTIMA, ORIGINAL, RECORD o AMIGO"));
    }

    @Test
    void quienNoPuedeVerLaRutaRecibe404YSinToken401() throws Exception {
        sombra(eva, "?tipo=RECORD").andExpect(status().isNotFound());
        mvc.perform(get("/api/rutas/" + rutaId + "/sombra?tipo=RECORD")).andExpect(status().isUnauthorized());
    }
}
