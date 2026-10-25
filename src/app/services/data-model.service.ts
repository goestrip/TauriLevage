import { Injectable } from '@angular/core';
import { Epi } from '../model/epi';
import { MatTableDataSource } from '@angular/material/table';
import { invoke } from "@tauri-apps/api/core";
import { EpiMateriel, LevageMateriel } from '../model/catalogMateriel';
import { EpiDto } from '../model/dto/epiDto';
import { People } from '../model/people';
import { Emplacement } from '../model/emplacement';
import { AnomalyType, Anomaly } from '../model/anomaly';
import { AnomalyDto } from '../model/dto/anomalyDto';
import { Levage } from '../model/levage';
import { LevageDto } from '../model/dto/levageDto';
import { signal } from '@angular/core';
import {
  cell,
  criticityFromCsv,
  formatCsvDate,
  ImportResult,
  parseCsv,
  parseFlexibleDate,
  personLabel,
  sameName,
  splitPersonName,
  toCsvDocument,
} from '../model/csv';
import { errorText, toOptionalInt, toOptionalNumber } from '../model/helpers';

@Injectable({
  providedIn: 'root'
})
export class DataModelService {

  private epis: Epi[] = [];
  public epiSource = new MatTableDataSource(this.epis);
  public materiels = signal([] as EpiMateriel[]);

  private levages: Levage[] = [];
  public levageSource = new MatTableDataSource(this.levages);
  public levageMateriels = signal([] as LevageMateriel[]);

  public employees = signal([] as People[]);
  public locations = signal([] as Emplacement[]);
  public anomalyTypes = signal([] as AnomalyType[]);
  public isDbLoaded = signal(false);

  private anomalies: Anomaly[] = [];
  private loadTask: Promise<void> | null = null;

  constructor() {
    this.configureFilters();
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    try {
      const hasDb = await invoke<boolean>("has_database");
      if (hasDb) {
        await this.loadDatabase();
      }
    } catch (error) {
      console.error("Database bootstrap failed", error);
      this.isDbLoaded.set(false);
    }
  }

  public loadDatabase(): Promise<void> {
    if (!this.loadTask) {
      this.loadTask = this.loadDatabaseInner().catch((error) => {
        this.loadTask = null;
        this.isDbLoaded.set(false);
        throw error;
      });
    }
    return this.loadTask;
  }

  public reloadDatabase(): Promise<void> {
    this.loadTask = null;
    this.isDbLoaded.set(false);
    return this.loadDatabase();
  }

  public async initDatabase(): Promise<void> {
    await this.reloadDatabase();
  }

  private async loadDatabaseInner(): Promise<void> {
    await invoke<string>("init_database");

    const [materielJson, levageMaterielJson, anomalyTypesJson, peopleJson, locationsJson] = await Promise.all([
      invoke<string>("get_epi_materiel"),
      invoke<string>("get_levage_materiel"),
      invoke<string>("get_anomaly_types"),
      invoke<string>("get_people"),
      invoke<string>("get_emplacement"),
    ]);

    const materiels = (JSON.parse(materielJson) as EpiMateriel[]).map((item) => new EpiMateriel(item.id, item.nature));
    const levageMateriels = (JSON.parse(levageMaterielJson) as LevageMateriel[]).map((item) => new LevageMateriel(item.id, item.nature));
    const anomalyTypes = JSON.parse(anomalyTypesJson) as AnomalyType[];
    const people = JSON.parse(peopleJson) as People[];
    people.sort((a, b) => a.nom.localeCompare(b.nom, 'fr') || a.prenom.localeCompare(b.prenom, 'fr'));
    const locations = JSON.parse(locationsJson) as Emplacement[];
    locations.sort((a, b) => a.location.localeCompare(b.location, 'fr'));

    this.materiels.set(materiels);
    this.levageMateriels.set(levageMateriels);
    this.anomalyTypes.set(anomalyTypes);
    this.employees.set(people);
    this.locations.set(locations);

    const anomaliesJson = await invoke<string>("get_anomalies");
    const anomalyDtos = JSON.parse(anomaliesJson) as AnomalyDto[];
    this.anomalies = anomalyDtos.map((dto) => AnomalyDto.ToAnomaly(dto, anomalyTypes));

    const epiJson = await invoke<string>("get_epi");
    const epiDtos = JSON.parse(epiJson) as EpiDto[];
    this.epis = epiDtos.map((dto) => EpiDto.ToEpi(dto, materiels, people, locations, this.anomalies));
    this.epiSource.data = this.epis;

    await this.reloadLevages();
    this.isDbLoaded.set(true);
  }

