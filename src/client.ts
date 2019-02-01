import {
    RecordHiccupEvent,
    StartHiccupRecorderEvent,
    StopHiccupRecorderEvent
  } from "./api";
import { ChildProcess } from "child_process";
  
  
export class HiccupRecorder {
  private recorderLoop: any;

  constructor(
    private worker: ChildProcess,
    private controlIdleWorker: ChildProcess | false,
    private tag = "HICCUP",
    private idleTag = "CONTROL_IDLE",
    private resolutionMs = 100,
    private reportingIntervalMs = 30000,
  ) {}

  start() {
    this.startWorker();
    this.startControlIdleWorker();
    this.startRecorderLoop();
  }

  private startWorker() {
    const startEvent: StartHiccupRecorderEvent = {
      type: "start",
      resolutionMs: this.resolutionMs,
      reportingIntervalMs: this.reportingIntervalMs,
      tag: this.tag
    };
    this.worker.send(startEvent);
  }

  private startControlIdleWorker() {
    if (!this.controlIdleWorker) {
      // no control idle needed
      return;
    }
    const startEvent: StartHiccupRecorderEvent = {
      type: "start",
      resolutionMs: this.resolutionMs,
      reportingIntervalMs: this.reportingIntervalMs,
      tag: this.idleTag
    };
    this.controlIdleWorker.send(startEvent);
  }

  private startRecorderLoop() {
    let timeBeforeMeasurement = process.hrtime();
    this.recorderLoop = setInterval(() => {
      const delta = process.hrtime(timeBeforeMeasurement);
      const recordEvent: RecordHiccupEvent = {
        type: "record",
        deltaTimeMicroSec: Math.floor(delta[0] * 1e6 + delta[1] / 1e3)
      };
      this.worker.send(recordEvent);
      timeBeforeMeasurement = process.hrtime();
    }, this.resolutionMs);
  }
  
  stop() {
    clearInterval(this.recorderLoop);
    const stopEvent: StopHiccupRecorderEvent = {
      type: "stop"
    };
    this.worker.send(stopEvent);
    if (this.controlIdleWorker) {
      this.controlIdleWorker.send(stopEvent);
    }
  }
}
  