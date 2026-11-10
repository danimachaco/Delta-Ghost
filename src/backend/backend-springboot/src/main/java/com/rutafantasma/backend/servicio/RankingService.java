package com.rutafantasma.backend.servicio;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rutafantasma.backend.dto.PuestoRankingDto;
import com.rutafantasma.backend.dto.RankingResponse;
import com.rutafantasma.backend.dto.UsuarioResponse;
import com.rutafantasma.backend.modelo.Ruta;

/** Ranking de una ruta (PS-64): la mejor marca de cada corredor que la ha corrido. */
@Service
public class RankingService {

    private final AccesoRutas acceso;
    private final MarcasService marcas;

    public RankingService(AccesoRutas acceso, MarcasService marcas) {
        this.acceso = acceso;
        this.marcas = marcas;
    }

    @Transactional(readOnly = true)
    public RankingResponse ranking(Long usuarioId, Long rutaId) {
        Ruta ruta = acceso.visible(usuarioId, rutaId);
        List<Marca> mejores = marcas.mejorPorCorredor(ruta);
        long primero = mejores.get(0).tiempoTotalSegundos();

        List<PuestoRankingDto> puestos = new ArrayList<>();
        for (int i = 0; i < mejores.size(); i++) {
            Marca m = mejores.get(i);
            // Si empata con el anterior comparte su puesto (1, 2, 2, 4…), como en las clasificaciones deportivas
            int posicion = i > 0 && m.tiempoTotalSegundos() == mejores.get(i - 1).tiempoTotalSegundos()
                    ? puestos.get(i - 1).posicion()
                    : i + 1;
            puestos.add(new PuestoRankingDto(
                    posicion,
                    UsuarioResponse.de(m.usuario()),
                    m.tiempoTotalSegundos(),
                    m.carreraId(),
                    m.fecha(),
                    m.tiempoTotalSegundos() - primero,
                    m.usuario().getId().equals(usuarioId)));
        }
        return new RankingResponse(String.valueOf(ruta.getId()), ruta.getNombre(), puestos);
    }
}
