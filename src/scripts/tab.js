'use strict';
// Class 'Tab' to store favicon of tab, increase summary time & counter, get today time.
class Tab {
    constructor(url, favicon, days, summary, counter) {
        this.url = new Url(url);
        this.favicon = favicon;
        if (summary !== undefined)
            this.summaryTime = summary;
        else
            this.summaryTime = 0;
        if (counter !== undefined)
            this.counter = counter;
        else
            this.counter = 0;
        if (days !== undefined)
            this.days = days;
        else
            this.days = [];
    }
    // A method to increase summary time of tab.
    incSummaryTime() {
        this.summaryTime += 1;
        var day = this.days.find(x => x.date == todayLocalDate());
        if (day === undefined) {
            this.addNewDay(todayLocalDate());
        }
        else {
            day['summary'] += 1;
        }
    }
    // A method to get today time summary.
    getTodayTime(){
        return this.days.find(x => x.date == todayLocalDate()).summary;
    }
    // A method to increase counter.
    incCounter(){
        this.counter +=1;
        var day = this.days.find(x => x.date == todayLocalDate());
        if (day === undefined) {
            this.addNewDay(todayLocalDate());
        }
        else {
            day['counter'] += 1;
        }
    }
    // A method to update/add day.
    addNewDay(today) {
        this.days.push(
            {
                'date': today,
                'summary': 1,
                'counter': 1
            }
        );
    }
};
