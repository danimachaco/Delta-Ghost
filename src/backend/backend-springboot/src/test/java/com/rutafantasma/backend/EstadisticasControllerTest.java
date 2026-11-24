package com.rutafantasma.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

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
import com.rutafantasma.backend.dto.EstadisticasResponse;
import com.rutafantasma.backend.repositorio.AmistadRepository;
import com.rutafantasma.backend.repositorio.CarreraRepository;
import com.rutafantasma.backend.repositorio.RutaRepository;
import com.rutafantasma.backend.repositorio.UsuarioRepository;
import com.rutafantasma.backend.servicio.EstadisticasService;

/** Pruebas de GET /api/estadisticas (PS-75). */
@SpringBootTest
@AutoConfigureMockMvc
class EstadisticasControllerTest {

    /** Ruta recta hacia el norte de unos 222 m (2 tramos de 0,001º de latitud), grabada en 120 s */
    private static final String RUTA = """
            {"nombre":"Recta del parque","puntos":[
              {"latitud":40.000,"longitud":-3.7,"tiempoSegundos":0},
              {"latitud":40.001,"longitud":-3.7,"tiempoSegundos":60},
              {"latitud":40.002,"longitud":-3.7,"tiempoSegundos":120}]}
            """;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private EstadisticasService servicio;

    @Autowired
    private AmistadRepository amistades;

    @Autowired
    private CarreraRepository carreras;

    @Autowired
    private RutaRepository rutas;

    @Autowired
    private UsuarioRepository usuarios;

    private JsonNode ana;
    private String rutaId;

