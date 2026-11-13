package com.rutafantasma.backend.servicio;

import org.springframework.stereotype.Component;

import com.rutafantasma.backend.excepcion.RutaNoEncontradaException;
import com.rutafantasma.backend.modelo.Ruta;
import com.rutafantasma.backend.repositorio.AmistadRepository;
import com.rutafantasma.backend.repositorio.RutaRepository;

/**
 * Decide quién puede ver y correr una ruta (PS-64): su dueño y los amigos del dueño (PS-56).
 * Así varios corredores pueden competir en la misma ruta y tiene sentido un ranking.
 * Para cualquier otro usuario la ruta "no existe" (404), para no revelar rutas ajenas.
 */
@Component
public class AccesoRutas {

    private final RutaRepository rutas;
    private final AmistadRepository amistades;

    public AccesoRutas(RutaRepository rutas, AmistadRepository amistades) {
        this.rutas = rutas;
        this.amistades = amistades;
    }

    /** La ruta, si el usuario puede verla; si no, lanza RutaNoEncontradaException (404) */
    public Ruta visible(Long usuarioId, Long rutaId) {
        return rutas.findById(rutaId)
                .filter(r -> puedeVer(usuarioId, r))
                .orElseThrow(() -> new RutaNoEncontradaException(rutaId));
    }

    public boolean puedeVer(Long usuarioId, Ruta ruta) {
        Long dueno = ruta.getUsuario().getId();
        return dueno.equals(usuarioId) || amistades.sonAmigos(usuarioId, dueno);
    }
}
