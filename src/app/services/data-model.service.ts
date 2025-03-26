import { Injectable, Signal, signal } from '@angular/core';
import { Epi, GenerateRandomEpi } from '../model/epi';
import { EpiDataSource } from './dataSource';
import { MatTableDataSource } from '@angular/material/table';
import { invoke } from "@tauri-apps/api/core";
import { EpiMateriel } from '../model/catalogMateriel';

@Injectable({
  providedIn: 'root'
})
export class DataModelService {

  private epis : Epi[] = [];
  public materiels  = signal([]);

  public epiSource = new MatTableDataSource(this.epis);

  constructor() {
    // for(let i= 0 ; i < 15; i++) {
    //   this.epis.push(GenerateRandomEpi());
    // }

    invoke<string>("get_epi_materiel", {}).then((json) => {
      const materiels = JSON.parse(json);
      this.materiels.set(materiels);
      console.log(materiels);
    });
   }

   public addEpi(){
    //this.epis.unshift(GenerateRandomEpi());
    let epi = new Epi();
    this.epis.unshift(epi);
    this.epiSource.data = this.epis;
   }

   public saveEpi(epi: Epi){
    const epiJson = JSON.stringify(epi, (key, value) => {
      // Check if the value is a Date object
      if (value instanceof Date) {
        // Format the date as 'YYYY-MM-DD'
        return value.toISOString().split('T')[0];
      }
      return value; // Return other values as-is
    });
    console.log(epiJson);
    invoke<string>("save_epi", {epi: epiJson}).then((text) => {
      console.log(text);
    });
   }

}
