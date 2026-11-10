package com.rutafantasma.backend.controlador;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rutafantasma.backend.dto.SombraResponse;
import com.rutafantasma.backend.seguridad.TokenInterceptor;
import com.rutafantasma.backend.servicio.SombraService;
import com.rutafantasma.backend.servicio.TipoSombra;

/**
 * API REST de la sombra: GET /api/rutas/{rutaId}/sombra (la tuya) y GET /api/rutas/{rutaId}/sombra/{tipo} (PS-70)
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

    /**
     * Sombra por tipo (PS-70): propia, record o amigo.
     * Para "amigo" se indica cuál con ?amigoId= (no se llama usuarioId para no confundirlo con quien pide).
     */
    @GetMapping("/api/rutas/{rutaId}/sombra/{tipo}")
    public SombraResponse obtenerPorTipo(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId,
            @PathVariable Long rutaId, @PathVariable String tipo, @RequestParam(required = false) Long amigoId) {
        return servicio.obtener(usuarioId, rutaId, TipoSombra.desde(tipo), amigoId);
    }
}
