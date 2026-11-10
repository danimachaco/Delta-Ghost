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
 * API REST de la sombra: GET /api/rutas/{rutaId}/sombra?tipo=MEJOR|ULTIMA|ORIGINAL|RECORD|AMIGO (PS-70)
 * Sin tipo devuelve tu mejor marca, como antes. Para AMIGO se indica cuál con &amigoId=
 * (no se llama usuarioId para no confundirlo con quien hace la petición).
 * Como cuelga de /api/rutas, TokenInterceptor ya exige el token y deja el id del usuario en "usuarioId".
 */
@RestController
public class SombraController {

    private final SombraService servicio;

    public SombraController(SombraService servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/api/rutas/{rutaId}/sombra")
    public SombraResponse obtener(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId, @PathVariable Long rutaId,
            @RequestParam(required = false) String tipo, @RequestParam(required = false) Long amigoId) {
        return servicio.obtener(usuarioId, rutaId, TipoSombra.desde(tipo), amigoId);
    }
}
