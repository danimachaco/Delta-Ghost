package com.rutafantasma.backend.servicio;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rutafantasma.backend.dto.PuntoDto;
import com.rutafantasma.backend.dto.SectorSombraDto;
import com.rutafantasma.backend.dto.SombraResponse;
import com.rutafantasma.backend.excepcion.RutaNoEncontradaException;
import com.rutafantasma.backend.modelo.Carrera;
import com.rutafantasma.backend.modelo.Punto;
import com.rutafantasma.backend.modelo.Ruta;
import com.rutafantasma.backend.modelo.Sector;
import com.rutafantasma.backend.repositorio.CarreraRepository;
import com.rutafantasma.backend.repositorio.RutaRepository;

/**
 * Calcula la sombra de una ruta: los puntos y tiempos de la mejor marca, que el reloj
 * descarga antes de salir para dibujar el segundo punto y avisar en cada sector.
 */
@Service
public class SombraService {

    /** Radio medio de la Tierra en metros, para la fórmula de Haversine */
    private static final double RADIO_TIERRA = 6_371_000;

    private final RutaRepository rutas;
    private final CarreraRepository carreras;

    public SombraService(RutaRepository rutas, CarreraRepository carreras) {
        this.rutas = rutas;
        this.carreras = carreras;
    }

    @Transactional(readOnly = true)
    public SombraResponse obtener(Long usuarioId, Long rutaId) {
        // Las rutas de otro usuario responden 404, igual que en RutaService
        Ruta ruta = rutas.findById(rutaId)
                .filter(r -> r.getUsuario().getId().equals(usuarioId))
                .orElseThrow(() -> new RutaNoEncontradaException(rutaId));

        // Si ninguna carrera ha batido la grabación de la ruta, la sombra es la propia grabación (PS-33)
        Carrera mejor = carreras.findFirstByRutaIdAndMejorMarcaTrue(rutaId).orElse(null);
        List<PuntoDto> puntos = mejor != null
                ? mejor.getPuntos().stream().map(PuntoDto::de).toList()
                : ruta.getPuntos().stream().map(PuntoDto::de).toList();

        return new SombraResponse(
                String.valueOf(ruta.getId()),
                mejor != null ? String.valueOf(mejor.getId()) : null,
                puntos.get(puntos.size() - 1).tiempoSegundos(),
                puntos,
                tiemposPorSector(ruta, puntos));
    }

    /**
     * Tiempo de la sombra al final de cada sector. Los sectores se definen con los puntos de la ruta,
     * pero la carrera de la sombra tiene sus propios puntos GPS (pueden ser más o menos y no caer justo
     * en el mismo sitio), así que para cada final de sector se busca el punto de la sombra más cercano.
     * La búsqueda sigue hacia delante desde el sector anterior para que, si la ruta pasa dos veces por
     * el mismo sitio, los tiempos nunca vayan hacia atrás.
     */
    private static List<SectorSombraDto> tiemposPorSector(Ruta ruta, List<PuntoDto> sombra) {
        List<SectorSombraDto> sectores = new ArrayList<>();
        int desde = 0;
        for (Sector s : ruta.getSectores()) {
            Punto fin = ruta.getPuntos().get(s.getPuntoFin());
            int masCercano = desde;
            for (int i = desde; i < sombra.size(); i++) {
                if (distancia(fin, sombra.get(i)) < distancia(fin, sombra.get(masCercano))) {
                    masCercano = i;
                }
            }
            sectores.add(new SectorSombraDto(s.getNumero(), s.getPuntoInicio(), s.getPuntoFin(),
                    sombra.get(masCercano).tiempoSegundos()));
            desde = masCercano;
        }
        return sectores;
    }

    /** Distancia en metros entre dos coordenadas con la fórmula de Haversine (la misma que el servicio Calculo del frontend) */
    private static double distancia(Punto a, PuntoDto b) {
        double dLat = Math.toRadians(b.latitud() - a.getLatitud());
        double dLon = Math.toRadians(b.longitud() - a.getLongitud());
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(a.getLatitud())) * Math.cos(Math.toRadians(b.latitud()))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * RADIO_TIERRA * Math.asin(Math.sqrt(h));
    }
}
