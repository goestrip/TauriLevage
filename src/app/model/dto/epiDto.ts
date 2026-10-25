import { Anomaly } from "../anomaly";
import { EpiMateriel } from "../catalogMateriel";
import { Emplacement } from "../emplacement";
import { Epi } from "../epi";
import { dateToMs, msToDate, toOptionalInt } from "../helpers";
import { People } from "../people";


export class EpiDto{
    public id: number | null = null;
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
            date_fabrication: msToDate(dto.date_fabrication),
            date_mise_en_service: msToDate(dto.date_mise_en_service),
            validite_years: dto.validite_years,
            date_rebus: msToDate(dto.date_rebus),
            assigned_to: employees.find(l => l.id == dto.assigned_to_id) || null,
            emplacement: locations.find(e => e.id == dto.emplacement_id) || null,
            date_last_control: msToDate(dto.date_last_control),
            anomaly: anomalies.find(a => a.id == dto.anomaly_id) || null,
       });
    }

    public static FromEpi( epi: Epi): EpiDto{
        return Object.assign(new EpiDto(),{
            id: epi.id && epi.id > 0 ? epi.id : null,
            nature_id: epi.nature?.id || 0,
            serial: epi.serial,
            date_fabrication: dateToMs(epi.date_fabrication),
            date_mise_en_service: dateToMs(epi.date_mise_en_service),
            validite_years: toOptionalInt(epi.validite_years),
            assigned_to_id: epi.assigned_to?.id || null,
            emplacement_id: epi.emplacement?.id || null,
            date_last_control: dateToMs(epi.date_last_control),
            date_rebus: dateToMs(epi.date_rebus),
            anomaly_id: epi.anomaly?.id && epi.anomaly.id > 0 ? epi.anomaly.id : null,
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