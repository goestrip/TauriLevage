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
import { EpiMateriel } from '../../model/catalogMateriel';
import { downloadCsv, ImportResult } from '../../model/csv';
import { errorText } from '../../model/helpers';


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
  templateUrl: './page-epi.component.html',
  styleUrl: './page-epi.component.scss'
})
export class PageEpiComponent {

   displayedColumns: string[] = [
     'edition',
     'nature',
     'serial',
     'date_fabrication',
     'date_mise_en_service',
     'validite_years',
     'validiteLimite',
     'assigned_to',
     'emplacement',
   
     'date_last_control',
     'date_rebus',
     'anomaly_name',
     'anomaly_criticity',
   ];
   
  private _liveAnnouncer = inject(LiveAnnouncer);

  epiData: MatTableDataSource<Epi>;
  epiMateriel: EpiMateriel[] = [];
  filter: string = '';
  importStatus = '';

  editingRow: any = null;
  readonly dialog = inject(MatDialog); // Inject MatDialog
 
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

  

  toggleEditRow(epi: Epi): void {
    const dialogRef = this.dialog.open(FormEpiComponent, {
      width: '900px',
      maxWidth: '90vw',
      data: { formTitle: 'Edition EPI', epi: epi } // Pass the EPI to the dialog
    });


    dialogRef.afterClosed().subscribe(async (updatedEpi: Epi | null) => {
      if (!updatedEpi) {
        return;
      }
      epi.copyFrom(updatedEpi);
      try {
        await this.dataService.saveEpi(epi);
      } catch (error) {
        console.error(error);
        alert(`Enregistrement impossible : ${errorText(error)}`);
        await this.dataService.reloadDatabase();
      }
    });
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
    this.epiData.filter = filterValue.trim().toLowerCase();
  }

  clearFilter(): void {
    this.filter = '';
    this.epiData.filter = ''; // Clear the filter
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

  exportCsv(): void {
    downloadCsv(`epi-${this.fileStamp()}.csv`, this.dataService.exportEpiCsv());
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
        const result = await this.dataService.importEpiCsv(csvData);
        this.importStatus = this.formatImportResult(result);
      } catch (error) {
        this.importStatus = `Import impossible : ${errorText(error)}`;
      }
      input.value = '';
    };
    reader.readAsText(file);
  }

  private formatImportResult(result: ImportResult): string {
    const details = result.errors.slice(0, 3).join(' ');
    return `${result.imported} ligne(s) importée(s), ${result.skipped} ignorée(s). ${details}`.trim();
  }

  private fileStamp(): string {
    return new Date().toISOString().slice(0, 10);
  }
  
}
