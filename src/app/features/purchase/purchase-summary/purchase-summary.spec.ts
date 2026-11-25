import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PurchaseSummary } from './purchase-summary';

describe('PurchaseSummary', () => {
  let component: PurchaseSummary;
  let fixture: ComponentFixture<PurchaseSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseSummary],
    providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseSummary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
