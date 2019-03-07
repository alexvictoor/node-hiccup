#!/usr/bin/env node
import { isAbsolute, sep } from 'path';
import monitor from './index';

const scriptParam = process.argv[2];
console.log(`Starting to instrument with node-hiccup script ${scriptParam}`);
let appPath;
if (isAbsolute(scriptParam)) {
    appPath = scriptParam;
} else {
    appPath = process.cwd() + sep + scriptParam;
}
try {
    require.resolve(appPath);
} catch (err) {
    console.error('Could not find javascript module', scriptParam);
    throw err;
}
monitor();
require(appPath);
