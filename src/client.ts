import {
    Event,
    RecordHiccupEvent,
    StartHiccupRecorderEvent,
    StopHiccupRecorderEvent
  } from "./api";
import { ChildProcess } from "child_process";
  
  
export class HiccupRecorder {
    private recorderLoop: any;
  
    constructor(
      private worker: ChildProcess,
      private controlIdleWorker: ChildProcess,
      private tag = "HICCUP",
      private resolutionMs = 50,
      private reportingIntervalMs = 60000,
    ) {}
  
    start() {
      const startEvent: StartHiccupRecorderEvent = {
        type: "start",
        resolutionMs: this.resolutionMs,
        reportingIntervalMs: this.reportingIntervalMs,
        tag: this.tag
      };

      this.worker.send(startEvent);
      this.controlIdleWorker.send(startEvent);
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
      this.controlIdleWorker.send(stopEvent);
    }
  }
  