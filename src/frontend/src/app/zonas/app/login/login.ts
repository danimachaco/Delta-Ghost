import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ErrorApi } from '../../../core/modelos/error-api';
import { Auth } from '../../../core/servicios/auth';

/** Pantalla de inicio de sesión (/app/login) */
@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrls: ['../../../compartido/estilos/formulario.css'],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  /** true mientras se espera la respuesta del servidor */
  protected readonly enviando = signal(false);

  /** Mensaje de error del servidor (credenciales incorrectas, sin conexión…) */
  protected readonly errorServidor = signal<string | null>(null);

  protected enviar(): void {
    if (this.formulario.invalid) {
      // Marca los campos para que se vean sus errores
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorServidor.set(null);

    this.auth.login(this.formulario.getRawValue()).subscribe({
      next: () => {
        // Vuelve a la página que se quería ver antes de entrar, o a la app
        const volver = this.ruta.snapshot.queryParamMap.get('volver');
        this.router.navigateByUrl(volver?.startsWith('/') ? volver : '/app');
      },
      error: (error: ErrorApi) => {
        this.errorServidor.set(
          error.estado === 401 ? 'El email o la contraseña no son correctos.' : error.mensaje,
        );
        this.enviando.set(false);
      },
    });
  }

  /** true si el campo tiene errores y el usuario ya lo ha tocado */
  protected mostrarError(campo: 'email' | 'password'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
  }
}
