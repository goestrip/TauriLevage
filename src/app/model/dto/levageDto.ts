import { Anomaly } from "../anomaly";
import { LevageMateriel } from "../catalogMateriel";
import { Emplacement } from "../emplacement";
import { Levage } from "../levage";
import { People } from "../people";


export class LevageDto{
    public id: number = 0;
    public nature_id: number = 0;
    public serial: string = '';;
    public date_mise_en_service: number = 0;
    public cmu_kg: number = 0;
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
            date_mise_en_service: dto.date_mise_en_service ? new Date(dto.date_mise_en_service) : null,
            cmu_kg: dto.cmu_kg,
            essai_charge: dto.essai_charge_kg,
            date_rebus: dto.date_rebus ? new Date(dto.date_rebus) : null,
            assigned_to: employees.find(l => l.id == dto.assigned_to_id) || null,
            emplacement: locations.find(e => e.id == dto.emplacement_id) || null,
            date_last_control: dto.date_last_control ? new Date(dto.date_last_control) : null,
            anomaly: anomalies.find(a => a.id == dto.anomaly_id) || null,
       });
    }

    public static FromLevage( levage:Levage): LevageDto{
        return Object.assign(new LevageDto(),{
            id: levage.id,
            nature_id: levage.nature?.id || 0,
            serial: levage.serial,
            date_mise_en_service: levage.date_mise_en_service ? levage.date_mise_en_service.getTime() : null,
            cmu_kg: levage.cmu_kg? levage.cmu_kg : null,
            essai_charge_kg: levage.essai_charge? levage.essai_charge : null,
            assigned_to_id: levage.assigned_to?.id || null,
            emplacement_id: levage.emplacement?.id || null,
            date_last_control: levage.date_last_control ? levage.date_last_control.getTime() : null,
            date_rebus: levage.date_rebus ? levage.date_rebus.getTime() : null,
            anomaly_id: levage.anomaly?.id || null,
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