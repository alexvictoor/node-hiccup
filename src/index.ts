import { fork } from 'child_process';
import { HiccupClient } from './client';

const hiccupWorker = () => fork(`${__dirname}/start-worker.js`);
const controlIdleWorker = () => fork(`${__dirname}/start-idle-controller.js`);

interface BuildClientParams {
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

const defaultBuildClientParams: BuildClientParams = {
    resolutionMs: 100,
    reportingIntervalMs: 30000,
    tag: "HICCUP",
    enableIdleController: false,
    idleTag: "CONTROL_IDLE",
}

const buildClient = (params: Partial<BuildClientParams>) => {
    const completeParams: BuildClientParams = {
        ...defaultBuildClientParams,
        ...params,
    };
    return new HiccupClient(
        hiccupWorker(), 
        completeParams.enableIdleController && controlIdleWorker(), 
        completeParams.tag,
        completeParams.idleTag,
        completeParams.resolutionMs,
        completeParams.reportingIntervalMs
    );
};

const monitor = (params: Partial<BuildClientParams> = defaultBuildClientParams) => {
    const client = buildClient(params);
    client.start();
    return client;
}

export default monitor;