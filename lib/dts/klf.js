/**
 * Date utility helpers for fiscal year calculations and business-day arithmetic.
 * 
 * Highlights:
 * - {@link x_912467_klf.DateUtils.getFiscalYear | getFiscalYear}: Given a GlideDateTime, returns the Federal fiscal year (YYYY),
 *   where dates in October–December are counted toward the next fiscal year.
 * - {@link x_912467_klf.DateUtils.getCurrentFiscalYear | getCurrentFiscalYear}: Convenience method that returns
 *   the current Federal fiscal year based on the instance’s local time.
 * - {@link x_912467_klf.DateUtils.getFiscalYearStartDate | getFiscalYearStartDate}: Returns a GlideDate representing
 *   the start of a fiscal year (Oct 1). Optionally offset by N prior fiscal years.
 * - {@link x_912467_klf.DateUtils.addBusinessDaysToDate | addBusinessDaysToDate}: Adds N business days to a given GlideDate,
 *   honoring a ServiceNow schedule (excluding weekends/holidays via the configured schedule).
 */

//@ts-ignore
var x_912467_klf = x_912467_klf || {};
/**
 * @class x_snb_common.DateUtils
 * contains utility functions
 */
x_912467_klf.DateUtils = (function() {

    return {
        /**
         * Returns the fiscal year of the GlideDateTime in the form of YYYY
         * @param {GlideDateTime} glideDateTime
         * @returns {number}
         */
        getFiscalYear: function(glideDateTime) {
            var month = glideDateTime.getMonthLocalTime();
            var isBetweenOctoberAndDecember = month >= 10 && month <= 12;
            var year = glideDateTime.getYearLocalTime();
            return isBetweenOctoberAndDecember ? year + 1 : year;
        },
        /**
         * Returns the fiscal year of the current date
         * @returns {number}
         */
        getCurrentFiscalYear: function() {
            return this.getFiscalYear(new GlideDateTime());
        },
        /**
         * Returns a string that represents the start date of the current fiscal year
         * @param {number} [yearsAgo]
         * @returns {GlideDate}
         */
        getFiscalYearStartDate: function(yearsAgo) {
            yearsAgo = yearsAgo || 0;
            return new GlideDateTime((this.getCurrentFiscalYear() - yearsAgo - 1) + '-10-01 04:00:00').getDate();
        },
        /**
         * Returns the current year in the form of YYYY
         * @returns {number}
         */
        getCurrentYear: function() {
            return new GlideDateTime().getYearLocalTime();
        },
        /**
         * Returns a GlideDate that represents the number of business days
         * after the current date based on the days argument. The start date must be
         * a today or a future date.
         * @param {GlideDate} startDate
         * @param {number} days
         * @param {string} [scheduleSysId]
         * @returns {GlideDate}
         */
        addBusinessDaysToDate: function(startDate, days, scheduleSysId) {
            // Check start date
            if(!(startDate instanceof GlideDate)) {
                throw new Error('startDate parameter must be a GlideDate');
            }
            if(startDate < this.nowDate()) {
                throw new Error('startDate parameter must be today or a future date');
            }
            if(typeof days !== 'number' || Number.isNaN(days)) {
                throw new Error('Days parameter must be a number');
            }
            if(!scheduleSysId) {
                scheduleSysId = gs.getProperty('x_912467_klf.DateUtils.business_days_schedule_sys_id');
            }
            this.checkSchedule(scheduleSysId);

            if (days < 0) throw 'Days must be greater than or equal to 0';
            gs.debug('Start Date: ' + startDate.getByFormat('YYYY-MM-dd'));
            var start = new GlideDateTime();
            start.setDisplayValue(startDate.getByFormat('YYYY-MM-dd'));
            // if the days is O then we need at least lms so the schedular checks if the current day is on the schedule
            var duration = days === 0 ? new GlideDuration(1) : new GlideDuration(60 * 60 * 24 * 1000 * days);
            var durationCalculator = new global.DurationCalculator();
            gs.debug('Start: ' + start);
            durationCalculator.setSchedule(scheduleSysId);
            durationCalculator.calcRelativeDueDate(start, days);
            return durationCalculator.getEndDateTime().getLocalDate();
        },

        /**
         * Verifises that a schedule with the given sys_id exists
         * @param {string} scheduleSysId 
         */
        checkSchedule: function(scheduleSysId) {
            var scheduleGr = new GlideRecord('cmn_schedule');
            if (!scheduleGr.get(scheduleSysId)) {
                var errorMessage = `Schedule with sys_id "${scheduleSysId}" does not exist.
                You may need to update the property 'x_912467_klf.DateUtils.business_days_schedule_sys_id' to point to a valid schedule.
                If a schedule has not been created yet, you can create one using the x_912467_klf.DateUtils.createDefaultFederalBusinessDayScheduleAndUpdateSystemProperty function.`;
                throw new Error(errorMessage);
            }
        },


        /**
         * Returns a GlideDate that represents the number of business days
         * after the current date based on the days argument
         * @param {number} days
         * @param {string} [scheduleSysId]
         * @returns {GlideDate}
         */
        addBusinessDays: function(days, scheduleSysId) {
            var start = new GlideDateTime(gs.beginningOfToday()).getDate();
            if (days < 0) {
                return this.subtractBusinessDaysToDate(start, -1 * days, scheduleSysId);
            } else {
                return this.addBusinessDaysToDate(start, days, scheduleSysId);
            }
        },
        /**
         * Returns a GlideDate that represents the number of business days
         * after the current date based on the days argument
         * 
         * This function only works if startDate - days results in a future date. This is a limitation of
         * the algorithm used. It's using GlideSchedule.isInSchedule which only works for today and future dates.
         * @param {GlideDate} startDate
         * @param {number} days
         * @param {string} [scheduleSysId]
         * @returns {GlideDate}
         */
        subtractBusinessDaysToDate: function(startDate, days, scheduleSysId) {
            // Check start date
            if(!(startDate instanceof GlideDate)) {
                throw new Error('startDate parameter must be a GlideDate');
            }
            if(startDate < this.nowDate()) {
                throw new Error('startDate parameter must be today or a future date');
            }
            var earliestPossibleDate = new GlideDateTime(startDate.toString())
            earliestPossibleDate.addDaysUTC(-1 * days);
            if(earliestPossibleDate.getDate() < this.nowDate()) {
                throw new Error('startDate minus days results in a past date which is not supported by this function. The resulting date must be today or a future date.');
            }
            if(typeof days !== 'number' || Number.isNaN(days)) {
                throw new Error('Days parameter must be a number');
            }
            if(!scheduleSysId) {
                scheduleSysId = gs.getProperty('x_912467_klf.DateUtils.business_days_schedule_sys_id');
            }
            this.checkSchedule(scheduleSysId);

            // Formula to return an estimation of the number of business
            // days in the past. This will be off because it only accounts
            // for weekends, but it will be closer than just starting with
            // the days parameter
            function candidateBusinessDaysAgo( /**@type {number}*/ x) {
                x = x < 0 ? -1 * x : x;
                return (((x - (x % 5)) / 5) * 7) + (x % 5);
            }
            var schedule = new GlideSchedule(scheduleSysId);
            if (days <= 0) throw 'Days must be greater than O';
            // This script may run on a non-business day, so we get the next business
            // day by asking for the business day O days from now
            var currentBusinessDay = this.addBusinessDaysToDate(startDate, 0);
            var loopCount = 0;
            var candidateDayOffset = -1 * candidateBusinessDaysAgo(days);
            do {
                var result = null;
                if (loopCount > 365) throw 'Could not do subtraction';
                loopCount = loopCount + 1;
                var candidateAnswer = new GlideDateTime();
                candidateAnswer.setDisplayValue(currentBusinessDay.getValue())
                candidateAnswer.addDaysLocalTime(candidateDayOffset);
                if (!schedule.isInSchedule(candidateAnswer)) {
                    // if this day is not in the schedule skip to previous day
                    candidateDayOffset = candidateDayOffset - 1;
                    continue;
                }
                result = this.addBusinessDaysToDate(candidateAnswer.getDate(), days, scheduleSysId);
                candidateDayOffset = candidateDayOffset - 1;
            } while (result === null || result.getValue() != currentBusinessDay.getValue());
            return candidateAnswer.getDate();
        },
        /**
         * GlideDate representation of today's date
         * @returns {GlideDate}
         */
        nowDate: function() {
            return new GlideDate();
        },
        /**
         * Returns a GlideDate that represents the date the number of days
         * in the future based on the passed in argument. If you want days in the past then
         * use a negative number of days
         * @param {number} days
         * @returns {GlideDate}
         */
        addDays: function(days) {
            var daysAgo = new GlideDateTime();
            daysAgo.addDaysLocalTime(days);
            return daysAgo.getDate();
        },
        /**
         * Creates a federal holiday schedule with cmn_schedule_span records for each federal holiday.
         * The schedule is created with type 'exclude' to represent days when work should not occur.
         * Federal holidays are based on the U.S. Office of Personnel Management calendar.
         * Note: Inauguration Day (January 20) is only observed in presidential inauguration years.
         * 
         * @param {string} scheduleName - The name of the schedule to create
         * @returns {string} The sys_id of the newly created cmn_schedule record
         * @throws {Error} If a schedule with the given name already exists
         */
        createFederalHolidaySchedule: function(scheduleName) {
            // Check if schedule already exists
            var existingSchedule = new GlideRecord('cmn_schedule');
            existingSchedule.addQuery('name', scheduleName);
            existingSchedule.query();
            if (existingSchedule.next()) {
                throw new Error('Schedule with name "' + scheduleName + '" already exists with sys_id: ' + existingSchedule.getUniqueValue());
            }

            // Create the schedule
            // Need to use KLF_GlideRecordUtils because of scoped application insert restrictions
            var scheduleGr = new global.KLF_GlideRecordUtils().insertRecord('cmn_schedule', {
                name: scheduleName,
                time_zone: 'US/Eastern' // Federal holidays are typically based on Eastern time
            });
            if(!scheduleGr.isValidRecord()) {
                throw new Error('Failed to create schedule');
            }
            var scheduleSysId = scheduleGr.getUniqueValue();

            if (!scheduleSysId) {
                throw new Error('Failed to create schedule');
            }

            // Constants for day of week (ServiceNow uses 1=Sunday, 2=Monday, etc.)
            var DAY_OF_WEEK = {
                SUNDAY: 1,
                MONDAY: 2,
                TUESDAY: 3,
                WEDNESDAY: 4,
                THURSDAY: 5,
                FRIDAY: 6,
                SATURDAY: 7
            };

            // Constants for week occurrence (positive = 1st, 2nd, 3rd, 4th; negative = last)
            var WEEK_OCCURRENCE = {
                FIRST: 1,
                SECOND: 2,
                THIRD: 3,
                FOURTH: 4,
                LAST: -1
            };

            // Constants for months
            var MONTH = {
                JANUARY: 1,
                FEBRUARY: 2,
                MARCH: 3,
                APRIL: 4,
                MAY: 5,
                JUNE: 6,
                JULY: 7,
                AUGUST: 8,
                SEPTEMBER: 9,
                OCTOBER: 10,
                NOVEMBER: 11,
                DECEMBER: 12
            };

            // Special value for floating holidays (no fixed day of month)
            var NO_FIXED_DAY = 0;

            // Define federal holidays - these are recurring annual holidays
            // Based on https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/
            /**
             * @type {({name: string, month: number, day: number, type: 'fixed'} |
             * {name: string, month: number, day: number, dayOfWeek: number, occurrence: number, referenceDate: string, type: 'floating'})[]}
             */
            var holidays = [
                { name: "New Year's Day", month: MONTH.JANUARY, day: 1, type: 'fixed' },
                { name: "Birthday of Martin Luther King, Jr.", month: MONTH.JANUARY, day: NO_FIXED_DAY, dayOfWeek: DAY_OF_WEEK.MONDAY, occurrence: WEEK_OCCURRENCE.THIRD, referenceDate: '2025-01-20', type: 'floating' },
                { name: "Washington's Birthday", month: MONTH.FEBRUARY, day: NO_FIXED_DAY, dayOfWeek: DAY_OF_WEEK.MONDAY, occurrence: WEEK_OCCURRENCE.THIRD, referenceDate: '2025-02-17', type: 'floating' },
                { name: "Memorial Day", month: MONTH.MAY, day: NO_FIXED_DAY, dayOfWeek: DAY_OF_WEEK.MONDAY, occurrence: WEEK_OCCURRENCE.LAST, referenceDate: '2025-05-26', type: 'floating' },
                { name: "Juneteenth National Independence Day", month: MONTH.JUNE, day: 19, type: 'fixed' },
                { name: "Independence Day", month: MONTH.JULY, day: 4, type: 'fixed' },
                { name: "Labor Day", month: MONTH.SEPTEMBER, day: NO_FIXED_DAY, dayOfWeek: DAY_OF_WEEK.MONDAY, occurrence: WEEK_OCCURRENCE.FIRST, referenceDate: '2025-09-01', type: 'floating' },
                { name: "Columbus Day", month: MONTH.OCTOBER, day: NO_FIXED_DAY, dayOfWeek: DAY_OF_WEEK.MONDAY, occurrence: WEEK_OCCURRENCE.SECOND, referenceDate: '2025-10-13', type: 'floating' },
                { name: "Veterans Day", month: MONTH.NOVEMBER, day: 11, type: 'fixed' },
                { name: "Thanksgiving Day", month: MONTH.NOVEMBER, day: NO_FIXED_DAY, dayOfWeek: DAY_OF_WEEK.THURSDAY, occurrence: WEEK_OCCURRENCE.FOURTH, referenceDate: '2025-11-27', type: 'floating' },
                { name: "Christmas Day", month: MONTH.DECEMBER, day: 25, type: 'fixed' }
            ];

            // Create schedule spans for each holiday
            holidays.forEach(function(holiday) {
                var beginningOfHoliday, endOfHoliday;
                if(holiday.type == 'floating') {
                    var referenceDate = new GlideDateTime(holiday.referenceDate).getDate();
                    beginningOfHoliday = referenceDate.getDisplayValue() + ' ' + '00:00:00'; // Format should be yyyyMMddTHH:mm:ss
                    endOfHoliday = referenceDate.getDisplayValue() + ' ' + '23:59:59'; // Format should be yyyyMMddTHH:mm:ss
                } else {
                    var year = new GlideDate().getYearLocalTime(); // Current year
                    var month = holiday.month.toString().padStart(2, '0');
                    var day = holiday.day.toString().padStart(2, '0');
                    beginningOfHoliday = month + '-' + day + '-' + year + ' ' + '00:00:00'; // Format should be yyyyMMddTHH:mm:ss
                    endOfHoliday = month + '-' + day + '-' + year + ' ' + '23:59:59'; // Format should be yyyyMMddTHH:mm:ss
                }
                var span = new GlideRecord('cmn_schedule_span');
                span.newRecord();
                span.schedule = scheduleSysId;
                span.name = holiday.name;
                span.type = 'exclude';
                span.repeat_type = 'yearly';
                span.repeat_count = 1; // Repeats annually
                span.start_date_time = beginningOfHoliday; // This is not a normal DateTime field. It's a Schedule Date/Time field
                span.end_date_time = endOfHoliday; // This is not a normal DateTime field. It's a Schedule Date/Time field
                
                if (holiday.type === 'floating') {
                    // Floating holiday (e.g., 3rd Monday in January)
                    span.yearly_type = 'float';
                    span.month = holiday.month.toString(); // Convert to string because this will throw an error in scoped applications
                    span.float_week = holiday.occurrence == WEEK_OCCURRENCE.LAST ? 'last' : holiday.occurrence.toString(); // Convert to string because this will throw an error in scoped applications
                    span.float_day = holiday.dayOfWeek;
                } else {
                    // Fixed date holiday (e.g., July 4, December 25)
                    span.yearly_type = 'doy';
                }
                span.insert();
            });

            gs.info('Created federal holiday schedule "' + scheduleName + '" with sys_id: ' + scheduleSysId);
            return scheduleSysId;
        },

        /**
         * Creates a weekend schedule with cmn_schedule_span records for Saturday and Sunday.
         * The schedule is created with type 'exclude' to represent days when work should not occur.
         * 
         * @param {string} scheduleName - The name of the schedule to create
         * @returns {string} The sys_id of the newly created cmn_schedule record
         * @throws {Error} If a schedule with the given name already exists
         */
        createWeekendSchedule: function(scheduleName) {
            // Check if schedule already exists
            var existingSchedule = new GlideRecord('cmn_schedule');
            existingSchedule.addQuery('name', scheduleName);
            existingSchedule.query();
            if (existingSchedule.next()) {
                throw new Error('Schedule with name "' + scheduleName + '" already exists with sys_id: ' + existingSchedule.getUniqueValue());
            }

            // Create the schedule
            // Need to use KLF_GlideRecordUtils because of scoped application insert restrictions
            var scheduleGr = new global.KLF_GlideRecordUtils().insertRecord('cmn_schedule', {
                name: scheduleName,
                time_zone: 'US/Eastern' // Federal holidays are typically based on Eastern time
            });
            if(!scheduleGr.isValidRecord()) {
                throw new Error('Failed to create schedule');
            }
            var scheduleSysId = scheduleGr.getUniqueValue();

            if (!scheduleSysId) {
                throw new Error('Failed to create schedule');
            }

            // Constants for day of week (ServiceNow uses 1=Sunday, 2=Monday, etc.)
            var DAY_OF_WEEK = {
                SUNDAY: 7,
                SATURDAY: 6
            };

            // Create schedule spans for Saturday and Sunday
            var weekendDays = [
                { name: 'Saturday', dayOfWeek: DAY_OF_WEEK.SATURDAY, referenceDate: '2025-11-01' },
                { name: 'Sunday', dayOfWeek: DAY_OF_WEEK.SUNDAY, referenceDate: '2025-11-02' }
            ];


            weekendDays.forEach(function(day) {
                var referenceDate = new GlideDateTime(day.referenceDate).getDate();
                var beginningOfDay = referenceDate.getDisplayValue() + ' ' + '00:00:00'; // Format should be yyyyMMddTHH:mm:ss
                var endOfDay = referenceDate.getDisplayValue() + ' ' + '23:59:59'; // Format should be yyyyMMddTHH:mm:ss
                var span = new GlideRecord('cmn_schedule_span');
                span.newRecord();
                span.schedule = scheduleSysId;
                span.name = day.name;
                span.type = 'exclude';
                span.all_day = true;
                span.repeat_type = 'weekly';
                span.days_of_week = day.dayOfWeek.toString();
                span.start_date_time = beginningOfDay; // This is not a normal DateTime field. It's a Schedule Date/Time field
                span.end_date_time = endOfDay; // This is not a normal DateTime field. It's a Schedule Date/Time field

                span.insert();
            });

            gs.info('Created weekend schedule "' + scheduleName + '" with sys_id: ' + scheduleSysId);
            return scheduleSysId;
        },

        /**
         * Creates a schedule for Federal Business Days
         * This schedule includes weekdays, excludes weekends and federal holidays
         * 
         * Three schedules are created:
         * 1. Main schedule for weekdays (Monday to Friday)
         * 2. Holiday schedule for federal holidays - These are excluded from the main schedule
         * 3. Weekend schedule for Saturdays and Sundays - These are excluded from the main schedule
         * 
         * You can optionally provide names for the holiday and weekend schedules. If not provided,
         * default names will be used.
         * 
         * @param {string} scheduleName - The name of the schedule to create
         * @param {string} [holidayScheduleName = 'Federal Holiday'] - The name of the holiday schedule to create
         * @param {string} [weekendScheduleName = 'Federal Weekend'] - The name of the weekend schedule to create
         * @returns {string} The sys_id of the newly created cmn_schedule record
         * @throws {Error} If a schedule with the given name already exists
         */
        createFederalBusinessDaySchedule: function(scheduleName, holidayScheduleName, weekendScheduleName) {
            // Check if schedule already exists
            var existingSchedule = new GlideRecord('cmn_schedule');
            existingSchedule.addQuery('name', scheduleName);
            existingSchedule.query();
            if (existingSchedule.next()) {
                throw new Error('Schedule with name "' + scheduleName + '" already exists with sys_id: ' + existingSchedule.getUniqueValue());
            }

            // Create the schedule
            // Need to use KLF_GlideRecordUtils because of scoped application insert restrictions
            var scheduleGr = new global.KLF_GlideRecordUtils().insertRecord('cmn_schedule', {
                name: scheduleName,
                time_zone: 'US/Eastern' // Federal holidays are typically based on Eastern time
            });
            if(!scheduleGr.isValidRecord()) {
                throw new Error('Failed to create schedule');
            }
            var scheduleSysId = scheduleGr.getUniqueValue();

            if (!scheduleSysId) {
                throw new Error('Failed to create schedule');
            }

            var _holidayScheduleName = holidayScheduleName || 'Federal Holidays';
            var _weekendScheduleName = weekendScheduleName || 'Federal Weekend';
            var holidayScheduleSysId = this.createFederalHolidaySchedule(_holidayScheduleName);
            var weekendScheduleSysId = this.createWeekendSchedule(_weekendScheduleName);

            // Create schedule spans for weekdays (Monday to Friday)
            var weekdaySpan = new GlideRecord('cmn_schedule_span');
            weekdaySpan.newRecord();
            weekdaySpan.schedule = scheduleSysId;
            weekdaySpan.name = 'Weekdays (Monday to Friday)';
            weekdaySpan.repeat_type = 'weekdays';
            var referenceDate = new GlideDateTime().getDate();
            var beginningOfDay = referenceDate.getDisplayValue() + ' ' + '00:00:00';
            var endOfDay = referenceDate.getDisplayValue() + ' ' + '23:59:59';
            weekdaySpan.start_date_time = beginningOfDay; 
            weekdaySpan.end_date_time = endOfDay;
            weekdaySpan.insert();

            // Link the holiday and weekend schedules as exclusions
            var holidayExclusion = new GlideRecord('cmn_other_schedule');
            holidayExclusion.newRecord();
            holidayExclusion.schedule = scheduleSysId;
            holidayExclusion.child_schedule = holidayScheduleSysId;
            holidayExclusion.time_zone = 'US/Eastern';
            holidayExclusion.type = 'include';
            holidayExclusion.insert();

            var weekendExclusion = new GlideRecord('cmn_other_schedule');
            weekendExclusion.newRecord();
            weekendExclusion.schedule = scheduleSysId;
            weekendExclusion.child_schedule = weekendScheduleSysId;
            weekendExclusion.time_zone = 'US/Eastern';
            weekendExclusion.type = 'include';
            weekendExclusion.insert();

            gs.info('Created weekday schedule "' + scheduleName + '" with sys_id: ' + scheduleSysId);
            return scheduleSysId;
        },

        /**
         * Creates the default Federal Business Day schedule and updates the system property. 
         * That points to the schedule for the added business days calculations.
         * @returns {string} The sys_id of the newly created cmn_schedule record
         */
        createDefaultFederalBusinessDayScheduleAndUpdateSystemProperty: function() {
            gs.info('Creating default Federal Business Day schedule');
            var scheduleId = this.createFederalBusinessDaySchedule('Federal Business Day');

            gs.info('Updating system property x_912467_klf.DateUtils.business_days_schedule_sys_id to ' + scheduleId);
            gs.setProperty('x_912467_klf.DateUtils.business_days_schedule_sys_id', scheduleId);

            gs.info('Updating access for DurationCalculator script include to public');
            // This script also has a dependency on DurationCalculator script include. By default the DurationCalculator
            // script include is not available in scoped applications. To resolve this we need to
            // make DurationCalculator accessible to all scopes by setting its access to public.
            new global.KLF_GlideRecordUtils().updateRecord('sys_script_include', 'sys_id=c14b7dd30a6a803f2f25e0e60a457f7b', {
                access: 'public'
            });

            return scheduleId;
        }
    };
})();
/**
 * Script that exposes an eval function for scoped applications.
 * GlideEvaluator.eval is not available in scoped applications.
 * This script gives an alternative way to execute a script given as a string dynamically.
 * 
 */
