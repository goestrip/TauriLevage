import { Component, effect, inject, ViewChild} from '@angular/core';

import {LiveAnnouncer} from '@angular/cdk/a11y';
import {MatSort, Sort, MatSortModule} from '@angular/material/sort';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { FormEpiComponent } from '../../forms/form-epi/form-epi.component';

import { Epi } from '../../model/epi';
import { DataModelService } from '../../services/data-model.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EpiDataSource } from '../../services/dataSource';
import { Criticity } from '../../model/criticity';
import { provideNativeDateAdapter } from '@angular/material/core';
import { EpiMateriel } from '../../model/catalogMateriel';


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
    CommonModule,
    MatSortModule ,
    MatDatepickerModule,
    MatOptionModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './page-epi.component.html',
  styleUrl: './page-epi.component.scss'
})
export class PageEpiComponent {

   displayedColumns: string[] = [
     'edition',
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
     'anomaly_name',
     'anomaly_criticity',
   ];
   
  private _liveAnnouncer = inject(LiveAnnouncer);

  epiData: MatTableDataSource<Epi>;
  epiMateriel: EpiMateriel[] = [];

  editingRow: any = null;

 
  @ViewChild(MatSort) sort: MatSort | null = null;

  constructor(private dataService: DataModelService) {
    this.epiData = this.dataService.epiSource;

    effect(() => {
      this.epiMateriel = this.dataService.materiels();

    });
  }

  
  ngAfterViewInit() {
    this.epiData.sort = this.sort;
  }

  readonly dialog = inject(MatDialog); // Inject MatDialog

  toggleEditRow(epi: Epi): void {
    const dialogRef = this.dialog.open(FormEpiComponent, {
      data: { formTitle: 'Edit EPI', epi: epi } // Pass the EPI to the dialog
    });

    dialogRef.afterClosed().subscribe((updatedEpi: Epi) => {
      if (updatedEpi) {
        epi.copyFrom(updatedEpi); // Update the EPI with the changes
        this.saveRow(epi); // Save the updated EPI
      }
    });
  }

  saveRow(epi: any): void {
    this.dataService.saveEpi(epi); // Save the EPI to the data service
  }

  validityOverdue(epi: Epi): boolean {
    if (!epi.validiteLimite) {
      return false;
    }
    return  new Date() >= epi.validiteLimite ;    
  }
  
  dateControl(epi: Epi): boolean {
    epi.date_last_control
    return true;
  }

  announceSortChange(sortState: Sort) {
    // This example uses English messages. If your application supports
    // multiple language, you would internationalize these strings.
    // Furthermore, you can customize the message to add additional
    // details about the values being sorted.
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  isRebus(epi: Epi): boolean {
    return epi.date_rebus !== null;
  }

  isRowRebus(rowData: any): boolean{
    console.log(rowData);
    return Math.random() < 0.5;
    
  }

  getCriticityClass(epi: any): string {
    switch (epi.anomaly?.criticity) {
      case Criticity.NORMAL:
        return 'class-normal';
      case Criticity.URGENT:
        return 'class-urgent';
      case Criticity.CRITICAL:
        return 'class-critical';
      default:
        return '';
    }
  }
  
}
