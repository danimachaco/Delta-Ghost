package com.rutafantasma.backend.servicio;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rutafantasma.backend.dto.MejorSectorDto;
import com.rutafantasma.backend.dto.MejoresSectoresResponse;
import com.rutafantasma.backend.dto.UsuarioResponse;
import com.rutafantasma.backend.modelo.Ruta;
import com.rutafantasma.backend.modelo.Sector;

/**
 * Calcula el mejor tiempo de cada sector entre todos los corredores de una ruta (PS-67),
 * como los "sectores morados" de la Fórmula 1.
 *
 * Se miran TODAS las marcas (cada carrera de cada corredor y la grabación de la ruta), no solo
 * la mejor de cada uno: alguien puede hacer su mejor sector en una vuelta que en total fue lenta.
 */
@Service
public class MejoresSectoresService {

    private final AccesoRutas acceso;
    private final MarcasService marcas;

    public MejoresSectoresService(AccesoRutas acceso, MarcasService marcas) {
        this.acceso = acceso;
        this.marcas = marcas;
    }

    @Transactional(readOnly = true)
    public MejoresSectoresResponse mejores(Long usuarioId, Long rutaId) {
        Ruta ruta = acceso.visible(usuarioId, rutaId);
        List<Sector> sectores = ruta.getSectores();

        // Para cada sector, la marca con menos tiempo en él y ese tiempo
        Marca[] mejorMarca = new Marca[sectores.size()];
        long[] mejorTiempo = new long[sectores.size()];
        for (Marca m : marcas.todas(ruta)) {
            List<Long> duraciones = TiemposSector.duraciones(ruta, m.puntos(ruta));
            for (int i = 0; i < duraciones.size(); i++) {
                if (mejorMarca[i] == null || mejora(duraciones.get(i), m, mejorTiempo[i], mejorMarca[i])) {
                    mejorMarca[i] = m;
                    mejorTiempo[i] = duraciones.get(i);
                }
            }
        }

        List<MejorSectorDto> resultado = new ArrayList<>();
        long ideal = 0;
        for (int i = 0; i < sectores.size(); i++) {
            Sector s = sectores.get(i);
            Marca m = mejorMarca[i];
            resultado.add(new MejorSectorDto(s.getNumero(), s.getPuntoInicio(), s.getPuntoFin(), mejorTiempo[i],
                    UsuarioResponse.de(m.usuario()), m.carreraId(), m.fecha(), m.usuario().getId().equals(usuarioId)));
            ideal += mejorTiempo[i];
        }
        return new MejoresSectoresResponse(String.valueOf(ruta.getId()), resultado, ideal);
    }

    /** Un tiempo mejora al actual si es menor; si empatan, se queda el que se hizo antes */
    private static boolean mejora(long tiempo, Marca marca, long tiempoActual, Marca actual) {
        return tiempo < tiempoActual || (tiempo == tiempoActual && marca.fecha().isBefore(actual.fecha()));
    }
}
