import { Anomaly } from "./anomaly";
import { Emplacement } from "./emplacement";
import { EpiMateriel } from "./catalogMateriel";
import { People } from "./people";

export class Epi{
    public id: number = 0;
    public nature: EpiMateriel = new EpiMateriel();
    
    public serial: string = '';
    public date_mise_en_service: Date = new Date();
    public date_fabrication: Date = new Date();
    public validite_years: number = 0;
    public assignedTo: People|null = null;
    public emplacement: Emplacement|null = null;

    public date_last_control: Date|null = null;
    public date_rebus: Date|null = null;

    public anomalies: Anomaly[] = [];
}