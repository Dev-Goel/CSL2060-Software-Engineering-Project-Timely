'use strict';
// Class 'Time Interval' to add interval and close interval.
class TimeInterval {
    constructor(day, url, intervals) {
        this.url = new Url(url);
        if (intervals != undefined)
            this.intervals = intervals;
        else this.intervals = [];
        this.day = day;
    }
    // A method to add interval.
    addInterval() {
        var date = new Date();
        var stringDate = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        this.intervals.push(stringDate + '-' + stringDate);
    }
    // A method to close interval.
    closeInterval() {
        var today = new Date();
        var stringDate = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
        var currentInterval = this.intervals[this.intervals.length - 1];
        if (currentInterval != undefined) {
            if (currentInterval.split('-')[0] == currentInterval.split('-')[1]) {
                this.intervals.pop();
                this.intervals.push(currentInterval.split('-')[0] + '-' + stringDate);
            }
        }
    }
};
