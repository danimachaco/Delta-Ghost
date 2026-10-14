import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppInicio } from './app-inicio';

describe('AppInicio', () => {
  let component: AppInicio;
  let fixture: ComponentFixture<AppInicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppInicio],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppInicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('se crea', () => {
    expect(component).toBeTruthy();
  });
});
