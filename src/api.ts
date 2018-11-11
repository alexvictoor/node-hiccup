export interface StartHiccupRecorderEvent {
  type: "start";
  resolutionMs: number;
  reportingIntervalMs: number;
}

export interface RecordHiccupEvent {
  type: "record";
  deltaTimeNanoSec: number;
}

export interface StopHiccupRecorderEvent {
  type: "stop";
}

export type Event =
  | StartHiccupRecorderEvent
  | RecordHiccupEvent
  | StopHiccupRecorderEvent;
