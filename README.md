# node-hiccup
NodeJS monitoring tool inspired by jHiccup from the Java landscape

Struggling with performance issues on your NodeJS application? node-hiccup might be handy!
node-hiccup is strongly inspired by [jHiccup](https://github.com/giltene/jHiccup) from the Java landscape. The goal of node-hiccup is to measure NodeJS event loop latency issues. Just like JHiccup, it generates logs files that can be used to generate graphs with the [HdrHistogram log analyzer](https://hdrhistogram.github.io/HdrHistogramJSDemo/logparser.html) 
*Note: node-hiccup measures are in milli seconds when displayed in the log analyzer UI*

## Under the cover 
Just like jHiccup, node-hiccup runs a loop and keeps track of the delay between two turns. If the delay is bigger than usual, the system, the JavaScript runtime, might have freezed. All the delay are stored in an histogram which is serialized at fixed interval in a log, leveraging on [HdrHistogram](https://github.com/HdrHistogram/HdrHistogramJS). Since HdrHistogram operations might increase the load of your application, all the costly treatments are done by a forked NodeJS process. Hence the overhead on the event loop running your code should be as low as possible. 

## Usage

You can use node-hiccup without touching any line of code. This can be done leveraging on npx. The only thing you need to do is to replace 'node' by 'npx node-hiccup' in the command line used to bootstrap your application:

```
  npx node-hiccup server.js  // assuming that server.js is the bootstrap script for your app

```

...and that's it! Your app is instrumented with node-hiccup.  After a few seconds you will see some logs coming.
In some cases you may need to have more control on how your application is launched. 
If you are in this situation, you need to include node-hiccup in your project:
```
  npm i -S node-hiccup
```
or if you prefer yarn:
```
  yarn install node-hiccup
```

Then you just need 2 lines of code in the bootstrap of your application:
```
  import monitor from 'node-hiccup';

  const hiccup = monitor();
  ...

```

That's all folks!  

The hiccup object returned by the *monitor()* method call provides 2 methods:
- *stop()* stop the instrumentation of the event loop, if you want to implement a gracefull shutdown.
- *getLastIntervalStatistics()* provides useful live statistics on the event loop latency from latest measures (i.e. an object that looks like that { count: 4200, mean: 123, p90: 200, p99: 250, p99_9: 290, max: 297 })  

There are some shortcomings with live statistics. The main one is that you will not be able to retrieve these statistics when you need them the most, when your application event loop is very busy or even completely stucked.  
These shortcomings can be avoided by using logs. node-hiccup worker process generates logs containing all hiccup measures serialized in base64 strings:
```
#node-hiccup v1.0
#Timestamp and interval length are in seconds
#Hiccup measures are in micro seconds
#Hiccup max are in milliseconds
"StartTimestamp","Interval_Length","Interval_Max","Interval_Compressed_Histogram"
Tag=HICCUP,1546001922.480,30.001,6.078,HISTFAAAAU54nDWSwUrDQBCGN/9uCCGGEoqUUkMppZRSShEp4kGkeCiliBQR8SQePfoOvoGP6Nln0G8mmmWWnX9m/pn9N2cfn/0QlEIIGRZD92Vh/OPfv39S60pLFTqq0lDP2FqaAC10rZ4a7fSV6TvDf9E7WKNckYK+FFgVVuLWknuliLB1SZxzhRQsuwBpvNAqgOmV/y1yCoCByImeOVLLKuFdWnErnTLOKHXxoc41hy1qncaONFqlPbc4aJqM0fpU7COqajIu8W85LWhz1JbYVtYyp3KAF3UDY64xDKVWxDac+1RP7DI2cEtTH/JJr7qH2XIi4J0FSoADtpczFnBeYI/YrgOj3hjBb1eieoDwwUUOmjHNDHxjOp7Kp6rtYPqtGGxuChTJVAUeShVK9AADqFG32JT2Ax/EH6c2wcidpjU/ArVKFU/hDZgil4tZ6heLoCJz
Tag=HICCUP,1546001922.478,30.001,6.162,HISTFAAAAVB4...
```

The purpose of those logs is to allow a deep analysis afterwards of what is happening in your application using [HdrHistogram log analyzer](https://hdrhistogram.github.io/HdrHistogramJSDemo/logparser.html). 


## Advanced usage
In the above example, node-hiccup was started with the monitor() function, with default parameters. You can customise the way node-hiccup monitor the event loop, passing as a parameter a configuration object. Below a code fragment illustrating what can be configured along with default values:
```

  import monitor from 'node-hiccup';
  const monitor = monitor({
    resolutionMs: 100,            // sampling resolution in milliseconds
                                  // here each 100ms a timer checks that 100ms,
                                  // and only 100ms, have actually elapsed
    
    reportingIntervalMs: 30000,   // reporting interval
                                  // here each 30s a base64 encoded histogram
                                  // of hiccup latencies is written in the
                                  // standard output
    
    tag: "HICCUP",                // tag used in the logs for hiccup measures
    
    idleController: false,        // when set to true enable a forked process 
                                  // to measure idle workload.
    
    idleTag: "CONTROL_IDLE",      // tag used in the logs for idle workload measures
                                  // (used only when idleController=true)
  });


```

These logs use the same format as jHiccup. You need a tool such as the [HdrHistogram log analyzer](https://hdrhistogram.github.io/HdrHistogramJSDemo/logparser.html) to understand them.
 


**HICCUP** tagged lines contains latencies of your application event loop. These latencies are recorded by a forked NodeJS process that listens events comming from your application.  
**CONTROL_IDLE** tagged lines contains latencies of another forked NodeJS process, doing nothing but recording latencies of its own event loop. These latencies can be used as a reference. If there is a performance issue related to the host running your application, the OS, you might see it thanks to these measures.

