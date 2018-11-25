import { fork } from 'child_process';
import { HiccupRecorder } from './client';

const hiccupWorker = fork(`${__dirname}/start-worker.js`);
const controlIdleWorker = fork(`${__dirname}/start-idle-controller.js`);

export default new HiccupRecorder(hiccupWorker, controlIdleWorker);