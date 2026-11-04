package com.rutafantasma.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Indica desde qué direcciones puede el navegador llamar a la API (CORS).
 *
 * Las direcciones permitidas se leen de la propiedad `cors.origenes` (variable de entorno
 * CORS_ORIGENES, separadas por comas). Por defecto se permite `localhost` en cualquier puerto,
 * así el frontend funciona aunque `ng serve` use otro puerto distinto del 4200.
 * Cuando el frontend se publique (p. ej. en Vercel), se añade su dirección:
 *   CORS_ORIGENES=http://localhost:*,https://mi-app.vercel.app
 *
 * Se permite la cabecera Authorization para que el frontend pueda enviar el token.
 */
@Configuration
public class CorsConfig {

    private final String[] origenes;

    public CorsConfig(@Value("${cors.origenes}") String[] origenes) {
        this.origenes = origenes;
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        // "Patterns" admite comodines en el puerto (http://localhost:*)
                        .allowedOriginPatterns(origenes)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("Authorization", "Content-Type");
            }
        };
    }
}
