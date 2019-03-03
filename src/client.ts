import {
    RecordHiccupEvent,
    StartHiccupRecorderEvent,
    StopHiccupRecorderEvent,
    HiccupStatistics,
    EventFromWorker
  } from "./api";
import { ChildProcess } from "child_process";
  
  
export class HiccupClient {
  private recorderLoop: any;
  private lastHiccupStatistics: HiccupStatistics;

  constructor(
    private worker: ChildProcess,
    private controlIdleWorker: ChildProcess | false,
    private tag = "HICCUP",
    private idleTag = "CONTROL_IDLE",
    private resolutionMs = 100,
    private reportingIntervalMs = 30000,
  ) {
    this.lastHiccupStatistics = {
      count: NaN,
      mean: NaN,
      p90: NaN,
      p99: NaN,
      p99_9: NaN,
      max: NaN,
    }
  }

  start() {
    this.startWorker();
    this.startControlIdleWorker();
    this.startRecorderLoop();
  }

  getLastHiccupStatistics(): HiccupStatistics {
    return this.lastHiccupStatistics;
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
        deltaTimeMilliSec: Math.floor(delta[0] * 1e3 + delta[1] / 1e6)
      };
      this.worker.send(recordEvent);
      timeBeforeMeasurement = process.hrtime();
    }, this.resolutionMs);

    this.worker.on('message', (event: EventFromWorker) => {
      if (event.type === "statistics") {
          this.lastHiccupStatistics = event.statistics;
      }
    });
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
  