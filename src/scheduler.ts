//
// accurate scheduler inspired from https://timetocode.tumblr.com/post/71512510386/an-accurate-nodejs-game-loop-inbetween-settimeout
//

export default (fn: () => void, timeoutInMs: number) => {
    const start = process.hrtime();
    const loop = () => {
        const timeElapsed = process.hrtime(start);
        const timeElapsedInMs = timeElapsed[0] * 1e3 + timeElapsed[1] / 1e6
        const timeLeftInMs = timeoutInMs - timeElapsedInMs;
        if (timeLeftInMs <= 0) {
            fn();
        } else {
            if (timeLeftInMs > 30000) {
                setTimeout(loop);
            } else {
                setImmediate(loop);
            }
        }
    }
}