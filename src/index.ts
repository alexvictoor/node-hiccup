import { fork } from 'child_process';
import { HiccupRecorder } from './client';

const hiccupWorker = () => fork(`${__dirname}/start-worker.js`);
const controlIdleWorker = () => fork(`${__dirname}/start-idle-controller.js`);

interface BuildRecorderParams {
    /** sampling resolution in milliseconds (default 100ms) */
    resolutionMs: number,
    /** reporting interval (default 30000m) */
    reportingIntervalMs: number,
    /** tag used in the logs for hiccup measures (default "HICCUP") */
    tag: string,
    /**  enable a forked process to measure idle workload (default false)*/
    enableIdleController: boolean,
    /** tag used in the logs for idle workload measures (default "CONTROL_IDLE") */
    idleTag: string,
}

const defaultBuildRecorderParams: BuildRecorderParams = {
    resolutionMs: 100,
    reportingIntervalMs: 30000,
    tag: "HICCUP",
    enableIdleController: false,
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

const monitor = (params: Partial<BuildRecorderParams> = defaultBuildRecorderParams) => {
    const recorder = buildRecorder(params);
    recorder.start();
    return recorder;
}

export default monitor;