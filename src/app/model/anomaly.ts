import { Criticity, RandomCriticity } from "./criticity";

export class Anomaly{
    public id: number = 0;
    public title: string = '';
    public description: string = '';
    public criticity: Criticity = Criticity.NONE;
    public isHandled: boolean = false;
    public date_detection: Date = new Date();
    public date_resolution: Date|null = null;
}

export function GenerateRandomAnomaly():Anomaly|null{

    if(Math.random() < 0.5){
        return null;
    }

    const anomaly = new Anomaly();
    anomaly.title = 'Anomaly ' + Math.floor(Math.random() * 1000);
    anomaly.description = 'Description ' + Math.floor(Math.random() * 1000);
    anomaly.criticity = RandomCriticity();
    anomaly.isHandled = Math.random() > 0.5;
    anomaly.date_detection = new Date();
    anomaly.date_resolution = null;
    return anomaly;
}