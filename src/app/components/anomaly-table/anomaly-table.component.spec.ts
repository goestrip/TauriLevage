import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnomalyTableComponent } from './anomaly-table.component';

describe('AnomalyTableComponent', () => {
  let component: AnomalyTableComponent;
  let fixture: ComponentFixture<AnomalyTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnomalyTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnomalyTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
