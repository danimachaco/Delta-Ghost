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
import com.rutafantasma.backend.repositorio.CarreraRepository;
import com.rutafantasma.backend.repositorio.RutaRepository;
import com.rutafantasma.backend.repositorio.UsuarioRepository;

/**
 * Pruebas de GET /api/rutas/{id}/ranking (PS-64) y de que los amigos del dueño
 * pueden ver y correr su ruta, cada uno con su propia mejor marca.
 */
@SpringBootTest
@AutoConfigureMockMvc
class RankingControllerTest {

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

    private String tokenAna;
    private String tokenLuis;
    private String tokenEva;
    private String rutaId;

    /** Ana tiene una ruta; Luis es amigo de Ana; Eva no conoce a nadie */
    @BeforeEach
    void preparar() throws Exception {
        limpiar();
        tokenAna = registrar("Ana", "ana@correo.com");
        tokenLuis = registrar("Luis", "luis@correo.com");
        tokenEva = registrar("Eva", "eva@correo.com");
        hacerAmigos(tokenAna, tokenLuis, "luis@correo.com");

        String respuesta = mvc.perform(post("/api/rutas").header("Authorization", "Bearer " + tokenAna)
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

    private String registrar(String nombre, String email) throws Exception {
        String cuerpo = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"" + nombre + "\",\"email\":\"" + email + "\",\"password\":\"secreta1\"}"))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(cuerpo).get("token").asText();
    }

