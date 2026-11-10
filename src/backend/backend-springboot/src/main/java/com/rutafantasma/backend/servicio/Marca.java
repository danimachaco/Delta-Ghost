package com.rutafantasma.backend.servicio;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

import com.rutafantasma.backend.dto.PuntoDto;
import com.rutafantasma.backend.modelo.Carrera;
import com.rutafantasma.backend.modelo.Ruta;
import com.rutafantasma.backend.modelo.Usuario;

/**
 * Un tiempo hecho por un corredor en una ruta (PS-64): una carrera o la grabación original
 * de la ruta, que cuenta como la primera marca de su dueño (igual que en PS-33).
 * @param carrera la carrera, o null si la marca es la grabación de la ruta
 */
public record Marca(Usuario usuario, long tiempoTotalSegundos, Carrera carrera, LocalDateTime fecha) {

    /** Orden de un ranking: menos tiempo primero; si empatan, gana quien lo hizo antes */
    public static final Comparator<Marca> MAS_RAPIDA_PRIMERO = Comparator
            .comparingLong(Marca::tiempoTotalSegundos)
            .thenComparing(Marca::fecha);

    public static Marca de(Carrera c) {
        return new Marca(c.getUsuario(), c.getTiempoTotalSegundos(), c, c.getFecha());
    }

    /** La grabación de la ruta como marca de su dueño: el tiempo es el de su último punto */
    public static Marca deGrabacion(Ruta ruta) {
        long tiempo = ruta.getPuntos().get(ruta.getPuntos().size() - 1).getTiempoSegundos();
        return new Marca(ruta.getUsuario(), tiempo, null, ruta.getFechaCreacion());
    }

    public boolean esGrabacion() {
        return carrera == null;
    }

    /** Puntos que recorrió el corredor en esta marca */
    public List<PuntoDto> puntos(Ruta ruta) {
        return esGrabacion()
                ? ruta.getPuntos().stream().map(PuntoDto::de).toList()
                : carrera.getPuntos().stream().map(PuntoDto::de).toList();
    }

    /** Id de la carrera como texto, o null si es la grabación (así lo espera el frontend) */
    public String carreraId() {
        return esGrabacion() ? null : String.valueOf(carrera.getId());
    }
}
