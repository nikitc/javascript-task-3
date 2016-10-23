'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
var DAYS = {
    'ПН': 0,
    'ВТ': 1,
    'СР': 2,
    'ЧТ': 3,
    'ПТ': 4,
    'СБ': 5,
    'ВС': 6
};

var NUMBERS = {
    0: 'ПН',
    1: 'ВТ',
    2: 'СР'
};

function getTimeZone(time) {
    var regTimeZone = /\+\d+/g;

    return parseInt(time.match(regTimeZone)[0]);
}

function parseBankWork(time) {
    var regHours = /(\d\d):/;
    var regMinutes = /:(\d\d)/;
    var hours = parseInt(time.match(regHours)[1]);
    var minutes = parseInt(time.match(regMinutes)[1]);

    return hours * 60 + minutes;
}

function parseDay(day, hours, minutes, delta) {
    var convertTime = {};
    hours += delta;
    if (hours > 23) {
        day += 1;
        hours -= 24;
    }
    convertTime.day = day;
    convertTime.minutes = hours * 60 + minutes + day * 24 * 60;

    return convertTime;
}

function timeConversion(time, delta) {
    var regDay = /([А-Я]{2}) /;
    var regHours = /(\d\d):/;
    var regMinutes = /:(\d\d)/;
    var hours = parseInt(time.match(regHours)[0]);
    var day = DAYS[time.match(regDay)[1]];
    var minutes = parseInt(time.match(regMinutes)[1]);

    return parseDay(day, hours, minutes, delta);
}

function createTimeTable() {
    var timeTable = new Array(3 * 24 * 60);
    for (var index = 0; index < timeTable.length; index++) {
        timeTable[index] = 0;
    }

    return timeTable;
}


function getTableFriend(schedule, friend, timeZone) {
    var newSchedule = [];

    for (var index = 0; index < schedule[friend].length; index++) {
        var meet = {};
        var meetTimeZone = getTimeZone(schedule[friend][index].from);
        var delta = timeZone - meetTimeZone;
        meet.from = timeConversion(schedule[friend][index].from, delta);
        meet.to = timeConversion(schedule[friend][index].to, delta);

        newSchedule.push(meet);
    }

    return newSchedule;
}

function leadToBankTime(schedule, workingHours) {
    var timeZone = getTimeZone(workingHours.from);
    var newSchedule = {};
    for (var friend in schedule) {
        if (schedule.hasOwnProperty(friend)) {
            newSchedule[friend] = getTableFriend(schedule, friend, timeZone);
        }
    }

    return newSchedule;
}

function markAsBusy(timeTable, schedule) {
    for (var time = schedule.from.minutes;
         time < schedule.to.minutes && time < timeTable.length; time++) {
        timeTable[time] = 1;
    }
}

function findTimeDay(start, to, duration, tableTime) {
    var countMinutes = 0;
    var startTime = start;
    for (var index = start; index < to && countMinutes !== duration; index++) {
        if (tableTime[index] === 0) {
            countMinutes++;
        } else {
            countMinutes = 0;
            startTime = index + 1;
        }
    }
    if (countMinutes !== duration) {

        return -1;
    }

    return startTime;
}


function findTimeRobbery(tableTime, newWorkingHours, duration, start) {
    var startTime = -1;

    for (var step = 0; step < 3 && startTime === -1; step++) {
        if (start < newWorkingHours.from + step * 60 * 24) {
            startTime = findTimeDay(newWorkingHours.from + step * 60 * 24,
                                    newWorkingHours.to + step * 60 * 24, duration, tableTime);
        } else {
            startTime = findTimeDay(start, newWorkingHours.to + step * 60 * 24,
                                    duration, tableTime);
        }
    }

    return startTime;
}

function getHours(startTime, day) {

    return Math.floor((startTime - 60 * 24 * day) / 60);
}

function getMinutes(startTime, day, hours) {

    return startTime - 60 * 24 * day - hours * 60;
}


function convertToBegin(timeRobbery) {
    if (timeRobbery.minutes === 0) {
        timeRobbery.minutes = '00';
    }

    if (timeRobbery.hours === 0) {
        timeRobbery.hours = '00';
    }

    return timeRobbery;
}
function getTimeRobbery(startTime) {
    var timeRobbery = {};
    timeRobbery.day = Math.floor(startTime / (60 * 24));
    timeRobbery.hours = getHours(startTime, timeRobbery.day);
    timeRobbery.minutes = getMinutes(startTime, timeRobbery.day, timeRobbery.hours);
    timeRobbery = convertToBegin(timeRobbery);

    return timeRobbery;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var newSchedule = leadToBankTime(schedule, workingHours);
    var newWorkingHours = {};
    newWorkingHours.from = parseBankWork(workingHours.from);
    newWorkingHours.to = parseBankWork(workingHours.to);
    var tableTime = createTimeTable();
    for (var friend in newSchedule) {
        if (newSchedule.hasOwnProperty(friend)) {
            newSchedule[friend].forEach(function (table) {
                markAsBusy(tableTime, table);
            });
        }
    }
    var startTime = findTimeRobbery(tableTime, newWorkingHours, duration, 0);
    var startRobbery = getTimeRobbery(startTime);
    var exist = startTime !== -1;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {

            return exist;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */

        format: function (template) {
            if (!exist) {

                return '';
            }

            return template.replace(/%(\w\w)/gi, function (str) {
                var format = {
                    '%HH': startRobbery.hours,
                    '%MM': startRobbery.minutes,
                    '%DD': NUMBERS[startRobbery.day]
                };

                return format[str];
            });
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            var newStartTime = findTimeRobbery(tableTime, newWorkingHours,
                                                duration, startTime + 30);
            if (newStartTime === -1) {

                return false;
            }
            startTime = newStartTime;
            startRobbery = getTimeRobbery(startTime);

            return true;
        }
    };
};
