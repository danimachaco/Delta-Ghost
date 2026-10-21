package com.rutafantasma.desarrollador1.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Una carrera guardada: lista de puntos GPS con sus tiempos.
 * La "sombra" del corredor es la carrera con menor tiempo total de un mismo recorrido.
 */
@Document(collection = "rutas")
public class Ruta {

    @Id
    private String id;
    private String nombre;
    private LocalDateTime fecha;
    private List<PuntoGps> puntos = new ArrayList<>();

    public Ruta() {
    }

    public Ruta(String nombre, LocalDateTime fecha, List<PuntoGps> puntos) {
        this.nombre = nombre;
        this.fecha = fecha;
        this.puntos = puntos;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public List<PuntoGps> getPuntos() { return puntos; }
    public void setPuntos(List<PuntoGps> puntos) { this.puntos = puntos; }
}
