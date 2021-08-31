var MODULE_ID = 'about-face';
/**
 * Logging
 * @module Logging
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["ALL"] = 4] = "ALL";
})(LogLevel || (LogLevel = {}));
/**
 * Simple wrapper around console.log to give us log level functionality.
 * @function
 * @param {LogLevel} messageLevel - ERROR,INFO,DEBUG,WARN,ALL
 * @param {...any} args - console.log() arguments
 */
export function log(messageLevel, ...args) {
    if (messageLevel > CONFIG[MODULE_ID].logLevel)
        return;
    if (messageLevel === LogLevel.ERROR)
        console.error(MODULE_ID + ' | ', ...args);
    else if (messageLevel === LogLevel.WARN) 
        console.warn(MODULE_ID + ' | ', ...args);
    else
        console.log(MODULE_ID + ' | ', ...args);
}
