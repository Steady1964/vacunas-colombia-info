import Dexie from 'dexie';
import { ADMIN_A, CHILD_A, CHILD_B } from './fixtures';
import type { LegacyFamilyV1 } from '../lib/types';

export async function seedLegacyDatabase(
  name: string,
  snapshot: LegacyFamilyV1,
): Promise<void> {
  if (name === 'vacunas-colombia') throw new Error('test-database-required');
  const db = new Dexie(name);
  db.version(1).stores({ profiles: 'id, name', doses: 'id, profileId, date' });
  try {
    await db.open();
    await db.transaction(
      'rw',
      db.table('profiles'),
      db.table('doses'),
      async () => {
        await db.table('profiles').bulkAdd(snapshot.profiles);
        await db.table('doses').bulkAdd(snapshot.doses);
      },
    );
  } finally {
    db.close();
  }
}

export function makeLegacyFamily(): LegacyFamilyV1 {
  return {
    version: 1,
    profiles: [
      {
        id: CHILD_A,
        name: 'Luna',
        birthDate: '2026-01-31',
        scheme: 'shortened',
        createdAt: '2026-02-01T12:30:00.000Z',
        originalField: 'conservar',
      },
      {
        id: CHILD_B,
        name: 'Sol',
        birthDate: '2025-03-30',
        scheme: 'traditional',
        createdAt: '2025-04-01T12:30:00.000Z',
      },
      {
        id: 'pending',
        name: 'Pendiente',
        birthDate: '2026-02-01',
        scheme: 'unknown',
      },
      {
        id: 'invalid-birth',
        name: 'Revisar',
        birthDate: '2026-02-30',
        scheme: 'traditional',
      },
    ],
    doses: [
      {
        id: ADMIN_A,
        profileId: CHILD_A,
        vaccine: 'Vacuna escrita',
        dose: 'primer refuerzo?',
        date: '2026-03-14',
        brand: 'Marca libre',
        lot: 'lote-1',
        point: 'IPS familiar',
        access: 'PAI sin confirmar',
        notes: 'Nota capturada',
        extra: { source: 'carné' },
        createdAt: '2026-03-15T10:00:00.000Z',
      },
      {
        id: 'similar-second-id',
        profileId: CHILD_A,
        vaccine: 'Vacuna escrita',
        dose: 'primer refuerzo?',
        date: '2026-03-14',
      },
      {
        id: 'future',
        profileId: CHILD_A,
        vaccine: 'Vacuna futura',
        dose: '2',
        date: '2099-01-01',
      },
      {
        id: 'invalid-date',
        profileId: CHILD_A,
        vaccine: 'Vacuna',
        dose: '3',
        date: '2026-02-30',
      },
      {
        id: 'orphan',
        profileId: 'missing',
        vaccine: 'Vacuna huérfana',
        dose: '1',
        date: '2026-03-14',
      },
      {
        id: 'before-birth',
        profileId: CHILD_A,
        vaccine: 'Vacuna previa',
        dose: '',
        date: '2026-01-30',
      },
    ],
  };
}
