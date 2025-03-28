import { Anomaly, GenerateRandomAnomaly } from "./anomaly";
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
    public validiteLimite: Date | undefined;
    public assigned_to: People|null = null;
    public emplacement: Emplacement|null = null;

    public date_last_control: Date|null = null;
    public date_rebus: Date|null = null;

    public anomaly: Anomaly |null = null;
}

export function GenerateRandomEpi():Epi{
    const epi = new Epi();
    epi.nature = new EpiMateriel(1, "stop chute");
    epi.serial = uuidv4().toString().slice(0, 8);
    epi.date_fabrication = getRandomDate(new Date(2014, 0, 1), new Date(2021, 0, 1));
    epi.date_mise_en_service = getRandomDate(new Date(2021, 0, 1));
    epi.validite_years = Math.floor(Math.random() * 4) + 6;
    epi.validiteLimite = new Date(epi.date_fabrication.getTime() + epi.validite_years *YEAR_TO_MS);
    epi.assigned_to = null;
    epi.emplacement = null;
    epi.date_last_control = getRandomDate(new Date(2023, 0, 1));
    epi.date_rebus = Math.random() < 0.4 ? epi.date_last_control  : null;
    epi.anomaly = GenerateRandomAnomaly();
    return epi;
}
