import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DataModelService } from '../services/data-model.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import {open, save} from '@tauri-apps/plugin-dialog';


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
  selectedFileName: string | null = null;

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

  initDb():void{
    this.dataModelService.initDatabase();
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
