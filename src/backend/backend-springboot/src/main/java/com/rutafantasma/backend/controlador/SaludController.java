package com.rutafantasma.backend.controlador;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Comprobación de que el backend está vivo: GET /api/salud → { "estado": "ok" }.
 * La usa Render para saber si el servicio ha arrancado bien, y sirve para comprobar
 * a mano desde el navegador que el backend publicado responde. No necesita token.
 */
@RestController
public class SaludController {

    @GetMapping("/api/salud")
    public Map<String, String> salud() {
        return Map.of("estado", "ok");
    }
}
