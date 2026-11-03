package com.rutafantasma.backend.controlador;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RestController;

import com.rutafantasma.backend.dto.SombraResponse;
import com.rutafantasma.backend.seguridad.TokenInterceptor;
import com.rutafantasma.backend.servicio.SombraService;

/**
 * API REST de la sombra: GET /api/rutas/{rutaId}/sombra
 * Como cuelga de /api/rutas, TokenInterceptor ya exige el token y deja el id del usuario en "usuarioId".
 */
@RestController
public class SombraController {

    private final SombraService servicio;

    public SombraController(SombraService servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/api/rutas/{rutaId}/sombra")
    public SombraResponse obtener(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId, @PathVariable Long rutaId) {
        return servicio.obtener(usuarioId, rutaId);
    }
}
