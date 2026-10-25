import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DataModelService } from '../services/data-model.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import { confirm, open, save } from '@tauri-apps/plugin-dialog';
import { errorText } from '../model/helpers';


@Component({
  selector: 'app-settings',
  imports: [CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  constructor(
    public dialogRef: MatDialogRef<SettingsComponent>,
    public dataModelService: DataModelService
  ) { }

  currentDatabaseName: string | null = null;
  selectedFileName: string | null = null;
  errorMessage = '';
  newEpiNature = '';
  newLevageNature = '';
  newPrenom = '';
  newNom = '';
  newLocation = '';
  newAnomalyType = '';

  ngOnInit(): void {
    this.currentDatabaseName = this.dataModelService.isDbLoaded() ? 'Base chargée' : null;
  }

  close(): void {
    this.dialogRef.close();
  }

  selectedFile: File | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      console.log('Selected file:', this.selectedFile);
    }
  }

  openFileDialog(): void {
    open({ directory: false,  filters: [{ name: 'Database Files', extensions: ['db'] }] }).then((filePath) => {
      if (filePath) {
        this.selectedFileName = filePath as string;
      }
    });
  }

  createNewFile(): void {
    save({ title: 'Créer un nouveau fichier', filters: [{ name: 'Database Files', extensions: ['db'] }] }).then((filePath) => {
      if (filePath) {
        this.selectedFileName = filePath as string;
      }
    });
  }

  async initDb(): Promise<void> {
    this.errorMessage = '';
    try {
      await this.dataModelService.initDatabase();
      this.currentDatabaseName = 'Base initialisée';
    } catch (error) {
      this.errorMessage = errorText(error);
    }
  }

  async addEpiNature(): Promise<void> {
    if (await this.runReferenceChange(() => this.dataModelService.addEpiMateriel(this.newEpiNature))) {
      this.newEpiNature = '';
    }
  }

  async addLevageNature(): Promise<void> {
    if (await this.runReferenceChange(() => this.dataModelService.addLevageMateriel(this.newLevageNature))) {
      this.newLevageNature = '';
    }
  }

  async addPerson(): Promise<void> {
    if (await this.runReferenceChange(() => this.dataModelService.addPerson(this.newPrenom, this.newNom))) {
      this.newPrenom = '';
      this.newNom = '';
    }
  }

  async addLocation(): Promise<void> {
    if (await this.runReferenceChange(() => this.dataModelService.addLocation(this.newLocation))) {
      this.newLocation = '';
    }
  }

  async addAnomalyType(): Promise<void> {
    if (await this.runReferenceChange(() => this.dataModelService.addAnomalyType(this.newAnomalyType))) {
      this.newAnomalyType = '';
    }
  }

  async removeEpiNature(id: number, label: string): Promise<void> {
    if (await confirm(`Supprimer la nature EPI « ${label} » ?`)) {
      await this.runReferenceChange(() => this.dataModelService.deleteEpiMateriel(id));
    }
  }

  async removeLevageNature(id: number, label: string): Promise<void> {
    if (await confirm(`Supprimer la nature de levage « ${label} » ?`)) {
      await this.runReferenceChange(() => this.dataModelService.deleteLevageMateriel(id));
    }
  }

  async removePerson(id: number, label: string): Promise<void> {
    if (await confirm(`Supprimer ${label} ?`)) {
      await this.runReferenceChange(() => this.dataModelService.deletePerson(id));
    }
  }

  async removeLocation(id: number, label: string): Promise<void> {
    if (await confirm(`Supprimer l'emplacement « ${label} » ?`)) {
      await this.runReferenceChange(() => this.dataModelService.deleteLocation(id));
    }
  }

  async removeAnomalyType(id: number, label: string): Promise<void> {
    if (await confirm(`Supprimer le type « ${label} » ?`)) {
      await this.runReferenceChange(() => this.dataModelService.deleteAnomalyType(id));
    }
  }

  private async runReferenceChange(action: () => Promise<unknown>): Promise<boolean> {
    this.errorMessage = '';
    try {
      await action();
      return true;
    } catch (error) {
      this.errorMessage = errorText(error);
      return false;
    }
  }

  applySettings(): void {
    if(this.selectedFileName) {
      
      this.dialogRef.close(this.selectedFileName);
    }
    else {
      this.dialogRef.close(null);
    }
  }
}
