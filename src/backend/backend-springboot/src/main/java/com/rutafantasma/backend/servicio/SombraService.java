package com.rutafantasma.backend.servicio;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rutafantasma.backend.dto.PuntoDto;
import com.rutafantasma.backend.dto.SectorSombraDto;
import com.rutafantasma.backend.dto.SombraResponse;
import com.rutafantasma.backend.dto.UsuarioResponse;
import com.rutafantasma.backend.excepcion.SombraNoDisponibleException;
import com.rutafantasma.backend.excepcion.TipoSombraIncorrectoException;
import com.rutafantasma.backend.modelo.Ruta;
import com.rutafantasma.backend.modelo.Sector;
import com.rutafantasma.backend.repositorio.AmistadRepository;

/**
 * Calcula la sombra de una ruta: los puntos y tiempos de la marca contra la que se corre, que el reloj
 * descarga antes de salir para dibujar el segundo punto y avisar en cada sector.
 * La sombra puede ser la tuya, el récord de la ruta o la de un amigo (PS-70).
 */
@Service
public class SombraService {

    private final AccesoRutas acceso;
    private final MarcasService marcas;
    private final AmistadRepository amistades;

    public SombraService(AccesoRutas acceso, MarcasService marcas, AmistadRepository amistades) {
        this.acceso = acceso;
        this.marcas = marcas;
        this.amistades = amistades;
    }

    /** Tu propia sombra (PS-36): es lo mismo que pedir el tipo "propia" */
    @Transactional(readOnly = true)
    public SombraResponse obtener(Long usuarioId, Long rutaId) {
        return obtener(usuarioId, rutaId, TipoSombra.PROPIA, null);
    }

    /**
     * Sombra del tipo pedido (PS-70).
     * @param amigoId solo para el tipo AMIGO: el usuario contra cuya mejor marca quieres correr
     */
    @Transactional(readOnly = true)
    public SombraResponse obtener(Long usuarioId, Long rutaId, TipoSombra tipo, Long amigoId) {
        // La ven el dueño y sus amigos; para los demás la ruta no existe (404)
        Ruta ruta = acceso.visible(usuarioId, rutaId);
        List<Marca> mejores = marcas.mejorPorCorredor(ruta);

        Marca marca = switch (tipo) {
            // Tu mejor marca. Si todavía no tienes ninguna (eres un amigo que aún no la ha corrido),
            // corres contra la grabación de la ruta
            case PROPIA -> mejorDe(mejores, usuarioId).orElseGet(() -> Marca.deGrabacion(ruta));
            // La más rápida de todos: el primero del ranking (PS-64)
            case RECORD -> mejores.get(0);
            case AMIGO -> marcaDeAmigo(mejores, usuarioId, amigoId);
        };

        List<PuntoDto> puntos = marca.puntos(ruta);
        return new SombraResponse(
                String.valueOf(ruta.getId()),
                marca.carreraId(),
                tipo.texto(),
                UsuarioResponse.de(marca.usuario()),
                puntos.get(puntos.size() - 1).tiempoSegundos(),
                puntos,
                tiemposPorSector(ruta, puntos));
    }

    /** La mejor marca de un amigo: tiene que ser tu amigo y haber corrido ya la ruta */
    private Marca marcaDeAmigo(List<Marca> mejores, Long usuarioId, Long amigoId) {
        if (amigoId == null) {
            throw new TipoSombraIncorrectoException("Para correr contra un amigo indica cuál con ?amigoId=");
        }
        if (!amistades.sonAmigos(usuarioId, amigoId)) {
            throw new SombraNoDisponibleException("No tienes ningún amigo con id " + amigoId);
        }
        return mejorDe(mejores, amigoId)
                .orElseThrow(() -> new SombraNoDisponibleException("Tu amigo todavía no ha corrido esta ruta"));
    }

    private static Optional<Marca> mejorDe(List<Marca> mejores, Long usuarioId) {
        return mejores.stream().filter(m -> m.usuario().getId().equals(usuarioId)).findFirst();
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
