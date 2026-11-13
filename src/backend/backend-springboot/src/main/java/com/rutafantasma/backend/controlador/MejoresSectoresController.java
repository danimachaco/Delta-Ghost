package com.rutafantasma.backend.controlador;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RestController;

import com.rutafantasma.backend.dto.MejoresSectoresResponse;
import com.rutafantasma.backend.seguridad.TokenInterceptor;
import com.rutafantasma.backend.servicio.MejoresSectoresService;

/**
 * API REST de los mejores sectores: GET /api/rutas/{rutaId}/sectores/mejores (PS-67)
 * Como cuelga de /api/rutas, TokenInterceptor ya exige el token y deja el id del usuario en "usuarioId".
 */
@RestController
public class MejoresSectoresController {

    private final MejoresSectoresService servicio;

    public MejoresSectoresController(MejoresSectoresService servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/api/rutas/{rutaId}/sectores/mejores")
    public MejoresSectoresResponse mejores(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId,
            @PathVariable Long rutaId) {
        return servicio.mejores(usuarioId, rutaId);
    }
}