//@ts-ignore
var x_912467_klf = x_912467_klf || {};
/**
 * @class x_912467_klf.Evaluator
 * Eval function for scoped apps because you can't execute
 * GlideEvaluator.eval from scoped application
 * @example
 * var script = 'gs.info("Hello World")';
 * x_912467_klf.Evaluator.evaluate(script);
 */
x_912467_klf.Evaluator = (function() {

    function getFixScript() {
        var fixScriptName = 'KLF Script Eval';
        var fixScript = new GlideRecord('sys_script_fix');
        if (!fixScript.get('name', fixScriptName)) {
            fixScript.newRecord();
            fixScript.record_for_rollback = false;
            fixScript.description = 'Created automatically by x_912467_klf.Evaluator to dynamically execute scripts. ' +
                'ServiceNow does not allow GlideEvaluator.eval from scoped applications. ' +
                'I am using a fix script to execute dynamic scripts. The script field is left intentionally blank.';
            fixScript.name = fixScriptName;
            fixScript.update();
        }
        return fixScript;
    }

    return {
        /**
         * @param {string} script 
         * @param {{[argumentName: string]: any}} argumentMap
         * @returns {any}
         */
        evaluate: function(script, argumentMap) {
            argumentMap = argumentMap || {};
            var fixScript = getFixScript();
            fixScript.script = script;
            var evaluator = new GlideScopedEvaluator();
            Object.keys(argumentMap || {}).forEach(function(argName) {
                var argValue = argumentMap[argName];
                evaluator.putVariable(argName, argValue);
            });

            // @ts-ignore
            return evaluator.evaluateScript(fixScript);
        }, 
        
        /**
         * Evaluates the given script as the system user by calling a Flow Designer subflow.
         * 
         * You can pass parameters to the script via the argumentMap object.
         * Each key in the argumentMap will be available as a variable in the script.
         * @example
         * x_912467_klf.Evaluator.evaluateAsSystem('gs.info("Hello World")');
         * x_912467_klf.Evaluator.evaluateAsSystem('gs.info(message)', {message: 'Message Hello World'});
         * @param {string} script
         * @param {{[parameterName:string]: any}} [argumentMap]
         * @returns {any}
         */
        evaluateAsSystem: function(script, argumentMap) {
            var result = sn_fd.FlowAPI.executeSubflow('x_912467_klf.execute_as_system', {
                func: script,
                argumentMap: argumentMap
            });

            return result.output;
        }
    };

})();
/**
 * Exposes some general methods for working with GlideRecords
 * 
 * Some of the methods are:
 * - getRecord: Quickly retrieve a GlideRecord or null by sys_id
 * - getExtendedGlideRecord: Some GlideRecords are extended tables. This method will always return the extended GlideRecord
 * even if the passed in GlideRecord is the parent table
 * - getFieldLabel: Returns the sys_documentation label associated with a field. This can be useful if you want to get
 * some information that is stored on the sys_documentation record
 * - extendsTable: Returns whether or not a child table extends an ancestor table
 * - getRecordUrl: Returns the ServicePortal form URL
 * - getRecordHtmllink: Returns HTML anchor link to the ServicePortal form
 */

