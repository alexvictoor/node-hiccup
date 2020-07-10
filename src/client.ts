import { ChildProcess } from "child_process";
import {
  RecordHiccupEvent,
  StartHiccupRecorderEvent,
  StopHiccupRecorderEvent,
  HiccupStatistics,
  EventFromWorker
} from "./api";
import schedule from "./scheduler";

export class HiccupClient {
  private recorderLoop: any;
  private lastHiccupStatistics: HiccupStatistics;
  private running: boolean;

  constructor(
    private worker: ChildProcess,
    private controlIdleWorker: ChildProcess | false,
    private tag = "HICCUP",
    private idleTag = "CONTROL_IDLE",
    private resolutionMs = 100,
    private reportingIntervalMs = 30000,
    private correctForCoordinatedOmissions = true
  ) {
    this.lastHiccupStatistics = {
      count: NaN,
      mean: NaN,
      p90: NaN,
      p99: NaN,
      p99_9: NaN,
      max: NaN
    };
    this.running = false;
  }

  start() {
    this.startWorker();
    this.startControlIdleWorker();
    this.startRecorderLoop();
  }

  getLastIntervalStatistics(): HiccupStatistics {
    return this.lastHiccupStatistics;
  }

  private startWorker() {
    const startEvent: StartHiccupRecorderEvent = {
      type: "start",
      resolutionMs: this.resolutionMs,
      reportingIntervalMs: this.reportingIntervalMs,
      tag: this.tag,
      correctForCoordinatedOmissions: this.correctForCoordinatedOmissions
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
      tag: this.idleTag,
      correctForCoordinatedOmissions: this.correctForCoordinatedOmissions
    };
    this.controlIdleWorker.send(startEvent);
  }

  private startRecorderLoop() {
    let timeBeforeMeasure = process.hrtime();
    this.running = true;
    const loop = () => {
      const delta = process.hrtime(timeBeforeMeasure);
      const recordEvent: RecordHiccupEvent = {
        type: "record",
        deltaTimeMilliSec: Math.floor(delta[0] * 1e3 + delta[1] / 1e6)
      };
      this.worker.send(recordEvent);
      timeBeforeMeasure = process.hrtime();
      if (this.running) {
        schedule(loop, this.resolutionMs);
      }
    };
    schedule(loop, this.resolutionMs);

    this.worker.on("message", (event: EventFromWorker) => {
      if (event.type === "statistics") {
        this.lastHiccupStatistics = event.statistics;
      }
    });
  }

  stop() {
    this.running = false;
    const stopEvent: StopHiccupRecorderEvent = {
      type: "stop"
    };
    this.worker.send(stopEvent);
    if (this.controlIdleWorker) {
      this.controlIdleWorker.send(stopEvent);
    }
  }
}
