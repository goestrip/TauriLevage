import { Component, effect, model, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { Anomaly, AnomalyType } from '../../model/anomaly';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { CommonModule } from '@angular/common';
import { DataModelService } from '../../services/data-model.service';
import { Criticity } from '../../model/criticity';
import { formDate } from '../../model/helpers';

@Component({
  selector: 'app-anomaly-table',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatOptionModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './anomaly-table.component.html',
  styleUrl: './anomaly-table.component.scss'
})
export class AnomalyTableComponent implements OnInit {
  anomaly = model<Anomaly | null>();
  anomalyForm: FormGroup;
  anomalyTypes: AnomalyType[] = [];
  criticities = Object.values(Criticity);

  compareById = (left: { id?: number } | null, right: { id?: number } | null): boolean => {
    if (left == null || right == null) {
      return left == null && right == null;
    }
    return left.id === right.id;
  };

  constructor(private fb: FormBuilder, private dataService: DataModelService) {
    this.anomalyForm = this.fb.group({
      anomaly_type: [null, [Validators.required]],
      criticity: [Criticity.NONE, [Validators.required]],
      description: [''],
      date_detection: [null, [Validators.required]],
      date_resolution: [null],
    });

    effect(() => {
      this.anomalyTypes = this.dataService.anomalyTypes();
      const current = this.anomalyForm.get('anomaly_type')?.value as AnomalyType | null;
      if (current?.id == null) {
        return;
      }
      const match = this.anomalyTypes.find((item) => item.id === current.id);
      if (match && match !== current) {
        this.anomalyForm.get('anomaly_type')?.setValue(match, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    const current = this.anomaly();
    if (current) {
      this.anomalyForm.patchValue({
        anomaly_type: current.anomaly_type,
        criticity: current.criticity ?? Criticity.NONE,
        description: current.description ?? '',
        date_detection: current.date_detection,
        date_resolution: current.date_resolution,
      }, { emitEvent: false });
    }

    this.anomalyForm.get('date_resolution')?.valueChanges.subscribe((value) => {
      const criticityControl = this.anomalyForm.get('criticity');
      if (value) {
        if (criticityControl?.value !== Criticity.PROCESSED) {
          criticityControl?.setValue(Criticity.PROCESSED);
        }
      } else if (criticityControl?.value === Criticity.PROCESSED) {
        criticityControl?.setValue(Criticity.NORMAL);
      }
    });

    this.anomalyForm.valueChanges.subscribe((formValue) => {
      const previous = this.anomaly();
      const updated = Object.assign(new Anomaly(), previous, {
        id: previous?.id ?? null,
        anomaly_type: formValue.anomaly_type && typeof formValue.anomaly_type === 'object' ? formValue.anomaly_type : null,
        description: formValue.description ?? '',
        criticity: formValue.criticity ?? Criticity.NONE,
        date_detection: formDate(formValue.date_detection) ?? new Date(),
        date_resolution: formDate(formValue.date_resolution),
      });
      this.anomaly.set(updated);
    });
  }

  clearResolution(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.anomalyForm.get('date_resolution')?.setValue(null);
  }
}
