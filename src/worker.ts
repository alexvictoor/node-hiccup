import { Recorder, HistogramLogWriter } from "hdr-histogram-js";
import {
  Event,
  RecordHiccupEvent,
  StartHiccupRecorderEvent,
  StopHiccupRecorderEvent
} from "./api";

type Logger = (content: string) => void;

let resolutionNanoSec: number;
let reporter: any;
const recorder = new Recorder();
let histogram = recorder.getIntervalHistogram();
let logger: Logger;

const handleStart = (event: StartHiccupRecorderEvent) => {
  const writer = new HistogramLogWriter(content => logger(content));
  writer.outputLogFormatVersion();
  writer.outputComment("node-hiccup v1.0");
  writer.outputComment("Timestamp and interval length are in seconds");
  writer.outputComment("Hiccup measures, including max, are in nano seconds");
  writer.outputLegend();
  recorder.reset();
  resolutionNanoSec = event.resolutionMs * 1000 * 1000;
  reporter = setInterval(() => {
    histogram = recorder.getIntervalHistogram(histogram);
    histogram.tag = event.tag;
    writer.outputIntervalHistogram(histogram);
  }, event.reportingIntervalMs);
};

let shortestObservedDeltaTimeNanoSec = Number.MAX_SAFE_INTEGER;
const handleRecord = ({ deltaTimeNanoSec }: RecordHiccupEvent) => {
  if (deltaTimeNanoSec < shortestObservedDeltaTimeNanoSec) {
    shortestObservedDeltaTimeNanoSec = deltaTimeNanoSec;
  }
  const hiccupTimeNanoSec = Math.round(
    deltaTimeNanoSec - shortestObservedDeltaTimeNanoSec
  );
  recorder.recordValueWithExpectedInterval(
    hiccupTimeNanoSec,
    resolutionNanoSec
  );
};

const handleStop = (event: StopHiccupRecorderEvent) => {
  clearInterval(reporter);
};

export function configureAndStartWorker(customLogger: (content: string) => void = console.log) {
    logger = customLogger;
    process.on('message', (event: Event) => {
      switch (event.type) {
        case "start":
          handleStart(event);
          break;
        case "record":
          handleRecord(event);
          break;
        case "stop":
          handleStop(event);
          break;
        default:
          const error: never = event;
      }
    });
}