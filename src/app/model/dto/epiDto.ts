import { Anomaly } from "../anomaly";
import { EpiMateriel } from "../catalogMateriel";
import { Emplacement } from "../emplacement";
import { Epi } from "../epi";
import { People } from "../people";


export class EpiDto{
    public id: number = 0;
    public nature_id: number = 0;
    public serial: string = '';;
    public date_fabrication: number = 0;
    public date_mise_en_service: number = 0;
    public validite_years: number = 10;
    public validiteLimite: number | undefined;
    public assigned_to_id: number|null = null;
    public emplacement_id: number|null = null;
    public date_last_control: number|null = null;
    public date_rebus: number|null = null;
    public anomaly_id: number|null = null;
    
    public static ToEpi(dto:EpiDto, materiels: EpiMateriel[], employees: People[], locations:Emplacement[], anomalies: Anomaly[]):Epi{
       return Object.assign(new Epi(),{
            id: dto.id,
            serial: dto.serial,
            nature: materiels.find(m => m.id == dto.nature_id) || null,
            date_fabrication: dto.date_fabrication ? new Date(dto.date_fabrication) : null,
            date_mise_en_service: dto.date_mise_en_service ? new Date(dto.date_mise_en_service) : null,
            validite_years: dto.validite_years,
            date_rebus: dto.date_rebus ? new Date(dto.date_rebus) : null,
            assigned_to: employees.find(l => l.id == dto.assigned_to_id) || null,
            emplacement: locations.find(e => e.id == dto.emplacement_id) || null,
            date_last_control: dto.date_last_control ? new Date(dto.date_last_control) : null,
            anomaly: anomalies.find(a => a.id == dto.anomaly_id) || null,
       });
    }

    public static FromEpi( epi: Epi): EpiDto{
        return Object.assign(new EpiDto(),{
            id: epi.id,
            nature_id: epi.nature?.id || 0,
            serial: epi.serial,
            date_fabrication: epi.date_fabrication ? epi.date_fabrication.getTime() : null,
            date_mise_en_service: epi.date_mise_en_service ? epi.date_mise_en_service.getTime() : null,
            validite_years: epi.validite_years,
            assigned_to_id: epi.assigned_to?.id || null,
            emplacement_id: epi.emplacement?.id || null,
            date_last_control: epi.date_last_control ? epi.date_last_control.getTime() : null,
            date_rebus: epi.date_rebus ? epi.date_rebus.getTime() : null,
            anomaly_id: epi.anomaly?.id || null,
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