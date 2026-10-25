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
import { DataModelService } from '../../services/data-model.service';
import { Criticity } from '../../model/criticity';
import { provideNativeDateAdapter } from '@angular/material/core';
import { LevageMateriel } from '../../model/catalogMateriel';
import { Levage } from '../../model/levage';
import { FormLevageComponent } from '../../forms/form-levage/form-levage.component';
import { downloadCsv } from '../../model/csv';
import { errorText } from '../../model/helpers';



@Component({
  selector: 'app-page-levage',
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
     'longueur_m',
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
  importStatus = '';

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


    dialogRef.afterClosed().subscribe(async (updatedLevage: Levage | null) => {
      if (!updatedLevage) {
        return;
      }
      levage.copyFrom(updatedLevage);
      try {
        await this.dataService.saveLevage(levage);
      } catch (error) {
        console.error(error);
        alert(`Enregistrement impossible : ${errorText(error)}`);
        await this.dataService.reloadDatabase();
      }
    });
  }

  getControlClass(item: { WarningControlDate: { warningDate: Date; overdueDate: Date } | null }): string {
    const controlDates = item.WarningControlDate;
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

  isRebus(item: { date_rebus: Date | null }): boolean {
    return item.date_rebus !== null;
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

  exportCsv(): void {
    downloadCsv(`levage-${new Date().toISOString().slice(0, 10)}.csv`, this.dataService.exportLevageCsv());
  }

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvData = e.target?.result as string;
      try {
        const result = await this.dataService.importLevageCsv(csvData);
        const details = result.errors.slice(0, 3).join(' ');
        this.importStatus = `${result.imported} ligne(s) importée(s), ${result.skipped} ignorée(s). ${details}`.trim();
      } catch (error) {
        this.importStatus = `Import impossible : ${errorText(error)}`;
      }
      input.value = '';
    };
    reader.readAsText(file);
  }
  
}