  public async loadLevages(): Promise<void> {
    if (this.loadTask) {
      await this.loadTask;
    }
    if (!this.isDbLoaded()) {
      return;
    }
    await this.reloadLevages();
  }

  private async reloadLevages(): Promise<void> {
    const json = await invoke<string>("get_levage");
    const dtos = JSON.parse(json) as LevageDto[];
    this.levages = dtos.map((dto) => LevageDto.ToLevage(
      dto,
      this.levageMateriels(),
      this.employees(),
      this.locations(),
      this.anomalies,
    ));
    this.levageSource.data = this.levages;
  }

  public async addEpi(newEpi?: Epi): Promise<void> {
    if (!newEpi) return;
    this.epis.unshift(newEpi);
    this.epiSource.data = this.epis;
    try {
      await this.saveEpi(newEpi);
    } catch (error) {
      this.epis = this.epis.filter((item) => item !== newEpi);
      this.epiSource.data = this.epis;
      throw error;
    }
  }

  public async addLevage(newLevage?: Levage): Promise<void> {
    if (!newLevage) return;
    this.levages.unshift(newLevage);
    this.levageSource.data = this.levages;
    try {
      await this.saveLevage(newLevage);
    } catch (error) {
      this.levages = this.levages.filter((item) => item !== newLevage);
      this.levageSource.data = this.levages;
      throw error;
    }
  }

  public async saveEpi(epi: Epi): Promise<void> {
    if (!epi.nature?.id) {
      throw new Error("Nature EPI manquante");
    }
    await this.persistAnomaly(epi.anomaly);
    const id = await invoke<number>("save_epi", { epi: JSON.stringify(EpiDto.FromEpi(epi)) });
    epi.id = id;
  }

  public async saveLevage(levage: Levage): Promise<void> {
    if (!levage.nature?.id) {
      throw new Error("Nature de levage manquante");
    }
    await this.persistAnomaly(levage.anomaly);
    const id = await invoke<number>("save_levage", { levage: JSON.stringify(LevageDto.FromLevage(levage)) });
    levage.id = id;
  }

  private async persistAnomaly(anomaly: Anomaly | null): Promise<void> {
    if (!anomaly) {
      return;
    }
    if (!anomaly.anomaly_type?.id) {
      throw new Error("Type d'anomalie manquant");
    }
    const anomalyId = await invoke<number>("save_anomaly", {
      anomaly: JSON.stringify(AnomalyDto.FromAnomaly(anomaly)),
    });
    anomaly.id = anomalyId;
    this.rememberAnomaly(anomaly);
  }

  private rememberAnomaly(anomaly: Anomaly): void {
    if (anomaly.id == null) {
      return;
    }
    const index = this.anomalies.findIndex((item) => item.id === anomaly.id);
    if (index >= 0) {
      this.anomalies[index] = anomaly;
    } else {
      this.anomalies.push(anomaly);
    }
  }

  public epiSerialExists(serial: string): boolean {
    return this.epis.some((epi) => epi.serial === serial);
  }

  public levageSerialExists(serial: string): boolean {
    return this.levages.some((levage) => levage.serial === serial);
  }

  public async deleteEpi(epi: Epi | null): Promise<void> {
    if (!epi) return;
    if (epi.id != null && epi.id > 0) {
      await invoke("delete_epi", { id: epi.id });
    }
    const index = this.epis.indexOf(epi);
    if (index > -1) {
      this.epis.splice(index, 1);
      this.epiSource.data = this.epis;
    }
  }

  public async deleteLevage(levage: Levage | null): Promise<void> {
    if (!levage) return;
    if (levage.id != null && levage.id > 0) {
      await invoke("delete_levage", { id: levage.id });
    }
    const index = this.levages.indexOf(levage);
    if (index > -1) {
      this.levages.splice(index, 1);
      this.levageSource.data = this.levages;
    }
  }

