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
import {MatButtonModule} from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { FormEpiComponent } from '../../forms/form-epi/form-epi.component';

import { Epi } from '../../model/epi';
import { DataModelService } from '../../services/data-model.service';
import { Criticity } from '../../model/criticity';
import { provideNativeDateAdapter } from '@angular/material/core';
import { EpiMateriel, LevageMateriel } from '../../model/catalogMateriel';
import { Levage } from '../../model/levage';
import { FormLevageComponent } from '../../forms/form-levage/form-levage.component';



@Component({
  selector: 'app-page-epi',
  imports: [MatTableModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    DatePipe,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatSortModule ,
    MatDatepickerModule,
    MatOptionModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './page-levage.component.html',
  styleUrl: './page-levage.component.scss'
})
export class PageLevageComponent {

   displayedColumns: string[] = [
     'edition',
     'nature',
     'serial',
     'date_mise_en_service',
     'cmu_kg',
     'essai_charge',
     'assigned_to',
     'emplacement',
   
     'date_last_control',
     'date_rebus',
     'anomaly_name',
     'anomaly_criticity',
   ];
   
  private _liveAnnouncer = inject(LiveAnnouncer);

  levageData: MatTableDataSource<Levage>;
  levageMateriel: LevageMateriel[] = [];
  filter: string = '';

  editingRow: any = null;
  readonly dialog = inject(MatDialog); // Inject MatDialog
 
  @ViewChild(MatSort) sort: MatSort | null = null;

  constructor(private dataService: DataModelService) {
    this.levageData = this.dataService.levageSource;

    effect(() => {
      this.levageMateriel = this.dataService.levageMateriels();
      console.log("levageMateriel received", this.levageMateriel);
      
    });
  }

  ngOnInit(): void {
    console.log("ngOnInit levageData", this.levageData);
    
    this.dataService.loadLevages(); // Load levages when the component initializes
  }

  
  ngAfterViewInit() {
    this.levageData.sort = this.sort;
  }

  

  toggleEditRow(levage: Levage): void {
    const dialogRef = this.dialog.open(FormLevageComponent, {
      width: '900px',
      maxWidth: '90vw',
      data: { formTitle: 'Edition Levage', levage: levage } // Pass the EPI to the dialog
    });


    dialogRef.afterClosed().subscribe((updatedLevage: Levage) => {
      if (updatedLevage) {
        levage.copyFrom(updatedLevage); // Update the EPI with the changes
        this.saveRow(levage); // Save the updated EPI
      }
    });
  }

  saveRow(levage: Levage): void {
    this.dataService.saveLevage(levage); // Save the EPI to the data service
  }

  getValidityClass(epi: Epi): string {
    if (!epi.validiteLimite) {
      return '';
    }
    const twoMonthsBeforeLimit = new Date(epi.validiteLimite);
    twoMonthsBeforeLimit.setMonth(twoMonthsBeforeLimit.getMonth() - 2);

    const now = new Date();
    
    if (now >= twoMonthsBeforeLimit && now < epi.validiteLimite) {
      return 'class-urgent';
    }
    else if (now >= epi.validiteLimite) {
      return 'class-critical';
    }
    else{
      return '';
    }
  }

  getControlClass(epi: Epi): string {
    const controlDates = epi.WarningControlDate;
    if (controlDates) {
      const now = new Date();
      if (now >= controlDates.warningDate && now < controlDates.overdueDate) {
        return 'class-urgent'; // Warning state
      } else if (now >= controlDates.overdueDate) {
        return 'class-critical'; // Overdue state
      } else {
        return ''; // Normal state
      }
    } else {
      return ''; // No control date available
    }
  }
  
  dateControl(epi: Epi): boolean {
    epi.date_last_control
    return true;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.levageData.filter = filterValue.trim().toLowerCase();
  }

  clearFilter(): void {
    this.filter = '';
    this.levageData.filter = ''; // Clear the filter
  }

  announceSortChange(sortState: Sort) {
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
      case Criticity.PROCESSED:
        return 'class-processed';
      default:
        return '';
    }
  }

  importCsv() {
    // Implement CSV import functionality here
    console.log('Importing CSV...');
  }

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target?.result as string;
        this.dataService.parseCsvData(csvData);
      };
      reader.readAsText(file);
    }
  }
  
}
