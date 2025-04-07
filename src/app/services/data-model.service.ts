import { Injectable, Signal, signal } from '@angular/core';
import { Epi } from '../model/epi';
import { MatTableDataSource } from '@angular/material/table';
import { invoke } from "@tauri-apps/api/core";
import { EpiMateriel } from '../model/catalogMateriel';
import { EpiDto } from '../model/dto/epiDto';
import { People } from '../model/people';
import { Emplacement } from '../model/emplacement';
import { AnomalyType, Anomaly } from '../model/anomaly';
import { AnomalyDto } from '../model/dto/anomalyDto';

@Injectable({
  providedIn: 'root'
})
export class DataModelService {

  private epis : Epi[] = [];
  public materiels  = signal([] as EpiMateriel[]);
  public employees = signal([] as People[]);
  public locations = signal([] as Emplacement[]);
  public anomalyTypes = signal([] as AnomalyType[]);
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

   public async loadDatabase(){

    await(async () => {
      console.log("loadDatabase");
      invoke<string>("init_database", {}).then((text) => {
        console.log(text);
      });

      invoke<string>("get_epi_materiel", {}).then((json) => {
        const materiels: EpiMateriel[] = JSON.parse(json);
        this.materiels.set(materiels);
        console.log(materiels);
      });

      invoke<string>("get_anomaly_types", {}).then((json) => {
        const anomalyTypes: AnomalyType[] = JSON.parse(json);
        this.anomalyTypes.set(anomalyTypes);
        console.log(anomalyTypes);
      });

   
      const peopleJson = await invoke<string>("get_people", {});
      const people: People[] = JSON.parse(peopleJson);
      people.sort((a, b) => a.nom.localeCompare(b.nom));
      this.employees.set(people);

      const locationsJson = await invoke<string>("get_emplacement", {});
      const locations: Emplacement[] = JSON.parse(locationsJson);
      locations.sort((a, b) => a.location.localeCompare(b.location));
      this.locations.set(locations);
    })();

    let anomalies: Anomaly[] = [];
    await invoke<string>("get_anomalies", {}).then((json) => {
      const anomalyDtos: AnomalyDto[] = JSON.parse(json);
      anomalies = anomalyDtos.map((anomalyDto) => {
        return AnomalyDto.ToAnomaly(anomalyDto, this.anomalyTypes());
      });
    });


   
    invoke<string>("get_epi", {}).then((json) => {
      const epiDtos: EpiDto[] = JSON.parse(json);
      this.epis = epiDtos.map((epiDto) => {
        return EpiDto.ToEpi(epiDto, this.materiels(), this.employees(), this.locations(), anomalies);
      });


      this.epiSource.data = this.epis;
      console.log("loaded epi from back",this.epis);
    });
    
    this.epiSource.filterPredicate = (data: Epi, filter: string) => {
      console.log("filterPredicate",data, filter);
      return data.serial.includes(filter)
      || (data.nature?.nature?.toLowerCase().includes(filter) ?? false)
      || (data.assigned_to?.nom?.toLowerCase().includes(filter) ?? false)
      || (data.assigned_to?.prenom?.toLowerCase().includes(filter) ?? false)
      || (data.emplacement?.location?.toLowerCase().includes(filter) ?? false)
      || (data.anomaly?.anomaly_type?.name?.toLowerCase().includes(filter) ?? false)
    }
   }

   public addEpi(newEpi?: Epi) {
    if (!newEpi) return;

    this.epis.unshift(newEpi);
    this.epiSource.data = this.epis;

    this.saveEpi(newEpi);
   }

   public async saveEpi(epi: Epi){  
    
     if(epi.anomaly != null) {
       const anomalyJson = JSON.stringify(AnomalyDto.FromAnomaly(epi.anomaly));
       
       console.log("sending anomaly to the back", anomalyJson);
       await invoke<string>("save_anomaly", {anomaly: anomalyJson}).then((anomalyId) => {
         console.log("anomaly saved, id = ",anomalyId);
         epi.anomaly!.id = parseInt(anomalyId);
        });
      }
      
      
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
