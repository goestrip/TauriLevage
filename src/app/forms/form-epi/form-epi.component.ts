import { Component, Input, Inject, effect, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup,FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { EpiMateriel } from '../../model/catalogMateriel';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter, DateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { confirm } from "@tauri-apps/plugin-dialog";

import {MatTableDataSource, MatTableModule} from '@angular/material/table';

import { DataModelService } from '../../services/data-model.service';
import { Epi } from '../../model/epi';
import { predicateValidator } from '../validators/serial-validator';
import { People } from '../../model/people';
import { Emplacement } from '../../model/emplacement';
import { map, Observable, startWith } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { Anomaly } from '../../model/anomaly';
import { Criticity } from '../../model/criticity';
import { AnomalyTableComponent } from '../../components/anomaly-table/anomaly-table.component';
import { GenerateSerialNumber } from '../../model/helpers';

@Component({
  selector: 'app-form-epi',
  imports: [CommonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    AnomalyTableComponent],
    providers: [provideNativeDateAdapter()],
  templateUrl: './form-epi.component.html',
  styleUrl: './form-epi.component.scss'
})
export class FormEpiComponent implements OnInit {
  @Input() formTitle: string = ''; // Existing input property

  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
  epiForm: FormGroup;

  formEPI: Epi|null = null; // EPI form data
  anomaly : Anomaly|null = null; // Anomaly data

  epiMaterielList: EpiMateriel[] = [];
  peopleList: People[] = [];
  peopleFormControl = new FormControl();
  filteredPeople!: Observable<any[]>; // Filtered list for people

  locationList: Emplacement[] = [];
  filteredLocations: Emplacement[] = [];

  
  displayedColumns: string[] = [
    'edition',
    'date_detection',
    'title',
    'description',
    'criticity',
    'date_resolution',
    
  ];
  

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { formTitle?: string; epi?: Epi }, // Include EPI in dialog data
    private dataService: DataModelService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FormEpiComponent> // Inject MatDialogRef
  ) {

    this._adapter.setLocale('fr-FR'); // Set locale for date adapter

    if (data?.formTitle) {
      this.formTitle = data.formTitle; // Set formTitle from dialog data if provided
    }
    if (data?.epi) {
      this.formEPI = data.epi; // Set formEPI from dialog data if provided
      this.anomaly = data.epi.anomaly; // Set anomaly from EPI data if provided
    }

    this.epiForm = this.fb.group({
      serialNumber: [data?.epi?.serial || '', [
         Validators.required, Validators.maxLength(100),
         predicateValidator((value) =>
           this.data.epi?.serial == value ||
           (this.data.epi?.serial != value && !this.dataService.epiSerialExists(value)),
          'alreadyExists') ]],
      nature: [data?.epi?.nature || '', Validators.required],
      fabricationDate: [data?.epi?.date_fabrication || ''],
      activationDate: [data?.epi?.date_mise_en_service || ''],
      validiteYears: [data?.epi?.validite_years || '', [Validators.min(0), Validators.max(100)]],
      validiteLimite: [{ value: data?.epi?.validiteLimite || '', disabled: true }],
      assigned_to: this.peopleFormControl,
      emplacement: [data?.epi?.emplacement || ''],
      dateLastControl: [data?.epi?.date_last_control || ''],
      dateRebus: [data?.epi?.date_rebus || ''],
    });

    effect(() => {
      this.epiMaterielList = this.dataService.materiels();
    });
    effect(() => {
      this.peopleList = this.dataService.employees();
    });
    effect(() => {
      this.locationList = this.dataService.locations();
    });
  }

  ngOnInit(): void {
    // Automatically calculate validiteLimite when validiteYears or fabricationDate changes
    this.epiForm.get('validiteYears')?.valueChanges.subscribe(() => this.calculateValidityLimit());
    this.epiForm.get('fabricationDate')?.valueChanges.subscribe(() => this.calculateValidityLimit());

    this.epiForm.get('nature')?.valueChanges.subscribe((value) =>{
        
      });
    // Preset activationDate to fabricationDate when editing activationDate
    this.epiForm.get('fabricationDate')?.valueChanges.subscribe((fabricationDate) => {
      const activationDate = this.epiForm.get('activationDate')?.value;
      if (!activationDate && fabricationDate) {
        this.epiForm.get('activationDate')?.setValue(fabricationDate);
      }
    });


    this.peopleFormControl.setValue(this.data?.epi?.assigned_to || null); // Set the initial value for peopleFormControl

      // Filter the people list based on user input
      this.filteredPeople = this.peopleFormControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filterPeople(value || '')),
      );
  }

  generateSerialNumber(){
    const materiel = this.epiForm.get('nature')?.value;
    if(!materiel) return; // If nature is not selected, do nothing
    const serial = GenerateSerialNumber(materiel.nature); // Generate serial number based on nature
    this.epiForm.get('serialNumber')?.setValue(serial);
  }

  private calculateValidityLimit(): void {
    const fabricationDate = this.epiForm.get('fabricationDate')?.value;
    const validiteYears = this.epiForm.get('validiteYears')?.value;

    if (fabricationDate && validiteYears >= 0) {
      const fabrication = new Date(fabricationDate);
      const validiteLimite = Epi.ComputeValiditeLimite(fabrication, validiteYears);
      if(validiteLimite)
        this.epiForm.get('validiteLimite')?.setValue(validiteLimite.toISOString().split('T')[0]);
    } else {
      this.epiForm.get('validiteLimite')?.setValue('');
    }
  }

  private _filterPeople(value: any): any[] {
    if(typeof value === 'string') {
      const filterValue = value.toLowerCase();
      return this.peopleList.filter(option =>
        option.nom.toLowerCase().includes(filterValue) ||
        option.prenom.toLowerCase().includes(filterValue)
      );
    }
    else {
      const selectedPerson = value as People;
      return [selectedPerson.nom];
    }
  }

    // Function to display the selected value in the input field
    displayFn(person: any): string {
      return person ? `${person.prenom} ${person.nom}` : '';
    }

   addAnomaly() {
    this.anomaly = new Anomaly();

   }

  async onDelete() {
    if (await confirm('Êtes-vous sûr de vouloir supprimer cet EPI ?')) {
      this.dataService.deleteEpi(this.formEPI); // Delete the EPI from the data service
      this.dialogRef.close(null); // Indicate deletion to the parent component
    }
  }

  onSubmit() {
    if (this.epiForm.valid) {
      const updatedEpi = {
        ...this.data.epi,
        serial: this.epiForm.get('serialNumber')?.value,
        nature: this.epiForm.get('nature')?.value,
        date_fabrication: this.epiForm.get('fabricationDate')?.value ? new Date(this.epiForm.get('fabricationDate')?.value) : null,
        date_mise_en_service: this.epiForm.get('activationDate')?.value ? new Date(this.epiForm.get('activationDate')?.value) : null,
        validite_years: this.epiForm.get('validiteYears')?.value,
        validiteLimite: this.epiForm.get('validiteLimite')?.value ? new Date(this.epiForm.get('validiteLimite')?.value) : null,
        assigned_to: this.epiForm.get('assigned_to')?.value,
        emplacement: this.epiForm.get('emplacement')?.value,
        date_last_control: this.epiForm.get('dateLastControl')?.value ? new Date(this.epiForm.get('dateLastControl')?.value) : null,
        date_rebus: this.epiForm.get('dateRebus')?.value ? new Date(this.epiForm.get('dateRebus')?.value) : null,
        anomaly: this.anomaly
      };

      this.dialogRef.close(updatedEpi); // Return the updated EPI to the parent component
    }
  }
}
