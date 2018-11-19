import { fork } from 'child_process';
import { HiccupRecorder } from './client';

const hiccupWorker = fork(`${__dirname}/start-worker.js`);

export default new HiccupRecorder(hiccupWorker);