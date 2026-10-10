import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisRecompensas } from './mis-recompensas';

describe('MisRecompensas', () => {
  let component: MisRecompensas;
  let fixture: ComponentFixture<MisRecompensas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisRecompensas],
    }).compileComponents();

    fixture = TestBed.createComponent(MisRecompensas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
