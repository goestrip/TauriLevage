import { Injectable, Signal, signal } from '@angular/core';
import { Epi } from '../model/epi';
import { MatTableDataSource } from '@angular/material/table';
import { invoke } from "@tauri-apps/api/core";
import { EpiMateriel } from '../model/catalogMateriel';
import { EpiDto } from '../model/dto/epiDto';

@Injectable({
  providedIn: 'root'
})
export class DataModelService {

  private epis : Epi[] = [];
  public materiels  = signal([] as EpiMateriel[]);
  public isDbLoaded = signal(false);
  public epiSource = new MatTableDataSource(this.epis);

  constructor() {
    this.materiels.set([
      new EpiMateriel(1, "none"),

    ]);

    invoke<string>("has_database", {}).then((hasDbStr) => {
      let hasDb = hasDbStr as any as boolean;
      console.log("has_database",hasDb);
      //this.isDbLoaded.set(hasDb == "true");
      this.isDbLoaded.set(hasDb);
    });

   }

   public loadDatabase(){

    console.log("loadDatabase");
    invoke<string>("init_database", {}).then((text) => {
      console.log(text);
    });

    invoke<string>("get_epi_materiel", {}).then((json) => {
      const materiels: EpiMateriel[] = JSON.parse(json);
      this.materiels.set(materiels);
      console.log(materiels);
    });

    invoke<string>("get_epi", {}).then((json) => {
      const epiDtos: EpiDto[] = JSON.parse(json);
      this.epis = epiDtos.map((epiDto) => {
        return EpiDto.ToEpi(epiDto, this.materiels());
      });

      this.epiSource.data = this.epis;
      this.epiSource.filterPredicate = (data: Epi, filter: string) => {
        console.log("filterPredicate",data, filter);
        return data.serial.includes(filter)
        || (data.nature?.nature.toLowerCase().includes(filter) ?? false)
        
      }
      console.log("loaded epi from back",this.epis);
    });
   }

   public addEpi(newEpi?: Epi) {
    if (!newEpi) return;

    this.epis.unshift(newEpi);
    this.epiSource.data = this.epis;

    this.saveEpi(newEpi);
   }

   public saveEpi(epi: Epi){
    const epiJson = JSON.stringify(EpiDto.FromEpi(epi));
    console.log("sending epi to the back", epiJson);
    invoke<string>("save_epi", {epi: epiJson}).then((text) => {
      console.log("received from rust",text);
    });
   }

   public epiSerialExists(serial: string): boolean {
    return this.epis.some((epi) => epi.serial === serial);
   }

}
