package com.rutafantasma.backend.servicio;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rutafantasma.backend.dto.PuntoDto;
import com.rutafantasma.backend.dto.RutaRequest;
import com.rutafantasma.backend.dto.RutaResponse;
import com.rutafantasma.backend.excepcion.DatosRutaIncorrectosException;
import com.rutafantasma.backend.excepcion.RutaNoEncontradaException;
import com.rutafantasma.backend.modelo.Punto;
import com.rutafantasma.backend.modelo.Ruta;
import com.rutafantasma.backend.modelo.Sector;
import com.rutafantasma.backend.modelo.Usuario;
import com.rutafantasma.backend.repositorio.RutaRepository;
import com.rutafantasma.backend.repositorio.UsuarioRepository;

/** Lógica de negocio de las rutas. Cada usuario solo ve y crea sus propias rutas. */
@Service
public class RutaService {

    private final RutaRepository rutas;
    private final UsuarioRepository usuarios;

    public RutaService(RutaRepository rutas, UsuarioRepository usuarios) {
        this.rutas = rutas;
        this.usuarios = usuarios;
    }

    /** Rutas del usuario, de la más reciente a la más antigua. */
    @Transactional(readOnly = true)
    public List<RutaResponse> listar(Long usuarioId) {
        return rutas.findByUsuarioIdOrderByFechaCreacionDesc(usuarioId).stream().map(RutaResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public RutaResponse obtener(Long usuarioId, Long id) {
        // Si la ruta es de otro usuario se responde igual que si no existiera, para no revelar nada
        Ruta ruta = rutas.findById(id)
                .filter(r -> r.getUsuario().getId().equals(usuarioId))
                .orElseThrow(() -> new RutaNoEncontradaException(id));
        return RutaResponse.de(ruta);
    }

    @Transactional
    public RutaResponse crear(Long usuarioId, RutaRequest peticion) {
        comprobarTiempos(peticion.puntos());
        // getReferenceById no consulta la base de datos: solo hace falta el id para la clave foránea
        Usuario usuario = usuarios.getReferenceById(usuarioId);

        Ruta ruta = new Ruta(peticion.nombre().trim(), usuario);
        peticion.puntos().forEach(p -> ruta.anadirPunto(new Punto(p.latitud(), p.longitud(), p.tiempoSegundos())));

        int numeroSectores = peticion.numeroSectores() != null ? peticion.numeroSectores() : RutaRequest.SECTORES_POR_DEFECTO;
        dividirEnSectores(ruta, numeroSectores);

        return RutaResponse.de(rutas.save(ruta));
    }

    /** El tiempo de cada punto tiene que ser igual o mayor que el del anterior: el reloj no va hacia atrás. */
    private static void comprobarTiempos(List<PuntoDto> puntos) {
        for (int i = 1; i < puntos.size(); i++) {
            if (puntos.get(i).tiempoSegundos() < puntos.get(i - 1).tiempoSegundos()) {
                throw new DatosRutaIncorrectosException(
                        "El tiempo del punto " + i + " es menor que el del punto anterior");
            }
        }
    }

    /**
     * Reparte los puntos en sectores de tamaño parecido. Con 7 puntos (0..6) y 3 sectores
     * quedan los tramos 0→2, 2→4 y 4→6: el final de un sector es el inicio del siguiente.
     * Nunca hay más sectores que tramos entre puntos.
     */
    private static void dividirEnSectores(Ruta ruta, int pedidos) {
        int ultimo = ruta.getPuntos().size() - 1;
        int numero = Math.min(pedidos, ultimo);
        for (int i = 0; i < numero; i++) {
            int inicio = Math.round((float) i * ultimo / numero);
            int fin = Math.round((float) (i + 1) * ultimo / numero);
            ruta.anadirSector(new Sector(i + 1, inicio, fin));
        }
    }
}
