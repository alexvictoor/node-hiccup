export interface StartHiccupRecorderEvent {
  type: "start";
  resolutionMs: number;
  reportingIntervalMs: number;
  tag: string;
}

export interface RecordHiccupEvent {
  type: "record";
  deltaTimeMilliSec: number;
}

export interface StopHiccupRecorderEvent {
  type: "stop";
}

export interface HiccupStatisticsEvent {
  type: "statistics";
  statistics: HiccupStatistics,
}

export interface HiccupStatistics {
  count: number,
  mean: number,
  p90: number,
  p99: number,
  p99_9: number,
  max: number,
}

export type EventFromClient =
  | StartHiccupRecorderEvent
  | RecordHiccupEvent
  | StopHiccupRecorderEvent;

export type EventFromWorker = HiccupStatisticsEvent;