    @BeforeEach
    void preparar() throws Exception {
        limpiar();
        ana = registrar("Ana", "ana@correo.com");
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

    private JsonNode registrar(String nombre, String email) throws Exception {
        String cuerpo = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"" + nombre + "\",\"email\":\"" + email + "\",\"password\":\"secreta1\"}"))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(cuerpo);
    }

    private static String token(JsonNode quien) {
        return quien.get("token").asText();
    }

    /** Corre la ruta entera en el tiempo indicado */
    private void correr(JsonNode quien, long tiempoFinal) throws Exception {
        String cuerpo = """
                {"puntos":[
                  {"latitud":40.000,"longitud":-3.7,"tiempoSegundos":0},
                  {"latitud":40.001,"longitud":-3.7,"tiempoSegundos":%d},
                  {"latitud":40.002,"longitud":-3.7,"tiempoSegundos":%d}]}
                """.formatted(tiempoFinal / 2, tiempoFinal);
        mvc.perform(post("/api/rutas/" + rutaId + "/carreras").header("Authorization", "Bearer " + token(quien))
                .contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isCreated());
    }

    private ResultActions estadisticas(JsonNode quien, String parametros) throws Exception {
        return mvc.perform(get("/api/estadisticas" + parametros).header("Authorization", "Bearer " + token(quien)));
    }

    @Test
    void resumeTodasLasVecesQueHasCorrido() throws Exception {
        correr(ana, 100);
        correr(ana, 110);

        // 3 veces (la grabación y 2 carreras) de unos 222 m: 667 m en 330 s
        estadisticas(ana, "")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumen.carreras").value(3))
                .andExpect(jsonPath("$.resumen.rutasCorridas").value(1))
                .andExpect(jsonPath("$.resumen.distanciaTotalMetros").value(667))
                .andExpect(jsonPath("$.resumen.tiempoTotalSegundos").value(330))
                .andExpect(jsonPath("$.resumen.ritmoMedioSegundosKm").value(495))
                // La más rápida: 100 s para 222,4 m = 450 s/km (7:30 /km)
                .andExpect(jsonPath("$.resumen.mejorRitmoSegundosKm").value(450))
                .andExpect(jsonPath("$.resumen.carreraMasLargaMetros").value(222));
    }

    @Test
    void muestraElProgresoEnCadaRuta() throws Exception {
        correr(ana, 100);
        correr(ana, 110);

        estadisticas(ana, "")
                .andExpect(jsonPath("$.rutas.length()").value(1))
                .andExpect(jsonPath("$.rutas[0].rutaId").value(rutaId))
                .andExpect(jsonPath("$.rutas[0].nombre").value("Recta del parque"))
                .andExpect(jsonPath("$.rutas[0].carreras").value(3))
                .andExpect(jsonPath("$.rutas[0].primerTiempoSegundos").value(120))
                .andExpect(jsonPath("$.rutas[0].mejorTiempoSegundos").value(100))
                .andExpect(jsonPath("$.rutas[0].ultimoTiempoSegundos").value(110))
                .andExpect(jsonPath("$.rutas[0].mejoraSegundos").value(20));
    }

    @Test
    void laEvolucionVaEnOrdenDeFechaEmpezandoPorLaGrabacion() throws Exception {
        correr(ana, 100);
        estadisticas(ana, "")
                .andExpect(jsonPath("$.evolucion.length()").value(2))
                .andExpect(jsonPath("$.evolucion[0].carreraId").doesNotExist())
                .andExpect(jsonPath("$.evolucion[0].tiempoTotalSegundos").value(120))
                .andExpect(jsonPath("$.evolucion[1].carreraId").isString())
                .andExpect(jsonPath("$.evolucion[1].rutaNombre").value("Recta del parque"))
                .andExpect(jsonPath("$.evolucion[1].tiempoTotalSegundos").value(100))
                .andExpect(jsonPath("$.evolucion[1].ritmoSegundosKm").value(450));
    }

    @Test
    void lasSemanasIncluyenLasVaciasYTerminanEnLaActual() throws Exception {
        correr(ana, 100);
        String lunes = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toString();

        estadisticas(ana, "")
                .andExpect(jsonPath("$.semanas.length()").value(12))
                .andExpect(jsonPath("$.semanas[11].inicio").value(lunes))
                .andExpect(jsonPath("$.semanas[11].carreras").value(2))
                .andExpect(jsonPath("$.semanas[11].tiempoSegundos").value(220))
                .andExpect(jsonPath("$.semanas[10].carreras").value(0))
                .andExpect(jsonPath("$.semanas[10].distanciaMetros").value(0));
        estadisticas(ana, "?semanas=4").andExpect(jsonPath("$.semanas.length()").value(4));
        // Se limita entre 1 y 52
        estadisticas(ana, "?semanas=500").andExpect(jsonPath("$.semanas.length()").value(52));
        estadisticas(ana, "?semanas=0").andExpect(jsonPath("$.semanas.length()").value(1));
    }

    @Test
    void cadaCarreraCuentaEnLaSemanaEnQueSeHizo() {
        // Visto desde dentro de dos semanas, lo de hoy cae en la antepenúltima semana
        Long anaId = Long.valueOf(ana.get("usuario").get("id").asText());
        EstadisticasResponse dentroDeDosSemanas = servicio.estadisticas(anaId, 12, LocalDate.now().plusWeeks(2));
        assertEquals(0, dentroDeDosSemanas.semanas().get(11).carreras());
        assertEquals(1, dentroDeDosSemanas.semanas().get(9).carreras());
    }

    @Test
    void lasCarrerasEnRutasDeAmigosCuentanParaQuienCorre() throws Exception {
        JsonNode luis = registrar("Luis", "luis@correo.com");
        String solicitud = mvc.perform(post("/api/amigos/solicitudes").header("Authorization", "Bearer " + token(ana))
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"luis@correo.com\"}"))
                .andReturn().getResponse().getContentAsString();
        mvc.perform(post("/api/amigos/solicitudes/" + json.readTree(solicitud).get("id").asText() + "/aceptar")
                .header("Authorization", "Bearer " + token(luis)));
        correr(luis, 90);

        estadisticas(luis, "")
                .andExpect(jsonPath("$.resumen.carreras").value(1))
                .andExpect(jsonPath("$.rutas[0].nombre").value("Recta del parque"));
        // A Ana no le cuenta la carrera de Luis
        estadisticas(ana, "").andExpect(jsonPath("$.resumen.carreras").value(1));
    }

    @Test
    void sinCarrerasTodoEstaACeroYSinRitmo() throws Exception {
        JsonNode eva = registrar("Eva", "eva@correo.com");
        estadisticas(eva, "")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumen.carreras").value(0))
                .andExpect(jsonPath("$.resumen.distanciaTotalMetros").value(0))
                .andExpect(jsonPath("$.resumen.ritmoMedioSegundosKm").doesNotExist())
                .andExpect(jsonPath("$.resumen.mejorRitmoSegundosKm").doesNotExist())
                .andExpect(jsonPath("$.semanas.length()").value(12))
                .andExpect(jsonPath("$.rutas.length()").value(0))
                .andExpect(jsonPath("$.evolucion.length()").value(0));
    }

    @Test
    void sinTokenDevuelve401() throws Exception {
        mvc.perform(get("/api/estadisticas")).andExpect(status().isUnauthorized());
    }
}
