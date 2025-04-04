import { Component, computed, effect, input, model } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // Import ReactiveFormsModule and FormBuilder
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { Anomaly, AnomalyType } from '../../model/anomaly';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatOptionModule } from '@angular/material/core';
import {MatSelectModule} from '@angular/material/select';

import { CommonModule } from '@angular/common';
import { DataModelService } from '../../services/data-model.service';
import { Criticity } from '../../model/criticity';

@Component({
  selector: 'app-anomaly-table',
  imports: [
    FormsModule,
    ReactiveFormsModule, // Add ReactiveFormsModule
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatOptionModule,
    MatSelectModule
  ],
  templateUrl: './anomaly-table.component.html',
  styleUrl: './anomaly-table.component.scss'
})
export class AnomalyTableComponent {
  anomaly = model<Anomaly | null>();
  editingAnomaly: Anomaly | null = null;
  anomalyForm: FormGroup; // Define the form group
  anomalyTypes: AnomalyType[] = []; // List of anomaly types
  criticities = Object.values(Criticity); // Convert enum to an array of values


  constructor(private fb: FormBuilder, private dataService: DataModelService) {
    this.anomalyForm = this.fb.group({
      anomaly_type: ['', [Validators.required]], // Single-selection dropdown
      criticity: [this.anomaly()?.criticity, [Validators.required]], // Single-selection dropdown
      description: [this.anomaly()?.description],
      date_detection: [this.anomaly()?.date_detection, [Validators.required]],
      date_resolution: [this.anomaly()?.date_resolution]
    });

    effect(() => {
      this.anomalyTypes = this.dataService.anomalyTypes();
    });
  }

  ngOnInit(): void {
    if (this.anomaly()) {
      this.anomalyForm.patchValue(this.anomaly()!); // Populate the form with anomaly data
    }
  }

  saveAnomaly(): void {
    if (this.anomalyForm.valid) {
      console.log('Anomaly saved:', this.anomalyForm.value);
      this.editingAnomaly = null;
    } else {
      console.error('Form is invalid');
    }
  }

  cancelEdit(): void {
    //this.editingAnomaly = null;
    this.anomaly.update(() => null); // Reset the anomaly to null
  }
}
