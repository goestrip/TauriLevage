import { Component, computed, input } from '@angular/core';
import { Anomaly } from '../../model/anomaly';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-anomaly-table',
  imports: [],
  templateUrl: './anomaly-table.component.html',
  styleUrl: './anomaly-table.component.scss'
})
export class AnomalyTableComponent {

  anomaly = input<Anomaly|null>();

  editingAnomaly: Anomaly|null = null;


  constructor() {
  }
  ngOnInit(): void {
  }
}
