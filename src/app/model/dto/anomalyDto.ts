import { Anomaly, AnomalyType } from "../anomaly";
import { CriticityToInt, IntToCriticity } from "../criticity";


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
            date_detection: dto.date_detection ? new Date(dto.date_detection) : null,
            date_resolution: dto.date_resolution ? new Date(dto.date_resolution) : null
        });
    }

    public static FromAnomaly(anomaly: Anomaly): AnomalyDto {
        return Object.assign(new AnomalyDto(), {
            id: anomaly.id,
            anomaly_type_id: anomaly.anomaly_type?.id || 0,
            description: anomaly.description,
            criticity: CriticityToInt(anomaly.criticity),
            date_detection: anomaly.date_detection ? anomaly.date_detection.getTime() : null,
            date_resolution: anomaly.date_resolution ? anomaly.date_resolution.getTime() : null
        });
    }
}