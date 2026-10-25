import { Anomaly } from "../anomaly";
import { LevageMateriel } from "../catalogMateriel";
import { Emplacement } from "../emplacement";
import { dateToMs, msToDate, toOptionalInt, toOptionalNumber } from "../helpers";
import { Levage } from "../levage";
import { People } from "../people";


export class LevageDto{
    public id: number | null = null;
    public nature_id: number = 0;
    public serial: string = '';;
    public date_mise_en_service: number = 0;
    public cmu_kg: number | null = null;
    public longueur_m: number | null = null;
    public essai_charge_kg: number|null = null;

    public assigned_to_id: number|null = null;
    public emplacement_id: number|null = null;
    public date_last_control: number|null = null;
    public date_rebus: number|null = null;
    public anomaly_id: number|null = null;
    
    public static ToLevage(dto:LevageDto, materiels: LevageMateriel[], employees: People[], locations:Emplacement[], anomalies: Anomaly[]):Levage{
       return Object.assign(new Levage(),{
            id: dto.id,
            serial: dto.serial,
            nature: materiels.find(m => m.id == dto.nature_id) || null,
            date_mise_en_service: msToDate(dto.date_mise_en_service),
            cmu_kg: dto.cmu_kg,
            longueur_m: dto.longueur_m,
            essai_charge: dto.essai_charge_kg,
            date_rebus: msToDate(dto.date_rebus),
            assigned_to: employees.find(l => l.id == dto.assigned_to_id) || null,
            emplacement: locations.find(e => e.id == dto.emplacement_id) || null,
            date_last_control: msToDate(dto.date_last_control),
            anomaly: anomalies.find(a => a.id == dto.anomaly_id) || null,
       });
    }

    public static FromLevage( levage:Levage): LevageDto{
        return Object.assign(new LevageDto(),{
            id: levage.id && levage.id > 0 ? levage.id : null,
            nature_id: levage.nature?.id || 0,
            serial: levage.serial,
            date_mise_en_service: dateToMs(levage.date_mise_en_service),
            cmu_kg: toOptionalInt(levage.cmu_kg),
            longueur_m: toOptionalNumber(levage.longueur_m),
            essai_charge_kg: toOptionalInt(levage.essai_charge),
            assigned_to_id: levage.assigned_to?.id || null,
            emplacement_id: levage.emplacement?.id || null,
            date_last_control: dateToMs(levage.date_last_control),
            date_rebus: dateToMs(levage.date_rebus),
            anomaly_id: levage.anomaly?.id && levage.anomaly.id > 0 ? levage.anomaly.id : null,
        });
    }
}

export class EpiCsvDto{
    public nature: string = '';
    public serial: string = '';
    public date_fabrication: string = '';
    public date_mise_en_service: string = '';
    public validite_years: number = 10;
    public validiteLimite: string = '';
    public assigned_to: string|null = null;
    public secteur: string|null = null;
    public date_last_control: string|null = null;
    public date_rebus: string|null = null;
    public anomaly_name: string|null = null;
    public anomaly_criticity: string|null = null;
    public date_resolution: string|null = null;
}