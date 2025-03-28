import { Component , inject, OnInit} from '@angular/core';
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

  constructor(private dataService:DataModelService) { }

  ngOnInit(): void {
    console.log("init");
    invoke<string>("init_database", {}).then((text) => {
      console.log(text);
    });
  }

  save(): void {
    console.log("save");
  }

  addLine(): void {
    let dialogRef = this.dialog.open(FormEpiComponent, {
        data: { formTitle: 'epi' } // Pass 'epi' as the form title
    });

    dialogRef.afterClosed().subscribe((updatedEpi) => {
      if (updatedEpi) {
        this.dataService.addEpi(updatedEpi);
      }
    });
  }
  
  openSettings(): void {
    const dialogRef = this.dialog.open(SettingsComponent);


  }

}
