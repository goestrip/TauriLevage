import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageEpiComponent } from './page-epi.component';

describe('PageEpiComponent', () => {
  let component: PageEpiComponent;
  let fixture: ComponentFixture<PageEpiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageEpiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageEpiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
