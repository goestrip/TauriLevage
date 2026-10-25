import { Component, Input, Inject, effect, OnInit, inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup,FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { LevageMateriel } from '../../model/catalogMateriel';
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

import {MatTableModule} from '@angular/material/table';

import { DataModelService } from '../../services/data-model.service';
import { predicateValidator } from '../validators/serial-validator';
import { People } from '../../model/people';
import { Emplacement } from '../../model/emplacement';
import { map, Observable, startWith } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { Anomaly } from '../../model/anomaly';
import { AnomalyTableComponent } from '../../components/anomaly-table/anomaly-table.component';
import { errorText, formDate, GenerateSerialNumber, toOptionalInt, toOptionalNumber } from '../../model/helpers';
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
  @Input() formTitle: string = '';
  @ViewChild(AnomalyTableComponent) anomalyEditor?: AnomalyTableComponent;

  compareById = (left: { id?: number } | null, right: { id?: number } | null): boolean => {
    if (left == null || right == null) {
      return left == null && right == null;
    }
    return left.id === right.id;
  };

  displayFn = (person: People | string | null): string => {
    if (!person || typeof person === 'string') {
      return typeof person === 'string' ? person : '';
    }
    return `${person.prenom} ${person.nom}`.trim();
  };

  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
  levageForm: FormGroup;

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

    this.levageForm = this.fb.group({
      serialNumber: [data?.levage?.serial || '', [
         Validators.required, Validators.maxLength(100),
         predicateValidator((value) =>
           this.data.levage?.serial == value ||
           (this.data.levage?.serial != value && !this.dataService.levageSerialExists(value)),
          'alreadyExists') ]],
      nature: [data?.levage?.nature ?? null, Validators.required],
      cmuKg: [data?.levage?.cmu_kg ?? null, Validators.required],
      longueurM: [data?.levage?.longueur_m ?? null],
      essaiCharge: [data?.levage?.essai_charge ?? null],
      activationDate: [data?.levage?.date_mise_en_service || null],
      assigned_to: this.peopleFormControl,
      emplacement: [data?.levage?.emplacement ?? null],
      dateLastControl: [data?.levage?.date_last_control || null],
      dateRebus: [data?.levage?.date_rebus || null],
    });

    effect(() => {
      this.levageMaterielList = this.dataService.levageMateriels();
      this.matchControl('nature', this.levageMaterielList);
    });
    effect(() => {
      this.peopleList = this.dataService.employees();
      this.peopleFormControl.setValue(this.peopleFormControl.value, { emitEvent: true });
    });
    effect(() => {
      this.locationList = this.dataService.locations();
      this.matchControl('emplacement', this.locationList);
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
    const materiel = this.levageForm.get('nature')?.value;
    if(!materiel) return;
    const serial = GenerateSerialNumber(materiel.nature);
    this.levageForm.get('serialNumber')?.setValue(serial);
  }

  private _filterPeople(value: People | string | null): People[] {
    const text = typeof value === 'string'
      ? value
      : value
        ? `${value.prenom} ${value.nom}`
        : '';
    const filterValue = text.trim().toLowerCase();
    if (!filterValue) {
      return this.peopleList.slice();
    }
    return this.peopleList.filter(option =>
      option.nom.toLowerCase().includes(filterValue) ||
      option.prenom.toLowerCase().includes(filterValue) ||
      `${option.prenom} ${option.nom}`.toLowerCase().includes(filterValue)
    );
  }

  private matchControl(name: string, options: Array<{ id: number }>): void {
    const current = this.levageForm.get(name)?.value as { id?: number } | null;
    if (current?.id == null) {
      return;
    }
    const match = options.find((item) => item.id === current.id);
    if (match && match !== current) {
      this.levageForm.get(name)?.setValue(match, { emitEvent: false });
    }
  }

  canSubmit(): boolean {
    if (this.levageForm.invalid) {
      return false;
    }
    if (!this.anomaly) {
      return true;
    }
    return !!this.anomalyEditor && this.anomalyEditor.anomalyForm.valid;
  }

   addAnomaly() {
    this.anomaly = new Anomaly();

   }

  async onDelete() {
    if (await confirm('Êtes-vous sûr de vouloir supprimer ce matériel de levage ?')) {
      try {
        await this.dataService.deleteLevage(this.formLevage);
        this.dialogRef.close(null);
      } catch (error) {
        alert(`Suppression impossible : ${errorText(error)}`);
      }
    }
  }

  onSubmit() {
    if (!this.canSubmit()) {
      this.levageForm.markAllAsTouched();
      this.anomalyEditor?.anomalyForm.markAllAsTouched();
      return;
    }
    const updated = new Levage();
    updated.id = this.formLevage?.id ?? null;
    updated.serial = this.levageForm.get('serialNumber')?.value;
    updated.nature = this.objectOrNull(this.levageForm.get('nature')?.value);
    updated.date_mise_en_service = formDate(this.levageForm.get('activationDate')?.value);
    updated.cmu_kg = toOptionalInt(this.levageForm.get('cmuKg')?.value);
    updated.longueur_m = toOptionalNumber(this.levageForm.get('longueurM')?.value);
    updated.essai_charge = toOptionalInt(this.levageForm.get('essaiCharge')?.value);
    updated.assigned_to = this.objectOrNull(this.levageForm.get('assigned_to')?.value);
    updated.emplacement = this.objectOrNull(this.levageForm.get('emplacement')?.value);
    updated.date_last_control = formDate(this.levageForm.get('dateLastControl')?.value);
    updated.date_rebus = formDate(this.levageForm.get('dateRebus')?.value);
    updated.anomaly = this.anomaly;
    this.dialogRef.close(updated);
  }

  private objectOrNull<T extends object>(value: T | string | null | undefined): T | null {
    return value && typeof value === 'object' ? value : null;
  }
}
