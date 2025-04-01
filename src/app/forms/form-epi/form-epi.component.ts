import { Component, Input, Inject, effect, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EpiMateriel } from '../../model/catalogMateriel';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DataModelService } from '../../services/data-model.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Epi } from '../../model/epi';
import { predicateValidator } from '../validators/serial-validator';

@Component({
  selector: 'app-form-epi',
  imports: [CommonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,],
    providers: [provideNativeDateAdapter()],
  templateUrl: './form-epi.component.html',
  styleUrl: './form-epi.component.scss'
})
export class FormEpiComponent implements OnInit {
  @Input() formTitle: string = ''; // Existing input property
  epiForm: FormGroup;
  epiMaterielList: EpiMateriel[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { formTitle?: string; epi?: Epi }, // Include EPI in dialog data
    private dataService: DataModelService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FormEpiComponent> // Inject MatDialogRef
  ) {
    if (data?.formTitle) {
      this.formTitle = data.formTitle; // Set formTitle from dialog data if provided
    }

    this.epiForm = this.fb.group({
      serialNumber: [data?.epi?.serial || '', [
         Validators.required,
         predicateValidator((value) =>
           this.data.epi?.serial == value ||
           (this.data.epi?.serial != value && !this.dataService.epiSerialExists(value)),
          'alreadyExists') ]],
      nature: [data?.epi?.nature || '', Validators.required],
      fabricationDate: [data?.epi?.date_fabrication || '', Validators.required],
      activationDate: [data?.epi?.date_mise_en_service || '', Validators.required],
      validiteYears: [data?.epi?.validite_years || 5, [Validators.required, Validators.min(0), Validators.max(100)]],
      validiteLimite: [{ value: data?.epi?.validiteLimite || '', disabled: true }],
      assignedTo: [data?.epi?.assigned_to || ''],
      emplacement: [data?.epi?.emplacement || ''],
      dateLastControl: [data?.epi?.date_last_control || ''],
      dateRebus: [data?.epi?.date_rebus || ''],
      anomalyName: [data?.epi?.anomaly?.title || ''],
      anomalyCriticity: [data?.epi?.anomaly?.criticity || '']
    });

    effect(() => {
      this.epiMaterielList = this.dataService.materiels();
    });
  }

  ngOnInit(): void {
    // Automatically calculate validiteLimite when validiteYears or fabricationDate changes
    this.epiForm.get('validiteYears')?.valueChanges.subscribe(() => this.calculateValidityLimit());
    this.epiForm.get('fabricationDate')?.valueChanges.subscribe(() => this.calculateValidityLimit());

    // Preset activationDate to fabricationDate when editing activationDate
    this.epiForm.get('fabricationDate')?.valueChanges.subscribe((fabricationDate) => {
      const activationDate = this.epiForm.get('activationDate')?.value;
      if (!activationDate && fabricationDate) {
        this.epiForm.get('activationDate')?.setValue(fabricationDate);
      }
    });
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

  onSubmit() {
    if (this.epiForm.valid) {
      const updatedEpi = {
        ...this.data.epi,
        serial: this.epiForm.get('serialNumber')?.value,
        nature: this.epiForm.get('nature')?.value,
        date_fabrication: new Date(this.epiForm.get('fabricationDate')?.value),
        date_mise_en_service: new Date(this.epiForm.get('activationDate')?.value),
        validite_years: this.epiForm.get('validiteYears')?.value,
        validiteLimite: new Date(this.epiForm.get('validiteLimite')?.value),
        assignedTo: this.epiForm.get('assignedTo')?.value,
        emplacement: this.epiForm.get('emplacement')?.value,
        date_last_control: this.epiForm.get('dateLastControl')?.value,
        date_rebus: this.epiForm.get('dateRebus')?.value ? new Date(this.epiForm.get('dateRebus')?.value) : null,
        anomaly: {
          title: this.epiForm.get('anomalyName')?.value,
          criticity: this.epiForm.get('anomalyCriticity')?.value
        }
      };

      this.dialogRef.close(updatedEpi); // Return the updated EPI to the parent component
    }
  }
}
