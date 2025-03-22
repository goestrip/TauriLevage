import { Component } from '@angular/core';
import {MatTableModule} from '@angular/material/table';

class EpiData {
  id: number = 0;
  name: string = '' ;
  description: string= '';
}

@Component({
  selector: 'app-page-epi',
  imports: [MatTableModule],
  templateUrl: './page-epi.component.html',
  styleUrl: './page-epi.component.scss'
})
export class PageEpiComponent {

  columnsToDisplay:string[] = ['id', 'name'];

  epiData = [
    { id: 1, name: 'Epi 1', description: 'Epi 1 description' },
    { id: 2, name: 'Epi 2', description: 'Epi 2 description' },
    { id: 3, name: 'Epi 3', description: 'Epi 3 description' },
    { id: 4, name: 'Epi 4', description: 'Epi 4 description' },
    { id: 5, name: 'Epi 5', description: 'Epi 5 description' },
  ];
}
