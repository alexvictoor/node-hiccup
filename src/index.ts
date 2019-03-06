import { fork } from 'child_process';
import { HiccupClient } from './client';

const hiccupWorker = () => fork(`${__dirname}/start-worker.js`);
const controlIdleWorker = () => fork(`${__dirname}/start-idle-controller.js`);

interface Configuration {
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

const defaultConfiguration: Configuration = {
    resolutionMs: 1,
    reportingIntervalMs: 5000,
    tag: "HICCUP",
    enableIdleController: false,
    idleTag: "CONTROL_IDLE",
}

const buildClient = (config: Partial<Configuration>) => {
    const completeConfig: Configuration = {
        ...defaultConfiguration,
        ...config,
    };
    return new HiccupClient(
        hiccupWorker(), 
        completeConfig.enableIdleController && controlIdleWorker(), 
        completeConfig.tag,
        completeConfig.idleTag,
        completeConfig.resolutionMs,
        completeConfig.reportingIntervalMs
    );
};

const monitor = (config: Partial<Configuration> = defaultConfiguration) => {
    const client = buildClient(config);
    client.start();
    return client;
}

export default monitor;