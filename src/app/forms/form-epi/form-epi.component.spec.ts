import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormEpiComponent } from './form-epi.component';

describe('FormEpiComponent', () => {
  let component: FormEpiComponent;
  let fixture: ComponentFixture<FormEpiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormEpiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormEpiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