  public async addEpiMateriel(nature: string): Promise<EpiMateriel> {
    const existing = this.materiels().find((item) => sameName(item.nature, nature));
    if (existing) {
      return existing;
    }
    const id = await invoke<number>("add_epi_materiel", { nature: nature.trim() });
    const created = new EpiMateriel(id, nature.trim());
    this.materiels.set([...this.materiels(), created].sort((a, b) => a.nature.localeCompare(b.nature, 'fr')));
    return created;
  }

  public async deleteEpiMateriel(id: number): Promise<void> {
    await invoke("delete_epi_materiel", { id });
    this.materiels.set(this.materiels().filter((item) => item.id !== id));
  }

  public async addLevageMateriel(nature: string): Promise<LevageMateriel> {
    const existing = this.levageMateriels().find((item) => sameName(item.nature, nature));
    if (existing) {
      return existing;
    }
    const id = await invoke<number>("add_levage_materiel", { nature: nature.trim() });
    const created = new LevageMateriel(id, nature.trim());
    this.levageMateriels.set([...this.levageMateriels(), created].sort((a, b) => a.nature.localeCompare(b.nature, 'fr')));
    return created;
  }

  public async deleteLevageMateriel(id: number): Promise<void> {
    await invoke("delete_levage_materiel", { id });
    this.levageMateriels.set(this.levageMateriels().filter((item) => item.id !== id));
  }

  public async addPerson(prenom: string, nom: string): Promise<People> {
    const existing = this.employees().find((person) => sameName(person.prenom, prenom) && sameName(person.nom, nom));
    if (existing) {
      return existing;
    }
    const id = await invoke<number>("add_person", { prenom: prenom.trim(), nom: nom.trim() });
    const created = Object.assign(new People(), { id, prenom: prenom.trim(), nom: nom.trim() });
    this.employees.set([...this.employees(), created].sort((a, b) => a.nom.localeCompare(b.nom, 'fr') || a.prenom.localeCompare(b.prenom, 'fr')));
    return created;
  }

  public async deletePerson(id: number): Promise<void> {
    await invoke("delete_person", { id });
    this.employees.set(this.employees().filter((item) => item.id !== id));
  }

  public async addLocation(location: string): Promise<Emplacement> {
    const existing = this.locations().find((item) => sameName(item.location, location));
    if (existing) {
      return existing;
    }
    const id = await invoke<number>("add_emplacement", { location: location.trim() });
    const created = Object.assign(new Emplacement(), { id, location: location.trim() });
    this.locations.set([...this.locations(), created].sort((a, b) => a.location.localeCompare(b.location, 'fr')));
    return created;
  }

  public async deleteLocation(id: number): Promise<void> {
    await invoke("delete_emplacement", { id });
    this.locations.set(this.locations().filter((item) => item.id !== id));
  }

  public async addAnomalyType(name: string): Promise<AnomalyType> {
    const existing = this.anomalyTypes().find((item) => sameName(item.name, name));
    if (existing) {
      return existing;
    }
    const id = await invoke<number>("add_anomaly_type", { name: name.trim() });
    const created = Object.assign(new AnomalyType(), { id, name: name.trim() });
    this.anomalyTypes.set([...this.anomalyTypes(), created].sort((a, b) => a.name.localeCompare(b.name, 'fr')));
    return created;
  }

  public async deleteAnomalyType(id: number): Promise<void> {
    await invoke("delete_anomaly_type", { id });
    this.anomalyTypes.set(this.anomalyTypes().filter((item) => item.id !== id));
  }

