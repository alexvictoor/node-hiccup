import { Recorder, HistogramLogWriter } from "hdr-histogram-js";
import {
  Event,
  StartHiccupRecorderEvent,
  RecordHiccupEvent,
  StopHiccupRecorderEvent
} from "./api";

type Logger = (content: string) => void;

let resolutionMilliSec: number = 1; // value not used - makes TypeScript compiler happy
let reporter: any;
const recorder = new Recorder();
let histogram = recorder.getIntervalHistogram();
let logger: Logger;

const handleStart = (event: StartHiccupRecorderEvent) => {
  const writer = new HistogramLogWriter(content => logger(content));
  writer.outputLogFormatVersion();
  writer.outputComment("node-hiccup v1.0");
  writer.outputComment("Timestamp and interval length are in seconds");
  writer.outputComment("Hiccup measures are in milliseconds");
  writer.outputComment("Hiccup max are in milliseconds");
  //writer.outputLegend();
  logger(`"Tag","StartTimestamp","Interval_Length","Interval_Max","Interval_Compressed_Histogram"`);
  recorder.reset();
  resolutionMilliSec = event.resolutionMs;
  reporter = setInterval(() => {
    histogram = recorder.getIntervalHistogram(histogram);
    histogram.tag = event.tag;
    writer.outputIntervalHistogram(histogram, undefined, undefined, 1);
  }, event.reportingIntervalMs);
};

let shortestObservedDeltaTimeMilliSec = Number.MAX_SAFE_INTEGER;
const handleRecord = ({ deltaTimeMilliSec }: RecordHiccupEvent) => {
  if (deltaTimeMilliSec < shortestObservedDeltaTimeMilliSec) {
    shortestObservedDeltaTimeMilliSec = deltaTimeMilliSec;
  }
  const hiccupTimeMilliSec = Math.round(
    deltaTimeMilliSec - shortestObservedDeltaTimeMilliSec
  );
  recorder.recordValueWithExpectedInterval(
    hiccupTimeMilliSec,
    resolutionMilliSec
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