import { Component, effect} from '@angular/core';

import {MatTableModule} from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { Epi } from '../../model/epi';
import { DataModelService } from '../../services/data-model.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EpiDataSource } from '../../services/dataSource';


const COLUMNS_SCHEMA = [
  {
    key: "serial",
    type: "text",
    label: "numero de serie"
  },
  {
    key: "date_fabrication",
    type: "text",
    label: "date_fabrication"
  },
  {
    key: "occupation",
    type: "text",
    label: "Occupation"
  },
  {
    key: "validite_years",
    type: "number",
    label: "Validite"
  }
]

@Component({
  selector: 'app-page-epi',
  imports: [MatTableModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    DatePipe,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './page-epi.component.html',
  styleUrl: './page-epi.component.scss'
})
export class PageEpiComponent {

   displayedColumns: string[] = [
     'serial',
     'nature',
     'date_fabrication',
     'date_mise_en_service',
     'validite_years',
     'validiteLimite',
     'assignedTo',
     'emplacement',
   
     'date_last_control',
     'date_rebus',
     'edition',
    // 'anomalies',
   ];
   

  epiData: EpiDataSource;

  constructor(private dataService: DataModelService) {
    this.epiData = this.dataService.epiSource;
  }


  editEpi(epi: Epi) {
    console.log(epi);
  }

  validityOverdue(epi: Epi): boolean {
    return  new Date() >= epi.validiteLimite ;    
  }
  dateControl(epi: Epi): boolean {
    epi.date_last_control
    return true;
  }
}
