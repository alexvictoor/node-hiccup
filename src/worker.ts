import { Recorder, HistogramLogWriter } from "hdr-histogram-js";
import {
  EventFromClient,
  StartHiccupRecorderEvent,
  RecordHiccupEvent,
  StopHiccupRecorderEvent,
  HiccupStatisticsEvent
} from "./api";
import Histogram from "hdr-histogram-js/dist/Histogram";

type Logger = (content: string) => void;

export function configureAndStartWorker(
  customLogger: (content: string) => void = console.log
) {
  let resolutionMilliSec: number = 1; // value not used - makes TypeScript compiler happy
  let reporter: any;
  const recorder = new Recorder({ useWebAssembly: true });
  let logger: Logger;
  let recordLatency = recorder.recordValueWithExpectedInterval.bind(recorder);

  const sendStatistics = (histogram: Histogram) => {
    if (process.send) {
      const stats: HiccupStatisticsEvent = {
        type: "statistics",
        statistics: {
          count: histogram.totalCount,
          mean: histogram.mean,
          p90: histogram.getValueAtPercentile(90),
          p99: histogram.getValueAtPercentile(99),
          p99_9: histogram.getValueAtPercentile(99.9),
          max: histogram.maxValue
        }
      };
      process.send(stats);
    }
  };

  const handleStart = (event: StartHiccupRecorderEvent) => {
    const writer = new HistogramLogWriter(content => logger(content));
    writer.outputLogFormatVersion();
    writer.outputComment("node-hiccup v1.0");
    writer.outputComment(
      "To visualize those data go to https://hdrhistogram.github.io/HdrHistogramJSDemo/logparser.html"
    );
    writer.outputComment("Timestamp and interval length are in seconds");
    writer.outputComment("Hiccup measures & interval max are in milliseconds");
    //writer.outputLegend();
    logger(
      `#"Tag","StartTimestamp","Interval_Length","Interval_Max","Interval_Compressed_Histogram"`
    );
    recorder.reset();

    recordLatency = event.correctForCoordinatedOmissions
      ? recorder.recordValueWithExpectedInterval.bind(recorder)
      : recorder.recordValue.bind(recorder);

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
    recordLatency(hiccupTimeMilliSec, resolutionMilliSec);
  };

  const handleStop = (event: StopHiccupRecorderEvent) => {
    clearInterval(reporter);
  };

  logger = customLogger;
  process.on("message", (event: EventFromClient) => {
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
