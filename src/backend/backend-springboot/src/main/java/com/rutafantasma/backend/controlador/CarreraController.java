package com.rutafantasma.backend.controlador;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.rutafantasma.backend.dto.CarreraRequest;
import com.rutafantasma.backend.dto.CarreraResponse;
import com.rutafantasma.backend.seguridad.TokenInterceptor;
import com.rutafantasma.backend.servicio.CarreraService;

import jakarta.validation.Valid;

/**
 * API REST de carreras: /api/rutas/{rutaId}/carreras
 * Como cuelga de /api/rutas, TokenInterceptor ya exige el token y deja el id del usuario en "usuarioId".
 */
@RestController
@RequestMapping("/api/rutas/{rutaId}/carreras")
public class CarreraController {

    private final CarreraService servicio;

    public CarreraController(CarreraService servicio) {
        this.servicio = servicio;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CarreraResponse subir(@RequestAttribute(TokenInterceptor.USUARIO_ID) Long usuarioId,
            @PathVariable Long rutaId, @Valid @RequestBody CarreraRequest peticion) {
        return servicio.subir(usuarioId, rutaId, peticion);
    }
}
