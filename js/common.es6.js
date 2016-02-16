/**
 * @param {object} obj
 * @param {function} keyFormatter
 * @param {function} valueFormatter
 * @returns {Map}
 */
function convertObjectToMap(obj, keyFormatter, valueFormatter) {
    'use strict';
    var noFormatter = function (v) { return v; };
    keyFormatter = keyFormatter || noFormatter;
    valueFormatter = valueFormatter || noFormatter;

    var result = new Map();

    jQuery.each(obj, function(key, value) {
        result.set(
            keyFormatter(key),
            valueFormatter(value)
        );
    });

    return result;
}

/**
 * @param {Map} dataMap Map of pairs time:count.
 * @param {Array} binsThresholds Sorted array of bins boundaries from lowest value
 *     up to greatest (length + 1 values).
 * @returns {Map} Map of time: count.
 */
function calcHistogram(dataMap, binsThresholds) {
    'use strict';
    var from, to, current, result = new Map();

    for (var i = 0; i <= binsThresholds.length - 2; i++) {
        result.set(binsThresholds[i], 0);
    }

    for (var time of dataMap.keys()) {
        for (var i = 0; i <= binsThresholds.length - 2; i++) {
            from = binsThresholds[i];

            // If it's last bin, ignore right boundary.
            to = (i < binsThresholds.length - 2 ? binsThresholds[i + 1] : null);

            if (time >= from && (to == null || time < to)) {
                current = result.get(from) || 0;
                result.set(from, current + dataMap.get(time));
            }
        }
    }

    return result;
}