  public async importEpiCsv(csvData: string): Promise<ImportResult> {
    await this.loadDatabase();
    const parsed = parseCsv(csvData);
    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

    for (const [index, row] of parsed.rows.entries()) {
      const line = index + 2;
      const serial = cell(row, parsed.headers, 'serial', 1);
      const natureName = cell(row, parsed.headers, 'nature', 0);
      if (!serial || !natureName) {
        result.skipped++;
        continue;
      }
      if (this.epiSerialExists(serial)) {
        result.skipped++;
        result.errors.push(`Ligne ${line} : le numéro ${serial} existe déjà`);
        continue;
      }
      try {
        const epi = new Epi();
        epi.id = null;
        epi.serial = serial;
        epi.nature = await this.addEpiMateriel(natureName);
        epi.date_mise_en_service = parseFlexibleDate(cell(row, parsed.headers, 'date_mise_en_service', 2));
        epi.date_fabrication = parseFlexibleDate(cell(row, parsed.headers, 'date_fabrication', 3));
        epi.validite_years = toOptionalInt(cell(row, parsed.headers, 'validite_years', 4));
        epi.assigned_to = await this.personFromCsv(cell(row, parsed.headers, 'assigned_to', 6));
        epi.emplacement = await this.locationFromCsv(cell(row, parsed.headers, 'secteur', 7));
        epi.date_last_control = parseFlexibleDate(cell(row, parsed.headers, 'date_last_control', 8));
        epi.date_rebus = parseFlexibleDate(cell(row, parsed.headers, 'date_rebus', 9));
        epi.anomaly = await this.anomalyFromCsv(row, parsed.headers, epi.date_mise_en_service, {
          name: 10,
          description: 13,
          criticity: 11,
          resolution: 12,
          detection: 14,
        });
        await this.addEpi(epi);
        result.imported++;
      } catch (error) {
        result.errors.push(`Ligne ${line} : ${errorText(error)}`);
      }
    }
    return result;
  }

  public async importLevageCsv(csvData: string): Promise<ImportResult> {
    await this.loadDatabase();
    const parsed = parseCsv(csvData);
    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

    for (const [index, row] of parsed.rows.entries()) {
      const line = index + 2;
      const serial = cell(row, parsed.headers, 'serial', 1);
      const natureName = cell(row, parsed.headers, 'nature', 0);
      if (!serial || !natureName) {
        result.skipped++;
        continue;
      }
      if (this.levageSerialExists(serial)) {
        result.skipped++;
        result.errors.push(`Ligne ${line} : le numéro ${serial} existe déjà`);
        continue;
      }
      try {
        const levage = new Levage();
        levage.id = null;
        levage.serial = serial;
        levage.nature = await this.addLevageMateriel(natureName);
        levage.date_mise_en_service = parseFlexibleDate(cell(row, parsed.headers, 'date_mise_en_service', 2));
        levage.cmu_kg = toOptionalInt(cell(row, parsed.headers, 'cmu_kg', 3));
        levage.longueur_m = toOptionalNumber(cell(row, parsed.headers, 'longueur_m', 4));
        levage.essai_charge = toOptionalInt(cell(row, parsed.headers, 'essai_charge_kg', 5));
        levage.assigned_to = await this.personFromCsv(cell(row, parsed.headers, 'assigned_to', 6));
        levage.emplacement = await this.locationFromCsv(cell(row, parsed.headers, 'secteur', 7));
        levage.date_last_control = parseFlexibleDate(cell(row, parsed.headers, 'date_last_control', 8));
        levage.date_rebus = parseFlexibleDate(cell(row, parsed.headers, 'date_rebus', 9));
        levage.anomaly = await this.anomalyFromCsv(row, parsed.headers, levage.date_mise_en_service, {
          name: 10,
          description: 11,
          criticity: 12,
          detection: 13,
          resolution: 14,
        });
        await this.addLevage(levage);
        result.imported++;
      } catch (error) {
        result.errors.push(`Ligne ${line} : ${errorText(error)}`);
      }
    }
    return result;
  }

  public exportEpiCsv(): string {
    const headers = [
      'nature', 'serial', 'date_mise_en_service', 'date_fabrication', 'validite_years',
      'assigned_to', 'secteur', 'date_last_control', 'date_rebus',
      'anomaly_name', 'anomaly_description', 'anomaly_criticity', 'date_detection', 'date_resolution',
    ];
    const rows = this.epis.map((epi) => [
      epi.nature?.nature ?? '',
      epi.serial,
      formatCsvDate(epi.date_mise_en_service),
      formatCsvDate(epi.date_fabrication),
      epi.validite_years ?? '',
      personLabel(epi.assigned_to),
      epi.emplacement?.location ?? '',
      formatCsvDate(epi.date_last_control),
      formatCsvDate(epi.date_rebus),
      epi.anomaly?.anomaly_type?.name ?? '',
      epi.anomaly?.description ?? '',
      epi.anomaly?.criticity ?? '',
      formatCsvDate(epi.anomaly?.date_detection),
      formatCsvDate(epi.anomaly?.date_resolution),
    ]);
    return toCsvDocument(headers, rows);
  }

