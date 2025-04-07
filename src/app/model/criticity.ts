
export enum Criticity {
    NONE = 'Aucune',
    PROCESSED='Traité',
    NORMAL='A traiter',
    URGENT='Urgent',
    CRITICAL='Critique',
}

export function CriticityToInt(criticity: Criticity): number {
    switch(criticity){
        case Criticity.NONE: return 0;
        case Criticity.PROCESSED: return 1;
        case Criticity.NORMAL: return 2;
        case Criticity.URGENT: return 3;
        case Criticity.CRITICAL: return 4;
    }
}
export function IntToCriticity(criticity: number): Criticity {
    switch(criticity){
        case 0: return Criticity.NONE;
        case 1: return Criticity.PROCESSED;
        case 2: return Criticity.NORMAL;
        case 3: return Criticity.URGENT;
        case 4: return Criticity.CRITICAL;
    }
    return Criticity.NONE;
}

export function RandomCriticity():Criticity{
    const random = Math.floor(Math.random() * 4);
    switch(random){

        case 1: return Criticity.NORMAL;
        case 2: return Criticity.URGENT;
        case 3: return Criticity.CRITICAL;
    }
    return Criticity.NONE;
}