import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const line = (at: string, job: string, status: string, owner: string | null = 'piotr') =>
  JSON.stringify({ at, job, status, owner });

let dir: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  const data = [
    line('2026-10-29T01:00:00+01:00', 'zeta/job', 'ok'),
    line('2026-10-29T01:05:00+01:00', 'alpha/job', 'retry'),
    line('2026-10-29T01:10:00+01:00', 'alpha/job', 'ok'),
    line('2026-10-29T01:15:00+01:00', 'mid/job', 'fail', null),
  ];
  writeFileSync(join(dir, '2026-10-20.jsonl'), data.join('\n') + '\n');
  writeFileSync(join(dir, '2026-10-21.jsonl'), '');
  writeFileSync(join(dir, '2026-10-22.jsonl'), [data[0], 'not json at all', data[1]].join('\n') + '\n');
  app = createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: dir });
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

type Json = { night: string; rows: { job: string }[]; badLines: number };

describe('digest routes', () => {
  it('serves a night with data as a page and as JSON', async () => {
    const page = await app.request('/digest/2026-10-20');
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain('alpha/job');
    expect(html).not.toContain('nothing ran');
    const api = await app.request('/api/digest/2026-10-20');
    expect(api.status).toBe(200);
    const body = (await api.json()) as Json;
    expect(body.night).toBe('2026-10-20');
    expect(body.rows).toHaveLength(3);
    expect(body.badLines).toBe(0);
  });

  it('404s on a night with no file, page and JSON', async () => {
    const page = await app.request('/digest/2026-01-01');
    expect(page.status).toBe(404);
    expect(await page.text()).toContain('no run log for this night');
    const api = await app.request('/api/digest/2026-01-01');
    expect(api.status).toBe(404);
    expect(await api.json()).toEqual({ error: 'no such night', night: '2026-01-01' });
  });

  it('says nothing ran on an empty night, JSON has rows []', async () => {
    const page = await app.request('/digest/2026-10-21');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('nothing ran');
    const api = await app.request('/api/digest/2026-10-21');
    expect(api.status).toBe(200);
    const body = (await api.json()) as Json;
    expect(body.rows).toEqual([]);
    expect(body.badLines).toBe(0);
  });

  it('renders a night with a bad line, with the note, and JSON badLines 1', async () => {
    const page = await app.request('/digest/2026-10-22');
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain('1 line didn&#39;t parse');
    expect(html).toContain('zeta/job');
    const api = await app.request('/api/digest/2026-10-22');
    expect(api.status).toBe(200);
    expect(((await api.json()) as Json).badLines).toBe(1);
  });

  it('lists the same jobs in the same order on the page and in the JSON', async () => {
    const html = await (await app.request('/digest/2026-10-20')).text();
    const body = (await (await app.request('/api/digest/2026-10-20')).json()) as Json;
    const jobs = body.rows.map((r) => r.job);
    expect(jobs).toEqual(['alpha/job', 'mid/job', 'zeta/job']);
    const onPage = [...html.matchAll(/<td>([a-z]+\/job)<\/td>/g)].map((m) => m[1]);
    expect(onPage).toEqual(jobs);
  });
});