//@ts-ignore
var x_912467_klf = x_912467_klf || {};
/**
 * @class x_snb_common.GlideRecordUtils
 * contains utility functions
 */
x_912467_klf.GlideRecordUtils = (function() {

    var globalGlideRecordUtils = new global.KLF_GlideRecordUtils();

    return {
        /**
         * Quickly retrieve a GlideRecord by sys_id
         * @param {string} sysld
         * @param {string} tableName
         * @returns {?GlideRecord} Found GlideRecord or null
         */
        getRecord: function(sysld, tableName) {
            var record = new GlideRecord(tableName);
            if (record.get(sysld)) {
                return record;
            } else {
                return null;
            }
        },
        /**
         * Some GlideRecords are extended tables. This method will always return the extended GlideRecord
         * even if the passed in GlideRecord is the parent table
         * @param {GlideRecord} glideRecord A GlideRecord that uses extension
         * @returns {GlideRecord} The extended GlideRecord
         */
        getExtendedGlideRecord: function(glideRecord) {
            if (glideRecord.getTableName() != glideRecord.getRecordClassName()) {
                var extended = new GlideRecord(glideRecord.getRecordClassName());
                extended.get(glideRecord.getUniqueValue());
                return extended;
            } else {
                return glideRecord;
            }
        },
        /**
         * Returns the sys_documentation label associated with a field. The
         * sys_documentation record contains the label, help, and hint information
         * for a field
         * @param {string} tableName
         * @param {string} fieldName
         * @returns {?Object.<string,string>}
         */
        getFieldLabel: function(tableName, fieldName) {
            var label = new GlideRecord('sys_documentation');
            label.addQuery('name', tableName);
            label.addQuery('element', fieldName);
            label.query();
            if (label.getRowCount() > 1) {
                throw 'Found more than one label for the field' + tableName + '.' + fieldName;
            }
            if (label.next()) {
                return globalGlideRecordUtils.glideRecordToMap(label);
            } else {
                return null;
            }
        },
        /**
         * Retrieves the true table name of a GlideRecord. In some situations an extended table will return
         * the parent table name instead of the child table name if GlideRecord.getTableName is used
         * @param {GlideRecord} glideRecord GlideRecord to retrieve true table name for
         */
        getTableName: function(glideRecord) {
            return (glideRecord.sys_class_name && !glideRecord.sys_class_name.nil()) ?
                glideRecord.getValue('sys_class_name') :
                glideRecord.getTableName();
        },
        /**
         * Returns whether or not a child table given by tableName extends an ancestor table given by superTableName
         * If the tableName and superTableName are the same will return true
         * @param {string} superTableName The name of an ancestor table to check if it has been extended
         * @param {string} tableName The name of a child table to see if it extends the ancestor
         * @returns {boolean}
         */
        extendsTable: function(superTableName, tableName) {
            if (superTableName == tableName) {
                return true;
            }
            //Maybe refactor this to use GlideTableHierarchy
            // var tableHierarchy = new GlideTableHierarchy(requestTableName);
            // var parentTables = tableHierarchy.getTables();
            var dbRecord = new GlideRecord('sys_db_object');
            if (dbRecord.get('name', tableName) && !dbRecord.super_class.nil()) {
                var superDbRecord = dbRecord.super_class.getRefRecord();
                var superTableNameCandidate = superDbRecord.getValue('name');
                if (superTableName == superTableNameCandidate) {
                    return true;
                } else {
                    return this.extendsTable(superTableName, superTableNameCandidate);
                }
            } else {
                return false;
            }
        },
        /**
         * Returns a list of all the field names for a table
         * @param {string} tableName Table name to retrieve fields
         * @returns {string[]}
         */
        getTableFieldNames: function(tableName) {
            return new GlideRecord(tableName).getElements().map(function(element) {
                return element.getName();
            });
        },
        /**
         * Takes the names of two tables and returns the fields in the extended table that are
         * not in the base table
         * @param {string} baseTable The base table name that has been extended
         * @param {string} extendedTable The extended table name that extends the base table
         * @returns {string[]} A list of field names that are in the extended table that are not in the base table
         */
        getOnlyExtendedFields: function(baseTable, extendedTable) {
            /**
             * Returns the list of field names for a glide record
             * @param {GlideRecord} glideRecord
             * @returns {string[]}
             */
            function getFields(glideRecord) {
                return glideRecord.getElements().map(function( /**@type{GlideElement}*/ element) {
                    return element.getName();
                });
            }
            var baseGr = new GlideRecord(baseTable);
            var baseFields = getFields(baseGr);
            var extendedGr = new GlideRecord(extendedTable);
            var extendedFields = getFields(extendedGr);
            return new global.ArrayUtil().diff(extendedFields, baseFields);
        },
        /**
         * Returns the ServicePortal form URL
         * @param {GlideRecord} glideRecord Glide record to retrieve url
         * @param {string} portalUrl The base portal URL
         * @param {string} formPage The ServicePortal form page id to go to
         * @returns {string}
         */
        getRecordUrl: function(glideRecord, portalUrl, formPage) {
            return portalUrl + '?' +
                'id=' + formPage +
                '&table=' + glideRecord.getTableName() +
                '&sys_id=' + glideRecord.getUniqueValue() +
                '&view=sp';
        },
        /**
         * Returns HTML anchor link to the ServicePortal form
         * @param {GlideRecord} glideRecord GlideRecord to retrieve link
         * @param {string} portalUrl The base portal URL
         * @param {string} formPage The ServicePortal form page id to go to
         * @param {string} label Label for the link the user sees
         * @returns {string}
         */
        getRecordHtmllink: function(glideRecord, portalUrl, formPage, label) {
            return '<a href="' + this.getRecordUrl(glideRecord, portalUrl, formPage) + '">' + label + '</a>';
        },

        // Write your scripts here to run (JavaScript executed on server)
        /**
         * Returns a list of field names that have changed on the GlideRecord
         * Filters out sys_ fields
         * When this is an insert operation, all fields that are not empty are considered changed
         * @param {GlideRecord} glideRecord 
         * @returns {string[]}
         */
        getChangedFieldNames: function(glideRecord) {
            return this.getChanges(glideRecord).map(function(element) {
                return element.getName();
            });
        },

        /**
         * Returns a list of GlideElement objects that have changed on the GlideRecord
         * Filters out sys_ fields and fields that have not changed
         * When this is an insert operation, all fields that are not empty are considered changed
         * @param {GlideRecord} glideRecord 
         * @returns {GlideElement[]}
         */
        getChanges: function(glideRecord) {
            /** @type {GlideElement[]} */
            var elements = glideRecord.getElements();

            // Filter out sys_ fields
            var filteredElements = elements.filter(function(element) {
                var name = element.getName();
                return !name.startsWith("sys_") || name == "sys_domain";
            });

            if (glideRecord.operation() == "insert") {
                // On an insert operation, all fields that are not empty are considered changed
                filteredElements = filteredElements.filter(function(element) {
                    return !element.nil();
                });
            } else {
                // On an update operation, only fields that have changed are considered changed
                filteredElements = filteredElements.filter(function(element) {
                    return element.changes();
                });
            }

            return filteredElements;
        }
    };
})();
/**
 * Utility functions for Group (sys_user_group) table
 * 
 * Some of the functions include:
 * - isMemberOfSomeGroup: Returns true if the user is a member of any of the groups
 * - getGroupSysIdsForUser: Returns the list of sys_user_group.sys_id for the user
 * - getGroupByName: Returns the sys_user_group record with the given name
 * - isMemberOf: Returns true is the user is a member of the sys_user_group
 * - createGroup: Creates a new sys_user_group record   
 * - createUser: Creates a new sys_user record
 * - addUserToGroup: Adds a user to a group
 */
