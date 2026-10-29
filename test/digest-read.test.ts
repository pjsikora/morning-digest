import { describe, expect, it } from 'vitest';
import { digestLines, readNight } from '../src/digest/read.js';

describe('readNight', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line', () => {
    const n = readNight('runs', '2026-10-28');
    expect(n?.badLines).toBe(1);
    expect(n?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    const refresh = n?.rows.find((r) => r.job === 'fixtures/refresh');
    expect(refresh).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503' });
    expect(refresh?.firstAt).toBe('2026-10-29T01:30:00+01:00');
    expect(n?.rows.find((r) => r.job === 'notes/backup')).toMatchObject({ lastStatus: 'fail', lastError: 'quota exceeded' });
    expect(n?.rows.find((r) => r.job === 'digest/render')?.owner).toBeNull();
  });

  it('returns null for a night with no file', () => {
    expect(readNight('runs', '2026-01-01')).toBeNull();
    expect(readNight('runs', '../package')).toBeNull();
  });

  it('counts unparseable lines instead of throwing', () => {
    const d = digestLines('{"at":"x","job":"a","status":"ok","owner":null}\nnot json\n{"job":"a"}\n');
    expect(d.badLines).toBe(2);
    expect(d.rows).toHaveLength(1);
  });

  it('an empty file has no rows', () => {
    expect(digestLines('')).toEqual({ rows: [], badLines: 0 });
  });
});
