import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PurchaseSuccess } from './purchase-success';

describe('PurchaseSuccess', () => {
  let component: PurchaseSuccess;
  let fixture: ComponentFixture<PurchaseSuccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseSuccess],
    providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseSuccess);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
