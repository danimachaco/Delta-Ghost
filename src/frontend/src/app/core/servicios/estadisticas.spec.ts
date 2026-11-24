import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { EstadisticasServicio } from './estadisticas';

describe('EstadisticasServicio', () => {
  it('mias() pide GET /api/estadisticas', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const servidor = TestBed.inject(HttpTestingController);

    TestBed.inject(EstadisticasServicio).mias().subscribe();

    servidor.expectOne({ method: 'GET', url: `${environment.apiUrl}/estadisticas` }).flush({});
    servidor.verify();
  });
});
