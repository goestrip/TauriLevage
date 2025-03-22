import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageContractuelComponent } from './page-contractuel.component';

describe('PageContractuelComponent', () => {
  let component: PageContractuelComponent;
  let fixture: ComponentFixture<PageContractuelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageContractuelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageContractuelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
