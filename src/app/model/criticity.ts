
export enum Criticity {
    NONE = 'Aucune',
    NORMAL='A traiter',
    URGENT='Urgent',
    CRITICAL='Critique',
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