import { Anomaly, AnomalyType } from "../anomaly";
import { CriticityToInt, IntToCriticity } from "../criticity";
import { dateToMs, msToDate } from "../helpers";


export class AnomalyDto{
    id: number|null = null;
    anomaly_type_id: number = 0;
    description: string = '';
    criticity: number = 0;
    date_detection: number = 0;
    date_resolution: number|null = null;

    public static ToAnomaly(dto: AnomalyDto, anomalyTypes: AnomalyType[]): Anomaly {
        return Object.assign(new Anomaly(), {
            id: dto.id,
            anomaly_type: anomalyTypes.find(at => at.id == dto.anomaly_type_id) || null,
            description: dto.description,
            criticity: IntToCriticity(dto.criticity),
            date_detection: msToDate(dto.date_detection) ?? new Date(),
            date_resolution: msToDate(dto.date_resolution)
        });
    }

    public static FromAnomaly(anomaly: Anomaly): AnomalyDto {
        return Object.assign(new AnomalyDto(), {
            id: anomaly.id && anomaly.id > 0 ? anomaly.id : null,
            anomaly_type_id: anomaly.anomaly_type?.id || 0,
            description: anomaly.description ?? '',
            criticity: CriticityToInt(anomaly.criticity),
            date_detection: dateToMs(anomaly.date_detection) ?? Date.now(),
            date_resolution: dateToMs(anomaly.date_resolution)
        });
    }
}