#!/usr/bin/env node
import monitor from './index';

const scriptParam = process.argv[2];
console.log(`Starting to instrument with node-hiccup script ${scriptParam}`);
try {
    require.resolve('./' + scriptParam);
} catch (err) {
    console.error(`Could not find javascript module ${scriptParam}`)
    throw err;
}
monitor();
require('./' + scriptParam);