//@ts-ignore
var x_912467_klf = x_912467_klf || {};

/**
 * Utility functions for sys_user_group
 */
x_912467_klf.GroupUtils = (function() {
    const glideRecordUtils = new global.KLF_GlideRecordUtils();

    class GroupUtils {


        /**
         * Returns true if the user is a member of any of the groups
         * @param {string} userSysId 
         * @param {string[]|string} groupSysIds sys_user_group.sys_id[] or concatenated string of sys_user_group.sys_id
         * @returns {boolean}
         */
        isMemberOfSomeGroup(userSysId, groupSysIds) {
            const groupMember = new GlideRecord('sys_user_grmember');
            groupMember.addQuery('user', userSysId);
            groupMember.addQuery('group', 'IN', groupSysIds);
            groupMember.query();
            return groupMember.hasNext();
        }

        /**
         * Returns the list of sys_user_group.sys_id for the user
         * @param {string} userSysId - The sys_user.sys_id
         * @returns {string[]} - The list of sys_user_group.sys_id
         */
        getGroupSysIdsForUser(userSysId) {
            const gr = new GlideRecord('sys_user_grmember');
            gr.addQuery('user', userSysId);
            gr.query();
            const groupSysIds = [];
            while (gr.next()) {
                groupSysIds.push(gr.group.toString());
            }
            return groupSysIds;
        }

        /**
         * Returns the sys_user_group record with the given name
         * @param {string} groupName - The name of the group to find
         * @returns {?GlideRecord} - The sys_user_group record
         */
        getGroupByName(groupName) {
            const group = new GlideRecord('sys_user_group');
            if (group.get('name', groupName)) {
                return group;
            } else {
                return null;
            }
        }


        /**
         * Returns true is the user is a member
         * of the sys_user_group
         * @param {string} groupSysId sys_user_group.sys_id
         * @param {string} userSysId sys_user.sys_id
         * @returns {boolean}
         */
        isMemberOf(groupSysId, userSysId) {
            const gr = new GlideRecord('sys_user_grmember');
            gr.addQuery('group', groupSysId);
            gr.addQuery('user', userSysId);
            gr.query();
            return gr.hasNext();
        }

        /**
         * Creates a new sys_user_group record
         * @param {string} groupName - The name of the group to create
         * @returns {GlideRecord} - The newly created sys_user_group record
         */
        createGroup(groupName) {
            return glideRecordUtils.insertRecord('sys_user_group', {
                name: groupName
            });
        }

        /**
         * Creates a new sys_user record
         * @param {string} userName - The name of the user to create
         * @returns {GlideRecord} 
         */
        createUser(userName) {
            return glideRecordUtils.insertRecord('sys_user', {
                user_name: userName,
                first_name: userName + 'first',
                last_name: userName + 'last',
                email: userName + '@example.com'
            });
        }

        /**
         * Adds a user to a group
         * @param {GlideRecord} user - The user to add to the group
         * @param {GlideRecord} group - The group to add the user to
         */
        addUserToGroup(user, group) {
            glideRecordUtils.insertRecord('sys_user_grmember', {
                user: user.getUniqueValue(),
                group: group.getUniqueValue()
            });
        }
    }

    return new GroupUtils();

})();
/**
 * Helps to produce a metric based on the "List" field in ServiceNow. Metrics are located in the "Metrics" module.
 * 
 * It can be difficult to report on a list field in ServiceNow because the list values are aggregated into a single field.
 * 
 * This script helps to produce a metric based on the list field. A metric instance will be produced for each value in the
 * list field. This way you can create a report based on the individual values instead of the aggregated field.
 * 
 * Metrics are documented at {@link https://docs.servicenow.com/csh?topicname=c_MetricDefinitionSupport.html&version=latest}
 * 
 * NOTE: to produce metrics on tables that do not extend Task, you will need to duplicate the "metrics events" business rule that
 * sits on the Task table. That business rule is responsible for creating the metric instances. Duplicate the business rule and
 * change the table name to the table you want to produce metrics on.
 * 
 * When you duplicate the business rule, you will need to call the "queueMetricUpdate" function from the "onAfter" business rule.
 * The default "queueMetricUpdate" function can only be called from "global" scope. I have created a version of this function
 * in the KLF Global application called "KLF_MetricUtils.queueMetricUpdate" that can be called from the application scope. Refer to
 * the KLF_MetricUtils script include for more information.
 * 
 * @example
 * // Create a Metric Definition
 * // In the "Script" field of the definition add the following script:
 * x_912467_klf.ListMetric.createMetric(current, definition);
 */
