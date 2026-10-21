package com.rutafantasma.desarrollador1.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.rutafantasma.desarrollador1.model.Ruta;

/** Acceso a la colección "rutas" de MongoDB. */
public interface RutaRepository extends MongoRepository<Ruta, String> {

    List<Ruta> findByNombreIgnoreCase(String nombre);
}
