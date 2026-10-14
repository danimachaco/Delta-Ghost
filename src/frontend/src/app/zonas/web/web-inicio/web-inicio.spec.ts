import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WebInicio } from './web-inicio';

describe('WebInicio', () => {
  let component: WebInicio;
  let fixture: ComponentFixture<WebInicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebInicio],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(WebInicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('se crea', () => {
    expect(component).toBeTruthy();
  });

  it('muestra las tres características del producto', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.tarjeta').length).toBe(3);
  });
});
