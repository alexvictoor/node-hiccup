import { fork } from 'child_process';
import { HiccupRecorder } from './client';

const hiccupWorker = () => fork(`${__dirname}/start-worker.js`);
const controlIdleWorker = () => fork(`${__dirname}/start-idle-controller.js`);

interface BuildRecorderParams {
    resolutionMs: number,
    reportingIntervalMs: number,
    tag: string,
    enableIdleController: true,
    idleTag: string,
}

const defaultBuildRecorderParams: BuildRecorderParams = {
    resolutionMs: 100,
    reportingIntervalMs: 30000,
    tag: "HICCUP",
    enableIdleController: true,
    idleTag: "CONTROL_IDLE",
}

const buildRecorder = (params: Partial<BuildRecorderParams>) => {
    const completeParams: BuildRecorderParams = {
        ...defaultBuildRecorderParams,
        ...params,
    };
    return new HiccupRecorder(
        hiccupWorker(), 
        completeParams.enableIdleController && controlIdleWorker(), 
        completeParams.tag,
        completeParams.idleTag,
        completeParams.resolutionMs,
        completeParams.reportingIntervalMs
    );
};

const monitor = (params: Partial<BuildRecorderParams>) => {
    const recorder = buildRecorder(params);
    recorder.start();
    return recorder;
}

export default monitor;