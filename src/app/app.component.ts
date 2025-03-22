import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { invoke } from "@tauri-apps/api/core";
import {MatButtonModule} from '@angular/material/button';

@Component({
    standalone: true,
    selector: 'app-root',
    imports: [CommonModule, MatButtonModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
  greetingMessage = "";
  value = "_";

  load(value: number): void {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    invoke<string>("load_user", {value}).then((text) => {
      this.value = text;
      console.log(text);
    });
  }

  greet(event: SubmitEvent, name: string): void {
    event.preventDefault();

    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    invoke<string>("greet", { name }).then((text) => {
      this.greetingMessage = text;
      console.log(text);
      this.load(12);
    });
  }
}
