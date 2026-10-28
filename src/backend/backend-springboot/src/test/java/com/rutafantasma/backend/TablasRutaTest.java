package com.rutafantasma.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;

import com.rutafantasma.backend.modelo.Carrera;
import com.rutafantasma.backend.modelo.Punto;
import com.rutafantasma.backend.modelo.Ruta;
import com.rutafantasma.backend.modelo.Sector;
import com.rutafantasma.backend.modelo.Usuario;
import com.rutafantasma.backend.repositorio.CarreraRepository;
import com.rutafantasma.backend.repositorio.RutaRepository;
import com.rutafantasma.backend.repositorio.UsuarioRepository;

/** Comprueba las tablas ruta, punto, sector y carrera y sus relaciones. */
@DataJpaTest
class TablasRutaTest {

    @Autowired
    private UsuarioRepository usuarios;

    @Autowired
    private RutaRepository rutas;

    @Autowired
    private CarreraRepository carreras;

    @Autowired
    private TestEntityManager em;

    private Usuario ana;

    @BeforeEach
    void crearUsuario() {
        ana = usuarios.save(new Usuario("Ana", "ana@correo.com", "hash"));
    }

    private Ruta rutaDelParque() {
        Ruta ruta = new Ruta("Parque", ana);
        ruta.anadirPunto(new Punto(40.4100, -3.7000, 0));
        ruta.anadirPunto(new Punto(40.4110, -3.7010, 30));
        ruta.anadirPunto(new Punto(40.4120, -3.7020, 65));
        ruta.anadirSector(new Sector(1, 0, 1));
        ruta.anadirSector(new Sector(2, 1, 2));
        return ruta;
    }

    @Test
    void alGuardarLaRutaSeGuardanSusPuntosYSectoresEnOrden() {
        Long id = rutas.save(rutaDelParque()).getId();
        em.flush();
        em.clear(); // se vacía la caché para leer de verdad de la base de datos

        Ruta leida = rutas.findById(id).orElseThrow();
        assertThat(leida.getFechaCreacion()).isNotNull();
        assertThat(leida.getPuntos()).extracting(Punto::getOrden).containsExactly(0, 1, 2);
        assertThat(leida.getPuntos()).extracting(Punto::getTiempoSegundos).containsExactly(0L, 30L, 65L);
        assertThat(leida.getSectores()).extracting(Sector::getNumero).containsExactly(1, 2);
    }

    @Test
    void alBorrarLaRutaSeBorranSusPuntosYSectores() {
        Ruta ruta = rutas.save(rutaDelParque());
        em.flush();

        rutas.delete(ruta);
        em.flush();

        assertThat(em.getEntityManager().createQuery("select count(p) from Punto p", Long.class).getSingleResult()).isZero();
        assertThat(em.getEntityManager().createQuery("select count(s) from Sector s", Long.class).getSingleResult()).isZero();
    }

    @Test
    void laSombraEsLaCarreraMasRapida() {
        Ruta ruta = rutas.save(rutaDelParque());
        carreras.save(new Carrera(ruta, ana, 70));
        Carrera rapida = carreras.save(new Carrera(ruta, ana, 65));
        carreras.save(new Carrera(ruta, ana, 80));

        assertThat(carreras.findFirstByRutaIdOrderByTiempoTotalSegundosAsc(ruta.getId())).contains(rapida);
        assertThat(carreras.findByRutaIdOrderByFechaDesc(ruta.getId())).hasSize(3);
    }

    @Test
    void listaLasRutasDeCadaUsuario() {
        rutas.save(rutaDelParque());
        Usuario luis = usuarios.save(new Usuario("Luis", "luis@correo.com", "hash"));
        rutas.save(new Ruta("Río", luis));

        assertThat(rutas.findByUsuarioIdOrderByFechaCreacionDesc(ana.getId())).extracting(Ruta::getNombre).containsExactly("Parque");
    }

    @Test
    void noPermiteDosPuntosConElMismoOrdenEnLaMismaRuta() {
        Ruta ruta = rutaDelParque();
        ruta.getPuntos().get(2).setOrden(1);

        assertThatThrownBy(() -> rutas.saveAndFlush(ruta)).isInstanceOf(DataIntegrityViolationException.class);
    }
}
