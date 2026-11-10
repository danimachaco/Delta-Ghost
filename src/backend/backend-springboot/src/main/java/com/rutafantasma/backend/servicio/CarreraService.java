package com.rutafantasma.backend.servicio;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rutafantasma.backend.dto.CarreraRequest;
import com.rutafantasma.backend.dto.CarreraResponse;
import com.rutafantasma.backend.dto.PuntoDto;
import com.rutafantasma.backend.modelo.Carrera;
import com.rutafantasma.backend.modelo.Punto;
import com.rutafantasma.backend.modelo.PuntoCarrera;
import com.rutafantasma.backend.modelo.Ruta;
import com.rutafantasma.backend.repositorio.CarreraRepository;
import com.rutafantasma.backend.repositorio.UsuarioRepository;

/**
 * Lógica de las carreras. Cada vez que un corredor corre una ruta (suya o de un amigo, PS-64) se guarda
 * una carrera con sus puntos; si es su tiempo más rápido en esa ruta pasa a ser su sombra (mejor marca).
 */
@Service
public class CarreraService {

    private final CarreraRepository carreras;
    private final UsuarioRepository usuarios;
    private final AccesoRutas acceso;

    public CarreraService(CarreraRepository carreras, UsuarioRepository usuarios, AccesoRutas acceso) {
        this.carreras = carreras;
        this.usuarios = usuarios;
        this.acceso = acceso;
    }

    @Transactional
    public CarreraResponse subir(Long usuarioId, Long rutaId, CarreraRequest peticion) {
        List<PuntoDto> puntos = peticion.puntos();
        RutaService.comprobarTiempos(puntos);

        // Se pueden correr las rutas propias y las de los amigos; las demás responden 404 (AccesoRutas)
        Ruta ruta = acceso.visible(usuarioId, rutaId);

        // Los tiempos son segundos desde la salida, así que el del último punto es el tiempo total
        long tiempoTotal = puntos.get(puntos.size() - 1).tiempoSegundos();
        Carrera carrera = new Carrera(ruta, usuarios.getReferenceById(usuarioId), tiempoTotal);
        puntos.forEach(p -> carrera.anadirPunto(new PuntoCarrera(p.latitud(), p.longitud(), p.tiempoSegundos())));

        actualizarMejorMarca(ruta, usuarioId, carrera);
        return CarreraResponse.de(carreras.save(carrera));
    }

    /**
     * Cada corredor tiene su propia mejor marca en la ruta (PS-64).
     * Para el dueño, la primera sombra es la propia grabación de la ruta (el tiempo de su último punto).
     * La carrera nueva es mejor marca si baja ese tiempo y el de su mejor carrera anterior, que en ese caso
     * deja de serlo: solo hay una mejor marca por corredor y ruta. La primera carrera de un amigo siempre lo es.
     */
    private void actualizarMejorMarca(Ruta ruta, Long usuarioId, Carrera nueva) {
        Optional<Carrera> anterior = carreras.findFirstByRutaIdAndUsuarioIdAndMejorMarcaTrue(ruta.getId(), usuarioId);
        long aBatir;
        if (anterior.isPresent()) {
            aBatir = anterior.get().getTiempoTotalSegundos();
        } else if (ruta.getUsuario().getId().equals(usuarioId)) {
            List<Punto> puntosRuta = ruta.getPuntos();
            aBatir = puntosRuta.get(puntosRuta.size() - 1).getTiempoSegundos();
        } else {
            aBatir = Long.MAX_VALUE;
        }

        if (nueva.getTiempoTotalSegundos() < aBatir) {
            anterior.ifPresent(c -> c.setMejorMarca(false));
            nueva.setMejorMarca(true);
        }
    }
}
