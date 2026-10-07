import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PurchaseSuccess } from './purchase-success';

describe('PurchaseSuccess', () => {
  let component: PurchaseSuccess;
  let fixture: ComponentFixture<PurchaseSuccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseSuccess],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseSuccess);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
