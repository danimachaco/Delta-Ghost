package com.rutafantasma.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.stream.Collectors;
import java.util.stream.IntStream;

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
import com.rutafantasma.backend.repositorio.CarreraRepository;
import com.rutafantasma.backend.repositorio.RutaRepository;
import com.rutafantasma.backend.repositorio.UsuarioRepository;

/** Pruebas de GET /api/rutas/{id}/sectores/mejores (PS-67). */
@SpringBootTest
@AutoConfigureMockMvc
class MejoresSectoresControllerTest {

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

    private String tokenAna;
    private String tokenLuis;
    private String rutaId;

    /**
     * JSON con 7 puntos en línea recta hacia el norte y los tiempos indicados.
     * Los sectores de la ruta son 0→2, 2→4 y 4→6.
     */
    private static String puntos(long... tiempos) {
        return IntStream.range(0, tiempos.length)
                .mapToObj(i -> "{\"latitud\":" + (40 + i * 0.001) + ",\"longitud\":-3.7,\"tiempoSegundos\":" + tiempos[i] + "}")
                .collect(Collectors.joining(",", "[", "]"));
    }

    /** Ana graba la ruta en 180 s (60 s por sector); Luis es amigo de Ana */
    @BeforeEach
    void preparar() throws Exception {
        limpiar();
        tokenAna = registrar("Ana", "ana@correo.com");
        tokenLuis = registrar("Luis", "luis@correo.com");
        String solicitud = mvc.perform(post("/api/amigos/solicitudes").header("Authorization", "Bearer " + tokenAna)
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"luis@correo.com\"}"))
                .andReturn().getResponse().getContentAsString();
        mvc.perform(post("/api/amigos/solicitudes/" + json.readTree(solicitud).get("id").asText() + "/aceptar")
                .header("Authorization", "Bearer " + tokenLuis));

        String ruta = mvc.perform(post("/api/rutas").header("Authorization", "Bearer " + tokenAna)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Recta\",\"puntos\":" + puntos(0, 30, 60, 90, 120, 150, 180) + "}"))
                .andReturn().getResponse().getContentAsString();
        rutaId = json.readTree(ruta).get("id").asText();
    }

    /** Se borra en orden por las claves foráneas */
    @AfterEach
    void limpiar() {
        carreras.deleteAll();
        rutas.deleteAll();
        amistades.deleteAll();
        usuarios.deleteAll();
    }

    private String registrar(String nombre, String email) throws Exception {
        String cuerpo = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"" + nombre + "\",\"email\":\"" + email + "\",\"password\":\"secreta1\"}"))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(cuerpo).get("token").asText();
    }

    private String correr(String token, long... tiempos) throws Exception {
        String respuesta = mvc.perform(post("/api/rutas/" + rutaId + "/carreras").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"puntos\":" + puntos(tiempos) + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(respuesta).get("id").asText();
    }

    private ResultActions mejores(String token) throws Exception {
        return mvc.perform(get("/api/rutas/" + rutaId + "/sectores/mejores").header("Authorization", "Bearer " + token));
    }

    @Test
    void sinCarrerasLosMejoresSectoresSonLosDeLaGrabacion() throws Exception {
        mejores(tokenAna)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rutaId").value(rutaId))
                .andExpect(jsonPath("$.sectores.length()").value(3))
                .andExpect(jsonPath("$.sectores[0].numero").value(1))
                .andExpect(jsonPath("$.sectores[0].puntoInicio").value(0))
                .andExpect(jsonPath("$.sectores[0].puntoFin").value(2))
                .andExpect(jsonPath("$.sectores[0].tiempoSegundos").value(60))
                .andExpect(jsonPath("$.sectores[0].usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.sectores[0].usuario.email").doesNotExist())
                .andExpect(jsonPath("$.sectores[0].carreraId").doesNotExist())
                .andExpect(jsonPath("$.sectores[0].tuyo").value(true))
                .andExpect(jsonPath("$.tiempoIdealSegundos").value(180));
    }

    @Test
    void cadaSectorSeQuedaConElCorredorMasRapidoEnEseSector() throws Exception {
        // Luis: sectores de 50, 70 y 50 s. Ana: 60, 50 y 70 s
        String carreraLuis = correr(tokenLuis, 0, 25, 50, 85, 120, 145, 170);
        String carreraAna = correr(tokenAna, 0, 30, 60, 85, 110, 145, 180);

        mejores(tokenLuis)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sectores[0].usuario.nombre").value("Luis"))
                .andExpect(jsonPath("$.sectores[0].tiempoSegundos").value(50))
                .andExpect(jsonPath("$.sectores[0].carreraId").value(carreraLuis))
                .andExpect(jsonPath("$.sectores[0].tuyo").value(true))
                .andExpect(jsonPath("$.sectores[1].usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.sectores[1].tiempoSegundos").value(50))
                .andExpect(jsonPath("$.sectores[1].carreraId").value(carreraAna))
                .andExpect(jsonPath("$.sectores[1].tuyo").value(false))
                .andExpect(jsonPath("$.sectores[2].usuario.nombre").value("Luis"))
                .andExpect(jsonPath("$.sectores[2].tiempoSegundos").value(50))
                // La vuelta ideal (150 s) es mejor que cualquier vuelta real (170 s)
                .andExpect(jsonPath("$.tiempoIdealSegundos").value(150));
    }

    @Test
    void cuentaElMejorSectorAunqueSeaDeUnaVueltaLenta() throws Exception {
        // Vuelta lenta en total (240 s) pero con un primer sector de 40 s
        correr(tokenLuis, 0, 20, 40, 100, 160, 200, 240);
        mejores(tokenAna)
                .andExpect(jsonPath("$.sectores[0].usuario.nombre").value("Luis"))
                .andExpect(jsonPath("$.sectores[0].tiempoSegundos").value(40))
                .andExpect(jsonPath("$.sectores[1].usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.tiempoIdealSegundos").value(160));
    }

    @Test
    void siEmpatanSeQuedaElQueSeHizoAntes() throws Exception {
        // Luis iguala los 60 s del primer sector de la grabación de Ana
        correr(tokenLuis, 0, 30, 60, 100, 140, 180, 220);
        mejores(tokenLuis)
                .andExpect(jsonPath("$.sectores[0].usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.sectores[0].carreraId").doesNotExist());
    }

    @Test
    void quienNoEsAmigoNoPuedeVerlosYSinTokenDevuelve401() throws Exception {
        String tokenEva = registrar("Eva", "eva@correo.com");
        mejores(tokenEva).andExpect(status().isNotFound()).andExpect(jsonPath("$.error").exists());
        mvc.perform(get("/api/rutas/" + rutaId + "/sectores/mejores")).andExpect(status().isUnauthorized());
    }
}
