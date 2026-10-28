package com.rutafantasma.backend.controlador;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.rutafantasma.backend.dto.RutaRequest;
import com.rutafantasma.backend.dto.RutaResponse;
import com.rutafantasma.backend.seguridad.TokenInterceptor;
import com.rutafantasma.backend.servicio.RutaService;

import jakarta.validation.Valid;

/**
 * API REST de rutas: /api/rutas
 * Todas las peticiones necesitan el token (lo comprueba TokenInterceptor), que deja
 * el id del usuario en el atributo "usuarioId".
 */
@RestController
@RequestMapping("/api/rutas")
public class RutaController {

    private final RutaService servicio;

    public RutaController(RutaService servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public List<RutaResponse> listar(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId) {
        return servicio.listar(usuarioId);
    }

    @GetMapping("/{id}")
    public RutaResponse obtener(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId, @PathVariable Long id) {
        return servicio.obtener(usuarioId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RutaResponse crear(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId,
            @Valid @RequestBody RutaRequest peticion) {
        return servicio.crear(usuarioId, peticion);
    }
}
