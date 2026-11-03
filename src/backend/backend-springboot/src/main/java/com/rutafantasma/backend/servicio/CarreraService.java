package com.rutafantasma.backend.servicio;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rutafantasma.backend.dto.CarreraRequest;
import com.rutafantasma.backend.dto.CarreraResponse;
import com.rutafantasma.backend.dto.PuntoDto;
import com.rutafantasma.backend.excepcion.RutaNoEncontradaException;
import com.rutafantasma.backend.modelo.Carrera;
import com.rutafantasma.backend.modelo.Punto;
import com.rutafantasma.backend.modelo.PuntoCarrera;
import com.rutafantasma.backend.modelo.Ruta;
import com.rutafantasma.backend.repositorio.CarreraRepository;
import com.rutafantasma.backend.repositorio.RutaRepository;

/**
 * Lógica de las carreras. Cada vez que el usuario corre una de sus rutas se guarda una carrera
 * con sus puntos; si es la más rápida pasa a ser la sombra (mejor marca) de la ruta.
 */
@Service
public class CarreraService {

    private final CarreraRepository carreras;
    private final RutaRepository rutas;

    public CarreraService(CarreraRepository carreras, RutaRepository rutas) {
        this.carreras = carreras;
        this.rutas = rutas;
    }

    @Transactional
    public CarreraResponse subir(Long usuarioId, Long rutaId, CarreraRequest peticion) {
        List<PuntoDto> puntos = peticion.puntos();
        RutaService.comprobarTiempos(puntos);

        // Solo se pueden correr las rutas propias; las de otro usuario responden 404, como en RutaService
        Ruta ruta = rutas.findById(rutaId)
                .filter(r -> r.getUsuario().getId().equals(usuarioId))
                .orElseThrow(() -> new RutaNoEncontradaException(rutaId));

        // Los tiempos son segundos desde la salida, así que el del último punto es el tiempo total
        long tiempoTotal = puntos.get(puntos.size() - 1).tiempoSegundos();
        Carrera carrera = new Carrera(ruta, ruta.getUsuario(), tiempoTotal);
        puntos.forEach(p -> carrera.anadirPunto(new PuntoCarrera(p.latitud(), p.longitud(), p.tiempoSegundos())));

        actualizarMejorMarca(ruta, carrera);
        return CarreraResponse.de(carreras.save(carrera));
    }

    /**
     * La primera sombra es la propia grabación de la ruta (el tiempo de su último punto).
     * La carrera nueva es mejor marca si baja ese tiempo y el de la mejor carrera anterior,
     * que en ese caso deja de serlo: solo hay una mejor marca por ruta.
     */
    private void actualizarMejorMarca(Ruta ruta, Carrera nueva) {
        List<Punto> puntosRuta = ruta.getPuntos();
        long tiempoRuta = puntosRuta.get(puntosRuta.size() - 1).getTiempoSegundos();
        Optional<Carrera> anterior = carreras.findFirstByRutaIdAndMejorMarcaTrue(ruta.getId());
        long aBatir = anterior.map(Carrera::getTiempoTotalSegundos).orElse(tiempoRuta);

        if (nueva.getTiempoTotalSegundos() < aBatir) {
            anterior.ifPresent(c -> c.setMejorMarca(false));
            nueva.setMejorMarca(true);
        }
    }
}
