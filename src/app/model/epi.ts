import { Anomaly } from "./anomaly";
import { Emplacement } from "./emplacement";
import { EpiMateriel } from "./catalogMateriel";
import { People } from "./people";
import { v4 as uuidv4 } from 'uuid';
 
function getRandomDate(start: Date, end:Date|null = null): Date {
if(end === null){
    end = new Date();
}
    const startTime = start.getTime();
    const endTime = end.getTime();
    const randomTime = new Date(startTime + Math.random() * (endTime - startTime));
    return randomTime;
}

const YEAR_TO_MS = 365 * 24 * 60 * 60 * 1000;


export class Epi{
    public id: number = 0;
    public nature: EpiMateriel | null = null;
    public serial: string = uuidv4().toString().slice(0, 8);
    public date_fabrication: Date | undefined ;
    public date_mise_en_service: Date | undefined;
    public validite_years: number = 10;
    public get validiteLimite(): Date | undefined{
        if(this.date_fabrication){
            return Epi.ComputeValiditeLimite( this.date_fabrication, this.validite_years);
        }
        return undefined;
    }
    public assigned_to: People|null = null;
    public emplacement: Emplacement|null = null;

    public date_last_control: Date|null = null;
    public date_rebus: Date|null = null;
    public anomaly: Anomaly |null = null;

    public static ComputeValiditeLimite(date_fabrication: Date | undefined, validite_years: number): Date | undefined {
        if(date_fabrication){
            return new Date(date_fabrication.getTime() + validite_years * YEAR_TO_MS);
        }
        return undefined;
    }

    public copyFrom(other: Epi): void {
        this.nature = other.nature;
        this.serial = other.serial;
        this.date_fabrication = other.date_fabrication;
        this.date_mise_en_service = other.date_mise_en_service;
        this.validite_years = other.validite_years;
        this.assigned_to = other.assigned_to;
        this.emplacement = other.emplacement;
        this.date_last_control = other.date_last_control;
        this.date_rebus = other.date_rebus;
        this.anomaly = other.anomaly;
    }
}

