import { Anomaly } from "./anomaly";
import { Emplacement } from "./emplacement";
import { EpiMateriel } from "./catalogMateriel";
import { People } from "./people";
import { v4 as uuidv4 } from 'uuid';
 
function getRandomDate(start: Date, end:Date|null = null): Date {
//const start = new Date(2020, 0, 1);
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
    public nature: EpiMateriel = new EpiMateriel();
    public serial: string = uuidv4();
    public date_fabrication: Date = getRandomDate(new Date(2014, 0, 1), new Date(2021, 0, 1));
    public date_mise_en_service: Date = getRandomDate(new Date(2021, 0, 1));
    public validite_years: number = 10;
    public validiteLimite: Date = new Date(this.date_fabrication.getTime() + this.validite_years *YEAR_TO_MS);
    public assignedTo: People|null = null;
    public emplacement: Emplacement|null = null;

    public date_last_control: Date|null = null;
    public date_rebus: Date|null = null;

    public anomalies: Anomaly[] = [];
    
   
}
