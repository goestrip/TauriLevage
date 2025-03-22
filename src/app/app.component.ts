import { Component , OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import {MatTabsModule} from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import {MatButtonModule} from '@angular/material/button';

import { invoke } from "@tauri-apps/api/core";

import { NavBarComponent } from './nav-bar/nav-bar.component';


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

  ngOnInit(): void {
    console.log("init");
    invoke<string>("init_database", {}).then((text) => {
      console.log(text);
    });
  }

  save(): void {
    console.log("save");
  }
  
  openSettings(): void {
    console.log("openSettings");
  }

}
