import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Ranking } from './ranking';

describe('Ranking', () => {
  it('deRuta() pide GET /api/rutas/{id}/ranking', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const servidor = TestBed.inject(HttpTestingController);

    TestBed.inject(Ranking).deRuta('7').subscribe();

    servidor
      .expectOne({ method: 'GET', url: `${environment.apiUrl}/rutas/7/ranking` })
      .flush({ rutaId: '7', rutaNombre: 'Parque', entradas: [] });
    servidor.verify();
  });
});
