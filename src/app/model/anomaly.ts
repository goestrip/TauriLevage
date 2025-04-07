import { Criticity, RandomCriticity } from "./criticity";

export class AnomalyType{
    public id: number = 0;
    public name: string = '';
}

export class Anomaly{
    public id: number|null = null;
    public anomaly_type: AnomalyType|null = null;
    public description: string = '';
    public criticity: Criticity = Criticity.NONE;
    public date_detection: Date = new Date();
    public date_resolution: Date|null = null;
    
    public get isHandled(): boolean {
        return this.date_resolution !== null;
    }
}

