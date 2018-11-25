export interface StartHiccupRecorderEvent {
  type: "start";
  resolutionMs: number;
  reportingIntervalMs: number;
  tag: string;
}

export interface RecordHiccupEvent {
  type: "record";
  deltaTimeMicroSec: number;
}

export interface StopHiccupRecorderEvent {
  type: "stop";
}

export type Event =
  | StartHiccupRecorderEvent
  | RecordHiccupEvent
  | StopHiccupRecorderEvent;