    /** Uno envía la solicitud por la API y el otro la acepta */
    private void hacerAmigos(String tokenQuienPide, String tokenQuienAcepta, String emailQuienAcepta) throws Exception {
        String solicitud = mvc.perform(post("/api/amigos/solicitudes").header("Authorization", "Bearer " + tokenQuienPide)
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"" + emailQuienAcepta + "\"}"))
                .andReturn().getResponse().getContentAsString();
        mvc.perform(post("/api/amigos/solicitudes/" + json.readTree(solicitud).get("id").asText() + "/aceptar")
                .header("Authorization", "Bearer " + tokenQuienAcepta));
    }

    /** Carrera de 4 puntos por la ruta que termina en el tiempo indicado */
    private ResultActions correr(String token, long tiempoFinal) throws Exception {
        String cuerpo = """
                {"puntos":[
                  {"latitud":40.4153,"longitud":-3.6845,"tiempoSegundos":0},
                  {"latitud":40.4170,"longitud":-3.6858,"tiempoSegundos":80},
                  {"latitud":40.4188,"longitud":-3.6872,"tiempoSegundos":160},
                  {"latitud":40.4200,"longitud":-3.6890,"tiempoSegundos":%d}]}
                """.formatted(tiempoFinal);
        return mvc.perform(post("/api/rutas/" + rutaId + "/carreras").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(cuerpo));
    }

    private ResultActions pedir(String token, String ruta) throws Exception {
        return mvc.perform(get(ruta).header("Authorization", "Bearer " + token));
    }

    @Test
    void sinCarrerasElRankingSoloTieneLaGrabacionDelDueno() throws Exception {
        pedir(tokenAna, "/api/rutas/" + rutaId + "/ranking")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rutaId").value(rutaId))
                .andExpect(jsonPath("$.rutaNombre").value("Parque del Retiro"))
                .andExpect(jsonPath("$.entradas.length()").value(1))
                .andExpect(jsonPath("$.entradas[0].posicion").value(1))
                .andExpect(jsonPath("$.entradas[0].usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.entradas[0].tiempoTotalSegundos").value(260))
                .andExpect(jsonPath("$.entradas[0].carreraId").doesNotExist())
                .andExpect(jsonPath("$.entradas[0].tuya").value(true));
    }

    @Test
    void ordenaLaMejorMarcaDeCadaCorredorDeMasRapidaAMasLenta() throws Exception {
        correr(tokenLuis, 250).andExpect(status().isCreated());
        correr(tokenAna, 270);
        correr(tokenAna, 255);
        correr(tokenLuis, 300); // no empeora su marca: cuenta la mejor

        pedir(tokenLuis, "/api/rutas/" + rutaId + "/ranking")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entradas.length()").value(2))
                .andExpect(jsonPath("$.entradas[0].usuario.nombre").value("Luis"))
                .andExpect(jsonPath("$.entradas[0].tiempoTotalSegundos").value(250))
                .andExpect(jsonPath("$.entradas[0].diferenciaConPrimeroSegundos").value(0))
                .andExpect(jsonPath("$.entradas[0].carreraId").isString())
                .andExpect(jsonPath("$.entradas[0].tuya").value(true))
                .andExpect(jsonPath("$.entradas[1].usuario.nombre").value("Ana"))
                .andExpect(jsonPath("$.entradas[1].posicion").value(2))
                .andExpect(jsonPath("$.entradas[1].tiempoTotalSegundos").value(255))
                .andExpect(jsonPath("$.entradas[1].diferenciaConPrimeroSegundos").value(5))
                .andExpect(jsonPath("$.entradas[1].tuya").value(false))
                .andExpect(jsonPath("$.entradas[1].usuario.email").doesNotExist());
    }

    @Test
    void dosCorredoresConElMismoTiempoCompartenPuesto() throws Exception {
        correr(tokenLuis, 260);
        pedir(tokenAna, "/api/rutas/" + rutaId + "/ranking")
                .andExpect(jsonPath("$.entradas[0].posicion").value(1))
                .andExpect(jsonPath("$.entradas[1].posicion").value(1))
                // Empate: va primero quien lo hizo antes (la grabación de Ana)
                .andExpect(jsonPath("$.entradas[0].usuario.nombre").value("Ana"));
    }

    @Test
    void cadaCorredorTieneSuPropiaMejorMarcaYSuPropiaSombra() throws Exception {
        // La primera carrera de un amigo siempre es su mejor marca, aunque sea más lenta que la grabación
        correr(tokenLuis, 300).andExpect(jsonPath("$.mejorMarca").value(true));
        // Ana sigue teniendo que batir su grabación (260 s)
        correr(tokenAna, 280).andExpect(jsonPath("$.mejorMarca").value(false));
        correr(tokenLuis, 240).andExpect(jsonPath("$.mejorMarca").value(true));

        // La sombra de Ana sigue siendo su grabación aunque Luis haya sido más rápido
        pedir(tokenAna, "/api/rutas/" + rutaId + "/sombra")
                .andExpect(jsonPath("$.carreraId").doesNotExist())
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(260));
        pedir(tokenLuis, "/api/rutas/" + rutaId + "/sombra")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tiempoTotalSegundos").value(240));
    }

    @Test
    void unAmigoPuedeVerLaRutaPeroQuienNoEsAmigoNo() throws Exception {
        pedir(tokenLuis, "/api/rutas/" + rutaId).andExpect(status().isOk());
        pedir(tokenLuis, "/api/rutas/" + rutaId + "/sombra").andExpect(status().isOk());

        pedir(tokenEva, "/api/rutas/" + rutaId).andExpect(status().isNotFound());
        pedir(tokenEva, "/api/rutas/" + rutaId + "/ranking").andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
        pedir(tokenEva, "/api/rutas/" + rutaId + "/sombra").andExpect(status().isNotFound());
        correr(tokenEva, 200).andExpect(status().isNotFound());
        // Listar sigue mostrando solo las rutas propias
        pedir(tokenLuis, "/api/rutas").andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void rutaInexistenteOSinTokenDevuelveError() throws Exception {
        pedir(tokenAna, "/api/rutas/999999/ranking").andExpect(status().isNotFound());
        mvc.perform(get("/api/rutas/" + rutaId + "/ranking")).andExpect(status().isUnauthorized());
    }
}
