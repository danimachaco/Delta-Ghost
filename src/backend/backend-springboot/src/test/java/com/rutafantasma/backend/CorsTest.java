package com.rutafantasma.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Comprueba la configuración CORS: el navegador hace una petición OPTIONS ("preflight")
 * antes del POST, y si el backend no la acepta, el registro y el login fallan en el navegador.
 */
@SpringBootTest
@AutoConfigureMockMvc
class CorsTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void aceptaElFrontendEnLocalhostEnCualquierPuerto() throws Exception {
        for (String origen : new String[] { "http://localhost:4200", "http://localhost:4201", "http://127.0.0.1:4200" }) {
            mvc.perform(options("/api/auth/registro")
                    .header("Origin", origen)
                    .header("Access-Control-Request-Method", "POST")
                    .header("Access-Control-Request-Headers", "content-type"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", origen));
        }
    }

    @Test
    void permiteEnviarElTokenEnLaCabeceraAuthorization() throws Exception {
        mvc.perform(options("/api/rutas")
                .header("Origin", "http://localhost:4200")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Headers", "authorization"));
    }

    @Test
    void rechazaDireccionesQueNoEstanPermitidas() throws Exception {
        mvc.perform(post("/api/auth/login")
                .header("Origin", "https://web-desconocida.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"a@a.es\",\"password\":\"x\"}"))
                .andExpect(status().isForbidden());
    }
}
