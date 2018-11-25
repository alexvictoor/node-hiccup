import { Recorder, HistogramLogWriter } from "hdr-histogram-js";
import {
  Event,
  StartHiccupRecorderEvent,
  StopHiccupRecorderEvent
} from "./api";

type Logger = (content: string) => void;

let resolutionMicroSec: number = 1; // value not used - makes TypeScript compiler happy
let reporter: any;
let controlIdleTimer: any;
const controlIdleRecorder = new Recorder();
let controlIdleHistogram = controlIdleRecorder.getIntervalHistogram();
let logger: Logger;

let shortestObservedDeltaTimeMicroSec = Number.MAX_SAFE_INTEGER;
const recordIdleTime = (deltaTimeMicroSec: number) => {
  if (deltaTimeMicroSec < shortestObservedDeltaTimeMicroSec) {
    shortestObservedDeltaTimeMicroSec = deltaTimeMicroSec;
  }
  const idleTimeMicroSec = Math.round(
    deltaTimeMicroSec - shortestObservedDeltaTimeMicroSec
  );
  controlIdleRecorder.recordValueWithExpectedInterval(
    idleTimeMicroSec,
    resolutionMicroSec
  );
};

const handleStart = (event: StartHiccupRecorderEvent) => {
  const writer = new HistogramLogWriter(content => logger(content));
  controlIdleRecorder.reset();
  resolutionMicroSec = event.resolutionMs * 1000;
  reporter = setInterval(() => {
    controlIdleHistogram = controlIdleRecorder.getIntervalHistogram(controlIdleHistogram);
    controlIdleHistogram.tag = 'CONTROL_IDLE';
    writer.outputIntervalHistogram(controlIdleHistogram);
  }, event.reportingIntervalMs);
  
  let timeBeforeMeasurement = process.hrtime();
  controlIdleTimer = setInterval(() => {
    const delta = process.hrtime(timeBeforeMeasurement);
    const deltaTimeMicroSec = Math.floor(delta[0] * 1e6 + delta[1] / 1e3);
    recordIdleTime(deltaTimeMicroSec);
    timeBeforeMeasurement = process.hrtime();
  }, event.resolutionMs);
};

const handleStop = (event: StopHiccupRecorderEvent) => {
  clearInterval(controlIdleTimer);
  clearInterval(reporter);
};

export function configureAndStartIdleController(customLogger: (content: string) => void = console.log) {
    logger = customLogger;
    process.on('message', (event: Event) => {
      switch (event.type) {
        case "start":
          handleStart(event);
          break;
        case "record":
          // event ignored by the idle controller
          break;
        case "stop":
          handleStop(event);
          break;
        default:
          const error: never = event;
      }
    });
}