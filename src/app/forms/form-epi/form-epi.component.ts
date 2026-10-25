import { Component, Input, Inject, effect, OnInit, inject, ViewChild } from '@angular/core';
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

import {MatTableModule} from '@angular/material/table';

import { DataModelService } from '../../services/data-model.service';
import { Epi } from '../../model/epi';
import { predicateValidator } from '../validators/serial-validator';
import { People } from '../../model/people';
import { Emplacement } from '../../model/emplacement';
import { map, Observable, startWith } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { Anomaly } from '../../model/anomaly';
import { AnomalyTableComponent } from '../../components/anomaly-table/anomaly-table.component';
import { errorText, formDate, GenerateSerialNumber, toOptionalInt } from '../../model/helpers';

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
      nature: [data?.epi?.nature ?? null, Validators.required],
      fabricationDate: [data?.epi?.date_fabrication || null],
      activationDate: [data?.epi?.date_mise_en_service || null],
      validiteYears: [data?.epi?.validite_years ?? null, [Validators.min(0), Validators.max(100)]],
      validiteLimite: [{ value: data?.epi?.validiteLimite || '', disabled: true }],
      assigned_to: this.peopleFormControl,
      emplacement: [data?.epi?.emplacement ?? null],
      dateLastControl: [data?.epi?.date_last_control || null],
      dateRebus: [data?.epi?.date_rebus || null],
    });

    effect(() => {
      this.epiMaterielList = this.dataService.materiels();
      this.matchControl('nature', this.epiMaterielList);
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

    if (fabricationDate && validiteYears != null && validiteYears >= 0) {
      const fabrication = new Date(fabricationDate);
      const validiteLimite = Epi.ComputeValiditeLimite(fabrication, validiteYears);
      if(validiteLimite)
        this.epiForm.get('validiteLimite')?.setValue(validiteLimite.toISOString().split('T')[0]);
    } else {
      this.epiForm.get('validiteLimite')?.setValue('');
    }
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
    const current = this.epiForm.get(name)?.value as { id?: number } | null;
    if (current?.id == null) {
      return;
    }
    const match = options.find((item) => item.id === current.id);
    if (match && match !== current) {
      this.epiForm.get(name)?.setValue(match, { emitEvent: false });
    }
  }

  canSubmit(): boolean {
    if (this.epiForm.invalid) {
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
    if (await confirm('Êtes-vous sûr de vouloir supprimer cet EPI ?')) {
      try {
        await this.dataService.deleteEpi(this.formEPI);
        this.dialogRef.close(null);
      } catch (error) {
        alert(`Suppression impossible : ${errorText(error)}`);
      }
    }
  }

  onSubmit() {
    if (!this.canSubmit()) {
      this.epiForm.markAllAsTouched();
      this.anomalyEditor?.anomalyForm.markAllAsTouched();
      return;
    }
    const updated = new Epi();
    updated.id = this.formEPI?.id ?? null;
    updated.serial = this.epiForm.get('serialNumber')?.value;
    updated.nature = this.objectOrNull(this.epiForm.get('nature')?.value);
    updated.date_fabrication = formDate(this.epiForm.get('fabricationDate')?.value);
    updated.date_mise_en_service = formDate(this.epiForm.get('activationDate')?.value);
    updated.validite_years = toOptionalInt(this.epiForm.get('validiteYears')?.value);
    updated.assigned_to = this.objectOrNull(this.epiForm.get('assigned_to')?.value);
    updated.emplacement = this.objectOrNull(this.epiForm.get('emplacement')?.value);
    updated.date_last_control = formDate(this.epiForm.get('dateLastControl')?.value);
    updated.date_rebus = formDate(this.epiForm.get('dateRebus')?.value);
    updated.anomaly = this.anomaly;
    this.dialogRef.close(updated);
  }

  private objectOrNull<T extends object>(value: T | string | null | undefined): T | null {
    return value && typeof value === 'object' ? value : null;
  }
}
