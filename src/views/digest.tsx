import type { DigestRow, Night } from '../digest/types.js';

// Shared by the page and the JSON route (#3): the rows come from readNight, unchanged and in
// the order readNight gives them.
export const WARN_RETRIES = 3;

export function isWarnRow(row: DigestRow): boolean {
  return row.retries >= WARN_RETRIES || row.lastStatus === 'fail';
}

export function badLinesNote(n: number): string {
  return `${n} ${n === 1 ? "line didn't" : "lines didn't"} parse`;
}

export function DigestRows({ rows }: { rows: DigestRow[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>job</th>
          <th>owner</th>
          <th>runs</th>
          <th>retries</th>
          <th>last status</th>
          <th>last error</th>
          <th>first</th>
          <th>last</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr>
            <td>{r.job}</td>
            <td>{r.owner ?? '—'}</td>
            <td>{r.runs}</td>
            <td class={r.retries >= WARN_RETRIES ? 'warn' : undefined}>{r.retries}</td>
            <td class={r.lastStatus === 'fail' ? 'warn' : undefined}>{r.lastStatus}</td>
            <td>{r.lastError ?? '—'}</td>
            <td>{r.firstAt}</td>
            <td>{r.lastAt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DigestPage({ night }: { night: Night }) {
  return (
    <>
      <h1>digest · {night.night}</h1>
      {night.badLines > 0 ? <p class="warn">{badLinesNote(night.badLines)}</p> : null}
      {night.rows.length === 0 ? <p class="mute">nothing ran</p> : <DigestRows rows={night.rows} />}
    </>
  );
}

export function DigestNotFound({ night }: { night: string }) {
  return (
    <>
      <h1>digest · {night}</h1>
      <p class="mute">no run log for this night</p>
    </>
  );
}
