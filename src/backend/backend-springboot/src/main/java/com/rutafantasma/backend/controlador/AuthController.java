package com.rutafantasma.backend.controlador;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.rutafantasma.backend.dto.AuthResponse;
import com.rutafantasma.backend.dto.LoginRequest;
import com.rutafantasma.backend.dto.RegistroRequest;
import com.rutafantasma.backend.servicio.AuthService;

import jakarta.validation.Valid;

/** API REST de autenticación: /api/auth */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService servicio;

    public AuthController(AuthService servicio) {
        this.servicio = servicio;
    }

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registro(@Valid @RequestBody RegistroRequest peticion) {
        return servicio.registrar(peticion);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest peticion) {
        return servicio.iniciarSesion(peticion);
    }
}
