import { Recorder, HistogramLogWriter, AbstractHistogram } from "hdr-histogram-js";
import {
  EventFromClient,
  StartHiccupRecorderEvent,
  RecordHiccupEvent,
  StopHiccupRecorderEvent,
  HiccupStatisticsEvent,
} from "./api";

type Logger = (content: string) => void;

let resolutionMilliSec: number = 1; // value not used - makes TypeScript compiler happy
let reporter: any;
const recorder = new Recorder();
let logger: Logger;

const sendStatistics = (histogram: AbstractHistogram) => {
  if (process.send) { 
    const stats: HiccupStatisticsEvent = {
      type: 'statistics',
      statistics: {
        count: histogram.getTotalCount(),
        mean: histogram.getMean(),
        p90: histogram.getValueAtPercentile(90),
        p99: histogram.getValueAtPercentile(99),
        p99_9: histogram.getValueAtPercentile(99.9),
        max: histogram.maxValue,
      }
    };
    process.send(stats);
  }
}

const handleStart = (event: StartHiccupRecorderEvent) => {
  const writer = new HistogramLogWriter(content => logger(content));
  writer.outputLogFormatVersion();
  writer.outputComment("node-hiccup v1.0");
  writer.outputComment("To visualize those data go to https://hdrhistogram.github.io/HdrHistogramJSDemo/logparser.html");
  writer.outputComment("Timestamp and interval length are in seconds");
  writer.outputComment("Hiccup measures & interval max are in milliseconds");
  //writer.outputLegend();
  logger(`#"Tag","StartTimestamp","Interval_Length","Interval_Max","Interval_Compressed_Histogram"`);
  recorder.reset();
  resolutionMilliSec = event.resolutionMs;
  let histogram = recorder.getIntervalHistogram();
  reporter = setInterval(() => {
    histogram = recorder.getIntervalHistogram(histogram);
    sendStatistics(histogram);
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
    process.on('message', (event: EventFromClient) => {
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