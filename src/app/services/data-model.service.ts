import { Injectable, Signal, signal } from '@angular/core';
import { Epi } from '../model/epi';
import { MatTableDataSource } from '@angular/material/table';
import { invoke } from "@tauri-apps/api/core";
import { EpiMateriel, LevageMateriel } from '../model/catalogMateriel';
import { EpiCsvDto, EpiDto } from '../model/dto/epiDto';
import { People } from '../model/people';
import { Emplacement } from '../model/emplacement';
import { AnomalyType, Anomaly } from '../model/anomaly';
import { AnomalyDto } from '../model/dto/anomalyDto';
import { Levage } from '../model/levage';

@Injectable({
  providedIn: 'root'
})
export class DataModelService {

  private epis : Epi[] = [];
  public epiSource = new MatTableDataSource(this.epis);
  public materiels  = signal([] as EpiMateriel[]);


  private levages: Levage[] = [];
  public levageSource = new MatTableDataSource(this.levages);
  public levageMateriels  = signal([] as LevageMateriel[]);

  public employees = signal([] as People[]);
  public locations = signal([] as Emplacement[]);
  public anomalyTypes = signal([] as AnomalyType[]);
  public isDbLoaded = signal(false);

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

      return data.serial.toLowerCase().includes(filter)
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


   public parseCsvData(csvData: string): EpiCsvDto[] {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
    const epis: EpiCsvDto[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim());
      if (values.length !== headers.length || values[1].length == 0) continue; // Skip if the number of values doesn't match the number of headers

      const epiCsv: EpiCsvDto = new EpiCsvDto();
      epiCsv.nature = values[0];
      epiCsv.serial = values[1];
      epiCsv.date_mise_en_service = values[2];
      epiCsv.date_fabrication = values[3];
      epiCsv.validite_years = parseInt(values[4]);
      epiCsv.validiteLimite = values[5];
      epiCsv.assigned_to = values[6];
      epiCsv.secteur = values[7];
      epiCsv.date_last_control = values[8];
      epiCsv.date_rebus = values[9];
      epiCsv.anomaly_name = values[10];
      epiCsv.anomaly_criticity = values[11];
      epiCsv.date_resolution = values[12];
      epis.push(epiCsv);
    }

    return epis;
   }


   public deleteEpi(epi: Epi|null) {
    if (!epi) return;
    const epi_id = epi.id.toString();
    
    invoke<string>("delete_epi", {id: epi_id}).then((isDeleted) => {
      if (isDeleted ) {
        console.log("EPI deleted successfully");
        const index = this.epis.indexOf(epi);
        if (index > -1) {
          this.epis.splice(index, 1);
          this.epiSource.data = this.epis;
        }
      }
   });
  }

  public deleteLevage(levage: Levage|null) {
    if (!levage) return;
    const levage_id = levage.id.toString();
    
    invoke<string>("delete_levage", {id: levage_id}).then((isDeleted) => {
      if (isDeleted ) {
        console.log("LEVAGE deleted successfully");
        const index = this.levages.indexOf(levage);
        if (index > -1) {
          this.levages.splice(index, 1);
          this.levageSource.data = this.levages;
        }
      }
   });
  }
}
