import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageLevageComponent } from './page-levage.component';

describe('PageLevageComponent', () => {
  let component: PageLevageComponent;
  let fixture: ComponentFixture<PageLevageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageLevageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageLevageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
