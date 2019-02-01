import { readFileSync } from 'fs';
import monitor from './index';

console.log(`Starting to instrument with node-hiccup script ${process.argv[2]}`);
const script = readFileSync(process.argv[2],'utf8');
monitor();
eval(script);