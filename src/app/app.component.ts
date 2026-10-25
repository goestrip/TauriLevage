import { Component , effect, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import {MatTabsModule} from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import { Router } from '@angular/router';

import { invoke } from "@tauri-apps/api/core";

import { NavBarComponent } from './nav-bar/nav-bar.component';
import { DataModelService } from './services/data-model.service';
import { MatDialog } from '@angular/material/dialog';
import { SettingsComponent } from './settings/settings.component';
import { FormEpiComponent } from './forms/form-epi/form-epi.component';
import { FormLevageComponent } from './forms/form-levage/form-levage.component';
import { Levage } from './model/levage';
import { Epi } from './model/epi';
import { errorText } from './model/helpers';


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

  constructor(private dataService: DataModelService, private router: Router) {

    effect(() => {
      this.isDbLoaded = this.dataService.isDbLoaded();
    });
   }

  ngOnInit(): void {
    
  }

  save(): void {
    console.log("save");
  }

  addLine(): void {
    const currentRoute = this.router.url; // Get the current route
    let dialogRef;

    if (currentRoute.includes('page-epi')) {
      console.log("open epi form");
      dialogRef = this.dialog.open(FormEpiComponent, {
        width: '900px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        data: { formTitle: 'Ajout EPI' }
      });
      
      dialogRef.afterClosed().subscribe(async (updatedData: Epi | null) => {
        if (!updatedData) {
          return;
        }
        try {
          await this.dataService.addEpi(updatedData);
        } catch (error) {
          alert(`Enregistrement impossible : ${errorText(error)}`);
        }
      });
      
    } else if (currentRoute.includes('page-levage')) {
      console.log("open levage form");
      // Replace with the appropriate form component for 'page-levage'
      dialogRef = this.dialog.open(FormLevageComponent, {
        width: '900px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        data: { formTitle: 'Ajout Levage' }
      });
      dialogRef.afterClosed().subscribe(async (updatedData: Levage | null) => {
        if (!updatedData) {
          return;
        }
        try {
          await this.dataService.addLevage(updatedData);
        } catch (error) {
          alert(`Enregistrement impossible : ${errorText(error)}`);
        }
      });

    } else {
      // Handle other cases or default behavior
      console.log('No specific form for this route.');
      return;
    }

  }
  
  openSettings(): void {
    const dialogRef = this.dialog.open(SettingsComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(async (db_path) => {
      if (!db_path) {
        return;
      }
      try {
        await invoke<string>("set_db_path", { dbPath: db_path });
        await this.dataService.reloadDatabase();
      } catch (error) {
        console.error(error);
        alert(`Impossible d'ouvrir la base : ${errorText(error)}`);
      }
    });
  }

}
