import Dexie, { type Table } from 'dexie'
export type Scheme = 'traditional' | 'shortened'
export type Profile = { id: string; name: string; birthDate: string; scheme: Scheme; createdAt: string }
export type Dose = { id: string; profileId: string; vaccine: string; dose: string; date: string; brand?: string; lot?: string; point?: string; access?: string; notes?: string }
class VaccineDB extends Dexie { profiles!: Table<Profile, string>; doses!: Table<Dose, string>; constructor(){ super('vacunas-colombia'); this.version(1).stores({profiles:'id, name', doses:'id, profileId, date'}) } }
export const db = new VaccineDB()
export const schedule = [
 {age:'Al nacer', days:0, vaccines:['BCG','Hepatitis B neonatal']},
 {age:'6 semanas', days:42, vaccines:['Pentavalente / Hexavalente','Polio IPV']},
 {age:'2 meses', days:60, vaccines:['Pentavalente / Hexavalente','Polio IPV']},
 {age:'3 meses', days:84, vaccines:['Pentavalente / Hexavalente','Polio IPV']},
 {age:'4 meses', days:120, vaccines:['Pentavalente / Hexavalente','Polio IPV']},
 {age:'4,5 meses', days:126, vaccines:['Pentavalente / Hexavalente','Polio IPV']},
 {age:'6 meses', days:180, vaccines:['Influenza estacional']},
 {age:'7 meses', days:210, vaccines:['Influenza estacional']},
 {age:'9 meses', days:270, vaccines:['Fiebre amarilla']},
 {age:'12 meses', days:365, vaccines:['SRP 1','Varicela 1','Neumococo refuerzo','Hepatitis A']},
 {age:'18 meses', days:548, vaccines:['DPT refuerzo','Polio refuerzo','SRP 2']},
 {age:'5 años', days:1826, vaccines:['DPT refuerzo','Polio refuerzo','Varicela refuerzo']},
]
export function scheduleFor(scheme: Scheme){ return schedule.filter((item) => scheme === 'traditional' ? !['6 semanas','3 meses','4,5 meses'].includes(item.age) : !['2 meses','4 meses'].includes(item.age)) }
export function isoDate(date: Date){ return date.toISOString().slice(0,10) }
export function estimate(birth: string, days: number, scheme: Scheme){ const date = new Date(`${birth}T12:00:00`); if(scheme === 'traditional' && days === 42) return new Date(date.setMonth(date.getMonth()+2)); if(scheme === 'traditional' && days === 84) return new Date(date.setMonth(date.getMonth()+4)); if(scheme === 'traditional' && days === 126) return new Date(date.setMonth(date.getMonth()+6)); return new Date(date.setDate(date.getDate()+days)) }
