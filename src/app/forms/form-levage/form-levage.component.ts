import { Component, Input, Inject, effect, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup,FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { EpiMateriel, LevageMateriel } from '../../model/catalogMateriel';
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
import { predicateValidator } from '../validators/serial-validator';
import { People } from '../../model/people';
import { Emplacement } from '../../model/emplacement';
import { map, Observable, startWith } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { Anomaly } from '../../model/anomaly';
import { Criticity } from '../../model/criticity';
import { AnomalyTableComponent } from '../../components/anomaly-table/anomaly-table.component';
import { GenerateSerialNumber } from '../../model/helpers';
import { Levage } from '../../model/levage';

@Component({
  selector: 'app-form-levage',
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
  templateUrl: './form-levage.component.html',
  styleUrl: './form-levage.component.scss'
})
export class FormLevageComponent implements OnInit {
  @Input() formTitle: string = ''; // Existing input property

  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
  epiForm: FormGroup;

  formLevage: Levage|null = null; // EPI form data
  anomaly : Anomaly|null = null; // Anomaly data

  levageMaterielList: LevageMateriel[] = [];
  peopleList: People[] = [];
  peopleFormControl = new FormControl();
  filteredPeople!: Observable<any[]>; // Filtered list for people

  locationList: Emplacement[] = [];
  filteredLocations: Emplacement[] = [];


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { formTitle?: string; levage?: Levage }, // Include EPI in dialog data
    private dataService: DataModelService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FormLevageComponent> // Inject MatDialogRef
  ) {

    this._adapter.setLocale('fr-FR'); // Set locale for date adapter

    if (data?.formTitle) {
      this.formTitle = data.formTitle; // Set formTitle from dialog data if provided
    }
    if (data?.levage) {
      this.formLevage = data.levage; // Set formEPI from dialog data if provided
      this.anomaly = data.levage.anomaly; // Set anomaly from EPI data if provided
    }

    this.epiForm = this.fb.group({
      serialNumber: [data?.levage?.serial || '', [
         Validators.required, Validators.maxLength(100),
         predicateValidator((value) =>
           this.data.levage?.serial == value ||
           (this.data.levage?.serial != value && !this.dataService.epiSerialExists(value)),
          'alreadyExists') ]],
      nature: [data?.levage?.nature || '', Validators.required],
      cmuKg: [data?.levage?.cmu_kg || '', Validators.required],
      essaiCharge: [data?.levage?.essai_charge || ''],
      activationDate: [data?.levage?.date_mise_en_service || ''],
      
      assigned_to: this.peopleFormControl,
      emplacement: [data?.levage?.emplacement || ''],
      dateLastControl: [data?.levage?.date_last_control || ''],
      dateRebus: [data?.levage?.date_rebus || ''],
    });

    effect(() => {
      this.levageMaterielList = this.dataService.levageMateriels();
    });
    effect(() => {
      this.peopleList = this.dataService.employees();
    });
    effect(() => {
      this.locationList = this.dataService.locations();
    });
  }

  ngOnInit(): void {
    this.peopleFormControl.setValue(this.data?.levage?.assigned_to || null); // Set the initial value for peopleFormControl

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
      this.dataService.deleteLevage(this.formLevage); // Delete the EPI from the data service
      this.dialogRef.close(null); // Indicate deletion to the parent component
    }
  }

  onSubmit() {
    if (this.epiForm.valid) {
      const updatedLevage = {
        ...this.data.levage,
        serial: this.epiForm.get('serialNumber')?.value,
        nature: this.epiForm.get('nature')?.value,
        date_mise_en_service: this.epiForm.get('activationDate')?.value ? new Date(this.epiForm.get('activationDate')?.value) : null,
        cmu_kg: this.epiForm.get('cmuKg')?.value,
        essai_charge: this.epiForm.get('essaiCharge')?.value,
        assigned_to: this.epiForm.get('assigned_to')?.value,
        emplacement: this.epiForm.get('emplacement')?.value,
        date_last_control: this.epiForm.get('dateLastControl')?.value ? new Date(this.epiForm.get('dateLastControl')?.value) : null,
        date_rebus: this.epiForm.get('dateRebus')?.value ? new Date(this.epiForm.get('dateRebus')?.value) : null,
        anomaly: this.anomaly
      };

      this.dialogRef.close(updatedLevage); // Return the updated EPI to the parent component
    }
  }
}
