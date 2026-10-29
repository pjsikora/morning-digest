// Plan morning-digest § 1. The contract every part of § 2 starts against.

export type RunStatus = 'ok' | 'retry' | 'fail';

// One row per job in a night's run log. Times keep the log's offset (styleguide).
export type DigestRow = {
  job: string;
  owner: string | null; // rendered as `—` when null
  runs: number; // lines for this job
  retries: number; // lines with status `retry`
  lastStatus: RunStatus;
  lastError: string | null; // error of the latest line that had one
  firstAt: string;
  lastAt: string;
};

export type Night = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[]; // sorted by job
  badLines: number; // lines that didn't parse; counted, never thrown
};

// Reads `<runsDir>/<night>.jsonl`. Returns null when the night has no file.
export type ReadNight = (runsDir: string, night: string) => Night | null;

// Lines per status across a night's file; lines that don't parse are not counted.
export type StatusCounts = Record<RunStatus, number>;
