package com.rutafantasma.backend.servicio;

import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rutafantasma.backend.dto.AuthResponse;
import com.rutafantasma.backend.dto.LoginRequest;
import com.rutafantasma.backend.dto.RegistroRequest;
import com.rutafantasma.backend.dto.UsuarioResponse;
import com.rutafantasma.backend.excepcion.CredencialesIncorrectasException;
import com.rutafantasma.backend.excepcion.EmailYaRegistradoException;
import com.rutafantasma.backend.modelo.Usuario;
import com.rutafantasma.backend.repositorio.UsuarioRepository;

/** Lógica de registro e inicio de sesión. */
@Service
public class AuthService {

    private final UsuarioRepository usuarios;
    private final PasswordEncoder cifrador;
    private final TokenService tokens;

    public AuthService(UsuarioRepository usuarios, PasswordEncoder cifrador, TokenService tokens) {
        this.usuarios = usuarios;
        this.cifrador = cifrador;
        this.tokens = tokens;
    }

    @Transactional
    public AuthResponse registrar(RegistroRequest peticion) {
        String email = normalizar(peticion.email());
        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw new EmailYaRegistradoException();
        }
        // Se guarda el hash, nunca la contraseña tal cual
        Usuario nuevo = new Usuario(peticion.nombre().trim(), email, cifrador.encode(peticion.password()));
        return respuesta(usuarios.save(nuevo));
    }

    @Transactional(readOnly = true)
    public AuthResponse iniciarSesion(LoginRequest peticion) {
        // Mismo error si no existe el email o si la contraseña falla: así no se revela qué emails están registrados
        Usuario usuario = usuarios.findByEmailIgnoreCase(normalizar(peticion.email()))
                .filter(u -> cifrador.matches(peticion.password(), u.getPasswordHash()))
                .orElseThrow(CredencialesIncorrectasException::new);
        return respuesta(usuario);
    }

    private AuthResponse respuesta(Usuario usuario) {
        return new AuthResponse(tokens.generar(usuario), UsuarioResponse.de(usuario));
    }

    private static String normalizar(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
