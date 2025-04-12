import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormLevageComponent } from './form-levage.component';

describe('FormLevageComponent', () => {
  let component: FormLevageComponent;
  let fixture: ComponentFixture<FormLevageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormLevageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormLevageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
