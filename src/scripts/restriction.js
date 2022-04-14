'use strict';
// Made 'Restriction' class that generates objects of restriciton tab.
class Restriction {
    constructor(url, time) {
        this.url = new Url(url);
        this.time = convertTimeToSummaryTime(time);
    }
};
// Made 'Notification' class that generates objects of notification tab.
class Notification{
    constructor(url, time) {
        this.url = new Url(url);
        this.time = convertTimeToSummaryTime(time);
    }
};
