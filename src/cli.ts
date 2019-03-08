#!/usr/bin/env node
import { isAbsolute, sep } from 'path';
import monitor from './index';

const scriptParam = process.argv[2];
console.log(`
 _   _           _        _   _ _                      
| \\ | |         | |      | | | (_)                     
|  \\| | ___   __| | ___  | |_| |_  ___ ___ _   _ _ __  
| . \` |/ _ \\ / _\` |/ _ \\ |  _  | |/ __/ __| | | | '_ \\ 
| |\\  | (_) | (_| |  __/ | | | | | (_| (__| |_| | |_) |
\\_| \\_/\\___/ \\__,_|\\___| \\_| |_/_|\\___\\___|\\__,_| .__/ 
                                                | |    
                                                |_|    

`);

if (!scriptParam) {
    console.log('Usage: npx node-hiccup YOUR_NODE_APPLICATION.js');
    console.log('');
    console.log('For more details on node-hiccup please checkout the doc on github');
    console.log('https://github.com/alexvictoor/node-hiccup');
    console.log('');
    
} else {
    console.log(`Starting to instrument with node-hiccup script ${scriptParam}`);
    let appPath;
    if (isAbsolute(scriptParam)) {
        appPath = scriptParam;
    } else {
        appPath = process.cwd() + sep + scriptParam;
    }
    let appFound = false;
    try {
        require.resolve(appPath);
        appFound = true;
    } catch (err) {
        console.error('Could not find javascript module', scriptParam);
    }
    if (appFound) {
        monitor();
        require(appPath);
    }
}