//@ts-ignore
var x_912467_klf = x_912467_klf || {};

x_912467_klf.ListMetric = (function() {
    // variables available
    // current: GlideRecord -  target incident
    // definition: GlideRecord -  (this row)
    /**
     * @param {string} instanceSysId 
     * @param {string} fieldName 
     * @returns {string[]}
     */
    function getSavedValues(instanceSysId, fieldName) {
        var mi = new GlideRecord('metric_instance');
        mi.addQuery('id', instanceSysId);
        mi.addQuery('field', fieldName);
        mi.query();
        var values = [];
        while (mi.next()) {
            values.push(mi.getValue('value'));
        }
        return values;
    }

    /**
     * @param {string} instanceSysId 
     * @param {string} fieldName 
     * @param {*} value 
     * @returns {boolean}
     */
    function exists(instanceSysId, fieldName, value) {
        var mi = new GlideRecord('metric_instance');
        mi.addQuery('id', instanceSysId);
        mi.addQuery('field', fieldName);
        mi.addQuery('value', value);
        mi.query();
        return mi.hasNext();
    }


    return {
        /**
         * Creates a metric instance for each value in the list field. 
         * If the list field is empty, all metric instances will be deleted.
         * @param {GlideRecord} glideRecord 
         * @param {GlideRecord} metricDefinition 
         */
        createMetric: function(glideRecord, metricDefinition) {
            var fieldName = metricDefinition.getValue('field');
            gs.debug('current operation: ' + glideRecord.operation());
            if (!glideRecord[fieldName].nil()) {
                var values = glideRecord.getValue(fieldName).split(',');
                var savedValues = getSavedValues(glideRecord.getUniqueValue(), fieldName);
                var removedValues = new global.ArrayUtil().diff(savedValues, values);
                values.forEach(function(value) {
                    if (!exists(glideRecord.getUniqueValue(), fieldName, value)) {
                        var mi = new global.KLF_MetricUtils().createMetricInstance(glideRecord, metricDefinition);
                        mi.value = value;
                        mi.update();
                    }
                });

                if (removedValues.length > 0) {
                    var mi = new GlideRecord('metric_instance');
                    mi.addQuery('id', glideRecord.getUniqueValue());
                    mi.addQuery('definition', metricDefinition.getUniqueValue());
                    mi.addQuery('value', 'IN', removedValues);
                    mi.deleteMultiple();
                }
            } else {
                var mi2 = new GlideRecord('metric_instance');
                mi2.addQuery('id', glideRecord.getUniqueValue());
                mi2.addQuery('definition', metricDefinition.getUniqueValue());
                mi2.query();
                while (mi2.next()) {
                    mi2.deleteRecord();
                }
            }
        }
    };

})();