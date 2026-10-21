package com.rutafantasma.desarrollador1.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.rutafantasma.desarrollador1.dto.RutaRequest;
import com.rutafantasma.desarrollador1.dto.RutaResponse;
import com.rutafantasma.desarrollador1.service.RutaService;

import jakarta.validation.Valid;

/** API REST de rutas: /api/rutas */
@RestController
@RequestMapping("/api/rutas")
public class RutaController {

    private final RutaService servicio;

    public RutaController(RutaService servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public List<RutaResponse> listar() {
        return servicio.listar();
    }

    @GetMapping("/{id}")
    public RutaResponse obtener(@PathVariable String id) {
        return servicio.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RutaResponse crear(@Valid @RequestBody RutaRequest peticion) {
        return servicio.crear(peticion);
    }

    @PutMapping("/{id}")
    public RutaResponse actualizar(@PathVariable String id, @Valid @RequestBody RutaRequest peticion) {
        return servicio.actualizar(id, peticion);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable String id) {
        servicio.eliminar(id);
    }
}
