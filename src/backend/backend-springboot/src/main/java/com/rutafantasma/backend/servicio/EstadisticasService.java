package com.rutafantasma.backend.servicio;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rutafantasma.backend.dto.EstadisticasResponse;
import com.rutafantasma.backend.dto.EstadisticasResponse.Evolucion;
import com.rutafantasma.backend.dto.EstadisticasResponse.PorRuta;
import com.rutafantasma.backend.dto.EstadisticasResponse.Resumen;
import com.rutafantasma.backend.dto.EstadisticasResponse.Semana;
import com.rutafantasma.backend.modelo.Ruta;
import com.rutafantasma.backend.repositorio.CarreraRepository;
import com.rutafantasma.backend.repositorio.RutaRepository;

/**
 * Estadísticas de un corredor (PS-75): totales, actividad por semanas, progreso en cada ruta
 * y evolución del ritmo. Cuenta cada vez que ha corrido: sus carreras (en rutas propias o de amigos)
 * y la grabación de sus rutas, que es su primera vuelta a cada una (igual que en el ranking, PS-64).
 */
@Service
public class EstadisticasService {

    /** Semanas que se devuelven si no se pide otra cosa, y el máximo permitido (un año) */
    public static final int SEMANAS_POR_DEFECTO = 12;
    public static final int SEMANAS_MAXIMO = 52;

    /** Carreras que se devuelven en la evolución: las más recientes, para que el gráfico se lea bien */
    static final int EVOLUCION_MAXIMO = 50;

    private final RutaRepository rutas;
    private final CarreraRepository carreras;

    public EstadisticasService(RutaRepository rutas, CarreraRepository carreras) {
        this.rutas = rutas;
        this.carreras = carreras;
    }

    /** Una vez que corrió el usuario, con la ruta y la distancia ya calculadas */
    private record Vez(Marca marca, Ruta ruta, double metros) {
        long tiempo() {
            return marca.tiempoTotalSegundos();
        }
    }

    /**
     * @param semanas cuántas semanas incluir en la serie semanal; se limita entre 1 y 52
     * @param hoy     día de hoy (se pasa desde fuera para que las pruebas no dependan del reloj)
     */
    @Transactional(readOnly = true)
    public EstadisticasResponse estadisticas(Long usuarioId, int semanas, LocalDate hoy) {
        List<Vez> veces = veces(usuarioId);
        return new EstadisticasResponse(
                resumen(veces),
                porSemana(veces, Math.max(1, Math.min(SEMANAS_MAXIMO, semanas)), hoy),
                porRuta(veces),
                evolucion(veces));
    }

    /** Las grabaciones de sus rutas y todas sus carreras, de la más antigua a la más reciente */
    private List<Vez> veces(Long usuarioId) {
        List<Vez> veces = new ArrayList<>();
        rutas.findByUsuarioIdOrderByFechaCreacionDesc(usuarioId)
                .forEach(r -> veces.add(vez(Marca.deGrabacion(r), r)));
        carreras.findByUsuarioIdOrderByFechaAsc(usuarioId)
                .forEach(c -> veces.add(vez(Marca.de(c), c.getRuta())));
        veces.sort(Comparator.comparing(v -> v.marca().fecha()));
        return veces;
    }

    private static Vez vez(Marca marca, Ruta ruta) {
        return new Vez(marca, ruta, Geo.recorrido(marca.puntos(ruta)));
    }

    private static Resumen resumen(List<Vez> veces) {
        double metros = veces.stream().mapToDouble(Vez::metros).sum();
        long segundos = veces.stream().mapToLong(Vez::tiempo).sum();
        Long mejorRitmo = veces.stream()
                .map(v -> ritmo(v.tiempo(), v.metros()))
                .filter(r -> r != null)
                .min(Long::compare)
                .orElse(null);
        return new Resumen(
                veces.size(),
                (int) veces.stream().map(v -> v.ruta().getId()).distinct().count(),
                Math.round(metros),
                segundos,
                ritmo(segundos, metros),
                mejorRitmo,
                Math.round(veces.stream().mapToDouble(Vez::metros).max().orElse(0)));
    }

    /** Las últimas `numero` semanas (de lunes a domingo), incluida la actual, con ceros en las que no corrió */
    private static List<Semana> porSemana(List<Vez> veces, int numero, LocalDate hoy) {
        LocalDate lunesActual = hoy.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<Semana> semanas = new ArrayList<>();
        for (int i = numero - 1; i >= 0; i--) {
            LocalDate inicio = lunesActual.minusWeeks(i);
            LocalDate fin = inicio.plusWeeks(1);
            List<Vez> enSemana = veces.stream()
                    .filter(v -> {
                        LocalDate dia = v.marca().fecha().toLocalDate();
                        return !dia.isBefore(inicio) && dia.isBefore(fin);
                    })
                    .toList();
            semanas.add(new Semana(
                    inicio,
                    enSemana.size(),
                    Math.round(enSemana.stream().mapToDouble(Vez::metros).sum()),
                    enSemana.stream().mapToLong(Vez::tiempo).sum()));
        }
        return semanas;
    }

    /** Progreso en cada ruta, ordenado por la ruta que más ha corrido */
    private static List<PorRuta> porRuta(List<Vez> veces) {
        Map<Long, List<Vez>> porRuta = new LinkedHashMap<>();
        veces.forEach(v -> porRuta.computeIfAbsent(v.ruta().getId(), id -> new ArrayList<>()).add(v));
        return porRuta.values().stream()
                .map(lista -> {
                    // `veces` ya está en orden de fecha, así que la primera es la más antigua y la última la más reciente
                    Ruta ruta = lista.get(0).ruta();
                    long primero = lista.get(0).tiempo();
                    long mejor = lista.stream().mapToLong(Vez::tiempo).min().orElse(primero);
                    return new PorRuta(String.valueOf(ruta.getId()), ruta.getNombre(), lista.size(),
                            primero, mejor, lista.get(lista.size() - 1).tiempo(), primero - mejor);
                })
                .sorted(Comparator.comparingInt(PorRuta::carreras).reversed())
                .toList();
    }

    /** Las últimas carreras, de la más antigua a la más reciente */
    private static List<Evolucion> evolucion(List<Vez> veces) {
        return veces.subList(Math.max(0, veces.size() - EVOLUCION_MAXIMO), veces.size()).stream()
                .map(v -> new Evolucion(
                        v.marca().carreraId(),
                        String.valueOf(v.ruta().getId()),
                        v.ruta().getNombre(),
                        v.marca().fecha(),
                        v.tiempo(),
                        Math.round(v.metros()),
                        ritmo(v.tiempo(), v.metros())))
                .toList();
    }

    /** Segundos por kilómetro, o null si no hay distancia (no se puede dividir entre 0) */
    private static Long ritmo(long segundos, double metros) {
        return metros > 0 ? Math.round(segundos / (metros / 1000)) : null;
    }
}
