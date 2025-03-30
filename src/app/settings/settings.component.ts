import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DataModelService } from '../services/data-model.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import {open} from '@tauri-apps/plugin-dialog';


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
    private dataModelService: DataModelService
  ) { }

  currentDatabaseName: string | null = null;
  newDatabaseName: string = '';
  selectedDirectory: string | null = null;

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

  openDirectoryDialog(): void {
    open({ directory: true }).then((directory) => {
      if (directory) {
        this.selectedDirectory = directory as string;
        console.log('Selected directory:', this.selectedDirectory);
      }
    });
  }

  applySettings(): void {
    if (this.selectedDirectory && this.newDatabaseName) {
      // Validate the file name
      const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
      if (invalidChars.test(this.newDatabaseName)) {
        console.error('Invalid file name:', this.newDatabaseName);
        alert('Le nom de fichier contient des caractères non valides.');
        return;
      }

      // Append '.db' extension if not already present
      if (!this.newDatabaseName.endsWith('.db')) {
        this.newDatabaseName += '.db';
      }

      const fullPath = `${this.selectedDirectory}\\${this.newDatabaseName}`;
      console.log('Full path:', fullPath);
      this.dialogRef.close(fullPath); // Pass the full path to the caller
    } else {
      this.dialogRef.close(); // Close without passing data if inputs are incomplete
    }
  }
}
