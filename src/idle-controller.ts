import { Recorder, HistogramLogWriter } from "hdr-histogram-js";
import {
  EventFromClient,
  StartHiccupRecorderEvent,
  StopHiccupRecorderEvent
} from "./api";

type Logger = (content: string) => void;

let resolutionMilliSec: number = 1; // value not used - makes TypeScript compiler happy
let reporter: any;
let controlIdleTimer: any;
const controlIdleRecorder = new Recorder();
let controlIdleHistogram = controlIdleRecorder.getIntervalHistogram();
let logger: Logger;

let shortestObservedDeltaTimeMilliSec = Number.MAX_SAFE_INTEGER;
const recordIdleTime = (deltaTimeMilliSec: number) => {
  if (deltaTimeMilliSec < shortestObservedDeltaTimeMilliSec) {
    shortestObservedDeltaTimeMilliSec = deltaTimeMilliSec;
  }
  const idleTimeMilliSec = Math.round(
    deltaTimeMilliSec - shortestObservedDeltaTimeMilliSec
  );
  controlIdleRecorder.recordValueWithExpectedInterval(
    idleTimeMilliSec,
    resolutionMilliSec
  );
};

const handleStart = (event: StartHiccupRecorderEvent) => {
  const writer = new HistogramLogWriter(content => logger(content));
  controlIdleRecorder.reset();
  resolutionMilliSec = event.resolutionMs * 1000;
  reporter = setInterval(() => {
    controlIdleHistogram = controlIdleRecorder.getIntervalHistogram(controlIdleHistogram);
    controlIdleHistogram.tag = 'CONTROL_IDLE';
    writer.outputIntervalHistogram(controlIdleHistogram, undefined, undefined, 1);
  }, event.reportingIntervalMs);
  
  let timeBeforeMeasurement = process.hrtime();
  controlIdleTimer = setInterval(() => {
    const delta = process.hrtime(timeBeforeMeasurement);
    const deltaTimeMilliSec = Math.floor(delta[0] * 1e3 + delta[1] / 1e6);
    recordIdleTime(deltaTimeMilliSec);
    timeBeforeMeasurement = process.hrtime();
  }, event.resolutionMs);
};

const handleStop = (event: StopHiccupRecorderEvent) => {
  clearInterval(controlIdleTimer);
  clearInterval(reporter);
};

export function configureAndStartIdleController(customLogger: (content: string) => void = console.log) {
    logger = customLogger;
    process.on('message', (event: EventFromClient) => {
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