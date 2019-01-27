# node-hiccup
NodeJS monitoring tool inspired by jHiccup from the Java landscape

Struggling with performance issues on your NodeJS application? node-hiccup might be handy!
node-hiccup is strongly inspired by [jHiccup](https://github.com/giltene/jHiccup) from the Java landscape. The goal of node-hiccup is to measure and report NodeJS event loop latency issues. Just like JHiccup, it generates logs files that can be used to generate graphs with the [HdrHistogram log analyzer](https://hdrhistogram.github.io/HdrHistogramJSDemo/logparser.html) 
*Note: node-hiccup measures are in micro seconds when displayed in the log analyzer UI*

## Under the cover 
Just like jHiccup, node-hiccup runs a loop and keeps track of the delay between two turns. If the delay is bigger than usual, the system, the JavaScript runtime, might have freeze. All the delay are stored in an histogram which is serialized at fixed interval in a log, leveraging on [HdrHistogram](https://github.com/HdrHistogram/HdrHistogramJS). Since HdrHistogram operations might increase the load of your application, all the costly treatments are done by a forked NodeJS process. Hence the overhead on the event loop running your code should be as low as possible. 

## Usage
First you need to include node-hiccup in your project:
```
  npm i -S node-hiccup
```
or if you prefer:
```
  yarn install node-hiccup
```

Then you just need 2 lines of code in the bootstrap of your application:
```
  import monitor from 'node-hiccup';

  monitor();
```

That's all folks!
After a few seconds you will see some logs with base64 strings as below:
```
#node-hiccup v1.0
#Timestamp and interval length are in seconds
#Hiccup measures are in micro seconds
#Hiccup max are in milliseconds
"StartTimestamp","Interval_Length","Interval_Max","Interval_Compressed_Histogram"
Tag=HICCUP,1546001922.480,30.001,6.078,HISTFAAAAU54nDWSwUrDQBCGN/9uCCGGEoqUUkMppZRSShEp4kGkeCiliBQR8SQePfoOvoGP6Nln0G8mmmWWnX9m/pn9N2cfn/0QlEIIGRZD92Vh/OPfv39S60pLFTqq0lDP2FqaAC10rZ4a7fSV6TvDf9E7WKNckYK+FFgVVuLWknuliLB1SZxzhRQsuwBpvNAqgOmV/y1yCoCByImeOVLLKuFdWnErnTLOKHXxoc41hy1qncaONFqlPbc4aJqM0fpU7COqajIu8W85LWhz1JbYVtYyp3KAF3UDY64xDKVWxDac+1RP7DI2cEtTH/JJr7qH2XIi4J0FSoADtpczFnBeYI/YrgOj3hjBb1eieoDwwUUOmjHNDHxjOp7Kp6rtYPqtGGxuChTJVAUeShVK9AADqFG32JT2Ax/EH6c2wcidpjU/ArVKFU/hDZgil4tZ6heLoCJz
Tag=CONTROL_IDLE,1546001922.478,30.001,6.162,HISTFAAAAVB4nDWQzUoDQRCEZ2pnsyzDsIQlLmENIQSREMSDBJEgHkIQEU8iHn0Gjx5FQTz7FD6C+GSe9JsO7s8w3dVV3V37rx+tc/7HcfAXbvd4N/215z/eW8qFTpWupWNdKqlX1D33Qo1WdjqRLHXAeSYdqeYyVBcKXYG3OiT35XWesUdN9eZ1ozuAxB/RdrAdb5iSQi+UJIVOaWCtpWJAJndRhybfXCMVIZJryOZzKLRrYyVpAXUOOVeWAAtwBzlqDIxEAthCtChRk99GJzZVpwt2adHo8yhLVCsbtWTwb69bPaFDNLY1XJ4ob6BQESa6Ra0pLwzMU9I+V9eiA8wNLd69Pj1ttpQ9ez3AwtceygRn19w2IBFmg2EdC4+JO3ROFTZ5fwodyexfGSZAxqg1M0P60HBDoLDBXWiB8nYjszUMGPfF483K2s5YMw3w3iz/A6e9I68=
```

**HICCUP** tagged lines contains latencies of your application event loop. These latencies are recorded by a forked NodeJS process that listens events comming from your application.  
**CONTROL_IDLE** tagged lines contains latencies of another forked NodeJS process, doing nothing but recording latencies of its own event loop. These latencies can be used as a reference. If there is a performance issue related to the host running your application, the OS, you might see it thanks to these measures.

## Advanced usage
You can specify a bunch of optional parameter to customise the way node-hiccup monitor the event loop. Below a code fragment illustrating what are those parameters along with default values:
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
    
    idleController: true,         // enable an extra event loop to measure idle workload
    
    idleTag: "CONTROL_IDLE",      // tag used in the logs for idle workload measures
  });


```

These logs use the same format as jHiccup. You need a tool such as the [HdrHistogram log analyzer](https://hdrhistogram.github.io/HdrHistogramJSDemo/logparser.html) to understand them.
 

