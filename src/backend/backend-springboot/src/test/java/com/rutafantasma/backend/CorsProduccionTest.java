package com.rutafantasma.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

/** Con la configuración CORS de render.yaml, la web publicada en Vercel puede llamar a la API. */
@SpringBootTest(properties = "cors.origenes=https://*.vercel.app,http://localhost:*,http://127.0.0.1:*")
@AutoConfigureMockMvc
class CorsProduccionTest {

    @Autowired
    private MockMvc mvc;

    private void preflight(String origen, int estadoEsperado) throws Exception {
        mvc.perform(options("/api/auth/login")
                .header("Origin", origen)
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().is(estadoEsperado));
    }

    @Test
    void aceptaLaWebPublicadaEnVercel() throws Exception {
        preflight("https://delta-ghost.vercel.app", 200);
        mvc.perform(options("/api/auth/login")
                .header("Origin", "https://delta-ghost-git-main-equipo.vercel.app")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(header().string("Access-Control-Allow-Origin", "https://delta-ghost-git-main-equipo.vercel.app"));
    }

    @Test
    void sigueRechazandoOtrasWebs() throws Exception {
        preflight("https://web-desconocida.com", 403);
        preflight("http://delta-ghost.vercel.app", 403); // solo https
    }
}
