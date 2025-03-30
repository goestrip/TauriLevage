import { Component , effect, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import {MatTabsModule} from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';

import { invoke } from "@tauri-apps/api/core";

import { NavBarComponent } from './nav-bar/nav-bar.component';
import { DataModelService } from './services/data-model.service';
import { MatDialog } from '@angular/material/dialog';
import { SettingsComponent } from './settings/settings.component';
import { FormEpiComponent } from './forms/form-epi/form-epi.component';


@Component({
    standalone: true,
    selector: 'app-root',
    imports: [CommonModule,
      MatButtonModule,
      MatToolbarModule,
      RouterModule,
      MatIconModule,
      MatTabsModule,
      NavBarComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {

  links = ['page-epi', 'page-levage', 'third'];
  activeLink = this.links[0];
  readonly dialog = inject(MatDialog);
  today: Date = new Date();
  isDbLoaded = false;

  constructor(private dataService:DataModelService) {

    effect(() => {
      this.isDbLoaded = this.dataService.isDbLoaded();
      console.log("isDbLoaded", this.dataService.isDbLoaded());
      if (this.dataService.isDbLoaded()) {
        this.dataService.loadDatabase();
      }
    });
   }

  ngOnInit(): void {
    
  }

  save(): void {
    console.log("save");
  }

  addLine(): void {
    let dialogRef = this.dialog.open(FormEpiComponent, {
        data: { formTitle: 'epi' } // Pass 'epi' as the form title
    });

    dialogRef.afterClosed().subscribe((updatedEpi) => {
      console.log("dialog closed, updatedEpi", updatedEpi);
      
      if (updatedEpi) {
        this.dataService.addEpi(updatedEpi);
      }
    });
  }
  
  openSettings(): void {
    const dialogRef = this.dialog.open(SettingsComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe((fullPath) => {
      if (fullPath) {
        console.log('Received full path from settings dialog:', fullPath);
        // Handle the full path here
      }
    });
  }

}
