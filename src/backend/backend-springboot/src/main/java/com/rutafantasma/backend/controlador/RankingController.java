package com.rutafantasma.backend.controlador;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RestController;

import com.rutafantasma.backend.dto.RankingResponse;
import com.rutafantasma.backend.seguridad.TokenInterceptor;
import com.rutafantasma.backend.servicio.RankingService;

/**
 * API REST del ranking: GET /api/rutas/{rutaId}/ranking
 * Como cuelga de /api/rutas, TokenInterceptor ya exige el token y deja el id del usuario en "usuarioId".
 */
@RestController
public class RankingController {

    private final RankingService servicio;

    public RankingController(RankingService servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/api/rutas/{rutaId}/ranking")
    public RankingResponse ranking(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId, @PathVariable Long rutaId) {
        return servicio.ranking(usuarioId, rutaId);
    }
}
