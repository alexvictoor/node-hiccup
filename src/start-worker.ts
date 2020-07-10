import { configureAndStartWorker } from "./worker";
import { initWebAssembly } from "hdr-histogram-js";

initWebAssembly().then(() => configureAndStartWorker());
