package com.rutafantasma.backend.servicio;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rutafantasma.backend.dto.PuntoDto;
import com.rutafantasma.backend.dto.SectorSombraDto;
import com.rutafantasma.backend.dto.SombraResponse;
import com.rutafantasma.backend.modelo.Carrera;
import com.rutafantasma.backend.modelo.Ruta;
import com.rutafantasma.backend.modelo.Sector;
import com.rutafantasma.backend.repositorio.CarreraRepository;

/**
 * Calcula la sombra de una ruta: los puntos y tiempos de la mejor marca, que el reloj
 * descarga antes de salir para dibujar el segundo punto y avisar en cada sector.
 */
@Service
public class SombraService {

    private final AccesoRutas acceso;
    private final CarreraRepository carreras;

    public SombraService(AccesoRutas acceso, CarreraRepository carreras) {
        this.acceso = acceso;
        this.carreras = carreras;
    }

    @Transactional(readOnly = true)
    public SombraResponse obtener(Long usuarioId, Long rutaId) {
        // La ven el dueño y sus amigos; para los demás la ruta no existe (404)
        Ruta ruta = acceso.visible(usuarioId, rutaId);

        // La sombra es la mejor marca de quien la pide (PS-64). Si todavía no tiene ninguna
        // (no ha batido la grabación o es un amigo que aún no la ha corrido), es la grabación de la ruta.
        Carrera mejor = carreras.findFirstByRutaIdAndUsuarioIdAndMejorMarcaTrue(rutaId, usuarioId).orElse(null);
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

    /** Tiempo de la sombra al final de cada sector, calculado con TiemposSector */
    private static List<SectorSombraDto> tiemposPorSector(Ruta ruta, List<PuntoDto> sombra) {
        List<Long> finales = TiemposSector.finales(ruta, sombra);
        List<SectorSombraDto> sectores = new ArrayList<>();
        for (int i = 0; i < finales.size(); i++) {
            Sector s = ruta.getSectores().get(i);
            sectores.add(new SectorSombraDto(s.getNumero(), s.getPuntoInicio(), s.getPuntoFin(), finales.get(i)));
        }
        return sectores;
    }
}
