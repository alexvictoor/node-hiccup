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
      public writer = (line: string) => console.log(line),
      private resolutionMs = 100,
      private reportingIntervalMs = 60000
    ) {}
  
    start() {
      const startEvent: StartHiccupRecorderEvent = {
        type: "start",
        resolutionMs: this.resolutionMs,
        reportingIntervalMs: this.reportingIntervalMs
      };

      this.worker.send(startEvent);
      let timeBeforeMeasurement = process.hrtime();
      this.recorderLoop = setInterval(() => {
        const delta = process.hrtime(timeBeforeMeasurement);
        const recordEvent: RecordHiccupEvent = {
          type: "record",
          deltaTimeNanoSec: (delta[0] * 1e9 + delta[1])
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
    }
  }
  