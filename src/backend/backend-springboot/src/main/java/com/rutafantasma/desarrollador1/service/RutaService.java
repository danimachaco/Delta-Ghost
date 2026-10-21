package com.rutafantasma.desarrollador1.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.rutafantasma.desarrollador1.dto.RutaRequest;
import com.rutafantasma.desarrollador1.dto.RutaResponse;
import com.rutafantasma.desarrollador1.exception.RutaNoEncontradaException;
import com.rutafantasma.desarrollador1.model.Ruta;
import com.rutafantasma.desarrollador1.repository.RutaRepository;

/** Lógica de negocio de las rutas. */
@Service
public class RutaService {

    private final RutaRepository repositorio;

    public RutaService(RutaRepository repositorio) {
        this.repositorio = repositorio;
    }

    public List<RutaResponse> listar() {
        return repositorio.findAll().stream().map(this::aRespuesta).toList();
    }

    public RutaResponse obtener(String id) {
        return aRespuesta(buscar(id));
    }

    public RutaResponse crear(RutaRequest peticion) {
        Ruta ruta = new Ruta(peticion.nombre(), LocalDateTime.now(), peticion.puntos());
        return aRespuesta(repositorio.save(ruta));
    }

    public RutaResponse actualizar(String id, RutaRequest peticion) {
        Ruta ruta = buscar(id);
        ruta.setNombre(peticion.nombre());
        ruta.setPuntos(peticion.puntos());
        return aRespuesta(repositorio.save(ruta));
    }

    public void eliminar(String id) {
        repositorio.delete(buscar(id));
    }

    private Ruta buscar(String id) {
        return repositorio.findById(id).orElseThrow(() -> new RutaNoEncontradaException(id));
    }

    private RutaResponse aRespuesta(Ruta r) {
        return new RutaResponse(r.getId(), r.getNombre(), r.getFecha(), r.getPuntos());
    }
}