  public exportLevageCsv(): string {
    const headers = [
      'nature', 'serial', 'date_mise_en_service', 'cmu_kg', 'longueur_m', 'essai_charge_kg',
      'assigned_to', 'secteur', 'date_last_control', 'date_rebus',
      'anomaly_name', 'anomaly_description', 'anomaly_criticity', 'date_detection', 'date_resolution',
    ];
    const rows = this.levages.map((levage) => [
      levage.nature?.nature ?? '',
      levage.serial,
      formatCsvDate(levage.date_mise_en_service),
      levage.cmu_kg ?? '',
      levage.longueur_m ?? '',
      levage.essai_charge ?? '',
      personLabel(levage.assigned_to),
      levage.emplacement?.location ?? '',
      formatCsvDate(levage.date_last_control),
      formatCsvDate(levage.date_rebus),
      levage.anomaly?.anomaly_type?.name ?? '',
      levage.anomaly?.description ?? '',
      levage.anomaly?.criticity ?? '',
      formatCsvDate(levage.anomaly?.date_detection),
      formatCsvDate(levage.anomaly?.date_resolution),
    ]);
    return toCsvDocument(headers, rows);
  }

  private async personFromCsv(value: string): Promise<People | null> {
    const name = splitPersonName(value);
    if (!name) {
      return null;
    }
    const existing = this.employees().find((person) => sameName(person.prenom, name.prenom) && sameName(person.nom, name.nom));
    return existing ?? this.addPerson(name.prenom, name.nom);
  }

  private async locationFromCsv(value: string): Promise<Emplacement | null> {
    if (!value.trim()) {
      return null;
    }
    return this.addLocation(value);
  }

  private async anomalyFromCsv(
    row: string[],
    headers: string[] | null,
    fallbackDetection: Date | null,
    indexes: { name: number; description: number; criticity: number; resolution: number; detection: number },
  ): Promise<Anomaly | null> {
    const name = cell(row, headers, 'anomaly_name', indexes.name);
    const description = cell(row, headers, 'anomaly_description', indexes.description);
    const criticityValue = cell(row, headers, 'anomaly_criticity', indexes.criticity);
    const resolution = parseFlexibleDate(cell(row, headers, 'date_resolution', indexes.resolution));
    const detection = parseFlexibleDate(cell(row, headers, 'date_detection', indexes.detection)) ?? fallbackDetection ?? new Date();
    if (!name && !description && !criticityValue && !resolution) {
      return null;
    }
    const anomaly = new Anomaly();
    anomaly.anomaly_type = await this.addAnomalyType(name || 'Autre');
    anomaly.description = description || name;
    anomaly.date_detection = detection;
    anomaly.date_resolution = resolution;
    anomaly.criticity = criticityFromCsv(criticityValue, resolution);
    return anomaly;
  }

  private configureFilters(): void {
    this.epiSource.filterPredicate = (data: Epi, filter: string) => {
      return data.serial.toLowerCase().includes(filter)
        || (data.nature?.nature?.toLowerCase().includes(filter) ?? false)
        || (data.assigned_to?.nom?.toLowerCase().includes(filter) ?? false)
        || (data.assigned_to?.prenom?.toLowerCase().includes(filter) ?? false)
        || (data.emplacement?.location?.toLowerCase().includes(filter) ?? false)
        || (data.anomaly?.anomaly_type?.name?.toLowerCase().includes(filter) ?? false)
        || (data.anomaly?.description?.toLowerCase().includes(filter) ?? false);
    };
    this.levageSource.filterPredicate = (data: Levage, filter: string) => {
      return data.serial.toLowerCase().includes(filter)
        || (data.nature?.nature?.toLowerCase().includes(filter) ?? false)
        || String(data.cmu_kg ?? '').includes(filter)
        || String(data.longueur_m ?? '').includes(filter)
        || (data.assigned_to?.nom?.toLowerCase().includes(filter) ?? false)
        || (data.assigned_to?.prenom?.toLowerCase().includes(filter) ?? false)
        || (data.emplacement?.location?.toLowerCase().includes(filter) ?? false)
        || (data.anomaly?.anomaly_type?.name?.toLowerCase().includes(filter) ?? false)
        || (data.anomaly?.description?.toLowerCase().includes(filter) ?? false);
    };
  }
}
