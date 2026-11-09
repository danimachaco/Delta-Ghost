package com.rutafantasma.backend.servicio;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rutafantasma.backend.dto.AmistadResponse;
import com.rutafantasma.backend.dto.SolicitudesResponse;
import com.rutafantasma.backend.excepcion.AmistadRepetidaException;
import com.rutafantasma.backend.excepcion.SolicitudAmistadIncorrectaException;
import com.rutafantasma.backend.excepcion.SolicitudNoEncontradaException;
import com.rutafantasma.backend.excepcion.UsuarioNoEncontradoException;
import com.rutafantasma.backend.modelo.Amistad;
import com.rutafantasma.backend.modelo.Usuario;
import com.rutafantasma.backend.repositorio.AmistadRepository;
import com.rutafantasma.backend.repositorio.UsuarioRepository;

/**
 * Lógica de los amigos: enviar solicitudes (por email), aceptarlas y listar amigos y solicitudes.
 * Una amistad es mutua: da igual quién la pidiera, los dos se ven en su lista de amigos.
 */
@Service
public class AmistadService {

    private final AmistadRepository amistades;
    private final UsuarioRepository usuarios;

    public AmistadService(AmistadRepository amistades, UsuarioRepository usuarios) {
        this.amistades = amistades;
        this.usuarios = usuarios;
    }

    /**
     * Envía una solicitud de amistad al corredor con ese email.
     * Si esa persona ya te había enviado una a ti, no se crea otra: se acepta la suya directamente.
     */
    @Transactional
    public AmistadResponse enviar(Long usuarioId, String email) {
        Usuario destinatario = usuarios.findByEmailIgnoreCase(email.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(UsuarioNoEncontradoException::new);
        if (destinatario.getId().equals(usuarioId)) {
            throw new SolicitudAmistadIncorrectaException("No puedes enviarte una solicitud de amistad a ti mismo");
        }

        Optional<Amistad> mia = amistades.findBySolicitanteIdAndDestinatarioId(usuarioId, destinatario.getId());
        Optional<Amistad> suya = amistades.findBySolicitanteIdAndDestinatarioId(destinatario.getId(), usuarioId);
        if (esAceptada(mia) || esAceptada(suya)) {
            throw new AmistadRepetidaException("Ya sois amigos");
        }
        if (mia.isPresent()) {
            throw new AmistadRepetidaException("Ya le has enviado una solicitud de amistad");
        }
        if (suya.isPresent()) {
            suya.get().aceptar();
            return AmistadResponse.de(suya.get(), usuarioId);
        }

        // getReferenceById no consulta la base de datos: solo hace falta el id para la clave foránea
        Amistad nueva = new Amistad(usuarios.getReferenceById(usuarioId), destinatario);
        return AmistadResponse.de(amistades.save(nueva), usuarioId);
    }

    /** Acepta una solicitud recibida. Solo puede aceptarla su destinatario y solo si sigue pendiente. */
    @Transactional
    public AmistadResponse aceptar(Long usuarioId, Long id) {
        Amistad solicitud = amistades.findById(id)
                .filter(a -> a.getDestinatario().getId().equals(usuarioId))
                .filter(a -> a.getEstado() == Amistad.Estado.PENDIENTE)
                .orElseThrow(() -> new SolicitudNoEncontradaException(id));
        solicitud.aceptar();
        return AmistadResponse.de(solicitud, usuarioId);
    }

    /** Amigos del usuario, del más reciente al más antiguo */
    @Transactional(readOnly = true)
    public List<AmistadResponse> amigos(Long usuarioId) {
        return amistades.amigosDe(usuarioId).stream().map(a -> AmistadResponse.de(a, usuarioId)).toList();
    }

    /** Solicitudes pendientes: las que has recibido y las que has enviado */
    @Transactional(readOnly = true)
    public SolicitudesResponse solicitudes(Long usuarioId) {
        return new SolicitudesResponse(
                amistades.findByDestinatarioIdAndEstadoOrderByFechaSolicitudDesc(usuarioId, Amistad.Estado.PENDIENTE)
                        .stream().map(a -> AmistadResponse.de(a, usuarioId)).toList(),
                amistades.findBySolicitanteIdAndEstadoOrderByFechaSolicitudDesc(usuarioId, Amistad.Estado.PENDIENTE)
                        .stream().map(a -> AmistadResponse.de(a, usuarioId)).toList());
    }

    private static boolean esAceptada(Optional<Amistad> amistad) {
        return amistad.map(a -> a.getEstado() == Amistad.Estado.ACEPTADA).orElse(false);
    }
}
