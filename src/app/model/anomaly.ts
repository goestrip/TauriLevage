import { Criticity } from "./criticity";

export class Anomaly{
    public id: number = 0;
    public title: string = '';
    public description: string = '';
    public criticity: Criticity = Criticity.NONE;
    public isHandled: boolean = false;
    public date_detection: Date = new Date();
    public date_resolution: Date|null = null;
}