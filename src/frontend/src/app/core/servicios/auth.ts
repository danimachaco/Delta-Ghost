import { computed, inject, Service, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { DatosLogin, DatosRegistro, RespuestaAuth, Usuario } from '../modelos/usuario';
import { Api } from './api';

/** Clave con la que se guarda la sesión en el navegador */
const CLAVE_SESION = 'ruta-fantasma.sesion';

/**
 * Servicio de autenticación: inicia sesión, registra usuarios y recuerda
 * quién ha entrado (también al recargar la página, gracias a localStorage).
 *
 * Endpoints del backend que usa:
 *  - POST /api/auth/login     { email, password }          → { token, usuario }
 *  - POST /api/auth/registro  { nombre, email, password }  → { token, usuario }
 */
@Service()
export class Auth {
  private readonly api = inject(Api);

  /** Sesión actual (null si no hay nadie dentro) */
  private readonly sesion = signal<RespuestaAuth | null>(leerSesionGuardada());

  /** Usuario que ha iniciado sesión, o null */
  readonly usuario = computed<Usuario | null>(() => this.sesion()?.usuario ?? null);

  /** Token para enviar al backend, o null */
  readonly token = computed<string | null>(() => this.sesion()?.token ?? null);

  /** true si hay un usuario dentro */
  readonly estaAutenticado = computed(() => this.sesion() !== null);

  /** Inicia sesión. Si va bien, guarda la sesión y devuelve el usuario. */
  login(datos: DatosLogin): Observable<Usuario> {
    return this.api.post<RespuestaAuth>('auth/login', datos).pipe(
      tap((respuesta) => this.guardar(respuesta)),
      map((respuesta) => respuesta.usuario),
    );
  }

  /** Crea una cuenta nueva y deja al usuario dentro directamente. */
  registrar(datos: DatosRegistro): Observable<Usuario> {
    return this.api.post<RespuestaAuth>('auth/registro', datos).pipe(
      tap((respuesta) => this.guardar(respuesta)),
      map((respuesta) => respuesta.usuario),
    );
  }

  /** Cierra la sesión y borra los datos guardados. */
  cerrarSesion(): void {
    this.sesion.set(null);
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      // Si el navegador bloquea localStorage no pasa nada: la sesión ya está cerrada
    }
  }

  private guardar(respuesta: RespuestaAuth): void {
    this.sesion.set(respuesta);
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(respuesta));
    } catch {
      // Sin localStorage (modo privado…) la sesión dura hasta recargar la página
    }
  }
}

/** Lee la sesión guardada en una visita anterior (si existe y es válida). */
function leerSesionGuardada(): RespuestaAuth | null {
  try {
    const texto = localStorage.getItem(CLAVE_SESION);
    const datos = texto ? (JSON.parse(texto) as RespuestaAuth) : null;
    return datos?.token && datos.usuario ? datos : null;
  } catch {
    return null;
  }
}
