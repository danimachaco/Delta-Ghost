package com.rutafantasma.backend.servicio;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.rutafantasma.backend.modelo.Ruta;
import com.rutafantasma.backend.repositorio.CarreraRepository;

/**
 * Reúne los tiempos de todos los corredores en una ruta (PS-64). Lo usan el ranking,
 * los mejores sectores y la sombra por tipo, para que todos cuenten las marcas igual.
 * Hay que llamarlo dentro de una transacción: lee usuarios y puntos que se cargan bajo demanda.
 */
@Service
public class MarcasService {

    private final CarreraRepository carreras;

    public MarcasService(CarreraRepository carreras) {
        this.carreras = carreras;
    }

    /** Todas las marcas de la ruta: la grabación del dueño y cada carrera de cualquier corredor */
    public List<Marca> todas(Ruta ruta) {
        List<Marca> marcas = new ArrayList<>();
        marcas.add(Marca.deGrabacion(ruta));
        carreras.findByRutaIdOrderByFechaDesc(ruta.getId()).forEach(c -> marcas.add(Marca.de(c)));
        return marcas;
    }

    /** La mejor marca de cada corredor en la ruta, de la más rápida a la más lenta */
    public List<Marca> mejorPorCorredor(Ruta ruta) {
        Map<Long, Marca> mejores = new LinkedHashMap<>();
        for (Marca m : todas(ruta)) {
            mejores.merge(m.usuario().getId(), m,
                    (actual, nueva) -> Marca.MAS_RAPIDA_PRIMERO.compare(nueva, actual) < 0 ? nueva : actual);
        }
        return mejores.values().stream().sorted(Marca.MAS_RAPIDA_PRIMERO).toList();
    }
}
