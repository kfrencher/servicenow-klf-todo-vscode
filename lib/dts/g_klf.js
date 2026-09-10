/**
 * Contains utility functions for dynamically creating ATF tests. The original use case for these utility methods was to
 * generate a baseline test template. Then using this script you could potentially generate copies of that template to
 * quickly create new tests.
 */

/** @ts-ignore */
var global = global || {};

global.KLF_AtfAddStepsHelper = (function() {
    return {
        /**
         * Gets an sys_atf_test record by sys_id
         * @param {string} testSysId sys_atf_test.sys_id
         * @returns {?GlideRecord} sys_atf_test
         */
        getTest: function(testSysId) {
            var test = new GlideRecord('sys_atf_test');
            if (test.get(testSysId)) {
                return test;
            } else {
                return null;
            }
        },

        /**
         * Copies test steps from the from test to the to test. The copied
         * test steps are added after the last test step in the to test.
         * Returns the list of added test steps
         * @param {string} fromTestSysId sys_atf_test.sys_id
         * @param {string} toTestSysId sys_atf_test.sys_id
         */
        addTestSteps: function(fromTestSysId, toTestSysId) {
            // copy test from test
            var copiedTestSysId = this.copyTest(fromTestSysId);
            var nextStepOrder = this.getMaxStepOrder(toTestSysId);
            // change the value of the order in each test step
            this.updateStepOrder(copiedTestSysId, nextStepOrder);
            // change the parent test of the test steps
            this.moveSteps(copiedTestSysId, toTestSysId);
            // delete the copied test
            this.deleteTest(copiedTestSysId);
        },

        /**
         * Deletes the test given by sys_atf_test.sys_id
         * @param {string} testSysId sys_atf_test.sys_id
         */
        deleteTest: function(testSysId) {
            var test = new GlideRecord('sys_atf_test');
            if (test.get(testSysId)) {
                new global.KLF_GlideRecordUtils().deleteRecord('sys_atf_test', test.getEncodedQuery());
            }
        },

        /**
         * Renumbers the sys_atf_step.order starting with the passed in
         * startOrder
         * @param {string} testSysId sys_atf_test.sys_id
         * @param {number} startOrder The starting value of sys_atf_step.order
         */
        updateStepOrder: function(testSysId, startOrder) {
            var step = new GlideRecord('sys_atf_step');
            step.addQuery('test', testSysId);
            step.query();
            while (step.next()) {
                startOrder = startOrder + 1;
                step.order = startOrder;
                step.setWorkflow(false);
                step.update();
            }
        },

        /**
         * Moves all the test steps from on test to another
         * @param {string} fromTestSysId sys_atf_test.sys_id
         * @param {string} toTestSysId sys_atf_test.sys_id
         */
        moveSteps: function(fromTestSysId, toTestSysId) {
            var step = new GlideRecord('sys_atf_step');
            step.addQuery('test', fromTestSysId);
            new global.KLF_GlideRecordUtils().updateRecord('sys_atf_step', step.getEncodedQuery(), {
                test: toTestSysId
            });
        },

        /**
         * Copies the source test to another test
         * @param {string} sourceTestSysId sys_atf_test.sys_id
         * @returns {string} sys_atf_test.sys_id of test copy
         */
        copyTest: function(sourceTestSysId) {
            var userTestProcessor = new sn_atf.UserTestProcessor();
            try {
                return userTestProcessor.copyTest(sourceTestSysId);
            } catch ( /**@type{*}*/ ex) {
                gs.addErrorMessage(gs.getMessage("Unexpected error occurred while copying the test: {0}", ex.message));
                return '';
            }
        },

        /**
         * Looks through a test and returns the maximum value for the
         * sys_atf_step.order field
         * @param {string} testSysId sys_atf_test.sys_id
         * @returns {number} The maximum value for sys_atf_step.order
         */
        getMaxStepOrder: function(testSysId) {
            var maxOrder = new GlideAggregate('sys_atf_step');
            maxOrder.groupBy('test');
            maxOrder.addQuery('test', testSysId);
            maxOrder.addQuery('active', true);
            maxOrder.addAggregate('MAX', 'order');
            maxOrder.query();

            if (maxOrder.next()) {
                return parseInt(maxOrder.getAggregate('MAX', 'order')) || 0;
            } else {
                return 0;
            }
        }

    };

})();
//@ts-ignore -- I know this throws an error, but it allows VSCode to autocomplete the methods
var global = global || {};

/**
 * ServiceNow has a module called Business Calendar. Business Calendars are used to define time
 * periods that are significant to the business that differ from the standard calendar year.
 * 
 * Creating all the entries in a business calendar can be a tedious task. This script include
 * provides a way to create the entries for a fiscal quarter and fiscal year business calendar.
 * This script is specifically used to create the entries for the US Federal Government fiscal
 * year and quarters.
 * 
 * The significant methods are:
 * {@link global.KLF_CalendarCreator.createFiscalQuarterNameEntries} Creates the fiscal quarter name entries for a Business Calendar. The names of the entries must exist before creating the entries.
 * NOTE: You must create a business_calendar named "Fiscal Year" before calling this method.
 * {@link global.KLF_CalendarCreator.createFiscalQuarterEntries} Creates the fiscal quarter entries for a Business Calendar (business_calendar) called "Fiscal Quarter".
 * NOTE: You must create a business_calendar named "Fiscal Quarter" before creating the entries.
 * 
 * {@link global.KLF_CalendarCreator.createFiscalYearNameEntries} Creates the year name entries for a Business Calendar. The names of the entries must exist before creating the entries.
 * NOTE: You must create a business_calendar named "Fiscal Year" before calling this method.
 * {@link global.KLF_CalendarCreator.createFiscalYearEntries} Creates the fiscal year entries for a Business Calendar (business_calendar) called "Fiscal Year"
 * NOTE: You must create a business_calendar named "Fiscal Year" before creating the entries.
 * 
 * 
 * @example
 * // This will generate Fiscal Year calendar for the years 1999 to 2040
 * // This must be run in global scope
 * // You will receive the error: "Could not find calendar using name: Fiscal Year"
 * // if you have not created a calendar with the name "Fiscal Year" in the system
 * // before calling this method
 * global.KLF_CalendarCreator.createFiscalYearNameEntries(1999, 2040);
 * global.KLF_CalendarCreator.createFiscalYearEntries(1999, 2040); 
 * 
 * // This will generate Fiscal Quarter calendar for the years 1999 to 2040
 * // This must be run in global scope
 * // You will receive the error: "Could not find calendar using name: Fiscal Quarter"
 * // if you have not created a calendar with the name "Fiscal Quarter" in the system
 * // before calling this method
 * global.KLF_CalendarCreator.createFiscalQuarterNameEntries(1999, 2040);
 * global.KLF_CalendarCreator.createFiscalQuarterEntries(1999, 2040); 
 */

/**
 * @typedef {Object} KLF_CalendarCreatorConfig
 * @property {string} [fiscalYearCalendarName='Fiscal Year']
 * @property {string} [fiscalQuarterCalendarName='Fiscal Quarter']
 */
/**
 * @param {KLF_CalendarCreatorConfig} [config]
 */
global.KLF_CalendarCreator = function(config) {
    /** @type {KLF_CalendarCreatorConfig} */
    var _config = config || {
        fiscalQuarterCalendarName: '',
        fiscalYearCalendarName: ''
    };
    var fiscalYearCalendarName = _config.fiscalYearCalendarName || 'Fiscal Year';
    var fiscalQuarterCalendarName = _config.fiscalQuarterCalendarName || 'Fiscal Quarter';

    return {
        /**
         * business_calendar that holds calendar data
         * @param {string} calendarName
         * @returns {GlideRecord} business_calendar
         */
        getCalendarByName: function(calendarName) {
            var calender = new GlideRecord('business_calendar');
            if (calender.get('calendar_name', calendarName)) {
                return calender;
            } else {
                throw 'Could not find calendar using name: ' + calendarName;
            }
        },
        /**
         * Returns the span name
         * @param {string} quarterName One of Q1, Q2, Q3, or Q4
         * @param {number} year
         * @returns {GlideRecord} business_calendar_span_name
         */
        getQuarterSpanName: function(quarterName, year) {
            var calendar = this.getCalendarByName(fiscalQuarterCalendarName);
            var quarter = new GlideRecord('business_calendar_span_name');
            quarter.addQuery('calendar', calendar.getUniqueValue());
            quarter.addQuery('short_name', this.getFiscalQuarterSpanNameShortName(quarterName, year));
            quarter.query();
            if (quarter.next()) {
                return quarter;
            } else {
                throw 'Could not find quarter name using calendar: ' + calendar.getDisplayValue() + ' and quarter: ' + quarterName + ' and year: ' + year;
            }
        },
        /**
         * Uses the quarter and year to return a pair that represent the start and end
         * date of the quarter
         * @param {string} quarterName One of Q1, Q2, Q3, Q4
         * @param {number} year
         * @returns {[string,string]} A pair representing the start and end date
         */
        getQuarterDateRange: function(quarterName, year) {
            if (quarterName == 'Q1') {
                return [year - 1 + '-10-01 00:00:00', year - 1 + '-12-31 23:59:59'];
            } else if (quarterName == 'Q2') {
                return [year + '-01-01 00:00:00', year + '-03-31 23:59:59'];
            } else if (quarterName == 'Q3') {
                return [year + '-04-01 00:00:00', year + '-06-30 23:59:59'];
            } else if (quarterName == 'Q4') {
                return [year + '-07-01 00:00:00', year + '-09-30 23:59:59'];
            } else {
                throw 'No date range defined for quarter: ' + quarterName;
            }
        },
        /**
         * Creates a business calendar span for the quarter and
         * year
         * @param {string} quarterName One of Q1, Q2, Q3, Q4
         * @param {number} year
         * @returns {GlideRecord} a persisted business_calendar_span
         */
        createQuarter: function(quarterName, year) {
            var calendarSysId = this.getCalendarByName(fiscalQuarterCalendarName).getUniqueValue();
            var spanNameSysId = this.getQuarterSpanName(quarterName, year).getUniqueValue();
            var calendarSpan = new GlideRecord('business_calendar_span');
            var dateRange = this.getQuarterDateRange(quarterName, year);
            calendarSpan.addQuery('calendar', calendarSysId);
            calendarSpan.addQuery('start', dateRange[0]);
            calendarSpan.addQuery('end', dateRange[1]);
            calendarSpan.query();
            if (!calendarSpan.next()) {
                calendarSpan.newRecord();
            }
            calendarSpan.start = dateRange[0];
            calendarSpan.end = dateRange[1];
            calendarSpan.calendar = calendarSysId;
            calendarSpan.span_name = spanNameSysId;
            calendarSpan.update();
            return calendarSpan;
        },
        /**
         * Creates 4 fiscal quarters for the provided year. The quarters
         * are business_calendar_span records
         * @param {number} year
         * @returns {[GlideRecord, GlideRecord, GlideRecord, GlideRecord]} the four fiscal quarters business_calendar_span
         */
        createFiscalYearByQuarters: function(year) {
            return [
                this.createQuarter('Q1', year),
                this.createQuarter('Q2', year),
                this.createQuarter('Q3', year),
                this.createQuarter('Q4', year)
            ];
        },
        /**
         * Creates the fiscal quarter entries for a Business Calendar (business_calendar) called "Fiscal Quarter".
         * NOTE: You must create a business_calendar named "Fiscal Quarter" before creating the entries.
         * 
         * Creates all the calendar entries by quarter beginning at the start year
         * and ending at the end year
         * @param {number} startYear
         * @param {number} endYear
         */
        createFiscalQuarterEntries: function(startYear, endYear) {
            for (var year = startYear; year <= endYear; year++) {
                this.createFiscalYearByQuarters(year);
            }
        },
        /**
         * Creates the span names for the fiscal quarters for a calendar year
         * @param {number} startYear
         * @param {number} endYear
         */
        createFiscalQuarterNameEntries: function(startYear, endYear) {
            for (var year = startYear; year <= endYear; year++) {
                this.createFiscalQuartersNameEntriesByYear(year);
            }
        },
        /**
        * Creates 4 fiscal quarter span names for the provided year. The names
        * are business_calendar_span_name records. They serve as the labels for the
        * calendar entries
        * @param {number} year
        * @returns {[GlideRecord, GlideRecord, GlideRecord, GlideRecord]}
        the four fiscal quarters business_calendar_span
        */
        createFiscalQuartersNameEntriesByYear: function(year) {
            return [
                this.createFiscalQuarterName('Q1', year),
                this.createFiscalQuarterName('Q2', year),
                this.createFiscalQuarterName('Q3', year),
                this.createFiscalQuarterName('Q4', year)
            ];
        },
        /**
         * Returns the fiscal quarter span name short name
         * @param {string} quarter One of Q1, Q2, Q3, or Q4
         * @param {number} year
         * @returns {string}
         */
        getFiscalQuarterSpanNameShortName: function(quarter, year) {
            return year + ' ' + quarter;
        },

        /**
         * @param {string} quarter
         * @param {number} year
         */
        createFiscalQuarterName: function(quarter, year) {
            if(!quarter) {
                throw new Error('Quarter must be provided');
            }

            if(!year) {
                throw new Error('Year must be provided');
            }

            var calendarSysId = this.getCalendarByName(fiscalQuarterCalendarName).getUniqueValue();
            var spanName = new GlideRecord('business_calendar_span_name');
            var shortName = this.getFiscalQuarterSpanNameShortName(quarter, year);
            spanName.addQuery('short_name', shortName);
            spanName.addQuery('calendar', calendarSysId);
            spanName.query();
            if (!spanName.next()) {
                spanName.newRecord();
            }
            spanName.short_name = shortName;
            spanName.long_name = 'Fiscal Quarter ' + quarter;
            spanName.label = 'FY ' + year + ' ' + quarter;
            spanName.calendar = calendarSysId;
            spanName.update();
            return spanName;
        },

        /**
         * Uses the year to return a pair that represent the start and end
         * date of the year
         * @param {number} year
         * @returns {[string,string]} A pair representing the start and end
         */
        getYearDateRange: function(year) {
            return [year - 1 + '-10-01 00:00:00', year + '-09-30 23:59:59'];
        },

        /**
         * Returns the span name
         * @param {number} year
         * @returns {GlideRecord} business_calendar_span_name
         */
        getYearSpanName: function(year) {
            var calendar = this.getCalendarByName(fiscalYearCalendarName);
            var yearSpanName = new GlideRecord('business_calendar_span_name');
            yearSpanName.addQuery('calendar', calendar.getUniqueValue());
            yearSpanName.addQuery('short_name', year.toString());
            yearSpanName.query();
            if (yearSpanName.next()) {
                return yearSpanName;
            } else {
                throw 'Could not find year name using calendar: ' +
                    calendar.getDisplayValue() + ' and year: ' + year;
            }
        },
        /** 
         * Creates a business calendar span for the quarter and
         * year
         * @param {number} year
         * @returns {GlideRecord} a persisted business_calendar_span
         */
        createYear: function(year) {
            var calendarSysId = this.getCalendarByName(fiscalYearCalendarName).getUniqueValue();
            var spanNameSysId = this.getYearSpanName(year).getUniqueValue();
            var calendarSpan = new GlideRecord('business_calendar_span');
            var dateRange = this.getYearDateRange(year);
            calendarSpan.addQuery('calendar', calendarSysId);
            calendarSpan.addQuery('start', dateRange[0]);
            calendarSpan.addQuery('end', dateRange[1]);
            calendarSpan.query();
            if (!calendarSpan.next()) {
                calendarSpan.newRecord();
            }
            calendarSpan.start = dateRange[0];
            calendarSpan.end = dateRange[1];
            calendarSpan.calendar = calendarSysId;
            calendarSpan.span_name = spanNameSysId;
            calendarSpan.update();
            return calendarSpan;
        },
        /**
         * Creates the fiscal year entries for a Business Calendar (business_calendar) called "Fiscal Year"
         * NOTE: You must create a business_calendar named "Fiscal Year" before creating the entries.
         * 
         * Creates all the calendar entries by year beginning at the start year
         * and ending at the end year.
         * @param {number} startYear
         * @param {number} endYear
         */
        createFiscalYearEntries: function(startYear, endYear) {
            for (var year = startYear; year <= endYear; year++) {
                this.createYear(year);
            }
        },
        /**
         * Creates the span names for the fiscal calendar year
         * @param {number} startYear
         * @param {number} endYear
         */
        createFiscalYearNameEntries: function(startYear, endYear) {
            for (var year = startYear; year <= endYear; year++) {
                this.createFiscalYearName(year);
            }
        },
        /**
         *
         * @param {number} year
         * @returns {GlideRecord}
         */
        createFiscalYearName: function(year) {
            var calendarSysId = this.getCalendarByName(fiscalYearCalendarName).getUniqueValue();
            var spanName = new GlideRecord('business_calendar_span_name');
            /**@ts-ignore */
            var shortName = year.toString();
            spanName.addQuery('short_name', shortName);
            spanName.addQuery('calendar', calendarSysId);
            spanName.query();
            if (!spanName.next()) {
                spanName.newRecord();
            }
            spanName.short_name = shortName;
            spanName.long_name = 'Fiscal Year ' + year;
            spanName.label = 'FY ' + year;
            spanName.calendar = calendarSysId;
            spanName.update();
            return spanName;
        }
    };

};
/**
 * This class is used to execute shell commands on a mid server. The command is executed by sending an
 * ecc_queue record to the mid server by {@link global.KLF_CommandProbe#executeCommand}. 
 * The mid server processes the command and sends the output back to
 * the ecc_queue. 
 * 
 * The ecc_queue table is used to send messages between the application server and the mid server.
 * The ecc_queue table has a topic field that is used to determine what processing is done on the ecc_queue
 * record. In this case the topic is "KLF_CommandProbe". "KLF_CommandProbe" topics are picked up by the
 * business rule {@link global.KLF_CommandProbe.onRecordInserted} that processes the command output.
 * 
 * Once the command output is processed by {@link global.KLF_CommandProbe.onRecordInserted} an event is
 * created that can be handled by a Script Action. The event name is "klf_commandprobe.response".
 */

var global = global || {};

/**
 * For details on how to use this class refer to the {@link global.KLF_CommandProbe#executeCommand} function
 * @param {string} midServer The name of the mid server
 * @param {string} [name='KLF_CommandProbeES'] The name of the probe
 */
global.KLF_CommandProbe = function(midServer, name) {
    this.midServer = midServer;
    this.name = name || "KLF_CommandProbe";
};

/**
 * Called by business rule on the ecc_queue table when the input records
 * are created with the topic "KLF_CommandProbe"
 * @param {GlideRecord} eccQueue The ecc_queue record
 */
global.KLF_CommandProbe.onRecordInserted = function(eccQueue) {
    // eccQueue should have a payload that looks like this:
    // <results probe_time="2054">
    // <result command="whoami">
    // <stdout>servicenow</stdout>
    // <stderr/>
    // </result>
    // <parameters>
    // <parameter name="agent" value="mid.server.aws_midserver"/>
    // <parameter name="signature" value=""/>
    // <parameter name="response_to" value=""/>
    // <parameter name="from_sys_id" value=""/>
    // <parameter name="source" value="3a98e38397512110b2e1f97e6253af5f"/>
    // <parameter name="priority" value="2"/>
    // <parameter name="agent_correlator" value=""/>
    // <parameter name="processed" value=""/>
    // <parameter name="error_string" value=""/>
    // <parameter name="sys_id" value="f698e38397512110b2e1f97e6253af5f"/>
    // <parameter name="sequence" value="186b282130d0000001"/>
    // <parameter name="from_host" value=""/>
    // <parameter name="sys_created_on" value="2023-03-05 16:01:54"/>
    // <parameter name="sys_domain" value="global"/>
    // <parameter name="name" value="whoami"/>
    // <parameter name="topic" value="Command"/>
    // <parameter name="state" value="ready"/>
    // <parameter name="queue" value="output"/>
    // <parameter name="ecc_queue" value="f698e38397512110b2e1f97e6253af5f"/>
    // </parameters>
    // </results>

    var payload = eccQueue.getValue('payload');
    /**
     * This is actually a ServiceNow XMLDocument object. To get the API look at the Script Include
     * @type {XMLDocument}
     */
    // @ts-ignore
    var resultsDoc = new XMLDocument(payload);

    /**
     * This is a Java object. To get the API look at JavaDoc for org.w3c.dom.Node
     * The stdout and stderr elements hold the output of the command. stdout will have the output
     * if the command executed successfully. stderr will have the output if the command failed.
     */
    var stdout = resultsDoc.getNode('//stdout');
    var stderr = resultsDoc.getNode('//stderr');

    if (stdout || stderr) {
        var output = {
            stdout: stdout ? stdout.getTextContent() : '',
            stderr: stderr ? stderr.getTextContent() : ''
        };
        var outputJson = JSON.stringify(output);
        gs.eventQueue('klf_commandprobe.response', eccQueue, outputJson, eccQueue.getValue('source'));
    } else {
        gs.eventQueue('klf_commandprobe.response', eccQueue, '', eccQueue.getValue('source'));
    }
};

global.KLF_CommandProbe.prototype = {

    /**
     * Adds a parameter to the payload that can be retrieved by a mid server
     * script include using 
     * @param {XMLDocument} payloadDoc
     * @param {HTMLElement} parametersElement
     * @param {string} name 
     * @param {string} value 
     */
    _addParameter: function(payloadDoc, parametersElement, name, value) {
        var el = payloadDoc.createElement("parameter");
        el.setAttribute("name", name);
        el.setAttribute("value", value);
        parametersElement.appendChild(el);
        return el;
    },

    /**
     * Sets the shell command to execute
     * The shell command works with the ECC Queue. An output record is created on the ECC Queue that
     * sends the command to the mid server. The mid server executes the command and sends the output
     * by crating an input record on the ECC Queue. The input record is processed by {@link global.KLF_CommandProbe.onRecordInserted}
     * {@link global.KLF_CommandProbe.onRecordInserted} will create an event called "klf_commandprobe.response" that can be handled
     * by a Script Action that you create.
     * @param {string} command The shell command to execute
     * @returns {{sysId:string,source:string,agentCorrelator:string}} The sys_id of the ecc_queue record and the value of the source field
     */
    executeCommand: function(command) {
        // @ts-ignore
        var payloadDoc = new XMLDocument();
        var parametersElement = payloadDoc.createElement("parameters");
        this._addParameter(payloadDoc, parametersElement, "name", command);
        var agentCorrelator = gs.generateGUID();
        var commandOutput = new GlideRecord("ecc_queue");
        commandOutput.newRecord();
        commandOutput.agent = "mid.server." + this.midServer;
        commandOutput.queue = "output";
        commandOutput.state = "ready";
        commandOutput.topic = "Command";
        commandOutput.name = this.name;
        commandOutput.source = 'KLF_CommandProbe';
        commandOutput.agent_correlator = agentCorrelator;
        commandOutput.payload = payloadDoc.toString();

        return {
            sysId: commandOutput.insert(),
            source: commandOutput.source,
            agentCorrelator: commandOutput.agent_correlator,
        };
    }
};
/**
 * This was an initial attempt to create a utility to export data from a scoped application. The core of it
 * uses updated sets to export data. While this method does work it creates a large amount of data in the source
 * and target instance. This method of exporting data is not recommended for large data sets. The recommended
 * method is to use KLF_RecordSync instead.
 * 
 * There are a few methods in this script that are still useful and may be used in other scripts.
 */

//@ts-ignore
var global = global || {};
// Add logging so have a better idea of what's going on

/**
 * Uses community supported 
 * {@link https://developer.servicenow.com/connect.do#!/share/contents/9824957_add_to_update_set_utility?t=PRODUCT_DETAILS|Add to Update Set Utility}
 * to export application data to an update set.
 * 
 * Primary methods are {@link KLF_DataTransferUtils.exportAllDataInTable} which exports all
 * data in a table and {@link KLF_DataTransferUtils.enhancedAddToUpdateSet}. Exporting a record
 * will include the related attachments, journal field data, currency data, price data, and
 * audit data.
 * 
 * Before starting export you'll probably want to change the "display" value for sys_user to be
 * sys_user.user_name. By default ServiceNow will try to match sys_user records based on the display value
 * which may not be unique in the target instance of an export
 * 
 * There is also a function that will generate a summary of the record count for all the tables in the
 * scoped application. This is useful estimating the amount of data that will be exported.
 * {@link KLF_DataTransferUtils.generateExportSummary}
 * 
 * @example
 * // Exporting all data in a table to update set
 * var transferUtils = new global.KLF_DataTransferUtils();
 * transferUtils.exportAllDataInTable('incident');
 * 
 * // Exporting one record to update set
 * var incident = new GlideRecord('incident');
 * incident.query();
 * incident.next();
 * var transferUtils = new global.KLF_DataTransferUtils();
 * transferUtils.enhancedAddToUpdateSet(incident);
 */
global.KLF_DataTransferUtils = function() {
};

/**
 * Convenience function to quickly log an export summary of an entire scoped application
 * Logs the export summary to syslog with the source of KLF_DataTransferUtils
 * Refer to {@link global.KLF_DataTransferUtils.generateExportSummary}
 * @param {string} scopeName
 */
global.KLF_DataTransferUtils.logExportSummary = function(scopeName) {
    var transferUtils = new global.KLF_DataTransferUtils();
    gs.log(JSON.stringify(transferUtils.generateExportSummary(scopeName), null, 4), 'KLF_DataTransferUtils');
};

global.KLF_DataTransferUtils.prototype = {
    example: function() {
        var sysId = "8cf4884f9779311024d7b066f053af8c";
        var tableName = "x_53417_demo_cat_breed";
        var glideRecord = new GlideRecord(tableName);
        glideRecord.get(sysId);
        var transferUtils = new global.KLF_DataTransferUtils();
        transferUtils.deleteAllRecordsAndRelatedRecords('x_53417_demo_cat_breed');
        // transferUtils.enhancedAddToUpdateSet(glideRecord);
        // transferUtils.exportAllDataInTable('x_53417_demo_cat_breed');
        // deleteRecordAndRelatedRecords(sysId, tableName);
        // gs.info(transferUtils.getTablesInScope('x_53417_demo'));
    },

    /**
     * Generates a hierarchical map that contains the record count for each table in the scoped application
     * the root will be the scoped application with the sum of the record count of all the tables in the scoped application
     * Below is an example of the expected output
     * {
     *   "totalRecordCount": 2000, // Total record count of all the tables in the scoped application
     *   "tables": {
     *     "x_my_app_task": {
     *       "totalRecordCount": 2000, // Record count of the recordCount and relatedRecordCount
     *       "recordCount": 1000, // Record count of the table
     *       "relatedRecordCount": 1000, // Record count of related tables
     *       "relatedTables": {
     *         "sys_journal_field": {
     *           "totalRecordCount": 500
     *           "recordCount": 500,
     *           "relatedRecordCount": 0
     *         },
     *         "sys_attachment": {
     *           "totalRecordCount": 500,
     *           "recordCount": 500,
     *           "relatedRecordCount": 0
     *         }
     *       }
     *     }
     *   }
     * }
     * @param {string} scopeName
     * @returns {*}
     */
    generateExportSummary: function(scopeName) {
        var me = this;

        /**
         * Returns the record count of related tables. This is the
         * sum of the record count of records in
         * sys_attachment, sys_attachment_doc, sys_journal_field, sys_audit, fx_currency_instance, and fx_price
         */

        /**
         * Returns the record count of a table using GlideAggregate
         * @param {string} tableName
         * @param {string} [encodedQuery]
         */
        function getRecordCount(tableName, encodedQuery) {
            // Use GlideAggregate to get the record count for each table
            var aggregate = new GlideAggregate(tableName);
            if (encodedQuery) {
                aggregate.addEncodedQuery(encodedQuery);
            }
            aggregate.addAggregate("COUNT");
            aggregate.query();
            if (aggregate.next()) {
                return parseInt(aggregate.getAggregate("COUNT")) || 0;
            }
            return 0;
        }

        /**
         * Returns the record count of sys_audit for the given tableName. This needs to work
         * differently than {@link getRecordCount} because sys_audit does not have an index
         * on tablename which makes querying by tablename extremely slow
         * @param {string} tableName
         */
        function getAuditRecordCount(tableName) {
            // Use join query to filter sys_audit instead of GlideAggregate
            var audit = new GlideRecord('sys_audit');
            audit.addJoinQuery(tableName, 'documentkey', 'sys_id');
            audit.addQuery('tablename', tableName);
            audit.query();
            return audit.getRowCount();
        }

        /**
         * Returns the attachment size of all the attachments for the table using the encodedQuery and by
         * expanding the encodedQuery to included any tables that extend the base table
         * @param {string} baseTableName A table that is potentially extended
         * @param {*} [encodedQuery]
         * @returns {number} The size of all the attachments on the table
         */
        function getAttachmentSize(baseTableName, encodedQuery) {
            var _encodedQuery = encodedQuery || '';

            // The table could be extended. Get all the tables in the hierarchy including the table
            var extendedTables = me.getExtendingTables(baseTableName);
            return extendedTables.reduce(function(attachmentSize, extendedTableName) {
                // The encodedQuery could be an interpolated string. I allow the table name to be interpolated
                // using the pattern {{tableName}}. Replace the pattern with the actual table name
                var processedEncodedQuery = _encodedQuery.replace("{{tableName}}", extendedTableName);
                // Use GlideAggregate to get the record count for each table
                var aggregate = new GlideAggregate('sys_attachment');
                if (processedEncodedQuery) {
                    aggregate.addEncodedQuery(processedEncodedQuery);
                }
                var sum = 0;
                aggregate.addAggregate("SUM", "size_bytes");
                aggregate.addNotNullQuery('size_bytes');
                aggregate.setGroup(false); // Don't group by anything so I just sum all the rows
                aggregate.query();
                if (aggregate.next()) {
                    sum = parseInt(aggregate.getAggregate("SUM", "size_bytes")) || 0;
                }
                return attachmentSize + sum;
            }, 0);
        }

        /**
         * Returns the record count of the passed in table using the encodedQuery and by
         * expanding the encodedQuery to included any tables that extend the base table
         * @param {string} tableName 
         * @param {string} baseTableName A table that is potentially extended
         * @param {*} [encodedQuery]
         * @returns 
         */
        function getBaseRecordCount(tableName, baseTableName, encodedQuery) {
            var _encodedQuery = encodedQuery || '';


            // The table could be extended. Get all the tables in the hierarchy including the table
            var extendedTables = me.getExtendingTables(baseTableName);
            return extendedTables.reduce(function(recordCount, extendedTableName) {
                // The encodedQuery could be an interpolated string. I allow the table name to be interpolated
                // using the pattern {{tableName}}. Replace the pattern with the actual table name
                var processedEncodedQuery = _encodedQuery.replace("{{tableName}}", extendedTableName);
                if (tableName == 'sys_audit') {
                    return recordCount + getAuditRecordCount(extendedTableName);
                } else {
                    return recordCount + getRecordCount(tableName, processedEncodedQuery);
                }
            }, 0);
        }

        /**
         * This is the type definition for the table object that is contained in the application object
         * @typedef {{
         *  recordCount: number;
         *  relatedTables: {
         *      sys_attachment: {
         *          recordCount: number;
         *          relatedRecordCount: number;
         *          totalRecordCount: number;
         *      };
         *      sys_attachment_doc: {
         *          recordCount: number;
         *          relatedRecordCount: number;
         *          totalRecordCount: number;
         *      };
         *      sys_journal_field: {
         *          recordCount: number;
         *          relatedRecordCount: number;
         *          totalRecordCount: number;
         *      };
         *      sys_audit: {
         *          recordCount: number;
         *          relatedRecordCount: number;
         *          totalRecordCount: number;
         *      };
         *      fx_currency_instance: {
         *          recordCount: number;
         *          relatedRecordCount: number;
         *          totalRecordCount: number;
         *      };
         *      fx_price: {
         *          recordCount: number;
         *          relatedRecordCount: number;
         *          totalRecordCount: number;
         *      };
         *  };
         *  relatedRecordCount: number;
         *  totalRecordCount: number;
         * }} _Table
         */

        var application = {
            tables: /** @type {{[tableName:string]:_Table}} */ ({}),
            totalRecordCount: 0,
            totalAuditCount: 0,
            totalJournalCount: 0,
            totalAttachmentCount: 0,
            totalAttachmentSize: 0,
            totalAttachmentDocCount: 0,
            totalCurrencyCount: 0,
            totalPriceCount: 0
        };

        var tables = this.getBaseTablesInScope(scopeName);
        tables.reduce(function(application, /** @type {string} */ tableName) {
            /**
             * @param {string} relatedTableName 
             * @param {string} [encodedQuery]
             */
            function getRelatedTable(relatedTableName, encodedQuery) {
                var table = {
                    recordCount: getBaseRecordCount(relatedTableName, tableName, encodedQuery),
                    relatedRecordCount: 0,
                    totalRecordCount: 0
                };
                if (relatedTableName == 'sys_attachment') {
                    // @ts-ignore
                    table.totalAttachmentSize = getAttachmentSize(tableName, encodedQuery);
                }
                table.totalRecordCount = table.recordCount + table.relatedRecordCount;
                return table;
            }

            /** @type {_Table} */
            var table = {};
            table.recordCount = getRecordCount(tableName); // This gets record count of the table

            // I also need to get the record count of related tables
            // The related tables are sys_attachment, sys_attachment_doc, sys_journal_field, sys_audit, fx_currency_instance, and fx_price
            var relatedTables = {
                sys_attachment: getRelatedTable("sys_attachment", "table_name={{tableName}}^ORtable_name=ZZ_YY{{tableName}}"), // ZZ_YY prefix is used when attachments are used on attachment fields
                sys_attachment_doc: getRelatedTable("sys_attachment_doc", "sys_attachment.table_name={{tableName}}^ORsys_attachment.table_name=ZZ_YY{{tableName}}"), // ZZ_YY prefix is used when attachments are used on attachment fields
                sys_journal_field: getRelatedTable("sys_journal_field", "name={{tableName}}"),
                sys_audit: getRelatedTable("sys_audit"),
                fx_currency_instance: getRelatedTable("fx_currency_instance", "table={{tableName}}"),
                fx_price: getRelatedTable("fx_price", "table={{tableName}}")
            };

            table.relatedTables = relatedTables;

            // Sum the record count of the related tables
            table.relatedRecordCount = Object.keys(relatedTables).reduce(function(relatedRecordCount, relatedTable) {
                // @ts-ignore
                return relatedRecordCount + relatedTables[relatedTable].totalRecordCount;
            }, 0);

            table.totalRecordCount = table.recordCount + table.relatedRecordCount;

            application.totalRecordCount += table.totalRecordCount;
            application.totalAuditCount += table.relatedTables.sys_audit.totalRecordCount;
            application.totalJournalCount += table.relatedTables.sys_journal_field.totalRecordCount;
            application.totalAttachmentCount += table.relatedTables.sys_attachment.totalRecordCount;
            // @ts-ignore
            application.totalAttachmentSize += table.relatedTables.sys_attachment.totalAttachmentSize;
            application.totalAttachmentDocCount += table.relatedTables.sys_attachment_doc.totalRecordCount;
            application.totalCurrencyCount += table.relatedTables.fx_currency_instance.totalRecordCount;
            application.totalPriceCount += table.relatedTables.fx_price.totalRecordCount;
            application.tables[tableName] = table;
            return application;
        }, application);

        // convert attachment size to a human readable number
        // @ts-ignore
        application.totalAttachmentSize = this.getReadableFileSizeString(application.totalAttachmentSize);

        return application;
    },


    /**
     * Return a list of all the tables in the scoped application
     *
     * Exclude tables is a list of tables that will be removed from the list. Tables in the
     * exclude list will exclude the excluded table and any table that extends the excluded table
     * @param {string} scopeNamespace
     * @param {string[]} [excludedTables]
     */
    getTablesInScope: function(scopeNamespace, excludedTables) {
        var _excludedTables = excludedTables || [];
        var me = this;

        var tables = [];
        var tableDefinition = new GlideRecord("sys_db_object");
		// Scope.Scope = scopeNamespace
		// OR
		// Scope.Name = scopeNamespace AND Scope.Scope = global
        tableDefinition.addEncodedQuery([
			'sys_scope.scope=' + scopeNamespace,
			'^scriptable_table=false',
			'^NQ', // This means New Query. It's a way of running two distinct filters
			'sys_scope.name=' + scopeNamespace,
			'^sys_scope.scope=global',
			'^scriptable_table=false'
		].join(''));
        tableDefinition.addQuery("scriptable_table", false);
        tableDefinition.query();
        while (tableDefinition.next()) {
            var tableName = tableDefinition.name.toString();
            // Make sure this table actually exists
            if (new GlideRecord(tableName).isValid()) {
                tables.push(tableName);
            }
        }
        return tables.filter(function(table) {
            var hierarchy = me.getTableAncestors(table);
            // Check the hierarchy to make sure none of the excluded tables are in the hierarchy
            return _excludedTables.every(function(excludedTable) {
                return hierarchy.indexOf(excludedTable) == -1;
            });
        });
    },

    /**
     * Returns list of tables that extend the table
     * @param {string} table
     * @returns {string[]}
     */
    getExtendingTables: function(table) {
        return new global.ArrayUtil().convertArray(new global.TableUtils(table).getAllExtensions())
            .map(function(table) {
                return String(table);
            });
    },

    /**
     * Returns list of tables in the parent hierarchy including the table
     * @param {string} table
     * @returns {string[]}
     */
    getTableAncestors: function(table) {
        return new global.ArrayUtil().convertArray(new global.TableUtils(table).getTables())
            .map(function(table) {
                return String(table);
            });
    },

    /**
     * Returns the name of a table that is in the application scope that this table extends.
     * If the table does not extend a table it returns the table name
     * @param {string} scopeNamespace 
     * @param {string} table 
     * @returns 
     */
    getBaseTableInScope: function(scopeNamespace, table) {
        // hierarchy is arranged from extended table to base table. The absolute base table will be last in the list.
        // This plucks the last table in the list until it finds one that matches the scopeNamespace
        var hierarchy = this.getTableAncestors(table);
        var baseInScope = '';
        // @ts-ignore
        while (baseInScope = hierarchy.pop()) {
            if (baseInScope.startsWith(scopeNamespace)) {
                break;
            }
        }
        return baseInScope || table;
    },

    /**
     * This returns only the base tables in the scope. The difference between this and
     * {@link KLF_DataTransferUtils.getTablesInScope} is that this method will filter out any
     * table extensions and only include the base tables and any tables that aren't extended.
     * 
     * Exclude tables is a list of tables that will be removed from the list. Tables in the
     * exclude list will exclude the excluded table and any table that extends the excluded table
     * @param {string} scopeNamespace
     * @param {string[]} [excludedTables]
     */
    getBaseTablesInScope: function(scopeNamespace, excludedTables) {
        if (!scopeNamespace) {
            return [];
        }

        var _excludedTables = excludedTables || [];
        var me = this;

        // holds the unique list of base tables. the key is the base table name
        // the value is not used
        var baseTableMap = this.getTablesInScope(scopeNamespace).reduce(function(baseTables, table) {
            baseTables[me.getBaseTableInScope(scopeNamespace, table)] = null;
            return baseTables;
        }, {});
        return Object.keys(baseTableMap).filter(function(table) {
            var hierarchy = me.getTableAncestors(table);
            // Check the hierarchy to make sure none of the excluded tables are in the hierarchy
            return _excludedTables.every(function(excludedTable) {
                return hierarchy.indexOf(excludedTable) == -1;
            });
        });
    },

    /**
     * Adds the record's related journal entries to the update set
     * @param {GlideRecord} parent
     */
    addJournalEntries: function(parent) {
        var journal = new GlideRecord("sys_journal_field");
        // Intentionally using GlideRecord.getRecordClassName because it will correctly
        // handle returning the correct table name when dealing with extended records
        journal.addQuery("name", parent.getRecordClassName());
        journal.addQuery("element_id", parent.getUniqueValue());
        journal.query();
        while (journal.next()) {
            // Using saveRecord to add these records to the update set directly w/out
            // going through all the things that addToUpdateSet does
            // 
            new global.addToUpdateSetUtils().saveRecord(journal, true, false);
        }
    },

    /**
     * Adds the record's related audit entries to the update set
     * @param {GlideRecord} parent
     */
    addAuditEntries: function(parent) {
        var audit = new GlideRecord("sys_audit");
        // Intentionally using GlideRecord.getRecordClassName because it will correctly
        // handle returning the correct table name when dealing with extended records
        audit.addQuery("tablename", parent.getRecordClassName());
        audit.addQuery("documentkey", parent.getUniqueValue());
        audit.query();
        while (audit.next()) {
            // Using saveRecord to add these records to the update set directly w/out
            // going through all the things that addToUpdateSet does
            new global.addToUpdateSetUtils().saveRecord(audit, true, false);
        }
    },

    /**
     * Adds the record's related currency entries to the update set
     * @param {GlideRecord} parent
     */
    addCurrencyEntries: function(parent) {
        var currency = new GlideRecord("fx_currency_instance");
        // Intentionally using GlideRecord.getRecordClassName because it will correctly
        // handle returning the correct table name when dealing with extended records
        currency.addQuery("table", parent.getRecordClassName());
        currency.addQuery("id", parent.getUniqueValue());
        currency.query();
        while (currency.next()) {
            // Using saveRecord to add these records to the update set directly w/out
            // going through all the things that addToUpdateSet does
            new global.addToUpdateSetUtils().saveRecord(currency, true, false);
        }
    },

    /**
     * Adds the record's related currency entries to the update set
     * @param {GlideRecord} parent
     */
    addPriceEntries: function(parent) {
        var price = new GlideRecord("fx_price");
        // Intentionally using GlideRecord.getRecordClassName because it will correctly
        // handle returning the correct table name when dealing with extended records
        price.addQuery("table", parent.getRecordClassName());
        price.addQuery("id", parent.getUniqueValue());
        price.query();
        while (price.next()) {
            // Using saveRecord to add these records to the update set directly w/out
            // going through all the things that addToUpdateSet does
            new global.addToUpdateSetUtils().saveRecord(price, true, false);
        }
    },

    /**
     * Adds the record and its related audit entries, journal entries, and attachments to the update set
     * @param {GlideRecord} glideRecord
     */
    enhancedAddToUpdateSet: function(glideRecord) {
        var _addToUpdateSetUtils = new global.addToUpdateSetUtils();
        // Disable adding attachments to the update set. Attachments
        // are already included in the base record XML for data records
        _addToUpdateSetUtils.includeAttachments = false;
        _addToUpdateSetUtils.addToUpdateSet(glideRecord);
        this.addAuditEntries(glideRecord);
        this.addJournalEntries(glideRecord);
    },

    /**
     * Use {@link KLF_DataTransferUtils.enhancedAddToUpdateSet} to export all the data in a table
     * @param {string} tableName
     */
    exportAllDataInTable: function(tableName) {
        var glideRecord = new GlideRecord(tableName);
        glideRecord.query();
        while (glideRecord.next()) {
            this.enhancedAddToUpdateSet(glideRecord);
        }
    },

    /**
     * Exportal all the data in the scope excluding any tables listed in the excluded table
     * list
     * @param {string} scopeNamespace
     * @param {string[]} excludedTables
     */
    exportAllDataInScope: function(scopeNamespace, excludedTables) {
        var tables = this.getBaseTablesInScope(scopeNamespace, excludedTables);
        var me = this;
        tables.forEach(function(table) {
            me.exportAllDataInTable(table);
        });
    },

    /**
     * Deletes all records and related audit entries, journal entries, and attachments in a scope
     * Useful for when you are testing loading data from a different instance and you want
     * to delete the data before loading new data
     * @param {string} scopeNamespace
     * @param {string[]} excludedTables
     */
    deleteAllRecordsAndRelatedRecordsInScope: function(scopeNamespace, excludedTables) {
        if (!scopeNamespace) {
            gs.error("scopeNamespace is required");
            return;
        }

        var tables = this.getTablesInScope(scopeNamespace, excludedTables);
        var me = this;
        tables.forEach(function(table) {
            me.deleteAllRecordsAndRelatedRecords(table);
        });
    },

    /**
     * Deletes all records and related audit entries, journal entries, and attachments in a table
     * Useful for when you are testing loading data from a different instance and you want
     * to delete the data before loading new data
     * @param {string} tableName
     */
    deleteAllRecordsAndRelatedRecords: function(tableName) {
        var me = this;

        if (!tableName) {
            gs.error("tableName is required");
            return;
        }

        var glideRecord = new GlideRecord(tableName);
        glideRecord.query();
        // Collect all sys_ids before deleting records
        var sysIds = [];
        while (glideRecord.next()) {
            sysIds.push(glideRecord.getUniqueValue());
        }

        // Delete all the records at once
        glideRecord.setWorkflow(false);
        glideRecord.deleteMultiple();

        // Delete related audit entries
        sysIds.forEach(function(sysId) {
            me.deleteRecordAndRelatedRecords(sysId, tableName);
        });
    },

    /**
     * Deletes a record and its related audit entries, journal entries, and attachments
     * Useful for when you are testing loading data from a different instance and you want
     * to delete the data before loading new data
     * @param {string} sysId
     * @param {string} tableName
     */
    deleteRecordAndRelatedRecords: function(sysId, tableName) {
        if (!sysId || !tableName) {
            gs.error("sysId and tableName are required");
            return;
        }

        // Delete related audit entries
        var audit = new GlideRecord("sys_audit");
        audit.addQuery("tablename", tableName);
        audit.addQuery("documentkey", sysId);
        audit.deleteMultiple();

        // Delete related journal entries
        var journal = new GlideRecord("sys_journal_field");
        journal.addQuery("name", tableName);
        journal.addQuery("element_id", sysId);
        journal.deleteMultiple();

        // Delete related attachments
        var attachment = new GlideRecord("sys_attachment");
        attachment
            .addQuery("table_name", tableName)
            .addOrCondition("table_name", "ZZ_YY" + tableName);
        attachment.addQuery("table_sys_id", sysId);
        attachment.deleteMultiple();

        // Delete related history entries
        var historySet = new GlideRecord("sys_history_set");
        historySet.addQuery("table", tableName);
        historySet.addQuery("id", sysId);
        historySet.deleteMultiple();

        var record = new GlideRecord(tableName);
        record.addQuery("sys_id", sysId);
        record.deleteMultiple();
    },

    /**
     * Returns the number of bytes in a human readable size
     * @param {number} fileSizeInBytes The number of bytes
     * @returns {string} A human readable file size
     */
    getReadableFileSizeString: function(fileSizeInBytes) {
        var i = -1;
        var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
        do {
            fileSizeInBytes /= 1024;
            i++;
        } while (fileSizeInBytes > 1024);

        return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
    }
};
/**
 * This utility object provides a convenient way to execute GlideRecord operations from a scoped application
 * on globally scoped tables. This is useful when you need to perform operations on tables that are restricted
 * to global scope.
 * 
 * It also provides a function to transform a GlideRecord into a map. This is useful when you need to pass
 * GlideRecord data to a client script. The map can be easily converted to JSON and passed to the client script.
 */

//@ts-ignore
var global = global || {};
global.KLF_GlideRecordUtils = function() {};

global.KLF_GlideRecordUtils.prototype = {
    /**
     * Transforms the GlideRecord into a map. The exact set of fields to be included can be passed.
     * If fields is not provided then all non 'sys' fields will be included. Sys fields are excluded
     * from output. The keys in the map are the field names. Thevalues are the values retrieved with
     * {@link GlideRecord#getValues}. Display values are copied over to the key value with a suffix of
     * _display_value. A write flag is copied to the key value witha suffie of _canwrite
     * @param {GlideRecord} glideRecord 
     * @param {string[]} [fields]
     * @returns {Object.<string,string>}
     */
    glideRecordToMap: function(glideRecord, fields) {
        /** @type {Object.<string, string>} */
        var glideRecordMap = {};
        var elements = new global.ArrayUtil().convertArray(glideRecord.getElements());
        elements.filter(function(element) {
            var name = element.getName();

            // if the fields are specified only include fields in map
            if (fields) {
                return fields.indexOf(name) >= 0;
            }

            if (name == 'sys_id') {
                return true;
            } else if (name.startsWith('sys_')) {
                return false;
            } else {
                return true;
            }
        }).forEach(function(element) {
            var name = element.getName();
            var displayName = name + '_display_value';
            var writeName = name + '_canwrite';
            var value = glideRecord.getValue(name);
            var displayValue = glideRecord.getDisplayValue(name);
            glideRecord[name] = value;
            glideRecord[displayName] = displayValue;
            glideRecord[writeName] = glideRecord[name].canWrite();
        });

        return glideRecordMap;
    },

    /**
     * Used to delete records from tables only accessible in Global scope. Some tables
     * restrict delete access to only Global so a scoped application can use this method
     * to delete records in global scope they otherwise wouldn't be able to delete. You
     * can pass the encodedQuery by generating an encodedQuery using a GlideRecord in the
     * current scope and pass it to this function
     * @param {string} tableName The table name to perform deletion
     * @param {string} encodedQuery An encoded query passed to this function to filter
     * the records to delete
     * query params before deletion. This is required
     * @example var taskDelete = new GlideRecord('task');
     * taskDelete.addQuery(active, false);
     * new global.KLF_GlideRecord().deleteRecord('incident', taskDelete.getEncodedQuery());
     */
    deleteRecord: function(tableName, encodedQuery) {
        if (!encodedQuery) {
            throw 'encodedQuery is required';
        }

        var glideRecord = new GlideRecord(tableName);
        glideRecord.addEncodedQuery(encodedQuery);
        glideRecord.query();

        while (glideRecord.next()) {
            glideRecord.deleteRecord();
        }
    },

    /**
     * Used to insert records from tables only accessible in Global scope. Some tables
     * restrict write access to only Global so a scoped application can use this method
     * to insert records in global scope they otherwise wouldn't be able to update. 	
     * @param {string} tableName The table name to perform deletion
     * @param {*} updates An object containing the fields and values to update
     * @example var taskInsert = new GlideRecord('task');
     * new global.KLF_GlideRecord().insertRecord('incident', {
     *   short_description: 'Updated description'
     * });
     */
    insertRecord: function(tableName, updates) {
        if (!updates) {
            throw 'updates is required';
        }

        var glideRecord = new GlideRecord(tableName);
        glideRecord.newRecord();

        Object.keys(updates).forEach(function(field) {
            glideRecord.setValue(field, updates[field]);
        });
        glideRecord.update();
        return glideRecord;
    },

    /**
     * Used to update records from tables only accessible in Global scope. Some tables
     * restrict write access to only Global so a scoped application can use this method
     * to update records in global scope they otherwise wouldn't be able to update. You
     * can pass the encodedQuery by generating an encodedQuery using a GlideRecord in the
     * current scope and pass it to this function
     * @param {string} tableName The table name to perform deletion
     * @param {string} encodedQuery An encoded query passed to this function to filter
     * @param {*} updates An object containing the fields and values to update
     * @returns {string[]} An array of sys_ids of the records updated
     * @example var taskUpdate = new GlideRecord('task');
     * taskUpdate.addQuery(active, false);
     * new global.KLF_GlideRecord().updateRecord('incident', taskUpdate.getEncodedQuery(), {
     *   short_description: 'Updated description'
     * });
     */
    updateRecord: function(tableName, encodedQuery, updates) {
        if (!encodedQuery) {
            throw 'encodedQuery is required';
        }
        if (!updates) {
            throw 'updates is required';
        }

        var glideRecord = new GlideRecord(tableName);
        glideRecord.addEncodedQuery(encodedQuery);
        glideRecord.query();

        /** @type {string[]} */
        var updatedSysIds = [];
        while (glideRecord.next()) {
            Object.keys(updates).forEach(function(field) {
                glideRecord.setValue(field, updates[field]);
            });
            glideRecord.update();
            updatedSysIds.push(glideRecord.getUniqueValue());
        }

        return updatedSysIds;
    }

};
/**
 * This script contains general functions that help with group management in ServiceNow.
 * - getGroupByName: Retrieves the sys_user_group based on a group name or alias.
 * - getGroupFields: Finds all the fields that reference sys_user_group in a scoped app.
 * - changeGroupName: This looks for all references to group `oldName` in the system and replaces 
 * that group reference with the `newName` group. This is useful for when an application needs to update all the references of an old group
 * to a new group
 * - syncChildGroupMembers: This will make the membership of the parent group equal to the membership of its child groups. Basically, it copies the child group membership
 * into the parent group
 */

//@ts-ignore
var global = global || {};

global.KLF_GroupUtils = function() {};

global.KLF_GroupUtils.prototype = {

    /**
     * Retrieves the sys_user_group based on a group alias. The alias can alson include
     * the ServiceNow concatenated alias.
     * @param {string} name One of the aliases for a group.
     * @returns {?GlideRecord} The sys_user_group or null
     */
    getGroupByName: function(name) {
        if (!name) return null;

        var group = new GlideRecord('sys_user_group');
        group.addQuery('name', name)
            .addOrCondition('name', 'CONTAINS', name + '^')
            .addOrCondition('name', 'CONTAINS', '^' + name);
        group.query();
        while (group.next()) {
            /** @type {string} **/
            var groupName = group.name.toString();
            if (groupName.split('^').length > 1) {
                var aliases = groupName.split('^');
                var match = aliases.some(function(alias) {
                    return name == alias;
                });
                if (match) {
                    return group;
                }
            } else {
                return group; // exact match
            }
        }

        gs.warn('Cannot find group by name: ' + name);

        return null;
    },

    /**
     * Data type returned from call to {@link GroupUtils.getGroupFields}
     * @typedef GroupField
     * @property {string} table The name of the table that contains the field
     * @property {string} type The type of the field from sys_dictionary
     * @property {string} columnName The column name of the field
     * @property {?string} [filter] A pass through optional filter. Used to query for records that contain the field
     */

    /**
     * Finds all the fields that reference sys_user_group in a scoped app. This attempts to find
     * all the group fields in the system. The group fields will include both reference fields and
     * list fields that reference sys_user_group
     * @param {string} scopeSysId sys_scope.sys_id
     * @param {string} [filter] GlideRecord encoded query
     * @returns {GroupField[]}
     */
    getGroupFields: function(scopeSysId, filter) {
        var fieldGr = new GlideRecord('sys_dictionary');
        fieldGr.addQuery('sys_scope', scopeSysId);
        fieldGr.addQuery('reference', 'sys_user_group');
        fieldGr.query();
        var fields = [];
        while (fieldGr.next()) {
            fields.push({
                table: fieldGr.name.toString(),
                type: fieldGr.internal_type.toString(),
                columnName: fieldGr.element.toString(),
                filter: filter
            });
        }
        return fields;
    },

    /**
     * Uses the field retrieved from {@link GroupUtils.getGroupFields}
     * to query for records and update the group name. The field
     * must be a list field. This will only update the specific group in the list
     * and leave the rest of the groups in place
     * @param {GroupField} field
     * @param {GlideRecord} oldGroup
     * @param {GlideRecord} newGroup
     * @returns {string[]} A list of sys_ids that have been updated
     */
    updateListGroupField: function(field, oldGroup, newGroup) {
        var gr = new GlideRecord(field.table);
        gr.addQuery(field.columnName, oldGroup.sys_id.toString());
        if (field.filter) {
            gr.addEncodedQuery(field.filter);
        }
        gr.query();
        var updates = [];
        while (gr.next()) {
            gr.setWorkflow(false);
            gr.autoSysFields(false);
            var groups = gr.getValue(field.columnName);
            var updatedGroups = groups.split(',').map(function(sys_id) {
                if (sys_id == oldGroup.sys_id.toString()) {
                    return newGroup.sys_id.toString();
                } else {
                    return sys_id;
                }
            }).join(',');
            gr.setValue(field.columnName, updatedGroups);
            gr.update();
            updates.push(gr.getUniqueValue());
        }
        return updates;
    },

    /**
     * Uses the field retrieved from {@link GroupUtils.getGroupFields}
     * to query for records and update the group name. The field
     * must be a reference field
     * @param {GroupField} field
     * @param {GlideRecord} oldGroup
     * @param {GlideRecord} newGroup
     * @returns {string[]} A list of sys_ids that have been updated
     */
    updateReferenceGroupField: function(field, oldGroup, newGroup) {
        var gr = new GlideRecord(field.table);
        // only kill the workflow isf the table isn't tracked
        gr.addQuery(field.columnName, oldGroup.sys_id.toString());
        if (field.filter) {
            gr.addEncodedQuery(field.filter);
        }
        gr.query();
        var updates = [];
        while (gr.next()) {
            gr.setWorkflow(false);
            gr.autoSysFields(false);
            gr.setValue(field.columnName, newGroup.sys_id.toString());
            gr.update();
            updates.push(gr.getUniqueValue());
        }
        return updates;
    },

    /**
     * @typedef ReportEntry
     * @property {string} sysId The sys_id of the record that was updated
     * @property {string} table Table of the record that was updated
     * @property {string} column Column of the table that was updated
     * @property {string} oldName The old group name
     * @property {string} newName The new group name
     */

    /**
     * This looks for all references to group oldName in the system and replaces
     * that group reference with the newName gorup. A GlideRecord encoded query can
     * be provided to filter for records that you want to target. If no filter is provided
     * all records in the system will attempt to be updated with the new name. This
     * method is useful when there are changes to group names. This method will
     * not look at sys_properties or any hardcoded sys_ids or group names you may directly have
     * in source code. It also doesn't look at notifications or email scripts.
     * To find references in code you may want to search sys_metadata using text search for the
     * old group name
     * @param {string} scopedAppName The name of the scoped application to query for group fields
     * @param {string} oldName The old name of the group
     * @param {string} newName The new name of the group
     * @param {string} [filter] GlideRecord encoded query
     * @returns {ReportEntry[]}
     */
    changeGroupName: function(scopedAppName, oldName, newName, filter) {
        var scopedApp = new GlideRecord('sys_scope');
        if (!scopedApp.get('name', scopedAppName)) {
            gs.error('Could not find scoped app using name: ' + scopedAppName);
        }
        var scopedAppSysId = scopedApp.getUniqueValue();

        var me = this;
        /** @type {ReportEntry[]} */
        var report = [];
        var oldGroup = /** @type {GlideRecord} */ (this.getGroupByName(oldName));
        var newGroup = /** @type {GlideRecord} */ (this.getGroupByName(newName));

        if (!oldGroup) {
            gs.error('Cannot find group: ' + oldName);
            return [];
        }

        if (!newGroup) {
            gs.error('Cannot find group: ' + newName);
            return [];
        }

        me.getGroupFields(scopedAppSysId, filter).forEach(function(field) {
            if (field.type == 'reference') {
                var updatedSysIds = me.updateReferenceGroupField(field, oldGroup, newGroup);
                var referenceReport = updatedSysIds.map(function(sysId) {
                    return {
                        sysId: sysId,
                        table: field.table,
                        column: field.columnName,
                        oldName: oldName,
                        newName: newName
                    };
                });
                report = /** @type {ReportEntry[]} */ ([]).concat(report, referenceReport);
            } else if (field.type == 'glide_list') {
                var updatedListSysIds = me.updateListGroupField(field, oldGroup, newGroup);
                var listReport = updatedListSysIds.map(function(sysId) {
                    return {
                        sysId: sysId,
                        table: field.table,
                        column: field.columnName,
                        oldName: oldName,
                        newName: newName
                    };
                });

                report = /** @type {ReportEntry[]} */ ([]).concat(report, listReport);
            } else {
                gs.error('Cannot update field: ' + field.table + '.' + field.columnName + ' : ' + field.type);
            }
        });

        return report;
    },

    /**
     * This will make the membership of the parent group equal to the membership of its child groups. Child groups
     * are groups where the sys_user_group.parent field is set to the passed in parentGroupSysId
     * This will sync the membership exactly. If there is a member in the parent group that is not in one of the
     * child groups that member will be removed. All members of child groups will be added directly to the passed
     * in parent group
     * @param {string} parentGroupSysId
     */
    syncChildGroupMembers: function(parentGroupSysId) {
        var parentGroup = new GlideRecord('sys_user_group');
        parentGroup.get(parentGroupSysId);

        // This will hold the sys_ids of all the members of all the child groups of the parent
        // group. I will initialize this with the current members of the parent group. These will
        // be initialized to "false". If I see the current member in one of the child groups the
        // flag will be set to "true". This is so I can clean up members that no longer exist in
        // the child group
        var members = /** @type {{[userSysId:string]:boolean}} */ ({});

        // Load up the current members
        var currentMember = new GlideRecord('sys_user_grmember');
        currentMember.addQuery('group', parentGroup.getUniqueValue());
        currentMember.query();
        while (currentMember.next()) {
            // Default this to false. I'm using this later to see if
            // the user is still in the aggregated parent group
            members[currentMember.getValue('user')] = false;
        }

        // Go through all the child groups and populate the member object. Any member
        // that is seen will be set to "true"
        var childGroup = new GlideRecord('sys_user_group');
        childGroup.addQuery('parent', parentGroup.getUniqueValue());
        childGroup.query();
        while (childGroup.next()) {
            // Get members
            var groupMember = new GlideRecord('sys_user_grmember');
            groupMember.addQuery('group', childGroup.getUniqueValue());
            groupMember.query();
            while (groupMember.next()) {
                members[groupMember.getValue('user')] = true;
            }
        }

        var memberSysIds = Object.keys(members);

        // Valid members are all members we saw in the child groups
        var validMembers = memberSysIds.filter(function(memberSysId) {
            return members[memberSysId];
        });
        addMembers(parentGroup.getUniqueValue(), validMembers);

        // Invalid members are all members that are in the parent group that we didn't
        // see in the child group
        var invalidMembers = memberSysIds.filter(function(memberSysId) {
            return !members[memberSysId];
        });
        removeMembers(parentGroup.getUniqueValue(), invalidMembers);

        /**
         * Adds the list of users to the group
         * @param {string} groupSysId sys_user_group.sys_id
         * @param {string[]} memberSysIds sys_user.sys_id[]
         */
        function addMembers(groupSysId, memberSysIds) {
            memberSysIds.forEach(function(memberSysId) {
                var groupMember = new GlideRecord('sys_user_group');
                groupMember.addQuery('group', groupSysId);
                groupMember.addQuery('user', memberSysId);
                groupMember.query();
                if (groupMember.getRowCount() === 0) {
                    groupMember.newRecord();
                    groupMember.group = groupSysId;
                    groupMember.user = memberSysId;
                    groupMember.update();
                }
            });
        }

        /**
         * Removes the list of users from the group
         * @param {string} groupSysId sys_user_group.sys_id
         * @param {string[]} memberSysIds sys_user.sys_id[]
         */
        function removeMembers(groupSysId, memberSysIds) {
            memberSysIds.forEach(function(memberSysId) {
                var groupMember = new GlideRecord('sys_user_group');
                groupMember.addQuery('group', groupSysId);
                groupMember.addQuery('user', memberSysId);
                groupMember.query();
                if (groupMember.next()) {
                    groupMember.deleteRecord();
                }
            });
        }
    }
};
/**
 * This script is used to ingest groups from LDAP into ServiceNow. Depending on the configuration
 * it can also properly ingest nested groups by recursively adding the members of nested groups
 * to the parent group.
 * 
 * It can ingest a single group or multiple groups. It can also refresh the membership of multiple
 * groups based on the group type names or sys_ids.
 */

//@ts-ignore
var global = global || {};
/**
 * There was no where to put this information, so storing it here. These are the attributes
 * available for active directory LDAP entry:
 * actualdn,cn,description,displayName,distinguishedName,dn,
 * extensionAttributel,extensionAttribute2,groupType,instanceType,
 * internetEncoding, mail, mailNickname, me.mber, memberOf, name, objectCategory,
 * objectClass,objectGUID,objectSid,proxyAddresses,reportToOriginator,
 * sAMAccountName,sAMAccountType,showinAddressBook,source,uSNChanged,
 * uSNCreated,whenChanged,whenCreated
 */
/**
 * @class global.KLF_LdapGroupService
 * @param {Object} [connectionConfig] A configuration object
 * @param {boolean} [connectionConfig.includeNestedGroups=false] Includes the members of any nested groups in resolved groups.
 * Otherwise only the top level members .will be included
 * @param {string} [connectionConfig.ldapServerName=LDAP] The ldap server name of the LDAP server to query against. Will be set to
 * LDAP by default if isActiveDirectoryGroups is false, LDAP-AD otherwise
 * @param {boolean} [connectionConfig.isActiveDirectoryGroups=false] Configures searches to run against active directory
 * @param {string} [connectionConfig.ingestTypeName=KLF_LDAP_GROUP] The sys_user_group_type that is added to a new group that is ingested by this class.
 * This will be set to KLF_LDAP_GROUP if isActiveDirectoryGroups is false, KLF_LDAP_AD otherwise
 * @param {string} [connectionConfig.searchRdn=ou=Groups] The rdn to limit searches of the directory to. For LDAP groups
 * this defaults to ou=Groups. Empty string is default for AD
 * @param {string} [connectionConfig.logSource=KLF_LdapGroupService] The source to add to log messages generated by this class. By default
 * KLF_LdapGroupService
 */
function KLF_LdapGroupService(connectionConfig) {
    connectionConfig = connectionConfig || {};
    this.includeNestedGroups = connectionConfig.includeNestedGroups || false;
    this.isActiveDirectoryGroups = connectionConfig.isActiveDirectoryGroups || false;
    this.logSource = connectionConfig.logSource || 'KLF_LdapGroupService';
    var defaultLdapServerName = this.isActiveDirectoryGroups ? 'LDAP-AD' : 'LDAP';
    this.ldapServerSysId = this._getLdapServerSysIdByName(connectionConfig.ldapServerName || defaultLdapServerName);
    this.processedGroups = [];
    var defaultingestTypeName = this.isActiveDirectoryGroups ?
        this.getDefaultAdGroupTypeName() : this.getDefaultLdapGroupTypeName();
    this.ingestTypeName = connectionConfig.ingestTypeName || defaultingestTypeName;
    var defaultSearchRdn = this.isActiveDirectoryGroups ? '' : 'ou=Groups~';
    this.searchRdn = connectionConfig.searchRdn || defaultSearchRdn;
}

KLF_LdapGroupService.prototype = {
    /**
     * These properties are not accessible directly. You must call
     * LdapResult.get to retrieve these values, and LdapResult.get does not
     * return a JavaScript string. I'm not exactly sure what this is returning,
     * but you need to wrap the return in a string constructor like
     * String(result.get('cn')). If you don't do this i've found some string methods
     * do not work correctly
     * @typedef {Hashtable<'cn'|'dn'|'description'|'source'|'uniquemember'|'member'|'employeeNumber'>} LdapResult
     * {string} en
     * {string} dn
     * {string} description Description of group
     * {string} source DN with a prefix of 'ldap:'
     * {string?} uniquemember Concatenated list of members.  Concatenated with 'A'. This will
     * be there for ou=Groups entries. Will be empty for dc=AD entries
     * {string?} member Concatenated list of members. Concatenated with 'A'. This will be
     * therefor dc=AD entries and not for ou=Group entries
     */
    /**
     * @typedef LdapGroup
     * @property {string} cn
     * @property {string} dn
     * @property {string} uniquemember
     * @property {string[]} members
     * @property {boolean} isAdGroup
     */
    /**
     * @template T
     * @callback transformFn
     * @param {LdapResult} result A single result returned from an LDAP search
     * @param {string[]} [processedGroups]
     * @returns {T} Result of transformation
     */
    /**
     * Refresh the membership of a set of groups based on the group types
     * @param {string[]} typeNames A list of sys_user_group_type names
     */
    refreshGroupsByTypeNames: function(typeNames) {
        var groupSysIds = this.getGroupSysIdsByTypeNames(typeNames);
        this.refreshGroups(groupSysIds);
    },
    /**
     * Refreshes the membership of a set of groups based off group sys_id
     * @param {string[]} groupSysIds sys_ids of groups to referesh
     */
    refreshGroups: function(groupSysIds) {
        groupSysIds.forEach(this.refreshGroup.bind(this));
    },
    /**
     * Refreshes the membership of a group based off of a sys_id
     * @param {string} groupSysId group sys_id
     */
    refreshGroup: function(groupSysId) {
        var group = new GlideRecord('sys_user_group');
        if (group.get(groupSysId)) {
            var source = group.getValue('source');
            var name = this.getGroupShortNameFromSource(source);
            var ldapGroup = this.getGroupByName(name);
            if (ldapGroup) {
                this.clearMembers(groupSysId);
                this.addMembers(groupSysId, ldapGroup.members);
            } else {
                this._logError('Could not find group, ' + name + ' in LDAP');
            }
        } else {
            this._logError('Could not find group using sys_id: ' + groupSysId);
        }
    },
    /**
     * Ingests the given group from LDAP. Will create the group if the group
     * does not already exist. Only applies the type names to newly created groups.
     * If the group already exists the type isn't applied
     * @param {string} groupName Set of group names to ingest
     * @param {string[]} [types] List of sys_user_group_type names to apply to newly created groups
     * @returns {?GlideRecord} The ingested group or null if there was a problem
     */
    ingestGroup: function(groupName, types) {
        var groups = this.ingestGroups([groupName], types);
        if (groups.length > 0) {
            return groups[0];
        } else {
            return null;
        }
    },
    /**
     * Retrieves a sys_user_group by distinguished name (DN)
     * @param {string} dn The distinguished name of the group to retrieve
     * @returns {?GlideRecord} the sys_user_group or null
     */
    getGroupByDn: function(dn) {
        var group = new GlideRecord('sys_user_group');
        if (group.get('source', 'ldap:' + dn)) {
            return group;
        } else {
            return null;
        }
    },
    /**
    * Ingests the given group names from LDAP. Will create the group if the
    * does not already exist. Only applies the type names to newly created
    * If the group already exists the type isn't applied
    * @param {string[]} groupNames Set of group names to ingest
    * @param {string[]} [types] List of sys_user_group_type names to apply to
    newly created groups
    types);
    * @returns {GlideRecord[]} The list of ingested groups
    */
    ingestGroups: function(groupNames, types) {
        var queryParts = groupNames.map(function(name) {
            return '(cn=' + name + ')';
        });
        var query = '(|' + queryParts.join(' ') + ')';
        /** @type {LdapGroup[]} */
        var ldapGroups = this.searchAndTransform(query, 10000, this.defaultTransformFn.bind(this));
        var me = this;
        return ldapGroups.map(function(ldapGroup) {
            var existingGroup = me.getGroupByDn(ldapGroup.dn);
            if (existingGroup) {
                return existingGroup;
            } else {
                return me.createGroupFromLdapGroup(ldapGroup, types);
            }
        });
    },
    /**
     * Retrieves a list of sys_user_group sys_ids by finding groups that have
     * all the provided type names passed in
     * @param {string[]} typeNames List of typenames to find group sys_ids
     * @returns {string[]} sys_ids of group names that have all type names
     */
    getGroupSysIdsByTypeNames: function(typeNames) {
        var me = this;
        var group = new GlideAggregate('sys_user_group');
        group.groupBy('sys_id');
        typeNames.forEach(function(name) {
            var type = me.getType(name);
            if (type) {
                group.addQuery('type', 'CONTAINS', type);
            }
        });
        group.query();
        var sysIds = [];
        while (group.next()) {
            sysIds.push(group.getValue('sys_id'));
        }
        return sysIds;
    },

    /**
     * Returns the type sys_id by using the provided type name
     * @param {string} typeName Type name from sys_user_group_type
     * @returns {?string} sys_id of the type or null if type not found
     */
    getType: function(typeName) {
        var types = this.getTypes([typeName]);
        if (types.length > 0) {
            return types[0];
        } else {
            return null;
        }
    },
    /**
     * Returns the sys_ids of the sys_user_group_type by using the provided
     * type names
     * @param {string[]} typeNames List of names of sys_user_group_type
     * @returns {string[]} List of sys_ids of the types
     */
    getTypes: function(typeNames) {
        if (typeNames && typeNames.length > 0) {
            var type = new GlideRecord('sys_user_group_type');
            type.addQuery('name', 'IN', typeNames);
            type.query();
            var types = [];
            while (type.next()) {
                types.push(type.getUniqueValue());
            }
            return types;
        } else {
            return [];
        }
    },
    /**
     * Creates the marker for newly ingested groups by this class. This is so
     * it is easy to find groups created by this class, so they can be updated
     * or monitored
     * @returns {string} The sys_id of the sys_user_group_type that represents the type
     * marker
     */
    getOrCreateIngestGroupType: function() {
        var type = new GlideRecord('sys_user_group_type');
        var ingestTypeName = this.ingestTypeName;
        if (type.get('name', ingestTypeName)) {
            return type.getUniqueValue();
        }
        type.newRecord();
        type.name = ingestTypeName;
        type.description = 'Marker for groups ingested by KLF_LdapGroupService';
        type.update();
        return type.getUniqueValue();
    },
    /**
     * Creates a sys_user_group from an LDAP group. Applies the provided type names to
     * the new group
     * @param {LdapGroup} ldapGroup
     * @param {string[]} [types] List of sys_user_group_type names to apply to the created group
     * @returns {GlideRecord} The created sys_user_group
     */
    createGroupFromLdapGroup: function(ldapGroup, types) {
        var group = new GlideRecord('sys_user_group');
        group.newRecord();
        group.name = this.getNameFromDn(ldapGroup.dn);
        group.source = 'ldap:' + ldapGroup.dn;
        var _types = types ? this.getTypes(types) : [];
        // @ts-ignore 
        group.type = [].concat([this.getOrCreateIngestGroupType()],
            _types).join(', ');
        group.update();
        this.addMembers(group.getUniqueValue(), ldapGroup.members);
        return group;
    },

    /**
     * Removes all the members of a group given a sys_id
     * @param {string} groupSysId sys_id of group to remove members
     */
    clearMembers: function(groupSysId) {
        if (!groupSysId) return;
        var groupMember = new GlideRecord('sys_user_grmember');
        groupMember.addQuery('group', groupSysId);
        groupMember.query();
        groupMember.deleteMultiple();
    },

    /**
     * Adds the given members distinguished by their DNs to the group by
     * the provided group sys_id
     * @param {string} groupSysId sys_id of group to add members
     * @param {string[]} memberDNs List DNs for people to add to group
     * @param {string[]} [processedGroups] DNs for groups that have already been processed. Used for
     * recursive calls
     */
    addMembers: function(groupSysId, memberDNs, processedGroups) {
        var me = this;
        var people = memberDNs.filter(function(member) {
            return new RegExp(me.getPersonRegex(), 'i').test(member);
        });
        if (people.length > 0) {
            var user = new GlideAggregate('sys_user');
            user.groupBy('sys_id');
            user.groupBy('employee_number');
            user.groupBy('u_dn');
            // @ts-ignore
            var peopleCopy = [].concat(people);
            var userCondition;
            /** @type {string[]} */
            var peopleEmployeeNumber = [];
            if (this.isActiveDirectoryGroups) {
                peopleEmployeeNumber = this._getActiveDirectoryUserEmployeeNumbers(peopleCopy);
                userCondition = user.addQuery('employee_number', 'IN', peopleEmployeeNumber);
            } else {
                userCondition = user.addQuery('u_dn', peopleCopy.shift());
                peopleCopy.reduce(function(condition, person) {
                    return condition.addOrCondition('u_dn', person);
                }, userCondition);
            }
            user.query();
            //used to track people we didn't find in ServiceNow that exist in LDAP
            /** @type {string[]} */
            var missingPeople = [];
            if (this.isActiveDirectoryGroups) {
                missingPeople = peopleEmployeeNumber;
            } else {
                // @ts-ignore
                missingPeople = [].concat(people);
            }
            while (user.next()) {
                var matchField = this.isActiveDirectoryGroups ? 'employee_number' : 'u_dn';
                var index = missingPeople.indexOf(user.getValue(matchField));
                if (index >= 0) {
                    missingPeople.splice(index, 1);
                }
                var groupMember = new GlideRecord('sys_user_grmember');
                groupMember.addQuery('user', user.getValue('sys_id'));
                groupMember.addQuery('group', groupSysId);
                groupMember.query();
                if (groupMember.hasNext()) {
                    continue;
                }
                groupMember.newRecord();
                groupMember.group = groupSysId;
                groupMember.user = user.getValue('sys_id');
                groupMember.update();
            }
            if (missingPeople.length > 0) {
                var targetGroup = new GlideRecord('sys_user_group');
                targetGroup.get(groupSysId);
                this._logWarning('KLF_LdapGroupService.addMembers  Could not find people: ' + missingPeople + ' for group: ' + targetGroup.getDisplayValue());
            }
        }
        if (this.includeNestedGroups) {
            var _processedGroups = processedGroups || [];
            var groupDNs = memberDNs.filter(function(member) {
                return new RegExp(me.getGroupRegex(), 'i').test(member);
            });
            /** @type {LdapGroup[]} */
            //@ts-ignore
            var groups = groupDNs.filter(function(groupDN) {
                var alreadyProcessed = _processedGroups.indexOf(groupDN) >= 0;
                return !alreadyProcessed;
            }).map(function(groupDN) {
                var shortCn = me.getGroupShortNameFromDn(groupDN);
                return me.getGroupByName(shortCn);
            }).filter(function(group) {
                return !!group;
            });
            groups.forEach(function(group) {
                //if processed groups is not initialized this is the first call the group
                //need to initialize this argument with the DN of
                //that all members are added to.
                if (!processedGroups) {
                    var targetGroup = new GlideRecord('sys_user_group');
                    targetGroup.get(groupSysId);
                    var dn = me.getDnFromSource(targetGroup.getValue('source'));
                    processedGroups = [dn];
                }
                me.addMembers(groupSysId, group.members, processedGroups);
            });
        }
    },
    /**
     * Transforms source attribute into a common name. Source field contains the DN that
     * is prefixed by 'ldap:'. This transforms that into just a common name
     * @param {string} source Value of source field in LdapResult or sys_user_group
     * @returns {string} primary common name of the group. This is the name used in the ON the DN
     */
    getGroupShortNameFromSource: function(source) {
        var dn = this.getDnFromSource(source);
        return this.getGroupShortNameFromDn(dn);
    },
    /**
    * Transforms DN attribute into a common name. ~t pulls the CN portion of
    * @param {string} groupDN Value of DN field in LdapResult or sys_user_group
    * @returns {string} primary common name of the group. This is the name
    used in the DN
    */
    getGroupShortNameFromDn: function(groupDN) {
        var dnParts = groupDN.split(', ');
        var cn = dnParts[0];
        var cnParts = cn.split('=');
        var shorten = cnParts[1];
        return shorten;
    },
    /**
     * Returns an LdapGroup for the given group name or null
     * @param {string} groupName An individual group alias
     * @param {?string[]} [processedGroups] List of processed groups by DN.
     * Used for recursive calls
     * @returns {(LdapGroup|null)}
     */
    getGroupByName: function(groupName, processedGroups) {
        var results = this.searchAndTransform('(cn=' + groupName + ')', 1, this.defaultTransformFn.bind(this), processedGroups);
        if (results.length > 0) {
            return results[0];
        } else {
            return null;
        }
    },
    /**
     * Searches for groups using a begins with query. The term is all or part of a group alias.
     * This returns a list of the found group names. The names will be the primary group names.
     * These are the group name used in the group's DN. This can be different than the ServiceNow
     * group name, because the ServiceNow group name may be the concatenated group aliases using the 'A'
     * @param {string} term common name of group to look for
     * @param {number} limit Maximum number of search results
     * @param {boolean} onlyMailGroups true if you only want mail groups
     * @returns {string[]} List of found primary group names
     */
    searchBeginsWith: function(term, limit, onlyMailGroups) {
        if (!term) {
            return [];
        }
        var query = onlyMailGroups ? '(&(en=' + term + ' *)(descript i on=domino_whitepages_group))' : '(en=' + term + ' *)';
        var groups = this.searchAndTransform(query, limit, this.defaultTransformFn.bind(this));
        if (limit != 0 && groups.length > limit) {
            groups.length = limit;
        }
        var transformedGroups = [];
        for (var i = 0; i < groups.length; i++) {
            transformedGroups.push(this.getNameFromDn(groups[i].dn));
        }
        return transformedGroups;
    },
    /**
     * Searches for groups using a contains query . The term is all or part of a group alias.
     * This returns a list of the found group names. The names will be the primary group names.
     * These are the group name used in the group's DN. This can be different than the ServiceNow
     * group name, because the ServiceNow group name may be the concatenated group aliases using the·~·
     * @param {string} term common name of group to look for
     * @param {number} limit Maximum number of search results
     * @param {boolean} onlyMailGroups true if you only want mail groups
     * @returns {string[]} List of found primary group names
     */
    search: function(term, limit, onlyMailGroups) {
        if (!term) {
            return [];
        }
        var query = onlyMailGroups ? '(&(en=*' + term + '*)(description=domino_whitepages_group))' : '(en=*' + term + '*)';
        var groups = this.searchAndTransform(query, limit, this.defaultTransformFn.bind(this));
        if (limit != 0 && groups.length > limit) {
            groups.length = limit;
        }
        var transformedGroups = [];
        for (var i = 0; i < groups.length; i++) {
            transformedGroups.push(this.getNameFromDn(groups[i].dn));
        }
        return transformedGroups;
    },
    /**
     * Returns true if group is an active directory group as opposed to a traditional LDAP
     * group . AD groups come straight from active directory and have slightly different
     * attributes
     * @param {string} dn DN of AD group
     */
    isActiveDirectoryGroup: function(dn) {
        //checks DN for the string dc=ad which signifies
        //that the entry is in the
        return /\bdc=ad\b/i.test(dn);
    },

    /**
     * A default implementation of a transform function used in searchAndTransform.
     * @type {transformFn<LdapGroup>}
     */
    defaultTransformFn: function(result, processedGroups) {
        var uniquemember = this.getUniqueMember(result);
        var members = this.getMembers(result, processedGroups || null);
        return {
            cn: String(result.get('cn')),
            dn: String(result.get('dn')),
            uniquemember: uniquemember,
            members: members,
            isAdGroup: this.isActiveDirectoryGroup(String(result.get('dn')))
        };
    },

    /**
     * Searches LDAP using the provided query. Will only pull back groups
     * because there is a RDN filter placed on the search. Query must be a valid LDAP query
     * You can provide an optional transformFn. If not provided a transform will
     * be performed on the query results
     * @template T
     * @param {string} query A valid LDAP query
     * @param {number} limit Maximum number of results
     * @param {transformFn<T>} transformFn Function to transform the result of the LDAP query
     * @param {?string[]} [processedGroups] Accumulator for recursive query
     * @returns {T[]} The list of found groups from LDAP
     */
    searchAndTransform: function(query, limit, transformFn, processedGroups) {
        var me = this;

        //@ts-ignore
        var ldap = new GlideLDAP();
        ldap.setConfigID(this._getLdapServerSysId());
        var ldapResult = ldap.getMatching(this.getSearchRdn(), query, false, limit || 1000);
        var groups = [];
        /** @type {LdapResult} */
        var result;
        while (ldapResult.hasMore()) {
            result = ldapResult.next();
            groups.push(transformFn(result));
        }
        return groups;
    },
    /**
     * @returns {string} The rdn to limit searches of the directory to
     */
    getSearchRdn: function() {
        return this.searchRdn;
    },
    /**
     * Retrieves the value for the members in a group. This can vary depending
     * on the type of LDAP entry retrieved
     * @param {LdapResult} result
     */
    getUniqueMember: function(result) {
        return this.isActiveDirectoryGroup(String(result.get('dn'))) ?
            String(result.get('member')) :
            String(result.get('uniquemember'));
    },
    /**
     * Returns a regex to apply against a DN returned from LDAP to determine if the DN
     * is a group
     * @returns {string} Regex to apply against a DN to determine if DN is a group
     */
    getGroupRegex: function() {
        return this.isActiveDirectoryGroups ?
            //This looks odd, but this matches everything that is not the getPersonRegex
            '^(?!CN=\\w{7}(-\\w{3})?,.*$)' :
            'ou=Groups';
    },
    /**
     * Returns a regex to apply against a DN returned from LDAP to determine if the DN
     * is a person
     * @returns {string} Regex to apply against a DN to determine if DN is a person
     */
    getPersonRegex: function() {
        return this.isActiveDirectoryGroups ?
            //Matches 7 characters followed by an optional dash and 3 characters
            //like abcdefg or abcdefg-adm
            '^CN=\\w{7}(-\\w{3})?,' :
            'ou=People';
    },
    /**
     * Retrieves all the members of a group using an LdapResult. This can potentially resolve
     * nested groups recursively.
     * @param {LdapResult} result Result from an LDAP search
     * @param {?string[]} processedGroups Accumulated list of already processed groups specified by DN.
     * Used for recursive calls
     * @returns {string[]} List of DNs of all the people in a group
     */
    getMembers: function(result, processedGroups) {
        var me = this;
        var uniquemember = this.getUniqueMember(result);
        var memberDNs = uniquemember ? uniquemember.split('A') : [];
        var people = memberDNs.filter(function(member) {
            return new RegExp(me.getPersonRegex(), 'i').test(member);
        });
        gs.debug('people:' + people.join('\n'));
        /** @type {string[]} */
        var nestedPeople = [];
        if (this.includeNestedGroups) {

            var _processedGroups = processedGroups ? processedGroups : [String(result.get('dn'))];
            var groupDNs = memberDNs.filter(function(member) {
                return new RegExp(me.getGroupRegex(), 'i').test(member);
            });
            gs.debug('groups: ' + groupDNs.join('\n'));
            /** @type {LdapGroup[]} */
            // @ts-ignore -- This is an LdapGroup[] but the type system doesn't know that
            var groups = groupDNs.filter(function(groupDN) {
                var alreadyProcessed = _processedGroups.indexOf(groupDN) >= 0;
                return !alreadyProcessed;
            }).map(function(groupDN) {
                var dnParts = groupDN.split(', ');
                var en = dnParts[0];
                var cnParts = en.split('=');
                var shortCn = cnParts[1];
                _processedGroups.push(groupDN);
                return me.getGroupByName(shortCn, _processedGroups);
            }).filter(function(group) {
                return !!group;
            });
            nestedPeople = groups.reduce(function(people, group) {
                return /**@type{string[]}*/ ([]).concat(people, group.members);
            }, /**@type{string[]}*/ ([]));
        }
        // @ts-ignore
        return new global.ArrayUtil().unique([].concat(people, nestedPeople));
    },
    /**
     * Returns if this group exists in LDAP
     * @param {string} groupName One of the aliases of a group
     * @returns {boolean} Returns true if alias found
     */
    exists: function(groupName) {
        return !!this.getGroupByName(groupName);
    },
    /**
    * Transforms source attribute into a DN
    * @param {string} source Value of source field in LdapResult or
    sys_user_group
    * @returns {string} The DN from the source field
    */
    getDnFromSource: function(source) {
        //chops off ldap: from source to get true DN
        return source.substr('ldap:'.length);
    },
    /**
     * Retrieves the primary group name from DN. This is the CN attribute associated table
     * with the DN
     * @param {string} dn
     * @returns {string} The primary group name
     */
    getNameFromDn: function(dn) {
        var cn = dn.split(', ')[0];
        if (cn) {
            var name = cn.split('=');
            return name[1];
        } else {
            return '';
        }
    },
    /**
     * Returns the sys_id of the LDAP server entry in the ldap_server_config
     */
    _getLdapServerSysId: function() {
        return this.ldapServerSysId;
    },

    /**
     * Returns the sys_id of the LDAP server by name
     * @param {string} name The name of the LDAP server
     * @returns {string} LDAP server sys_id
     */
    _getLdapServerSysIdByName: function(name) {
        var ldap = new GlideRecord('ldap_server_config');
        if (ldap.get('name', name)) {
            return ldap.getUniqueValue();
        } else {
            throw 'Could not find LDAP server using name: ' + name;
        }
    },
    /**
     * @returns {string} The default sys_user_group_type name for a LDAP group
     */
    getDefaultLdapGroupTypeName: function() {
        return 'KLF LDAP GROUP';
    },
    /**
     * @returns {string} The default sys_user_group_type name for an AD group
     */
    getDefaultAdGroupTypeName: function() {
        return 'KLF_AD_GROUP';
    },
    /**
     * Logs a warn level message with the log source provided at construction
     * @param {string} message Log message
     */
    _logWarning: function(message) {
        gs.logWarning(message, this.logSource);
    },
    /**
     * Logs a error level message with the log source provided at construction
     * @param {string} message
     */
    _logError: function(message) {
        gs.logError(message, this.logSource);
    },
    /**
     * Takes the member list from an LDAP search of active directory and retrieves the
     * associated employeenumbers by searching for the users in LDAP
     * @param {string[]} members List of member DNs to retrieve EmployeeNumbers
     * @returns {string[]} List of EmployeeNUmbers
     */
    _getActiveDirectoryUserEmployeeNumbers: function(members) {
        // var existingSearchRdn = this.searchRdn;
        var me = this;
        var queryParts = members.map(function(member) {
            return '(cn=' + me.getNameFromDn(member) + ')';
        });
        var query = '(|' + queryParts.join(' ') + ')';
        var results = this.searchAndTransform(query, 1000, function(ldapResult) {
            var employeeNumber = ldapResult.get('employeeNumber');
            return employeeNumber ? String(employeeNumber) : '';
        }).filter(function( /** @type {?string} */ employeeNumber) {
            return !!employeeNumber;
        });
        // this.searchRdn = existingSearchRdn;
        return new global.ArrayUtil().unique(results);
    },
    /** !Important: This field must be at the bottom of this object */
    /** @type {'KLF_LdapGroupService'} */
    type: 'KLF_LdapGroupService'
};

global.KLF_LdapGroupService = KLF_LdapGroupService;
/**
 * This script includes functions for working with metrics. Metrics are located in the Metrics module.
 * They are used to generated data associated with a record so that it can be used in reports.
 * 
 * Refer to the ServiceNow documentation for more information on metrics:
 * https://docs.servicenow.com/csh?topicname=c_MetricDefinitionSupport.html&version=latest
 * 
 * Some of the functions in this script are:
 * - createMetricInstance: Creates a metric instance record for a given metric definition and record
 * - clearMetricsByRelatedRecord: Deletes all metric instances for a given record
 * - queueMetricUpdate: Used in a business rule to queue the metric.update event. This is used when creating metrics on a table that doesn't extend Task
 */
// @ts-ignore
var global = global || {};

global.KLF_MetricUtils = function() {};

global.KLF_MetricUtils.prototype = {
    /**
     * @param {GlideRecord} glideRecord 
     * @param {GlideRecord} metricDefinition 
     * @returns {GlideRecord}
     */
    createMetricInstance: function(glideRecord, metricDefinition) {
        var metricInstance = new GlideRecord('metric_instance');
        metricInstance.newRecord();
        metricInstance.table = glideRecord.getRecordClassName();
        metricInstance.id = glideRecord.sys_id;
        metricInstance.definition = metricDefinition.sys_id;
        metricInstance.field = metricDefinition.field;
        return metricInstance;
    },

    /**
     * @param {string} table 
     * @param {string} sysId 
     */
    clearMetricsByRelatedRecord: function(table, sysId) {
        if (table && sysId) {
            var metricInstance = new GlideRecord('metric_instance');
            metricInstance.addQuery('table', table);
            metricInstance.addQuery('id', sysId);
            metricInstance.deleteMultiple();
        }
    },

    /**
     * This function should be called from a business rule.
     * 
     * Function is copied from "metrics events" business rule on the Task table
     * This function is used to queue the metric update event. When creating a Metric Definition
     * that doesn't extend the Task table, the "metrics events" business rule must be copied to the
     * new table and the queueMetricUpdate function must be called from the "onAfter" business rule
     * 
     * This function must be called from global scope. So this function is here in global so it can be
     * called from the business rule that will be in the application scope.
     */
    queueMetricUpdate: function() {
        var gru = GlideScriptRecordUtil.get(current);
        var fieldsChanged = gru.getChangedFieldNames();
        var gr = getDefinitions(fieldsChanged);
        /** @type {string} */
        var fields = '';
        while (gr.next())
            fields += gr.field + ',';

        if (fields.length > 0) {
            fields = '[' + fields.substring(0, fields.length - 1) + ']';
            gs.eventQueue('metric.update', current, fields, current.sys_mod_count, 'metric_update');
        }

        /**
         * @param {string[]} fields 
         * @returns {GlideAggregate}
         */
        function getDefinitions(fields) {
            var gr = new GlideAggregate('metric_definition');
            gr.addActiveQuery();
            var tables = GlideDBObjectManager.getTables(current.getTableName());
            gr.addQuery('table', tables);
            gr.addQuery('field', fields);
            gr.groupBy('field');
            gr.query();
            return gr;
        }
    }
};
/**
 * This script is a utility class for migrating records between different scopes in ServiceNow.
 * It extends the KLF_RecordSync class and provides additional functionality for transforming data.
 * 
 * KLF_RecordSync will transfer data from one instance to another. This object allows the data to
 * be transformed before it is sent to the target instance. This is useful when you need to change the
 * target table or other data before it is sent to the target instance.
 */

/**
 * @typedef {global.KLF_RecordSync & KLF_MigratorUtils} KLF_MigratorUtils_Class
 */

/**
 * @typedef {Object} KLF_MigratorUtilsConfig
 * @property {string} sourceScope - The scope of the source records.
 * @property {string} [sourceScopeSysId] - The sys_id of the source scope.
 * @property {string} targetScope - The scope of the target records.
 * @property {string} [targetScopeSysId] - The sys_id of the target scope.
 * @property {{[sourceTableName: string]: string}} [tableMap] - A map of source table names to target table names.
 * @property {{[sourceMetadataSysId: string]: string}} [metadataMap] - A map of source metadata sys_ids to target metadata sys_ids.
 */

/**
 * @param {KLF_MigratorUtilsConfig} config 
 * @param {KLF_RecordSyncConnectionConfig} connectionConfig
 * @param {KLF_RecordSync_GroupMapping?} [groupMapping]
 * @param {KLF_RecordSync_UserMapping?} [userMapping]
 * @example
 * var migrator = new global.KLF_MigratorUtils({
 *     sourceScope: 'x_53417_scoper_1',
 *     targetScope: 'x_53417_scoper_2',
 *     tableMap: {
 *         'x_53417_scoper_1_scoper_task': 'x_53417_scoper_2_scoper_task'
 *     }
 * });
 */
function KLF_MigratorUtils(config, connectionConfig, groupMapping, userMapping) {
    // Call the parent constructor (KLF_RecordSync)
    global.KLF_RecordSync.call(this, connectionConfig, groupMapping, userMapping, this.transformData.bind(this));

    var _config = config || {};
    var sourceScopeSysId = config.sourceScopeSysId || this.getScopeSysId(_config.sourceScope);
    if (!sourceScopeSysId) {
        throw 'Source scope not found';
    }

    var targetScopeSysId = config.targetScopeSysId || this.getScopeSysId(_config.targetScope);
    if (!targetScopeSysId) {
        throw 'Target scope not found';
    }

    this.sourceScope = _config.sourceScope;
    this.sourceScopeSysId = sourceScopeSysId;
    this.targetScope = _config.targetScope;
    this.targetScopeSysId = targetScopeSysId;
    this.tableMap = _config.tableMap || {};
};

// Inherit from KLF_RecordSync
KLF_MigratorUtils.prototype = Object.create(global.KLF_RecordSync.prototype);

// Set the constructor back to KLF_MigratorUtils
KLF_MigratorUtils.prototype.constructor = KLF_MigratorUtils;

/**
 * @memberof MY_KLF_MigratorUtils
 * Updates the scope found in the string using the source scope.
 * @param {string} string 
 * @returns {string}
 */
KLF_MigratorUtils.prototype.updateScope = function(string) {
    var _string = string.replace(new RegExp(this.sourceScope, 'g'), this.targetScope);
    return string.replace(new RegExp(this.sourceScopeSysId, 'g'), this.targetScopeSysId);
};

/**
 * Updates the table names found in the string using the table map.
 * 
 * @param {string} string 
 * @returns {string}
 */
KLF_MigratorUtils.prototype.updateTableNames = function(string) {
    if (!string) {
        return string;
    }

    // I want to replace these
    // <u_klf_test_task action="INSERT_OR_UPDATE">
    // </u_klf_test_task>
    // <sys_class_name>u_klf_test_task</sys_class_name>

    // Do not replace this
    // <u_klf_test_task display_value="KLF0001078">e05571fd2b5d2a100060ff42fe91bfe5</u_klf_test_task>

    for (var sourceTableName in this.tableMap) {
        var targetTableName = this.tableMap[sourceTableName];
        string = string.replace(new RegExp('<' + sourceTableName + ' action', 'g'), '<' + targetTableName + ' action');
        string = string.replace(new RegExp('></' + sourceTableName + '>', 'g'), '></' + targetTableName + '>');
        string = string.replace(new RegExp('<sys_class_name>' + sourceTableName + '<', 'g'), '<sys_class_name>' + targetTableName + '<');
    }
    return string;
};

/**
 * Retrieves the sys_id of a scope by its name.
 * @param {string} scopeName - The name of the scope to look up.
 * @returns {string|null} The sys_id of the scope if found, null otherwise.
 */
KLF_MigratorUtils.prototype.getScopeSysId = function(scopeName) {
    var scopeGr = new GlideRecord('sys_scope');
    if (scopeGr.get('scope', scopeName)) {
        return scopeGr.getUniqueValue();
    }
    // Could be global scope. Need to check by name
    var globalScope = new GlideRecord('sys_scope');
    globalScope.addQuery('name', scopeName);
    globalScope.query();
    if (globalScope.getRowCount() === 1) {
        globalScope.next();
        return globalScope.getUniqueValue();
    } else if (globalScope.getRowCount() > 1) {
        throw 'Ambiguous scope name. More than one scope found with the name: ' + scopeName;
    }

    return null;
};

/**
 * @param {global.KLF_RecordSync.Manifest} manifest
 */
KLF_MigratorUtils.prototype.updateManifest = function(manifest) {
    var me = this;
    var targetManifest = new global.KLF_RecordSync.Manifest();

    // The manifest will have the source table names
    // I need to replace the source table names with the target table names

    manifest.getTables().forEach(function(sourceTableName) {
        var targetTableName = me.tableMap[sourceTableName] || sourceTableName;
        targetManifest.addRecords(targetTableName, manifest.getSysIdsForTable(sourceTableName));
    });

    return targetManifest;
};

/**
 * @param {string} xml
 * @param {global.KLF_RecordSync.Manifest} [manifest]
 * @returns {{xml: string, manifest?: global.KLF_RecordSync.Manifest}}
 */
KLF_MigratorUtils.prototype.transformData = function(xml, manifest) {
    gs.log('Before transform XML: ' + xml.substring(0,100), 'KLF_MigratorUtils');
    var _xml = this.updateScope(xml);
    _xml = this.updateTableNames(_xml);
    gs.log('After transform XML: ' + _xml.substring(0,100), 'KLF_MigratorUtils');
    var _manifest = manifest ? this.updateManifest(manifest) : undefined;

    // This function is called when the record is sent to the target instance
    // You can use this function to log the XML or do any other processing you need to do
    return {
        xml: _xml,
        manifest: _manifest
    };
};

/**
 * @override
 * @param {string} message 
 */
KLF_MigratorUtils.prototype.logError = function(message) {
    gs.logError(message, 'KLF_MigratorUtils');
};

/**
 * @override
 * @param {string} message 
 */
KLF_MigratorUtils.prototype.logInfo = function(message) {
    gs.log(message, 'KLF_MigratorUtils');
};

/**
 * @override
 * Overrides the {@link global.KLF_RecordSync.getSysIdsToInsert} function. In the migrator, the
 * source and destination tables are different, so this function must account for the differences in table names.
 * 
 * This is used to filter out the sys_ids that are already in the target instance.
 * It's primarily used to prevent sending unnecessary data to the target instance.
 * Refer to {@link global.KLF_RecordSync.syncTable} for an example of how this is used.
 * @param {string[]} sourceSysIds 
 * @param {string} sourceTableName 
 * @returns {string[]?}
 */
KLF_MigratorUtils.prototype.getSysIdsToInsert = function(sourceSysIds, sourceTableName) {
    // I'm just declaring this here so the TypeScript compiler doesn't complain about references to
    // functions in the parent class. I will reference all the functions in the parent class using this.
    var superThis = /** @type {global.KLF_RecordSync} **/ ( /** @type {unknown} **/ (this));

    // If there is a mapping for this table then use the mapping. If not then the
    // source table name should be the target table name.
    var targetTableName = this.tableMap[sourceTableName] || sourceTableName;

    // Query the remote instance using the REST table API for the records that are in the sysIds array
    var request = superThis.createRestMessage();
    request.setHttpMethod('GET');
    var endpointPath = '/api/now/table/' + targetTableName;
    var query = [
        'sysparm_fields=sys_id',
        'sysparm_query=sys_idIN' + encodeURIComponent(sourceSysIds.join(','))
    ].join('&');
    var endpoint = request.getEndpoint() + endpointPath + '?' + query;
    request.setEndpoint(endpoint);
    var response = request.execute();

    if (response.getStatusCode() != 200) {
        superThis.logError('Failed to get the records from the target instance');
        superThis.logError('Received status code: ' + response.getStatusCode());
        superThis.logError('Received body: ' + response.getBody());
        return null;
    }

    /** @type {{result:[{sys_id:string}]}} */
    var responseBody;
    try {
        responseBody = JSON.parse(response.getBody());
    } catch (e) {
        superThis.logError('Failed to parse the response from the target instance');
        superThis.logError('Received status code: ' + response.getStatusCode());
        superThis.logError('Received body: ' + response.getBody());
        return null;
    }

    // The sys_ids in the response represent records that already exist in the target instance
    // Subtract the sys_ids in the response from the sysIds array to get the sys_ids that do not exist in the target instance
    // This will be the sys_ids that need to be inserted into the target instance
    var targetSysIds = /** @type string[] */ ([]);
    responseBody.result.forEach(function(record) {
        targetSysIds.push(record.sys_id);
    });

    return sourceSysIds.filter(function(sysId) {
        return targetSysIds.indexOf(sysId) === -1;
    });
};

//@ts-ignore
var global = global || {};
global.KLF_MigratorUtils = KLF_MigratorUtils;



// Example of how to use the KLF_MigratorUtils class to transfer data from one instance to another
(function() {
    var sourceScope = 'KLF Test Global'; // The scope to sync data from
    var scopeSysId = '34746a042bd5a2100060ff42fe91bf28'; // 

    var targetScope = 'x_53417_klf_test'; // The scope to sync data to
    var targetScopeSysId = '5374f750835da2103c9299e0deaad367'; // 

    /**
     * When initializing the KLF_MigratorUtils object you must pass in a configuration object
     * that contains connection information to the target instance.
     */
    function getConnectionConfig() {
        var connectionConfig = {
            instanceUrl: 'https://dev229555.service-now.com/',
            username: 'admin',
            password: gs.getProperty('KLF_RecordSync.password'),
            chunkSize: 20
        };
        return connectionConfig;
    }

    /**
     * Creates a user mapping for the target instance
     * @returns {KLF_RecordSync_UserMapping}
     */
    function createUserMapping() {
        var connectionConfig = getConnectionConfig();
        var userUtils = new global.KLF_RecordSync_UserUtils(connectionConfig);
        var users = userUtils.getUniqueUsersInScope(sourceScope);
        return userUtils.createUserMapping(users, sourceScope);
    }

    /**
     * Creates a group mapping for the target instance
     * @returns {KLF_RecordSync_GroupMapping}
     */
    function createGroupMapping() {
        var connectionConfig = getConnectionConfig();
        var groupUtils = new global.KLF_RecordSync_GroupUtils(connectionConfig);
        var groups = groupUtils.getUniqueGroupsInScope(sourceScope);
        return groupUtils.createGroupMapping(groups, sourceScope);
    }

    function transferData() {
        var connectionConfig = getConnectionConfig();
        var userMapping = new global.KLF_RecordSync_UserUtils(connectionConfig).getUserMapping(sourceScope);
        var groupMapping = new global.KLF_RecordSync_GroupUtils(connectionConfig).getGroupMapping(sourceScope);

        /** @type {KLF_MigratorUtils_Class} */
        // @ts-ignore
        var migratorUtils = new global.KLF_MigratorUtils({
                sourceScope: sourceScope,
                sourceScopeSysId: scopeSysId,
                targetScope: targetScope,
                targetScopeSysId: targetScopeSysId,
                // The table map is used to map the source table names to the target table names
                tableMap: {
                    'u_klf_test_task': 'x_53417_klf_test_test_task'
                }
            },
            connectionConfig,
            userMapping,
            groupMapping
        );

        // Sync the table from the source instance to the target instance
        migratorUtils.syncTable('u_klf_test_task');
    }

    // Creates the user mapping. This is necessary to map the users in the source instance to the users in the target instance
    // createUserMapping();

    // Creates the group mapping. This is necessary to map the groups in the source instance to the groups in the target instance
    // createGroupMapping();

    // Transfers the data from the source instance to the target instance
    transferData();
});
class KLF_OAuthHelper {
    /**
     * These parameters are needed to lookup the specific OAuth Requestor Profile [oauth_requestor_profile].
     * The oauth_requestor_profile is needed to lookup tokens in the OAuth Credential [oauth_credential] table.
     * The OAuth Credential table is where OAuth tokens are stored after ServiceNow executes an OAuth flow.
     * 
     * These values are provided when the OAuth token is initially retrieved. Typically using the oauth_initiator API. For more information look at "OAuth Outbound" in the ServiceNow documentation.
     * 
     * You can find an example of initiating an OAuth flow in the "Get OAuth Token" UI Action that is on the "REST Message" table
     * 
     * @param {string} requestorContext oauth_requestor_profile.requestor_context
     * @param {string} requestorSysId oauth_requestor_profile.requestor_id
     * @param {string} oauthEntityProfileSysId oauth_requestor_profile.oauth_entity_profile
     * @param {number} [minimumTokenExpirationInSeconds=28800] If the token expires in less than this amount of time then the call to {KLF_OAuthHelper.getToken} will return null even if the token exists. The default is 8 hours
     */
    constructor(requestorContext, requestorSysId, oauthEntityProfileSysId, minimumTokenExpirationInSeconds = 28800) {
        this.requestorContext = requestorContext;
        this.requestorSysId = requestorSysId;
        this.oauthEntityProfileSysId = oauthEntityProfileSysId;
        this.minimumTokenExpirationInSeconds = minimumTokenExpirationInSeconds;
    }

    /**
     * Returns an object that can be used to retrieve a token from OAuth Credentials [oauth_credential] or can
     * be used to initiate a flow using "oauth_initiator"
     * @returns {{
     * requestorContext: string,
     * requestorSysId: string,
     * oauthEntityProfileSysId: string,
     * hasAccessToken: boolean
     * }}
     */
    getTokenInfo() {
        return {
            requestorContext: this.requestorContext,
            requestorSysId: this.requestorSysId,
            oauthEntityProfileSysId: this.oauthEntityProfileSysId,
            hasAccessToken: this.hasAccessToken()
        };
    }

    /**
     * Returns true if access token exists and the token expiration is far enough in the future
     * @returns {boolean}
     */
    hasAccessToken() {
        return !!this.getAccessToken();
    }

    /**
     * @returns {string?} Returns the base64 encoded access token if one exists and is far enough in the future. Elses returns null
     */
    getAccessToken() {
        var oAuthClient = new sn_auth.GlideOAuthClient();
        var glideToken = oAuthClient.getToken(this.requestorSysId, this.oauthEntityProfileSysId);
        if (glideToken) {
            var expiresIn = glideToken.getExpiresIn();
            if (expiresIn > this.minimumTokenExpirationInSeconds) {
                return glideToken.getAccessToken();
            }
        }
        return null;
    }
}
/**
 * Possible enhancements:
 * - Add the ability to resume an export. Would need the ability to track where you are in an export
 * - Maybe sort the tables in order and keep track of when a table is completed
 * - Might even need to track where you are in the table. Maybe by sorting by created date
 */
//@ts-ignore
var global = global || {};

/**
 * Object that provides methods to sync records between two ServiceNow instances
 * 
 * ServiceNow natively supports transferring application code between instances but does not expose an API to efficiently transfer data between instances.
 * This script include provides a way to transfer data between instances using the REST API. The basic idea is to script the data transfer in a way that
 * that is repeatable so the script can be written up front and then run whenever data needs to be transferred. This way the data transfer is automated
 * and there is no need to manually export and import data.
 * 
 * NOTE: To use any of the sync methods you must install this application on the target
 * instance and the source instance. This scoped application contains the REST API that is used to import records into
 * the target instance. The open API spec for the REST API is located at 
 * {@link https://github.com/kfrencher/servicenow-klf-global/blob/main/klf_import_xml_openapi.yaml KLF Import XML Spec}
 * 
 * The primary method is {@link global.KLF_RecordSync.syncAllDataInScope} which syncs all the data in
 * a scoped application from one ServiceNow instance to the same application in a different ServiceNow instance
 * 
 * Other methods allow you to sync a single table or a single record
 * {@link global.KLF_RecordSync.syncTable} and {@link global.KLF_RecordSync.syncRecord} respectively
 * 
 * TODO: 
 * - Possibly add ability to do incremental syncs where the mod count or sys_updated_on is used to determine if a record needs to be synced
 * - Also may need a way to properly handle sys_user and sys_user_group references that aren't the same in the target instance or don't exist
 * - Probably need better error handling. It's non-existent right now
 * 
 * @class KLF_RecordSync
 * @param {KLF_RecordSyncConnectionConfig} connectionConfig
 * @param {KLF_RecordSync_GroupMapping?} [groupMapping]
 * @param {KLF_RecordSync_UserMapping?} [userMapping]
 * @param {(xml:string, manifest?:global.KLF_RecordSync.Manifest) => {xml:string, manifest?:global.KLF_RecordSync.Manifest}} [beforeTransfer] A function that is called 
 * before the transfer is made. This is useful if you want to modify the XML before it is sent to the target instance
 * 
 * @example
 * var recordSync = new global.KLF_RecordSync({
 *     username: 'admin',
 *     password: gs.getProperty('KLF_RecordSync.user.password'), // Retrieve password from encoded password property
 *     instanceUrl: 'https://dev188047.service-now.com',
 *     chunkSize: 220
 * });
 * 
 * // Example of syncing all the data in a scope
 * recordSync.syncAllDataInScope('x_53417_demo');
 * 
 * // Example of including approvals that are associated with the scope
 * // This shows that you can also sync data that is outside of the scope as sysapproval_approver records
 * // are in the global scope
 * var demoApproval = new GlideRecord('sysapproval_approver');
 * demoApproval.addQuery('source_table', 'STARTSWITH', 'x_53417_demo');
 * recordSync.syncTable('sysapproval_approver', demoApproval.getEncodedQuery());
 */
global.KLF_RecordSync = function(connectionConfig, groupMapping, userMapping, beforeTransfer) {
    this.connectionConfig = connectionConfig;
    this.groupMapping = groupMapping;
    this.userMapping = userMapping;
    this.beforeTransfer = beforeTransfer;
};

/**
 * The manifest is an object that represents the data that is being transfered in a transaction. The keys
 * in the manifest are the table name and the values are an object where the keys are the sys_ids of the records
 * being transferred. It's a bit unconventional, but the reason the sys_ids are stored as keys in an object is because
 * i want them to be unique.
 * {
 *    "incident": {"sys_id1": true, "sys_id2": true},
 * }
 * @typedef {{[tableName:string]: {[sysId:string]: boolean}}} KLF_Manifest
 */
global.KLF_RecordSync.Manifest = function() {
    /** @type {KLF_Manifest} */
    this.manifest = {};
};

/**
 * @typedef {{success:boolean, payload:string, missingManifest:global.KLF_RecordSync.Manifest?}} KLF_SendToRemoteInstanceResponse
 */

/**
 * Configuration object for the KLF_RecordSync class
 * @typedef KLF_RecordSyncConnectionConfig
 * @property {string} instanceUrl
 * @property {string} username
 * @property {string} password
 * @property {number} [chunkSize=220] Optional. The number of records to sync at a time. Default is 220. 220 was chosen
 * intentionally because there is a limitation on some ServiceNow instances that will throw a 400 error if the URL is too long
 */

global.KLF_RecordSync.Manifest.prototype = {
    /**
     * @param {string} message 
     */
    logError: function(message) {
        gs.logError(message, 'KLF_RecordSync.Manifest');
    },

    /**
     * Adds a record to the manifest
     * @param {string} tableName 
     * @param {string} sysId 
     */
    addRecord: function(tableName, sysId) {
        if (!tableName || !sysId) {
            this.logError('Invalid table name or sys_id');
            return;
        }

        if (!this.manifest[tableName]) {
            this.manifest[tableName] = {};
        }
        this.manifest[tableName][sysId] = true;
    },

    /**
     * Adds multiple records to the manifest
     * @param {string} tableName
     * @param {string[]} sysIds
     */
    addRecords: function(tableName, sysIds) {
        var me = this;
        sysIds.forEach(function(sysId) {
            me.addRecord(tableName, sysId);
        });
    },

    /**
     * Adds a record to the manifest by GlideRecord
     * @param {GlideRecord} glideRecord 
     */
    addRecordByGlideRecord: function(glideRecord) {
        if (!glideRecord.isValid()) {
            // I'm going to try to get the sys_id from the record. This
            // might fail 
            try {
                throw 'Invalid GlideRecord with table name: ' + glideRecord.getTableName() + ' and sys_id: ' + glideRecord.getUniqueValue();
            } catch (e) {
                throw 'Invalid GlideRecord with table name: ' + glideRecord.getTableName();
            }
        }
        this.addRecord(glideRecord.getTableName(), glideRecord.getUniqueValue());
    },

    /**
     * Adds a manifest to the current manifest
     * @param {global.KLF_RecordSync.Manifest} manifest
     */
    addManifest: function(manifest) {
        var me = this;
        manifest.getTables().forEach(function(tableName) {
            manifest.getSysIdsForTable(tableName).forEach(function(sysId) {
                me.addRecord(tableName, sysId);
            });
        });
    },

    /**
     * Returns all the tables in the manifest
     * @returns {string[]}
     */
    getTables: function() {
        return Object.keys(this.manifest).sort();
    },

    /**
     * Returns all the sys_ids for a table in the manifest
     * @param {string} tableName
     * @returns {string[]}
     */
    getSysIdsForTable: function(tableName) {
        var entries = this.manifest[tableName];
        if (entries) {
            return Object.keys(entries).sort();
        } else {
            return [];
        }
    },

    /**
     * Returns a Object representation of the manifest. This is to facilitate JSON serialization
     * @returns {{[tableName:string]:string[]}}
     */
    toObj: function() {
        var me = this;
        return this.getTables().reduce(function(manifest, tableName) {
            manifest[tableName] = me.getSysIdsForTable(tableName);
            return manifest;
        }, /** @type {{[tableName:string]:string[]}} */ ({}));
    },

    /**
     * Returns a JSON representation of the manifest
     */
    toJson: function() {
        return JSON.stringify(this.toObj(), null, 4);
    },

    /**
     * Returns true if the manifest is empty
     * @returns {boolean}
     */
    isEmpty: function() {
        return this.getTables().length === 0;
    },

    /**
     * Validates the manifest against the local instance. It checks to see if the records exist in the local instance.
     * It then builds a new manifest of records that do not exist in the local instance
     * @returns {global.KLF_RecordSync.Manifest} A manifest of records that do not exist in the local instance
     */
    validate: function() {
        var me = this;
        var missingManifest = new global.KLF_RecordSync.Manifest();
        this.getTables().forEach(function(tableName) {
            var manifestSysIds = me.getSysIdsForTable(tableName);
            var gr = new GlideAggregate(tableName);
            gr.addQuery('sys_id', 'IN', manifestSysIds.join(','));
            gr.groupBy('sys_id');
            gr.query();
            var foundSysIds = [];
            while (gr.next()) {
                foundSysIds.push(gr.getValue('sys_id'));
            }
            var missingSysIds = new global.ArrayUtil().diff(manifestSysIds, foundSysIds);
            missingManifest.addRecords(tableName, missingSysIds);
        });
        return missingManifest;
    }
};

/**
 * Creates a manifest from the object generated by {@link global.KLF_RecordSync.Manifest.toObj}
 * @param {{[tableName:string]:string[]}} manifestObject
 * @returns {global.KLF_RecordSync.Manifest}
 */
global.KLF_RecordSync.Manifest.createManifestFromObj = function(manifestObject) {
    var manifest = new global.KLF_RecordSync.Manifest();
    for (var tableName in manifestObject) {
        manifest.addRecords(tableName, manifestObject[tableName]);
    }
    return manifest;
};

/**
 * Creates a manifest from the JSON representation
 * @param {string} jsonManifest
 * @returns {global.KLF_RecordSync.Manifest}
 */
global.KLF_RecordSync.Manifest.createManifestFromJson = function(jsonManifest) {
    var manifestObj = JSON.parse(jsonManifest);
    return global.KLF_RecordSync.Manifest.createManifestFromObj(manifestObj);
};


/**
 * Imports a record into ServiceNow using GlideUpdateManager2
 * @param {string} xml
 */
global.KLF_RecordSync.loadRecordByGlideUpdateManager2 = function(xml) {
    // @ts-ignore
    var updateManager = new global.GlideUpdateManager2();
    updateManager.loadXML(xml);
};

global.KLF_RecordSync.prototype = {
    /**
     * @param {string} message 
     */
    logError: function(message) {
        gs.logError(message, 'KLF_RecordSync');
    },
    /**
     * @param {string} message 
     */
    logInfo: function(message) {
        gs.log(message, 'KLF_RecordSync');
    },

    dataTransferUtils: new global.KLF_DataTransferUtils(),

    /**
     * Syncs all the data in the scope excluding any tables listed in the excluded table
     * list
     * @param {string} scopeNamespace
     * @param {string[]} [excludedTables]
     * @param {boolean} [forceSync] If true, will sync all records regardless of whether they exist in the target instance
     * @returns {global.KLF_RecordSync.Manifest}
     */
    syncAllDataInScope: function(scopeNamespace, excludedTables, forceSync) {
        var tables = this.dataTransferUtils.getBaseTablesInScope(scopeNamespace, excludedTables);
        var me = this;
        var missingManifest = new global.KLF_RecordSync.Manifest();
        tables.forEach(function(table) {
            missingManifest.addManifest(me.syncTable(table, '', excludedTables, forceSync));
        });
        return missingManifest;
    },

    /**
     * Syncs document that could contain data from a number of tables from ServiceNow instance to target ServiceNow instance 
     * @param {Document} document
     * @param {global.KLF_RecordSync.Manifest} [manifest]
     * @returns {KLF_SendToRemoteInstanceResponse}
     */
    syncDocument: function(document, manifest) {
        return this.sendToRemoteInstance(this.documentToString(document), manifest);
    },

    /**
     * Syncs a single record from one table in a ServiceNow instance to the same table in a different ServiceNow instance 
     * @param {GlideRecord} glideRecord
     * @returns {KLF_SendToRemoteInstanceResponse}
     */
    syncRecord: function(glideRecord) {
        var unloadDocument = this.createUnloadDocument();
        var unloadedData = this.unloadRecordWithRelatedRecords(glideRecord, unloadDocument);
        return this.sendToRemoteInstance(this.documentToString(unloadedData.document), unloadedData.manifest);
    },

    /**
     * This is used to filter out the sys_ids that are already in the target instance
     * It's primarily used to prevent sending unnecessary data to the target instance
     * Refer to {@link global.KLF_RecordSync.syncTable} for an example of how this is used
     * @param {string[]} sourceSysIds 
     * @param {string} tableName 
     * @returns {string[]?}
     */
    getSysIdsToInsert: function(sourceSysIds, tableName) {
        // Query the remote instance using the REST table API for the records that are in the sysIds array
        var request = this.createRestMessage();
        request.setHttpMethod('GET');
        var endpointPath = '/api/now/table/' + tableName;
        var query = [
            'sysparm_fields=sys_id',
            'sysparm_query=sys_idIN' + encodeURIComponent(sourceSysIds.join(','))
        ].join('&');
        var endpoint = request.getEndpoint() + endpointPath + '?' + query;
        request.setEndpoint(endpoint);
        var response = request.execute();

        if (response.getStatusCode() != 200) {
            this.logError('Failed to get the records from the target instance');
            this.logError('Received status code: ' + response.getStatusCode());
            this.logError('Received body: ' + response.getBody());
            return null;
        }

        /** @type {{result:[{sys_id:string}]}} */
        var responseBody;
        try {
            responseBody = JSON.parse(response.getBody());
        } catch (e) {
            this.logError('Failed to parse the response from the target instance');
            this.logError('Received status code: ' + response.getStatusCode());
            this.logError('Received body: ' + response.getBody());
            return null;
        }

        // The sys_ids in the response represent records that already exist in the target instance
        // Subtract the sys_ids in the response from the sysIds array to get the sys_ids that do not exist in the target instance
        // This will be the sys_ids that need to be inserted into the target instance
        var targetSysIds = /** @type string[] */ ([]);
        responseBody.result.forEach(function(record) {
            targetSysIds.push(record.sys_id);
        });

        return sourceSysIds.filter(function(sysId) {
            return targetSysIds.indexOf(sysId) === -1;
        });
    },

    /**
     * Syncs data from one table in a ServiceNow instance to the same table in a different ServiceNow instance 
     * You can provide an encoded query string to filter the records that are synced
     * 
     * One simple way to get the encoded query string is to use the filter navigator in ServiceNow
     * Another is to build the query using GlideRecord and then call GlideRecord.getEncodedQuery()
     * 
     * This will return a manifest of records that were not inserted into the target instance
     * @param {string} tableName
     * @param {string} [encodedQueryString]
     * @param {string[]} [excludedTables] This may be necessary if the table is extended and you want to exclude some of the
     * tables that extend the base table
     * @param {boolean} [forceSync] If true, will sync all records regardless of whether they exist in the target instance
     * @returns {global.KLF_RecordSync.Manifest}
     */
    syncTable: function(tableName, encodedQueryString, excludedTables, forceSync) {
        var me = this;
        var missingRecordsManifest = new global.KLF_RecordSync.Manifest();

        /**
         * @param {number} start 
         * @param {number} chunkSize 
         * @returns 
         */
        function syncChunk(start, chunkSize) {
            // I want to transfer the data in chunks. So I will use the GlideRecord.setWindow method to query a batch of records at a time.
            // Use the tableName to query a batch of records from the source table
            var source = new GlideRecord(tableName);
            source.orderBy('sys_created_on');

            // If it has an auto number field then order by that field as well
            // There can be a subtle issue if we order by sys_created_on and while this script is running
            // records are being rapidly created in the source instance. Those records may have the same
            // sys_created_on value and the order of those records will be non-deterministic. So if the table
            // has an auto number field then order by that field as well
            if (me.tableHasAutoNumberField(tableName)) {
                source.orderBy('number');
            }

            if (encodedQueryString) {
                source.addEncodedQuery(encodedQueryString);
            }

            if (excludedTables && source.isValidField('sys_class_name')) {
                source.addQuery('sys_class_name', 'NOT IN', excludedTables);
            }

            source.chooseWindow(start, start + chunkSize);
            source.query();

            var sourceSysIds = [];
            while (source.next()) {
                sourceSysIds.push(source.sys_id.toString());
            }

            me.logInfo('Chunk: ' + start + ' to ' + (start + chunkSize) + ' of ' + totalRecords);

            var sysIdsToInsert = forceSync ? sourceSysIds : me.getSysIdsToInsert(sourceSysIds, tableName);

            if (!Array.isArray(sysIdsToInsert)) {
                me.logError('Failed to get the sys_ids to insert');
                return null;
            }

            me.logInfo(tableName + ' Syncing ' + sysIdsToInsert.length + ' records: ');

            // Requery the source for the records that need to be inserted into the target instance
			if (sysIdsToInsert.length > 0) {
				var sourceToInsert = new GlideRecord(tableName);
				sourceToInsert.addQuery('sys_id', 'IN', sysIdsToInsert.join(','));
				sourceToInsert.query();
				var unloadDocument = me.createUnloadDocument();
				var manifest = new global.KLF_RecordSync.Manifest();
				while (sourceToInsert.next()) {
					var unloadedData = me.unloadRecordWithRelatedRecords(sourceToInsert, unloadDocument);
					manifest.addManifest(unloadedData.manifest);
				}
            
                var remoteResponse = me.sendToRemoteInstance(me.documentToString(unloadDocument), manifest);
                if (remoteResponse.success) {
                    if (remoteResponse.missingManifest) {
                        missingRecordsManifest.addManifest(remoteResponse.missingManifest);
                    }
                } else {
                    me.logError('Failed to sync chunk:\n\n' + manifest.toJson() + '\n\n' + remoteResponse.payload);
                }
            } else {
                me.logInfo('No records to sync for this chunk');
            }

        }

        var chunkSize = this.connectionConfig.chunkSize || 220;
        var glideRecord = new GlideRecord(tableName);
        if (glideRecord.isValid()) {
            this.logInfo('Starting sync of table: ' + tableName);
            // First get the size of the table
            // Then sync records in chunks
            if (encodedQueryString) {
                this.logInfo(encodedQueryString);
                glideRecord.addEncodedQuery(encodedQueryString);
            }
            if (excludedTables && glideRecord.isValidField('sys_class_name')) {
                this.logInfo('Excluding tables: ' + excludedTables);
                glideRecord.addQuery('sys_class_name', 'NOT IN', excludedTables);
            }
            glideRecord.query();
            var totalRecords = glideRecord.getRowCount();
            this.logInfo('Total records: ' + totalRecords);
            var i = 0;
            while (i < totalRecords) {
                syncChunk(i, chunkSize);
                i = i + chunkSize;
            }
            return missingRecordsManifest;
        } else {
            throw new Error('Invalid table name: ' + tableName);
        }
    },

    /**
     * Returns a sn_ws.RESTMessageV2 object that is configured to make a request to the target instance
     * @returns {sn_ws.RESTMessageV2}
     */
    createRestMessage: function() {
        var request = new sn_ws.RESTMessageV2();
        request.setRequestHeader("Accept", "application/json");
        var authHeader = 'Basic ' + GlideStringUtil.base64Encode(this.connectionConfig.username + ':' + this.connectionConfig.password);
        request.setRequestHeader('Authorization', authHeader);
        // Do not use setBasicAuth. This does not work with mutual auth for some reason
        // request.setBasicAuth(this.connectionConfig.username, this.connectionConfig.password);
        request.setEndpoint(this.connectionConfig.instanceUrl);
        return request;
    },

    /**
     * Creates a document object that can be passed to {@link global.KLF_RecordSync.unloadRecord}
     * This is useful when you want to add multiple unloaded records to the same document
     * @returns {Document}
     */
    createUnloadDocument: function() {
        // @ts-ignore
        var document = global.GlideXMLUtil.newDocument('unload');
        var date = new GlideDateTime();
        document.documentElement.setAttribute('unload_date', date.toString());
        return document;
    },

    /**
     * Adds the record's related journal entries to the update set
     * @param {GlideRecord} parent
     * @param {Document} document
     * @returns {global.KLF_RecordSync.Manifest}
     */
    addJournalEntries: function(parent, document) {
        var manifest = new global.KLF_RecordSync.Manifest();

        var journal = new GlideRecord("sys_journal_field");
        // Intentionally using GlideRecord.getRecordClassName because it will correctly
        // handle returning the correct table name when dealing with extended records
        journal.addQuery("name", parent.getRecordClassName());
        journal.addQuery("element_id", parent.getUniqueValue());
        journal.query();
        while (journal.next()) {
            manifest.addRecordByGlideRecord(journal);
            this.unloadRecord(journal, document);
        }
        return manifest;
    },

    /**
     * Adds the record's related audit entries to the update set
     * @param {GlideRecord} parent
     * @param {Document} document
     * @returns {global.KLF_RecordSync.Manifest}
     */
    addAuditEntries: function(parent, document) {
        var manifest = new global.KLF_RecordSync.Manifest();

        var audit = new GlideRecord("sys_audit");
        // Intentionally using GlideRecord.getRecordClassName because it will correctly
        // handle returning the correct table name when dealing with extended records
        audit.addQuery("tablename", parent.getRecordClassName());
        audit.addQuery("documentkey", parent.getUniqueValue());
        audit.query();
        while (audit.next()) {
            manifest.addRecordByGlideRecord(audit);
            this.unloadRecord(audit, document);
        }
        return manifest;
    },

    /**
     * Adds the record's related currency entries to the update set
     * @param {GlideRecord} parent
     * @param {Document} document
     * @returns {global.KLF_RecordSync.Manifest}
     */
    addCurrencyEntries: function(parent, document) {
        var manifest = new global.KLF_RecordSync.Manifest();

        var currency = new GlideRecord("fx_currency_instance");
        // Intentionally using GlideRecord.getRecordClassName because it will correctly
        // handle returning the correct table name when dealing with extended records
        currency.addQuery("table", parent.getRecordClassName());
        currency.addQuery("id", parent.getUniqueValue());
        currency.query();
        while (currency.next()) {
            manifest.addRecordByGlideRecord(currency);
            this.unloadRecord(currency, document);
        }
        return manifest;
    },

    /**
     * Adds the record's related currency entries to the update set
     * @param {GlideRecord} parent
     * @param {Document} document
     * @returns {global.KLF_RecordSync.Manifest}
     */
    addPriceEntries: function(parent, document) {
        var manifest = new global.KLF_RecordSync.Manifest();

        var price = new GlideRecord("fx_price");
        // Intentionally using GlideRecord.getRecordClassName because it will correctly
        // handle returning the correct table name when dealing with extended records
        price.addQuery("table", parent.getRecordClassName());
        price.addQuery("id", parent.getUniqueValue());
        price.query();
        while (price.next()) {
            manifest.addRecordByGlideRecord(price);
            this.unloadRecord(price, document);
        }
        return manifest;
    },

    /**
     * Maps a reference field using the provided mapping
     * @param {GlideRecord} glideRecord
     * @param {string} fieldName 
     * @param {{[key: string]: string}} mapping
     */
    mapReferenceField: function(glideRecord, fieldName, mapping) {
        var value = mapping[glideRecord.getValue(fieldName)] ||
            glideRecord.getValue(fieldName);
        glideRecord.setValue(fieldName, value);
    },

    /**
     * Maps a list field using the provided mapping
     * @param {GlideRecord} glideRecord
     * @param {string} fieldName 
     * @param {{[key: string]: string}} mapping
     */
    mapListField: function(glideRecord, fieldName, mapping) {
        var value = glideRecord.getValue(fieldName);
        if (!value) {
            return;
        }
        var groupSysIds = value.split(',');
        var mappedSysIds = groupSysIds.map(function(sysId) {
            return mapping[sysId] || sysId;
        });
        glideRecord.setValue(fieldName, mappedSysIds.join(','));
    },

    /**
     * Uses the user mapping to map the users in the record to the users in the target instance
     * @param {GlideRecord} glideRecord 
     */
    mapUsers: function(glideRecord) {
        var me = this;

        if (!me.userMapping) {
            return;
        }

        var mapping = me.userMapping.mapping;

        // Need to find all the fields that are user references
        var elements = new global.ArrayUtil().convertArray(glideRecord.getElements());
        elements.forEach(function(element) {
            var elementDescriptor = element.getED();
            if (elementDescriptor) {
                var internalType = elementDescriptor.getInternalType();
                var table;
                if (internalType == 'reference') {
                    table = elementDescriptor.getReference();
                    if (table == 'sys_user') {
                        me.mapReferenceField(glideRecord, element.getName(), mapping);
                    }
                } else if (internalType == 'glide_list') {
                    table = elementDescriptor.getReference();
                    if (table == 'sys_user') {
                        me.mapListField(glideRecord, element.getName(), mapping);
                    }
                }
            }
        });
    },

    /**
     * Uses the group mapping to map the groups in the record to the groups in the target instance
     * @param {GlideRecord} glideRecord 
     */
    mapGroups: function(glideRecord) {
        var me = this;

        if (!me.groupMapping) {
            return;
        }

        var mapping = me.groupMapping.mapping;

        // Need to find all the fields that are group references
        var elements = new global.ArrayUtil().convertArray(glideRecord.getElements());
        elements.forEach(function(element) {
            var elementDescriptor = element.getED();
            if (elementDescriptor) {
                var internalType = elementDescriptor.getInternalType();
                var table;
                if (internalType == 'reference') {
                    table = elementDescriptor.getReference();
                    if (table == 'sys_user_group') {
                        me.mapReferenceField(glideRecord, element.getName(), mapping);
                    }
                } else if (internalType == 'glide_list') {
                    table = elementDescriptor.getReference();
                    if (table == 'sys_user_group') {
                        me.mapListField(glideRecord, element.getName(), mapping);
                    }
                }
            }
        });
    },

    /**
     * Generates XML from GlideRecord that is like the XML generated by exporting a record from ServiceNow.
     * This XML can be used to import a record into ServiceNow.
     * @param {GlideRecord} glideRecord 
     * @param {Document} [document]
     * @returns {Document}
     */
    unloadRecord: function(glideRecord, document) {
        // I'm going to write to this glideRecord so I don't want something downstream
        // to write to the database so I'm disabling write operations just in case
        // something downstream tries to write
        glideRecord.setAbortAction(true);

        // This will map the groups in the record to the groups in the target instance
        // if a group mapping is provided in the constructor
        this.mapGroups(glideRecord);

        // This will map the users in the record to the users in the target instance
        this.mapUsers(glideRecord);

        // @ts-ignore
        var _document = document || global.GlideXMLUtil.newDocument('unload');
        if (!document) {
            // If the document was not passed in, then add the unload_date attribute
            var date = new GlideDateTime();
            _document.documentElement.setAttribute('unload_date', date.toString());
        }

        // If this is an extended table then I need the true record and not the base record
        // If I detect this isn't the extended record I query for the extended record
        if (glideRecord.getTableName() != glideRecord.getRecordClassName()) {
            var extended = new GlideRecord(glideRecord.getRecordClassName());
            extended.get(glideRecord.getUniqueValue());
            // @ts-ignore
            new global.GlideUnloader().unloadGlideRecord(_document, extended, 'INSERT_OR_UPDATE');
        } else {
            // @ts-ignore
            new global.GlideUnloader().unloadGlideRecord(_document, glideRecord, 'INSERT_OR_UPDATE');
        }

        return _document;
    },

    /**
     * Generates XML from GlideRecord that is like the XML generated by exporting a record from ServiceNow.
     * This XML can be used to import a record into ServiceNow.
     * 
     * Adds the record and its related audit entries, journal entries, and attachments to the document
     * @param {GlideRecord} glideRecord 
     * @param {Document} [document]
     * @returns {{manifest:global.KLF_RecordSync.Manifest, document:Document}}
     */
    unloadRecordWithRelatedRecords: function(glideRecord, document) {
        var manifest = new global.KLF_RecordSync.Manifest();
        manifest.addRecordByGlideRecord(glideRecord);

        // @ts-ignore
        var _document = document || global.GlideXMLUtil.newDocument('unload');
        if (!document) {
            // If the document was not passed in, then add the unload_date attribute
            var date = new GlideDateTime();
            _document.documentElement.setAttribute('unload_date', date.toString());
        }

        // Initially add the record to the document
        this.unloadRecord(glideRecord, _document);

        // Add related records to the document
        manifest.addManifest(this.addAuditEntries(glideRecord, _document));
        manifest.addManifest(this.addJournalEntries(glideRecord, _document));
        manifest.addManifest(this.addCurrencyEntries(glideRecord, _document));
        manifest.addManifest(this.addPriceEntries(glideRecord, _document));

        return {
            manifest: manifest,
            document: _document
        };
    },

    /**
     * Returns the XML representation of the Document
     * @param {Document} document 
     * @param {boolean} [prettyPrint]
     * @returns {string}
     */
    documentToString: function(document, prettyPrint) {
        if (prettyPrint) {
            // @ts-ignore
            return String(global.GlideXMLUtil.toIndentedString(document));
        } else {
            // @ts-ignore
            return String(global.GlideXMLUtil.toString(document));
        }
    },

    /**
     * This isn't used right now. The thought is that it could be used to generate a custom version of the XML. You'd do
     * that if you needed to do something special with the XML before sending it to the target instance. One use case I can
     * think of is altering how the sys_user and sys_user_group references are handled because the sys_id values will be different
     * in the target instance
     * 
     * Generates XML from GlideRecord that is like the XML generated by exporting a record from ServiceNow.
     * This XML can be used to import a record into ServiceNow.
     * @param {GlideRecord} glideRecord 
     */
    unloadRecordCustom: function(glideRecord) {
        var xml = '<record_update>';
        xml += '<' + glideRecord.getTableName() + '>';
        var fields = glideRecord.getFields();
        for (var i = 0; i < fields.size(); i++) {
            var field = fields.get(i);
            xml += '<' + field + '>' + glideRecord[field] + '</' + field + '>';
        }
        xml += '</' + glideRecord.getTableName() + '>';
        xml += '</record_update>';
        return xml;
    },

    /**
     * Imports a record into ServiceNow using the Table API.
     * Returns whatever the response was or null if there was an error
     * 
     * If a manifest is provided then the manifest is validated on the remote
     * instance to ensure the records in the manifest were inserted
     * 
     * @param {string} xml 
     * @param {global.KLF_RecordSync.Manifest} [manifest]
     * before the request is sent. It can be used to modify the XML or manifest before sending it to the target instance
     * @returns {KLF_SendToRemoteInstanceResponse}
     */
    sendToRemoteInstance: function(xml, manifest) {
        var _xml = xml;
        var _manifest = manifest;

        if (this.beforeTransfer) {
            var result = this.beforeTransfer(xml, manifest);
            _xml = result.xml;
            _manifest = result.manifest;
        }

        var request = this.createRestMessage();
        request.setHttpMethod('POST');
        request.setRequestHeader('Content-Type', 'application/xml');
        var endpoint = request.getEndpoint() + gs.getProperty('KLF_RecordSync.endpoint.import.path');
        request.setEndpoint(endpoint);
        request.setRequestBody(_xml);
        var response = request.execute();
        if (response.getStatusCode() != 200) {
            this.logError('Failed to load the record into the target instance');
            this.logError('Received status code: ' + response.getStatusCode());
            this.logError('Received body: ' + response.getBody());
            return {
                success: false,
                payload: response.getBody(),
                missingManifest: null
            };
        }

        var payload = response.getBody();

        if (_manifest) {
            return {
                success: true,
                payload: payload,
                missingManifest: this.validateSync(_manifest)
            };
        } else {
            return {
                success: true,
                payload: payload,
                missingManifest: null
            };
        }

    },

    /**
     * Checks the target instance for the list of records specified in the manifest. If the records do not exist in the target instance
     * then a new manifest is created that contains the records that do not exist in the target instance
     * @param {global.KLF_RecordSync.Manifest} manifest
     * @returns {global.KLF_RecordSync.Manifest?} A manifest of records that do not exist in the remote instance
     */
    validateSync: function(manifest) {
        var request = this.createRestMessage();
        request.setHttpMethod('POST');
        request.setRequestHeader('Content-Type', 'application/json');
        var endpoint = request.getEndpoint() + gs.getProperty('KLF_RecordSync.endpoint.import.path') + '/validate_manifest';
        request.setEndpoint(endpoint);
        request.setRequestBody(manifest.toJson());
        var response = request.execute();
        if (response.getStatusCode() != 200) {
            this.logError('Failed to validate manifest');
            this.logError('Received status code: ' + response.getStatusCode());
            this.logError('Received body: ' + response.getBody());
            return null;
        }

        var payload = response.getBody();
        var parsedPayload = JSON.parse(payload);
        var missingManifest = global.KLF_RecordSync.Manifest.createManifestFromObj(parsedPayload.result);
        return missingManifest;
    },

    /**
     * Returns true if the table has an auto number field called number
     * @param {string} tableName 
     * @returns {boolean}
     */
    tableHasAutoNumberField: function(tableName) {
        var gr = new GlideRecord(tableName);
        if (!gr.isValid()) {
            return false;
        }

        if (!gr.isValidField('number')) {
            return false;
        }

        var table = new GlideRecord('sys_db_object');
        if (!table.get('name', tableName)) {
            return false;
        }

        // If the table has a number_ref field then it is an auto number field
        if (table.number_ref.nil()) {
            return false;
        }

        // Just make sure the field is active
        var numberColumn = new GlideRecord('sys_dictionary');
        numberColumn.addQuery('name', tableName);
        numberColumn.addQuery('element', 'number');
        numberColumn.query();
        return numberColumn.next() && Boolean(numberColumn.active);
    }

};

(function() {
    var scope = 'x_53417_demo';

    /**
     * When initializing the KLF_RecordSync object you must pass in a configuration object
     * that contains connection information to the target instance.
     */
    function getConnectionConfig() {
        var connectionConfig = {
            instanceUrl: 'https://dev229555.service-now.com/',
            username: 'admin',
            password: gs.getProperty('KLF_RecordSync.password'),
            chunkSize: 20
        };
        return connectionConfig;
    }

    /**
     * Creates a user mapping for the target instance
     * @returns {KLF_RecordSync_UserMapping}
     */
    function createUserMapping() {
        var connectionConfig = getConnectionConfig();
        var userUtils = new global.KLF_RecordSync_UserUtils(connectionConfig);
        var users = userUtils.getUniqueUsersInScope(scope);
        return userUtils.createUserMapping(users, scope);
    }

    /**
     * Creates a group mapping for the target instance
     * @returns {KLF_RecordSync_GroupMapping}
     */
    function createGroupMapping() {
        var connectionConfig = getConnectionConfig();
        var groupUtils = new global.KLF_RecordSync_GroupUtils(connectionConfig);
        var groups = groupUtils.getUniqueGroupsInScope(scope);
        return groupUtils.createGroupMapping(groups, scope);
    }

    /**
     * Checks the target instance for notifications that need to be updated
     */
    function checkNotifications() {
        var connectionConfig = getConnectionConfig();
        var groupUtils = new global.KLF_RecordSync_GroupUtils(connectionConfig);
        var notifications = groupUtils.getNotificationsUsingGroupsInScope(scope);
        if (notifications.length > 0) {
            gs.info('Check Notifications: ' + notifications.join('\n'));
        } else {
            gs.info('No notifications found');
        }
    }

    /**
     * Updates the notifications in the target instance
     */
    function updateNotifications() {
        var connectionConfig = getConnectionConfig();
        var groupUtils = new global.KLF_RecordSync_GroupUtils(connectionConfig);
        var notifications = groupUtils.getNotificationsUsingGroupsInScope(scope);
        groupUtils.updateRemoteNotifications(groupUtils.getGroupMapping(scope), notifications);
    }

    function transferData() {
        var connectionConfig = getConnectionConfig();
        var userMapping = new global.KLF_RecordSync_UserUtils(connectionConfig).getUserMapping(scope);
        var groupMapping = new global.KLF_RecordSync_GroupUtils(connectionConfig).getGroupMapping(scope);
        var recordSync = new global.KLF_RecordSync(connectionConfig, userMapping, groupMapping);

        // Example of syncing all the data in a scope
        // This will find all tables in the x_53417_demo scope and sync all the data in those tables
        recordSync.syncAllDataInScope('x_53417_demo');

        // Example of including approvals that are associated with the scope
        // This shows that you can also sync data that is outside of the scope as sysapproval_approver records
        // are in the global scope
        var demoApproval = new GlideRecord('sysapproval_approver');
        demoApproval.addQuery('source_table', 'STARTSWITH', 'x_53417_demo');
        recordSync.syncTable('sysapproval_approver', demoApproval.getEncodedQuery());
    }

    // Checks to see if there are any notifications that need to be updated
    checkNotifications();

    // Creates the user mapping. This is necessary to map the users in the source instance to the users in the target instance
    createUserMapping();

    // Creates the group mapping. This is necessary to map the groups in the source instance to the groups in the target instance
    createGroupMapping();

    // Transfers the data from the source instance to the target instance
    transferData();

    // Updates the notifications in the target instance. This is necessary for notifications that directly reference groups
    updateNotifications();
});
/**
 * When transferring data between ServiceNow instances groups referenced in the source data set may not exist 
 * in the target instance. This utility contains functions to help manage the group data when transferring
 * data between instances.
 * 
 * With this utility you can:
 * - Create a mapping of the groups in the local system to the groups in the remote system {@link global.KLF_RecordSync_GroupUtils.createGroupMapping}
 * - Sync the groups in the local system with the remote system {@link global.KLF_RecordSync_GroupUtils.syncGroups}
 * - Update the group sys_ids in notifications that are transferred to the remote system {@link global.KLF_RecordSync_GroupUtils.updateRemoteNotifications}
 */

/**
 * Data type returned from call to {@link GroupUtils.getGroupFields}
 * @typedef KLF_RecordSync_GroupField
 * @property {string} table The name of the table that contains the field
 * @property {string} type The type of the field from sys_dictionary
 * @property {string} columnName The column name of the field
 * @property {string} sysId sys_dictionary.sys_id
 */

/**
 * @typedef KLF_RecordSync_GroupMapping
 * @property {boolean} success true if there was a successful response from the remote system. false if there was an error response
 * @property {boolean} hasMissingGroups true if there are missing groups
 * @property {string[]} missingGroups The sys_ids of the groups that do not exist in the remote system
 * @property {{[localGroupSysId:string]:string}} mapping The mapping of the sys_ids of the groups that exist in the local system to the remote system
 * @property {string} [error] There error message if success is false
 */

/**
 * @typedef {{sysId:string,name:string?,source:string?}} KLF_RecordSync_RemoteGroup
 */

/**
 * @typedef {{
 *   groupMapping:KLF_RecordSync_GroupMapping,
 *   notificationSysIds:string[]
 * }} KLF_RecordSync_UpdateRemoteNotificationsRequest
 */

/**
 * Incomplete notifications is a mapping of the notification sys_id to the groups that were not found in the remote system
 * @typedef {{
 *   success:boolean,
 *   error?:string,
 *   updatedNotifications:string[],
 *   notUpdatedNotifications:string[]
 *   incompleteNotifications?: {[notificationSysId:string]: string[]}
 * }} KLF_RecordSync_UpdateRemoteNotificationsResponse
 */


//@ts-ignore
var global = global || {};

/**
 * 
 * @param {KLF_RecordSyncConnectionConfig} connectionConfig 
 */
global.KLF_RecordSync_GroupUtils = function(connectionConfig) {
    this.connectionConfig = connectionConfig;
};

/**
 * Uses the {@link KLF_RecordSync_RemoteGroup[]} passed in from the remote system to create a {@link KLF_RecordSync_GroupMapping} object
 * that maps the remote group sys_id to the local group sys_id
 * @param {KLF_RecordSync_RemoteGroup[]} remoteGroups 
 * @returns {KLF_RecordSync_GroupMapping}
 */
global.KLF_RecordSync_GroupUtils.createMappingFromRemote = function(remoteGroups) {
    /**
     * Creates a mapping of the passed in fieldName to the sys_id of the remote group
     * This is to make it easy to lookup the sys_id of the remote group by the provided
     * field name without searching through the remoteGroups array each time
     * @param {keyof KLF_RecordSync_RemoteGroup} fieldName 
     * @param {KLF_RecordSync_RemoteGroup[]} remoteGroups 
     * @returns {{[name:string]:string}}
     */
    function createIndex(remoteGroups, fieldName) {
        return remoteGroups.reduce(function(index, remoteGroup) {
            var key = remoteGroup[fieldName];
            if (key) {
                index[key] = remoteGroup.sysId;
            }
            return index;
        }, /** @type {{[indexName:string]:string}} */ ({}));
    }

    /** 
     * I am transforming the remoteGroups into an object that contains of the
     * names, sys_ids, and sources of the remote groups so I can easily use those
     * values in a GlideRecord query
     * @type {{names:string[],sysIds:string[],sources:string[]}} 
     **/
    var namesSysIdsSources = remoteGroups.reduce(function(namesSysIdsSources, remoteGroup) {
        // There should always be a sys_id. The name and source are optional
        namesSysIdsSources.sysIds.push(remoteGroup.sysId);
        if (remoteGroup.name) {
            namesSysIdsSources.names.push(remoteGroup.name);
        }
        if (remoteGroup.source) {
            namesSysIdsSources.sources.push(remoteGroup.source);
        }
        return namesSysIdsSources;
    }, {
        names: /** @type {string[]} **/ ([]),
        sysIds: /** @type {string[]} **/ ([]),
        sources: /** @type {string[]} **/ ([]),
    });

    var nameToSysId = createIndex(remoteGroups, 'name');
    var sourceToSysId = createIndex(remoteGroups, 'source');
    var sysIdToSysId = createIndex(remoteGroups, 'sysId');

    var groupGr = new GlideRecord('sys_user_group');
    groupGr.addQuery('sys_id', 'IN', namesSysIdsSources.sysIds)
        .addOrCondition('source', 'IN', namesSysIdsSources.sources)
        .addOrCondition('name', 'IN', namesSysIdsSources.names);
    groupGr.query();
    /** @type {{[localGroupSysId:string]:string}} */
    var localToRemoteMapping = {};
    while (groupGr.next()) {
        // This is in order of priority. 
        // If the sys_id is found, then that is used. 
        // If the name is found, then that is used. 
        // If the source is found, then that is used
        if (sysIdToSysId[groupGr.getUniqueValue()]) {
            localToRemoteMapping[sysIdToSysId[groupGr.getUniqueValue()]] = groupGr.getUniqueValue();
        } else if (nameToSysId[groupGr.getValue('name')]) {
            localToRemoteMapping[nameToSysId[groupGr.getValue('name')]] = groupGr.getUniqueValue();
        } else if (sourceToSysId[groupGr.getValue('source')]) {
            localToRemoteMapping[sourceToSysId[groupGr.getValue('source')]] = groupGr.getUniqueValue();
        }
    }

    var mappedGroups = Object.keys(localToRemoteMapping);
    var allGroups = Object.keys(sysIdToSysId);
    var missingGroups = new global.ArrayUtil().diff(allGroups, mappedGroups);

    return {
        success: true,
        hasMissingGroups: missingGroups.length > 0,
        missingGroups: missingGroups,
        mapping: localToRemoteMapping
    };
};

/**
 * The group sys_ids in notifications are not updated when the notifications are transferred to the remote system. This method
 * uses the group mapping to update the notifications with the correct group sys_ids
 * @param {KLF_RecordSync_GroupMapping} groupMapping 
 * @param {string[]} notificationSysIds sysevent_email_action.sys_id[]
 * @returns {KLF_RecordSync_UpdateRemoteNotificationsResponse}
 */
global.KLF_RecordSync_GroupUtils.updateNotifications = function(groupMapping, notificationSysIds) {
    if (!Array.isArray(notificationSysIds)) {
        throw 'notificationSysIds must be an array';
    }

    if (notificationSysIds.length === 0) {
        return {
            success: true,
            updatedNotifications: [],
            notUpdatedNotifications: []
        };
    }

    var mapping = groupMapping.mapping;

    // Get notifications that use groups
    var notification = new GlideRecord('sysevent_email_action');
    notification.addQuery('sys_id', 'IN', notificationSysIds);
    notification.addNotNullQuery('recipient_groups');
    notification.query();

    var hasIncompleteNotifications = false;
    var incompleteNotifications = /** @type {{[notificationSysId:string]:string[]}} */ ({});
    var updatedNotifications = [];
    while (notification.next()) {
        var recipientGroups = notification.getValue('recipient_groups').split(',');
        var updatedRecipientGroups = recipientGroups.map(function(group) {
            return mapping[group] || group;
        });
        notification.recipient_groups = updatedRecipientGroups.join(',');
        notification.update();

        // Check to see if all the groups have been mapped
        // If all the groups have not been mapped then
        var group = new GlideRecord('sys_user_group');
        group.addQuery('sys_id', 'IN', updatedRecipientGroups);
        group.query();
        var mappedGroups = [];
        while (group.next()) {
            mappedGroups.push(group.getUniqueValue());
        }

        var unmappedGroups = new global.ArrayUtil().diff(updatedRecipientGroups, mappedGroups);
        if (unmappedGroups.length > 0) {
            hasIncompleteNotifications = true;
            incompleteNotifications[notification.getUniqueValue()] = unmappedGroups;
        }

        updatedNotifications.push(notification.getUniqueValue());
    }

    var notUpdatedNotifications = new global.ArrayUtil().diff(notificationSysIds, updatedNotifications);

    // Needs to return updated notifications and notifications that were not updated
    var response = {
        success: true,
        updatedNotifications: updatedNotifications,
        notUpdatedNotifications: notUpdatedNotifications
    };

    if (hasIncompleteNotifications) {
        // @ts-ignore
        response.incompleteNotifications = incompleteNotifications;
    }

    return response;

};

global.KLF_RecordSync_GroupUtils.prototype = {
    /**
     * @param {string} message 
     */
    logInfo: function(message) {
        gs.log(message, 'KLF_RecordSync_GroupUtils');
    },
    /**
     * @param {string} message 
     */
    logError: function(message) {
        gs.logError(message, 'KLF_RecordSync_GroupUtils');
    },

    /**
     * Finds all the fields that reference sys_user_group in a scoped app. This attempts to find
     * all the group fields in the system. The group fields will include both reference fields and
     * list fields that reference sys_user_group
     * @param {string} scopeNamespace sys_scope.scope
     * @returns {KLF_RecordSync_GroupField[]}
     */
    getGroupFieldsInScope: function(scopeNamespace) {
        var me = this;
        var dataTransferUtils = new global.KLF_DataTransferUtils();
        var tables = dataTransferUtils.getTablesInScope(scopeNamespace);
        var sysDictionarySysIds = /** @type {{[sysId:string]:boolean}} */ ({});
        return tables.reduce(function(allFields, tableName) {
            var fields = me.getGroupFieldsInTable(tableName, Object.keys(sysDictionarySysIds));
            fields.forEach(function(field) {
                sysDictionarySysIds[field.sysId] = true;
            });
            return allFields.concat(fields);
        }, []);
    },

    /**
     * Finds all the fields that reference sys_user_group in a table. This attempts to find
     * all the group fields in table. The group fields will include both reference fields and
     * list fields that reference sys_user_group
     * @param {string} tableName 
     * @param {string[]} [excludeFields] A map of sys_dictionary.sys_id to exclude from the results
     * @returns {KLF_RecordSync_GroupField[]}
     */
    getGroupFieldsInTable: function(tableName, excludeFields) {
        if (!tableName) {
            throw 'Table name is required';
        }
        var gr = new GlideRecord(tableName);
        if (!gr.isValid()) {
            throw 'Table does not exist: ' + tableName;
        }
        var arrayUtil = new global.ArrayUtil();
        // @ts-ignore
        var tableUtils = new global.TableUtils(tableName);
        var tables = arrayUtil.convertArray(tableUtils.getTables());
        return tables.reduce(function(allFields, tableName) {
            var fieldGr = new GlideRecord('sys_dictionary');
            fieldGr.addQuery('name', tableName);
            fieldGr.addQuery('reference', 'sys_user_group');
            if (excludeFields) {
                fieldGr.addQuery('sys_id', 'NOT IN', excludeFields);
            }
            fieldGr.query();
            var fields = [];
            while (fieldGr.next()) {
                fields.push({
                    sysId: fieldGr.getUniqueValue(),
                    table: fieldGr.name.toString(),
                    type: fieldGr.internal_type.toString(),
                    columnName: fieldGr.element.toString(),
                });
            }
            return allFields.concat(fields);
        }, []);
    },

    /**
     * Finds all the unique groups that are referenced in a table by using the group fields
     * that are returned from {@link GroupUtils.getGroupFields}
     * @param {string} tableName
     * @param {string} [filter] GlideRecord encoded query
     * @returns {string[]} The unique group sys_ids
     */
    getUniqueGroupsInTable: function(tableName, filter) {
        var fields = this.getGroupFieldsInTable(tableName);
        var gr = new GlideRecord(tableName);
        if (filter) {
            gr.addEncodedQuery(filter);
        }
        gr.query();
        /** @type {{[fieldName:string]: boolean}} */
        var groups = {};
        while (gr.next()) {
            fields.forEach(function(field) {
                var columnName = field.columnName;
                if (gr[columnName].nil()) {
                    return;
                }

                if (field.type === 'reference') {
                    groups[gr.getValue(columnName)] = true;
                } else if (field.type === 'glide_list') {
                    var groupList = gr.getValue(columnName).split(',');
                    groupList.forEach(function(group) {
                        groups[group] = true;
                    });
                } else {
                    throw 'Unsupported field type: ' + field.type;
                }
            });
        }
        return Object.keys(groups);
    },

    /**
     * Finds all the unique groups that are referenced in a scope by using the group fields
     * that are returned from {@link GroupUtils.getGroupFields}
     * @param {string} scope
     * @returns {string[]} The unique group sys_ids
     */
    getUniqueGroupsInScope: function(scope) {
        var me = this;
        var dataTransferUtils = new global.KLF_DataTransferUtils();
        var tables = dataTransferUtils.getTablesInScope(scope);
        return new global.ArrayUtil().unique(tables.reduce(function(allGroups, tableName) {
            return allGroups.concat(me.getUniqueGroupsInTable(tableName));
        }, []));
    },

    /**
     * Returns a sn_ws.RESTMessageV2 object that is configured to make a request to the target instance
     * @returns {sn_ws.RESTMessageV2}
     */
    createRestMessage: function() {
        var request = new sn_ws.RESTMessageV2();
        request.setRequestHeader("Accept", "application/json");
        var authHeader = 'Basic ' + GlideStringUtil.base64Encode(this.connectionConfig.username + ':' + this.connectionConfig.password);
        request.setRequestHeader('Authorization', authHeader);
        // Do not use setBasicAuth. This does not work with mutual auth for some reason
        // request.setBasicAuth(this.connectionConfig.username, this.connectionConfig.password);
        request.setEndpoint(this.connectionConfig.instanceUrl);
        return request;
    },

    cachePropertyName: 'KLF_RecordSync_GroupUtils.mapping',

    /**
     * Returns the group mapping that was created by calling {@link global.KLF_RecordSync_GroupUtils.createGroupMapping}. When calling
     * {@link global.KLF_RecordSync_GroupUtils.createGroupMapping}, the cache will be updated with the group mapping
     * @param {string} mappingName The mapping name used to store the mapping when calling {@link global.KLF_RecordSync_GroupUtils.createGroupMapping}
     */
    getGroupMapping: function(mappingName) {
        var cacheJson = gs.getProperty(this.cachePropertyName);
        var cache = JSON.parse(cacheJson);
        var mapping = cache[this.getCacheKey(mappingName)];
        if (!mapping) {
            throw 'Call createGroupMapping first to create the group mapping';
        }
        return mapping;
    },

    /**
     * Returns a mappingName that is used to store / retrieve a group mapping from the cache
     * See {@link global.KLF_RecordSync_GroupUtils.getGroupMapping} and {@link global.KLF_RecordSync_GroupUtils.createGroupMapping}
     * @param {string} mappingName 
     * @returns {string}
     */
    getCacheKey: function(mappingName) {
        return this.connectionConfig.instanceUrl + ':' + mappingName;
    },

    /**
     * Uses the sys_ids of the groups in the local system to find the sys_ids of the groups that exist in the remote system. This returns
     * a mapping of the local group sys_id to the remote group sys_id. If a group does not exist in the remote system, the remote group sys_id will be null
     * 
     * By default the results are cached. If you want to bypass the cache, set useCache to false. When using the cache a mappingName is required. This is used
     * when you retrieve the group mapping using {@link global.KLF_RecordSync_GroupUtils.getGroupMapping}
     * @param {string[]} groupSysIds
     * @param {boolean} [useCache=true] If true, the cache will be used to store the group mappings. true by default
     * @param {string} [mappingName] A mapping name to store the group mapping under. This is not needed if useCache is false. Typically this would be the application scope, for example: x_example_app
     * @returns {KLF_RecordSync_GroupMapping} The sys_ids of the groups that do not exist in the remote system
     */
    createGroupMapping: function(groupSysIds, mappingName, useCache) {
        var _useCache = useCache === undefined ? true : useCache;
        var groupRecords = new GlideRecord('sys_user_group');
        groupRecords.addQuery('sys_id', 'IN', groupSysIds);
        groupRecords.query();

        /** @type {KLF_RecordSync_RemoteGroup[]} */
        var groups = [];
        var foundGroups = [];
        while (groupRecords.next()) {
            foundGroups.push(groupRecords.getUniqueValue());
            groups.push({
                sysId: groupRecords.getValue('sys_id'),
                name: groupRecords.getValue('name'),
                source: groupRecords.getValue('source')
            });
        }

        // Add the missing groups. These groups don't really exist in the local system for some reason
        // I will still attempt to find them in the remote system
        var missingGroupSysIds = new global.ArrayUtil().diff(groupSysIds, foundGroups);
        missingGroupSysIds.forEach(function(sysId) {
            groups.push({
                sysId: sysId,
                name: '',
                source: ''
            });
        });

        // Make a  request to sys_user_group
        var request = this.createRestMessage();
        request.setRequestHeader('Content-Type', 'application/json');
        request.setHttpMethod('POST');
        var endpoint = request.getEndpoint() + gs.getProperty('KLF_RecordSync_GroupUtils.endpoint.mapping.path');
        request.setEndpoint(endpoint);
        this.logInfo('Creating group mapping using RemoteGroups:\n\n' + JSON.stringify(groups, null, 4));
        request.setRequestBody(JSON.stringify(groups));

        var response = request.execute();
        if (response.getStatusCode() != 200) {
            this.logError('Failed to group mapping using groups: ' + groupSysIds.join(', '));
            this.logError('Received status code: ' + response.getStatusCode());
            this.logError('Received body: ' + response.getBody());
            if (_useCache) {
                gs.setProperty(this.cachePropertyName, '');
            }
            return {
                success: false,
                error: response.getBody(),
                hasMissingGroups: true,
                missingGroups: [],
                mapping: {}
            };
        }

        var payload = response.getBody();
        this.logInfo('Received group mapping response:\n\n' + payload);
        if (payload) {
            var parsedPayload = JSON.parse(payload);
            /** @type {KLF_RecordSync_GroupMapping} */
            var groupMapping = parsedPayload.result;
            if (_useCache) {
                if (!mappingName) {
                    throw 'KLF_RecordSync_GroupUtils: A mapping name is required when using the cache';
                }
                var cacheJson = gs.getProperty(this.cachePropertyName, '{}');
                var cache = JSON.parse(cacheJson);
                cache[this.getCacheKey(mappingName)] = groupMapping;
                gs.setProperty(this.cachePropertyName, JSON.stringify(cache, null, 4));
            }
            return groupMapping;
        } else {
            if (_useCache) {
                gs.setProperty(this.cachePropertyName, '');
            }
            return {
                success: false,
                error: 'No response body was received from the remote system',
                hasMissingGroups: true,
                missingGroups: [],
                mapping: {}
            };
        }
    },

    /**
     * Syncs the specified groups by their sys_user_group.sys_id in the local system with the remote system.
     * 
     * This will throw an exception if there are groups that don't exist in the group list unless
     * the quiet parameter is set to true
     * 
     * This will return null if the method finds that there are no groups to sync
     * @param {string[]} groupSysIds sys_user_group.sys_id[]
     * @param {boolean} [quiet=false] If true then sync will proceed even if there are groups that don't exist in the group list
     * @returns {KLF_SendToRemoteInstanceResponse?}
     */
    syncGroups: function(groupSysIds, quiet) {
        var manifest = new global.KLF_RecordSync.Manifest();
        var recordSync = new global.KLF_RecordSync(this.connectionConfig);
        var document = recordSync.createUnloadDocument();
        var group = new GlideRecord('sys_user_group');
        group.addQuery('sys_id', 'IN', groupSysIds);
        group.query();
        var foundGroupSysIds = [];
        while (group.next()) {
            foundGroupSysIds.push(group.getUniqueValue());
            recordSync.unloadRecord(group, document);
            manifest.addRecordByGlideRecord(group);
        }

        var missingGroupSysIds = new global.ArrayUtil().diff(groupSysIds, foundGroupSysIds);
        if (missingGroupSysIds.length > 0) {
            var errorMessage = 'The following groups were not found in the group list:\n' + missingGroupSysIds.join(',') + '\n';
            if (quiet) {
                this.logError(errorMessage);
            } else {
                throw errorMessage;
            }
        }

        if (foundGroupSysIds.length === 0) {
            return null;
        } else {
            return recordSync.syncDocument(document, manifest);
        }
    },

    /**
     * Returns a list of sys_ids of notifications in the provided scope that use groups as one of the recipients.
     * Useful to use in combination with {@link global.KLF_RecordSync_GroupUtils.updateRemoteNotifications}
     * @param {string} scope 
     * @returns {string[]} sysevent_email_action.sys_id[]
     */
    getNotificationsUsingGroupsInScope: function(scope) {
        var notification = new GlideRecord('sysevent_email_action');
        notification.addQuery('sys_scope.scope', scope);
		notification.addEncodedQuery([
			'sys_scope.scope=' + scope,
			'^recipient_groupsISNOTEMPTY',
			'^NQ', // This means New Query. It's a way of running two distinct filters
			'sys_scope.name=' + scope,
			'^sys_scope.scope=global',
			'^recipient_groupsISNOTEMPTY'
		].join(''));
        notification.query();
        var notifications = [];
        while (notification.next()) {
            notifications.push(notification.getUniqueValue());
        }
        return notifications;
    },

    /**
     * Returns a list of sys_user_group.sys_id of the groups that are used in the specified notifications
     * @param {string[]} notificationSysIds sysevent_email_action.sys_id[]
     * @returns {string[]} sys_user_group.sys_id[]
     */
    getGroupsUsedInNotifications: function(notificationSysIds) {
        if (!Array.isArray(notificationSysIds)) {
            throw 'notificationSysIds must be an array';
        }
        var notification = new GlideRecord('sysevent_email_action');
        notification.addQuery('sys_id', 'IN', notificationSysIds);
        notification.addNotNullQuery('recipient_groups');
        notification.query();
        var groups = /** @type string[] */ ([]);
        while (notification.next()) {
            var recipientGroups = notification.getValue('recipient_groups').split(',');
            groups = groups.concat(recipientGroups);
        }
        return new global.ArrayUtil().unique(groups);
    },

    /**
     * The group sys_ids in notifications are not updated when the notifications are transferred to the remote system. This method
     * uses the group mapping to update the notifications with the correct group sys_ids on the remote system
     * @param {KLF_RecordSync_GroupMapping} groupMapping 
     * @param {string[]} notificationSysIds sysevent_email_action.sys_id[]
     * @returns {KLF_RecordSync_UpdateRemoteNotificationsResponse}
     */
    updateRemoteNotifications: function(groupMapping, notificationSysIds) {
        var request = this.createRestMessage();
        request.setHttpMethod('POST');
        request.setEndpoint(request.getEndpoint() + gs.getProperty('KLF_RecordSync_GroupUtils.endpoint.notifications.path'));
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestBody(JSON.stringify({
            groupMapping: groupMapping,
            notificationSysIds: notificationSysIds
        }));
        var response = request.execute();
        if (response.getStatusCode() != 200) {
            this.logError('Failed to update remote notifications');
            this.logError('Received status code: ' + response.getStatusCode());
            this.logError('Received body: ' + response.getBody());
            return {
                success: false,
                error: response.getBody(),
                updatedNotifications: [],
                notUpdatedNotifications: []
            };
        }

        return JSON.parse(response.getBody());
    }
};
/**
 * When transferring an application between ServiceNow instances the various users and
 * groups on the target system will not have the same roles as the source system. This
 * script include helps to manage the transition of roles between the two systems.
 * 
 * The script include provides methods to:
 * - getRolesInScope: Returns a list of roles in the provided scope
 * - diffLocalAndRemoteRoles: Compares the roles assigned to users and groups on the source and target instances
 * - getRemoteRoleAssignedTo: Returns the roles on the source instance that are not assigned to the user or group on the target instance
 * - getAssignedToRole: Generates a data object that contains two keys: users and groups
 * - getRoleAssignedTo: Generates a data object that contains role names as keys
 * - getUsersForRole: Returns a list of usernames that have the specified role
 * - getGroupsForRole: Returns a list of group names that have the specified role
 * @example
 * // This finds the roles in the x_53417_demo scope
 * // Check the differences between the roles on the source and target instances
 * // Then syncs the roles on the target instance so they are the same as the source instance
 * // for the roles that are missing
 * var connectionConfig = {
 *     username: 'kenneth.frencher',
 *     password: gs.getProperty('KLF_RecordSync.user.password'), // Retrieve password from encoded password property
 *     instanceUrl: 'https://abspscpov2.service-now.com',
 *     chunkSize: 20
 * };
 * var roleUtils = new global.KLF_RecordSync_RoleUtils(connectionConfig);
 * var missingRoles = roleUtils.diffLocalAndRemoteRoles(roleNames);
 * roleUtils.syncRoles(missingRoles);
 */

var global = global || {};

/**
 * @param {KLF_RecordSyncConnectionConfig} connectionConfig 
 */
global.KLF_RecordSync_RoleUtils = function(connectionConfig) {
    this.connectionConfig = connectionConfig;
};

/**
 * @typedef {{
 * roleAssignedToData?: RoleAssignedToData,
 * success: boolean
 * error?: string
 * }} RoleAssignedToResponse
 */
/**
 * @param {string[]} roleNames 
 * @returns 
 */
global.KLF_RecordSync_RoleUtils.getRemoteRoleAssignedTo = function(roleNames) {
    return {
        // @ts-ignore
        roleAssignedToData: new global.KLF_RecordSync_RoleUtils().getRoleAssignedTo(roleNames),
        success: true
    };
};

/**
 * @typedef {{
 * success: boolean
 * errors: string[]
 * }} AddRolesResponse
 */
/**
 * @param {RoleAssignedToData} roleData 
 * @returns {AddRolesResponse}
 */
global.KLF_RecordSync_RoleUtils.addRoles = function(roleData) {
    // @ts-ignore
    var errors = new global.KLF_RecordSync_RoleUtils().addRoles(roleData);
    return {
        success: true,
        errors: errors
    };
};

global.KLF_RecordSync_RoleUtils.prototype = {
    /**
     * @param {string} message 
     */
    logInfo: function(message) {
        gs.log(message, 'KLF_RecordSync_RoleUtils');
    },
    /**
     * @param {string} message 
     */
    logError: function(message) {
        gs.logError(message, 'KLF_RecordSync_RoleUtils');
    },
    /**
     * Returns a list of roles in the provided scope
     * @param {string} scope
     * @returns {string[]}
     */
    getRolesInScope: function(scope) {
        if (!scope) {
            throw new Error('Scope is required');
        }
        var roles = [];
        var role = new GlideRecord('sys_user_role');
        role.addQuery('sys_scope.scope', scope);
        role.query();
        while (role.next()) {
            roles.push(role.name.toString());
        }
        return roles;
    },

    /**
     * Compares the two role objects and returns the roles that are present in
     * role1 but not in role2. The role names in the two objects must match.
     * @param {RoleAssignedToData} role1
     * @param {RoleAssignedToData} role2
     * @returns {RoleAssignedToData}
     */
    diffRoles: function(role1, role2) {
        var roles1 = Object.keys(role1);
        var roles2 = Object.keys(role2);

        var missingRoles = new global.ArrayUtil().diff(roles1, roles2);
        if (missingRoles.length > 0) {
            throw new Error('Role names do not match: ' + missingRoles.join('\n'));
        }

        return roles1.reduce(function(diff, roleName) {
            var users1 = role1[roleName].users;
            var users2 = role2[roleName].users;
            var missingUsers = new global.ArrayUtil().diff(users1, users2);

            var groups1 = role1[roleName].groups;
            var groups2 = role2[roleName].groups;
            var missingGroups = new global.ArrayUtil().diff(groups1, groups2);

            diff[roleName] = {
                users: missingUsers,
                groups: missingGroups
            };
            return diff;
        }, /** @type {RoleAssignedToData} */ ({}));
    },

    /**
     * Synchronizes the passed roles with the target instance
     * @param {RoleAssignedToData} roleData
     */
    syncRoles: function(roleData) {
        // Make a  request to sys_user_group
        var request = this.createRestMessage();
        request.setRequestHeader('Content-Type', 'application/json');
        request.setHttpMethod('POST');
        var endpoint = request.getEndpoint() + gs.getProperty('KLF_RecordSync_RoleUtils.endpoint.roles.path');
        request.setEndpoint(endpoint);
        this.logInfo('Syncing remote roles:\n\n' + JSON.stringify(roleData, null, 4));
        request.setRequestBody(JSON.stringify(roleData));

        var response = request.execute();
        if (response.getStatusCode() != 200) {
            this.logError('Failed to sync roles using role data: ' + JSON.stringify(roleData));
            this.logError('Received status code: ' + response.getStatusCode());
            this.logError('Received body: ' + response.getBody());
            return {
                success: false,
                error: response.getBody()
            };
        }

        var responseBody = JSON.parse(response.getBody());
        return {
            success: true,
            errors: responseBody.result.errors
        };
    },

    /**
     * Adds the specified roles to the users / groups
     * @param {RoleAssignedToData} roleData
     * @returns {string[]} Array of any errors that occurred
     */
    addRoles: function(roleData) {
        var me = this;
        var roleNames = Object.keys(roleData);
        var errors = /** @type {string[]} */ ([]);
        roleNames.forEach(function(roleName) {
            var assignedTo = roleData[roleName];
            assignedTo.users.forEach(function(username) {
                try {
                    me._addUserRole(username, roleName);
                } catch (e) {
                    if (e instanceof Error && e.name == 'UserNotFoundError') {
                        errors.push(e.message);
                    }
                    if (e instanceof Error && e.name == 'RoleNotFoundError') {
                        errors.push(e.message);
                    }
                }
            });
            assignedTo.groups.forEach(function(groupName) {
                try {
                    me._addGroupRole(groupName, roleName);
                } catch (e) {
                    if (e instanceof Error && e.name == 'GroupNotFoundError') {
                        errors.push(e.message);
                    }
                    if (e instanceof Error && e.name == 'RoleNotFoundError') {
                        errors.push(e.message);
                    }
                }
            });
        });

        return errors;
    },

    /**
     * Compares the roles assigned to users and groups on the source and target instances.
     * Returns the roles on the source instance that are not assigned to the user or group
     * on the target instance.
     * 
     * This allows for the roles to be added to the user or group on the target instance.
     * @param {string[]} roleNames
     * @returns {RoleAssignedToData}
     */
    diffLocalAndRemoteRoles: function(roleNames) {
        var localRoles = this.getRoleAssignedTo(roleNames);
        var response = this.getRemoteRoleAssignedTo(roleNames);
        if (!response.success) {
            throw new Error('Failed to retrieve remote roles: ' + response.error);
        }

        var remoteRoles = /** @type {RoleAssignedToData} */ (response.roleAssignedToData);
        return this.diffRoles(localRoles, remoteRoles);
    },

    /**
     * Returns a sn_ws.RESTMessageV2 object that is configured to make a request to the target instance
     * @returns {sn_ws.RESTMessageV2}
     */
    createRestMessage: function() {
        var request = new sn_ws.RESTMessageV2();
        request.setRequestHeader("Accept", "application/json");
        var authHeader = 'Basic ' + GlideStringUtil.base64Encode(this.connectionConfig.username + ':' + this.connectionConfig.password);
        request.setRequestHeader('Authorization', authHeader);
        // Do not use setBasicAuth. This does not work with mutual auth for some reason
        // request.setBasicAuth(this.connectionConfig.username, this.connectionConfig.password);
        request.setEndpoint(this.connectionConfig.instanceUrl);
        return request;
    },

    /**
     * @param {string[]} roleNames
     * @returns {RoleAssignedToResponse}
     */
    getRemoteRoleAssignedTo: function(roleNames) {
        // Make a  request to sys_user_group
        var request = this.createRestMessage();
        request.setRequestHeader('Content-Type', 'application/json');
        request.setHttpMethod('GET');
        var endpoint = request.getEndpoint() +
            gs.getProperty('KLF_RecordSync_RoleUtils.endpoint.roles.path') +
            '?roleNames=' + roleNames.join(',');
        request.setEndpoint(endpoint);
        this.logInfo('Retrieving remote roles using endpoint: ' + endpoint);
        this.logInfo('Retrieving remote roles:\n\n' + JSON.stringify(roleNames, null, 4));

        var response = request.execute();
        if (response.getStatusCode() != 200) {
            this.logError('Failed to retrieve roles using role names: ' + roleNames.join(', '));
            this.logError('Received status code: ' + response.getStatusCode());
            this.logError('Received body: ' + response.getBody());
            return {
                success: false,
                error: response.getBody()
            };
        }

        this.logInfo('Response from getRemoteRoleAssignedTo: ' + response.getBody());
        var responseBody = JSON.parse(response.getBody());
        return {
            success: true,
            roleAssignedToData: responseBody.result.roleAssignedToData
        };
    },

    /**
     * @typedef {{
     * users: {
     *   [username:string]: string[] // role names
     * },
     * groups: {
     *   [groupName:string]: string[] // role names
     * }
     * }} AssignedToRoleData
     */
    /**
     * Generates a data object that contains two keys: users and groups. The users key
     * contains a map of usernames to role names. The groups key contains a map of group
     * names to role names.
     * 
     * The roles in each map are the uninherited roles associated with the user or group on the source
     * instance
     * 
     * @param {string[]} roleNames
     * @returns {AssignedToRoleData}
     * @example
     * var roleUtils = new global.KLF_RecordSync_RoleUtils();
     * roleUtils.getRoleAssignedTo(['x_53417_demo.user']);
     * // returns:
     * {
     *   "users": {
     *       "avery.parbol": [
     *           "x_53417_demo.user"
     *       ],
     *       "alyssa.biasotti": [
     *           "x_53417_demo.user"
     *       ],
     *   },
     *   "groups": {
     *       "ATF_TestGroup_ServiceDesk": [
     *           "x_53417_demo.user"
     *       ],
     *       "Network CAB Managers": [
     *           "x_53417_demo.user"
     *       ],
     *   }
     * }
     */
    getAssignedToRole: function(roleNames) {
        var me = this;
        return roleNames.reduce(function(roleData, roleName) {
            var users = me.getUsersForRole(roleName);
            var groups = me.getGroupsForRole(roleName);

            roleData.users = users.reduce(function(userMap, userName) {
                userMap[userName] = userMap[userName] || [];
                userMap[userName].push(roleName);
                return userMap;
            }, roleData.users || {});

            roleData.groups = groups.reduce(function(groupMap, groupName) {
                groupMap[groupName] = groupMap[groupName] || [];
                groupMap[groupName].push(roleName);
                return groupMap;
            }, roleData.groups || {});

            return roleData;
        }, /** @type {AssignedToRoleData} */ ({}));
    },

    /**
     * @typedef {{
     * [roleName:string]: {
     *  users: string[],
     *  groups: string[]
     * }
     * }} RoleAssignedToData
     */
    /**
     * Generates a data object that contains role names as keys. Each key contains
     * an object with two keys: users and groups. The users key contains a list of
     * usernames that have the role on the source instance. The groups key contains
     * a list of group names that have the role on the source instance.
     * 
     * @param {string[]} roleNames
     * @returns {RoleAssignedToData}
     * @example
     * var roleUtils = new global.KLF_RecordSync_RoleUtils();
     * roleUtils.getRoleAssignedTo(['x_53417_demo.user']);
     * // returns:
     * {
     *   "x_53417_demo.user": {
     *       "users": [
     *           "avery.parbol",
     *           "alyssa.biasotti"
     *       ],
     *       "groups": [
     *           "ATF_TestGroup_ServiceDesk",
     *           "Network CAB Managers"
     *       ]
     *   }
     * }
     */
    getRoleAssignedTo: function(roleNames) {
        var me = this;
        return roleNames.reduce(function(roleData, roleName) {
            roleData[roleName] = {
                users: me.getUsersForRole(roleName),
                groups: me.getGroupsForRole(roleName)
            };
            return roleData;
        }, /** @type {RoleAssignedToData} */ ({}));
    },


    /**
     * Returns a list of usernames that have the specified role
     * @param {string} roleName 
     * @returns {string[]}
     */
    getUsersForRole: function(roleName) {
        if (!roleName) {
            throw new Error('Role name is required');
        }
        var userNames = [];
        var userRole = new GlideRecord('sys_user_has_role');
        userRole.addQuery('role.name', roleName);
        userRole.addQuery('inherited', false);
        userRole.query();
        while (userRole.next()) {
            userNames.push(userRole.user.user_name.toString());
        }
        return userNames;
    },

    /**
     * Returns a list of group names that have the specified role
     * @param {string} roleName 
     * @returns {string[]}
     */
    getGroupsForRole: function(roleName) {
        if (!roleName) {
            throw new Error('Role name is required');
        }
        var groupNames = [];
        var groupRole = new GlideRecord('sys_group_has_role');
        groupRole.addQuery('role.name', roleName);
        groupRole.query();
        while (groupRole.next()) {
            groupNames.push(groupRole.group.name.toString());
        }
        return groupNames;
    },

    /**
     * Adds the specified role to the group. If the role is already assigned to the group
     * then no action is taken.
     * @param {string} groupName 
     * @param {string} roleName 
     * @throws {Error} If the user or role does not exist
     */
    _addGroupRole: function(groupName, roleName) {
        var groupRole = new GlideRecord('sys_group_has_role');
        var error = null;
        // Make sure user and role exist
        var group = new GlideRecord('sys_user_group');
        if (!group.get('name', groupName)) {
            error = new Error('Group not found: ' + groupName);
            error.name = 'GroupNotFoundError';
            throw error;
        }
        var role = new GlideRecord('sys_user_role');
        if (!role.get('name', roleName)) {
            error = new Error('Role not found: ' + roleName);
            error.name = 'RoleNotFoundError';
            throw error;
        }
        groupRole.addQuery('group.name', groupName);
        groupRole.addQuery('role.name', roleName);
        groupRole.query();
        if (!groupRole.next()) {
            groupRole.newRecord();
            groupRole.group = group.getUniqueValue();
            groupRole.role = role.getUniqueValue();
            groupRole.update();
        }
    },


    /**
     * Adds the specified role to the user. If the role is already assigned to the user
     * then no action is taken.
     * @param {string} username 
     * @param {string} roleName 
     * @throws {Error} If the user or role does not exist
     */
    _addUserRole: function(username, roleName) {
        var userRole = new GlideRecord('sys_user_has_role');
        var error = null;
        // Make sure user and role exist
        var user = new GlideRecord('sys_user');
        if (!user.get('user_name', username)) {
            error = new Error('User not found: ' + username);
            error.name = 'UserNotFoundError';
            throw error;
        }
        var role = new GlideRecord('sys_user_role');
        if (!role.get('name', roleName)) {
            error = new Error('Role not found: ' + roleName);
            error.name = 'RoleNotFoundError';
            throw error;
        }
        userRole.addQuery('user.user_name', username);
        userRole.addQuery('role.name', roleName);
        userRole.query();
        if (!userRole.next()) {
            userRole.newRecord();
            userRole.user = user.getUniqueValue();
            userRole.role = role.getUniqueValue();
            userRole.update();
        }
    }

};
/**
 * When transferring data between ServiceNow instances users referenced in the source data set may not exist 
 * in the target instance. This utility contains functions to help manage the user data when transferring
 * data between instances.
 * 
 * With this utility you can:
 * - Create a mapping of the users in the local system to the users in the remote system {@link global.KLF_RecordSync_UserUtils.createUserMapping}
 */

/**
 * Data type returned from call to {@link global.KLF_RecordSync_UserUtils.getUserFields}
 * @typedef KLF_RecordSync_UserField
 * @property {string} table The name of the table that contains the field
 * @property {string} type The type of the field from sys_dictionary
 * @property {string} columnName The column name of the field
 */

/**
 * @typedef KLF_RecordSync_UserMapping
 * @property {boolean} success true if there was a successful response from the remote system. false if there was an error response
 * @property {boolean} hasMissingUsers true if there are missing users
 * @property {string[]} missingUsers The sys_ids of the users that do not exist in the remote system
 * @property {{[localUserSysId:string]:string}} mapping The mapping of the sys_ids of the users that exist in the local system to the remote system
 * @property {string} [error] There error message if success is false
 */

/**
 * @typedef {{sysId:string,username:string?,source:string?}} KLF_RecordSync_RemoteUser
 */

//@ts-ignore
var global = global || {};

/**
 * 
 * @param {KLF_RecordSyncConnectionConfig} connectionConfig 
 */
global.KLF_RecordSync_UserUtils = function(connectionConfig) {
    this.connectionConfig = connectionConfig;
};

/**
 * Uses the {@link KLF_RecordSync_RemoteUser[]} passed in from the remote system to create a {@link KLF_RecordSync_UserMapping} object
 * that maps the remote user sys_id to the local user sys_id
 * @param {KLF_RecordSync_RemoteUser[]} remoteUsers 
 * @returns {KLF_RecordSync_UserMapping}
 */
global.KLF_RecordSync_UserUtils.createMappingFromRemote = function(remoteUsers) {
    /**
     * Creates a mapping of the passed in fieldName to the sys_id of the remote user
     * This is to make it easy to lookup the sys_id of the remote user by the provided
     * field name without searching through the remoteUsers array each time
     * @param {keyof KLF_RecordSync_RemoteUser} fieldName 
     * @param {KLF_RecordSync_RemoteUser[]} remoteUsers 
     * @returns {{[name:string]:string}}
     */
    function createIndex(remoteUsers, fieldName) {
        return remoteUsers.reduce(function(index, remoteUser) {
            var key = remoteUser[fieldName];
            if (key) {
                index[key] = remoteUser.sysId;
            }
            return index;
        }, /** @type {{[indexName:string]:string}} */ ({}));
    }

    /** 
     * I am transforming the remoteUsers into an object that contains of the
     * names, sys_ids, and sources of the remote users so I can easily use those
     * values in a GlideRecord query
     * @type {{usernames:string[],sysIds:string[],sources:string[]}} 
     **/
    var usernamesSysIdsSources = remoteUsers.reduce(function(namesSysIdsSources, remoteUser) {
        // There should always be a sys_id. The name and source are optional
        namesSysIdsSources.sysIds.push(remoteUser.sysId);
        if (remoteUser.username) {
            namesSysIdsSources.usernames.push(remoteUser.username);
        }
        if (remoteUser.source) {
            namesSysIdsSources.sources.push(remoteUser.source);
        }
        return namesSysIdsSources;
    }, {
        usernames: /** @type {string[]} **/ ([]),
        sysIds: /** @type {string[]} **/ ([]),
        sources: /** @type {string[]} **/ ([]),
    });

    var usernameToSysId = createIndex(remoteUsers, 'username');
    var sourceToSysId = createIndex(remoteUsers, 'source');
    var sysIdToSysId = createIndex(remoteUsers, 'sysId');

    var userGr = new GlideRecord('sys_user');
    userGr.addQuery('sys_id', 'IN', usernamesSysIdsSources.sysIds)
        .addOrCondition('source', 'IN', usernamesSysIdsSources.sources)
        .addOrCondition('user_name', 'IN', usernamesSysIdsSources.usernames);
    userGr.query();
    /** @type {{[localUserSysId:string]:string}} */
    var localToRemoteMapping = {};
    while (userGr.next()) {
        // This is in order of priority. 
        // If the sys_id is found, then that is used. 
        // If the name is found, then that is used. 
        // If the source is found, then that is used
        if (sysIdToSysId[userGr.getUniqueValue()]) {
            localToRemoteMapping[sysIdToSysId[userGr.getUniqueValue()]] = userGr.getUniqueValue();
        } else if (usernameToSysId[userGr.getValue('user_name')]) {
            localToRemoteMapping[usernameToSysId[userGr.getValue('user_name')]] = userGr.getUniqueValue();
        } else if (sourceToSysId[userGr.getValue('source')]) {
            localToRemoteMapping[sourceToSysId[userGr.getValue('source')]] = userGr.getUniqueValue();
        }
    }

    var mappedUsers = Object.keys(localToRemoteMapping);
    var allUsers = Object.keys(sysIdToSysId);
    var missingUsers = new global.ArrayUtil().diff(allUsers, mappedUsers);

    return {
        success: true,
        hasMissingUsers: missingUsers.length > 0,
        missingUsers: missingUsers,
        mapping: localToRemoteMapping
    };
};

global.KLF_RecordSync_UserUtils.prototype = {
    /**
     * @param {string} message 
     */
    logInfo: function(message) {
        gs.log(message, 'KLF_RecordSync_UserUtils');
    },
    /**
     * @param {string} message 
     */
    logError: function(message) {
        gs.logError(message, 'KLF_RecordSync_UserUtils');
    },

    /**
     * Checks sys_user display field to make sure it is set to sys_user.user_name
     * Returns true if the display field is set to sys_user.user_name false otherwise
     * @returns {boolean}
     */
    checkSysUserDisplayField: function() {
        var field = new GlideRecord('sys_dictionary');
        field.addQuery('name', 'sys_user');
        field.addQuery('element', 'user_name');
        field.addQuery('display', true);
        field.query();

        return field.getRowCount() > 0;
    },

    /**
     * Clears the sys_user display field. This is typically used when the sys_user table is configured to pick a default display field.
     * Probably sys_user.name
     */
    clearSysUserDisplayField: function() {
        var displayField = new GlideRecord('sys_dictionary');
        displayField.addQuery('name', 'sys_user');
        displayField.addQuery('display', true);
        displayField.setWorkflow(false);
        displayField.autoSysFields(false);
        displayField.setValue('display', false);
        displayField.updateMultiple();
    },

    /**
     * When transferring sys_user data between instances the sys_user display value may be used to match users
     * 
     * This changes sys_user display value to sys_user.user_name instead of sys_user.name. This
     * is because the sys_user.user_name field is unique and the sys_user.name field is not.
     * 
     * When transferring data between instances, the sys_user.name field is not guaranteed to be unique
     * which could cause subtle bugs when trying to match users by name
     * 
     * @param {string} fieldName The field name to update the sys_user display field to
     * @returns {string} The previous display field name
     */
    updateSysUserDisplayField: function(fieldName) {
        // Make sure we can get the field using the field name
        if (!fieldName) {
            throw 'KLF_RecordSync_UserUtils.updateSysUserDisplayField: Field name is required';
        }

        var field = new GlideRecord('sys_dictionary');
        field.addQuery('name', 'sys_user');
        field.addQuery('element', fieldName);
        field.query();
        if (!field.next()) {
            throw 'KLF_RecordSync_UserUtils.updateSysUserDisplayField: Field not found';
        }

        // Set the display field to false
        var currentDisplayFieldName = '';
        // Check to see if there is a current display field
        var currentDisplayField = new GlideRecord('sys_dictionary');
        currentDisplayField.addQuery('name', 'sys_user');
        currentDisplayField.addQuery('display', true);
        currentDisplayField.query();
        if (currentDisplayField.next()) {
            // We have a current display field
            // Set this to false so we can update the display field
            currentDisplayFieldName = currentDisplayField.getValue('element');
            if (currentDisplayFieldName == fieldName) {
                return currentDisplayFieldName;
            }
            currentDisplayField.setWorkflow(false);
            currentDisplayField.autoSysFields(false);
            currentDisplayField.display = false;
            currentDisplayField.update();
        }

        // Update the field to be the display field
        field.setWorkflow(false);
        field.autoSysFields(false);
        field.display = true;
        field.update();

        return currentDisplayFieldName;
    },

    /**
     * Finds all the fields that reference sys_user in a scoped app. This attempts to find
     * all the user fields in the system. The user fields will include both reference fields and
     * list fields that reference sys_user
     * 
     * @param {string} scopeSysId sys_scope.sys_id
     * @param {string} [filter] GlideRecord encoded query
     * @returns {KLF_RecordSync_UserField[]}
     */
    getUserFields: function(scopeSysId, filter) {
        var fieldGr = new GlideRecord('sys_dictionary');
        fieldGr.addQuery('sys_scope', scopeSysId);
        fieldGr.addQuery('reference', 'sys_user');
        fieldGr.query();
        var fields = [];
        while (fieldGr.next()) {
            fields.push({
                table: fieldGr.name.toString(),
                type: fieldGr.internal_type.toString(),
                columnName: fieldGr.element.toString(),
                filter: filter
            });
        }
        return fields;
    },

    /**
     * Finds all the fields that reference sys_user in a scoped app. This attempts to find
     * all the user fields in the system. The user fields will include both reference fields and
     * list fields that reference sys_user
     * @param {string} scope sys_scope.scope
     * @returns {KLF_RecordSync_UserField[]}
     */
    getUserFieldsInScope: function(scope) {
        var me = this;
        var dataTransferUtils = new global.KLF_DataTransferUtils();
        var tables = dataTransferUtils.getTablesInScope(scope);
        return tables.reduce(function(allFields, tableName) {
            return allFields.concat(me.getUserFieldsInTable(tableName));
        }, []);
    },

    /**
     * Finds all the fields that reference sys_user in a table. This attempts to find
     * all the user fields in table. The user fields will include both reference fields and
     * list fields that reference sys_user
     * @param {string} tableName 
     * @returns {KLF_RecordSync_UserField[]}
     */
    getUserFieldsInTable: function(tableName) {
        var arrayUtil = new global.ArrayUtil();

        // @ts-ignore
        var tableUtils = new global.TableUtils(tableName);
        if (!tableUtils.tableExists()) {
            throw Error('Table does not exist: ' + tableName);
        }

        var tables = arrayUtil.convertArray(tableUtils.getTables());
        return tables.reduce(function(allFields, tableName) {
            var fieldGr = new GlideRecord('sys_dictionary');
            fieldGr.addQuery('name', tableName);
            fieldGr.addQuery('reference', 'sys_user');
            fieldGr.query();
            var fields = [];
            while (fieldGr.next()) {
                fields.push({
                    table: fieldGr.name.toString(),
                    type: fieldGr.internal_type.toString(),
                    columnName: fieldGr.element.toString(),
                });
            }
            return allFields.concat(fields);
        }, []);
    },

    /**
     * Finds all the unique users that are referenced in a table by using the user fields
     * that are returned from {@link UserUtils.getUserFields}
     * @param {string} tableName
     * @param {string} [filter] GlideRecord encoded query
     * @returns {string[]} The unique user sys_ids
     */
    getUniqueUsersInTable: function(tableName, filter) {
        var fields = this.getUserFieldsInTable(tableName);
        var gr = new GlideRecord(tableName);
        if (filter) {
            gr.addEncodedQuery(filter);
        }
        gr.query();
        /** @type {{[fieldName:string]: boolean}} */
        var users = {};
        while (gr.next()) {
            fields.forEach(function(field) {
                var columnName = field.columnName;
                if (gr[columnName].nil()) {
                    return;
                }

                if (field.type === 'reference') {
                    users[gr.getValue(columnName)] = true;
                } else if (field.type === 'glide_list') {
                    var userList = gr.getValue(columnName).split(',');
                    userList.forEach(function(user) {
                        users[user] = true;
                    });
                } else {
                    throw 'Unsupported field type: ' + field.type;
                }
            });
        }
        return Object.keys(users);
    },

    /**
     * Finds all the unique users that are referenced in a scope by using the user fields
     * that are returned from {@link UserUtils.getUserFields}
     * @param {string} scope
     * @returns {string[]} The unique user sys_ids
     */
    getUniqueUsersInScope: function(scope) {
        var me = this;
        var dataTransferUtils = new global.KLF_DataTransferUtils();
        var tables = dataTransferUtils.getTablesInScope(scope);
        return new global.ArrayUtil().unique(tables.reduce(function(allUsers, tableName) {
            return allUsers.concat(me.getUniqueUsersInTable(tableName));
        }, []));
    },

    /**
     * Returns a sn_ws.RESTMessageV2 object that is configured to make a request to the target instance
     * @returns {sn_ws.RESTMessageV2}
     */
    createRestMessage: function() {
        var request = new sn_ws.RESTMessageV2();
        request.setRequestHeader("Accept", "application/json");
        var authHeader = 'Basic ' + GlideStringUtil.base64Encode(this.connectionConfig.username + ':' + this.connectionConfig.password);
        request.setRequestHeader('Authorization', authHeader);
        // Do not use setBasicAuth. This does not work with mutual auth for some reason
        // request.setBasicAuth(this.connectionConfig.username, this.connectionConfig.password);
        request.setEndpoint(this.connectionConfig.instanceUrl);
        return request;
    },

    cachePropertyName: 'KLF_RecordSync_UserUtils.mapping',

    /**
     * Returns the user mapping that was created by calling {@link global.KLF_RecordSync_UserUtils.createUserMapping}. When calling
     * {@link global.KLF_RecordSync_UserUtils.createUserMapping}, the cache will be updated with the user mapping
     * @param {string} mappingName The mapping name used to store the mapping when calling {@link global.KLF_RecordSync_UserUtils.createUserMapping}
     */
    getUserMapping: function(mappingName) {
        var cacheJson = gs.getProperty(this.cachePropertyName);
        var cache = JSON.parse(cacheJson);
        var mapping = cache[this.getCacheKey(mappingName)];
        if (!mapping) {
            throw 'Call createUserMapping first to create the user mapping';
        }
        return mapping;
    },

    /**
     * Returns a mappingName that is used to store / retrieve a user mapping from the cache
     * See {@link global.KLF_RecordSync_UserUtils.getUserMapping} and {@link global.KLF_RecordSync_UserUtils.createUserMapping}
     * @param {string} mappingName 
     * @returns {string}
     */
    getCacheKey: function(mappingName) {
        return this.connectionConfig.instanceUrl + ':' + mappingName;
    },

    /**
     * Uses the sys_ids of the users in the local system to find the sys_ids of the users that exist in the remote system. This returns
     * a mapping of the local user sys_id to the remote user sys_id. If a user does not exist in the remote system, the remote user sys_id will be null
     * 
     * By default the results are cached. If you want to bypass the cache, set useCache to false. When using the cache a mappingName is required. This is used
     * when you retrieve the user mapping using {@link global.KLF_RecordSync_UserUtils.getUserMapping}
     * @param {string[]} userSysIds
     * @param {boolean} [useCache=true] If true, the cache will be used to store the user mappings. true by default
     * @param {string} [mappingName] A mapping name to store the user mapping under. This is not needed if useCache is false. Typically this would be the application scope, for example: x_example_app
     * @returns {KLF_RecordSync_UserMapping} The sys_ids of the users that do not exist in the remote system
     */
    createUserMapping: function(userSysIds, mappingName, useCache) {
        var _useCache = useCache === undefined ? true : useCache;
        var userRecords = new GlideRecord('sys_user');
        userRecords.addQuery('sys_id', 'IN', userSysIds);
        userRecords.query();

        /** @type {KLF_RecordSync_RemoteUser[]} */
        var users = [];
        var foundUsers = [];
        while (userRecords.next()) {
            foundUsers.push(userRecords.getUniqueValue());
            users.push({
                sysId: userRecords.getValue('sys_id'),
                username: userRecords.getValue('user_name'),
                source: userRecords.getValue('source')
            });
        }

        // Add the missing users. These users don't really exist in the local system for some reason
        // I will still attempt to find them in the remote system
        var missingUserSysIds = new global.ArrayUtil().diff(userSysIds, foundUsers);
        missingUserSysIds.forEach(function(sysId) {
            users.push({
                sysId: sysId,
                username: '',
                source: ''
            });
        });

        // Make a  request to sys_user
        var request = this.createRestMessage();
        request.setRequestHeader('Content-Type', 'application/json');
        request.setHttpMethod('POST');
        var endpoint = request.getEndpoint() + gs.getProperty('KLF_RecordSync_UserUtils.endpoint.mapping.path');
        request.setEndpoint(endpoint);
        this.logInfo('Creating user mapping using RemoteUsers:\n\n' + JSON.stringify(users, null, 4));
        request.setRequestBody(JSON.stringify(users));

        var response = request.execute();
        if (response.getStatusCode() != 200) {
            this.logError('Failed to user mapping using users: ' + userSysIds.join(', '));
            this.logError('Received status code: ' + response.getStatusCode());
            this.logError('Received body: ' + response.getBody());
            if (_useCache) {
                gs.setProperty(this.cachePropertyName, '');
            }
            return {
                success: false,
                error: response.getBody(),
                hasMissingUsers: true,
                missingUsers: [],
                mapping: {}
            };
        }

        var payload = response.getBody();
        this.logInfo('Received user mapping response:\n\n' + payload);
        if (payload) {
            var parsedPayload = JSON.parse(payload);
            /** @type {KLF_RecordSync_UserMapping} */
            var userMapping = parsedPayload.result;
            if (_useCache) {
                if (!mappingName) {
                    throw 'KLF_RecordSync_UserUtils: A mapping name is required when using the cache';
                }
                var cacheJson = gs.getProperty(this.cachePropertyName, '{}');
                var cache = JSON.parse(cacheJson);
                cache[this.getCacheKey(mappingName)] = userMapping;
                gs.setProperty(this.cachePropertyName, JSON.stringify(cache, null, 4));
            }
            return userMapping;
        } else {
            if (_useCache) {
                gs.setProperty(this.cachePropertyName, '');
            }
            return {
                success: false,
                error: 'No response body was received from the remote system',
                hasMissingUsers: true,
                missingUsers: [],
                mapping: {}
            };
        }
    },

    /**
     * This probably doesn't need to be used. Each ServiceNow instance should have a full list of users so
     * the users should be able to be found in the remote system.
     * 
     * Syncs the specified users by their sys_user.sys_id in the local system with the remote system.
     * 
     * This will throw an exception if there are users that don't exist in the user list unless
     * the quiet parameter is set to true
     * 
     * This will return null if the method finds that there are no users to sync
     * @param {string[]} userSysIds sys_user.sys_id[]
     * @param {boolean} [quiet=false] If true then sync will proceed even if there are users that don't exist in the user list
     * @returns {KLF_SendToRemoteInstanceResponse?}
     */
    syncUsers: function(userSysIds, quiet) {
        var manifest = new global.KLF_RecordSync.Manifest();
        var recordSync = new global.KLF_RecordSync(this.connectionConfig);
        var document = recordSync.createUnloadDocument();
        var user = new GlideRecord('sys_user');
        user.addQuery('sys_id', 'IN', userSysIds);
        user.query();
        var foundUserSysIds = [];
        while (user.next()) {
            foundUserSysIds.push(user.getUniqueValue());
            recordSync.unloadRecord(user, document);
            manifest.addRecordByGlideRecord(user);
        }

        var missingUserSysIds = new global.ArrayUtil().diff(userSysIds, foundUserSysIds);
        if (missingUserSysIds.length > 0) {
            var errorMessage = 'The following users were not found in the user list:\n' + missingUserSysIds.join(',') + '\n';
            if (quiet) {
                this.logError(errorMessage);
            } else {
                throw errorMessage;
            }
        }

        if (foundUserSysIds.length === 0) {
            return null;
        } else {
            return recordSync.syncDocument(document, manifest);
        }
    }
};
/**
 * This script contains general functions that help with role management in ServiceNow.
 * - userHasRole: Returns true if the user has the specified role.
 * - groupHasRole: Returns true if the group has the role.
 */

//@ts-ignore
var global = global || {};

global.KLF_RoleUtils = function() {};

global.KLF_RoleUtils.prototype = {
    /**
     * @param {string} message 
     */
    logError: function(message) {
        gs.logError(message, "KLF_RoleUtils");
    },

    /**
     * Returns true if the user has the specified role.
     * @param {string} username
     * @param {string} roleName
     * @returns {boolean}
     */
    userHasRole: function(username, roleName) {
        if (!username) {
            this.logError("KLF_RoleUtils.userHasRole: username is required");
            return false;
        }

        if (!roleName) {
            this.logError("KLF_RoleUtils.userHasRole: roleName is required");
            return false;
        }

        var userRole = new GlideRecord("sys_user_has_role");
        userRole.addQuery("user.user_name", username);
        userRole.addQuery("role.name", roleName);
        userRole.query();
        return userRole.hasNext();
    },

    /**
     * Returns true if the group has the role
     * @param {string} groupName
     * @param {string} roleName
     * @returns {boolean}
     */
    groupHasRole: function(groupName, roleName) {
        if (!groupName) {
            this.logError("KLF_RoleUtils.userHasRole: groupName is required");
            return false;
        }

        if (!roleName) {
            this.logError("KLF_RoleUtils.userHasRole: roleName is required");
            return false;
        }

        var groupRole = new GlideRecord("sys_group_has_role");
        groupRole.addQuery("group.name", groupName);
        groupRole.addQuery("role.name", roleName);
        groupRole.query();
        return groupRole.hasNext();
    },
};
/**
 * @todo This object is broken right now. Remove the ts-nocheck and fix the issues.
 * I created it as a way to scope global objects. I stopped working on it because because
 * I thought the method in KLF_ScoperUtils was a better approach.
 */
var global = global || {};
/**
 * Object used to copy application elements from one scope to another.
 * This is useful when you want to duplicate a scoped application to a new scope.
 * 
 * The following ServiceNow objects can be copied:
 * - Script Include (sys_script_include)
 * - Business Rule (sys_script)
 * - UI Action (sys_ui_action)
 * - UI Page (sys_ui_page)
 * - UI Policy (sys_ui_policy)
 * - UI Script (sys_ui_script)
 * - Client Script (sys_client_script)
 * - REST Message (sys_rest_message)
 * - UI View (sys_ui_view)
 * - UI Form (sys_ui_form)
 * - UI Form Section (sys_ui_section)
 * - UI List (sys_ui_list)
 * - UI Related List (sys_ui_related_list)
 */

/**
 * @typedef {Object} KLF_ScoperConfig
 * @property {string} sourceScope - The scope of the source records.
 * @property {string} targetScope - The scope of the target records.
 * @property {{[sourceTableName: string]: string}} [tableMap] - A map of source table names to target table names.
 */

/**
 * @param {KLF_ScoperConfig} config 
 * @example
 * var scoper = new global.KLF_Scoper({
 *     sourceScope: 'x_53417_scoper_1',
 *     targetScope: 'x_53417_scoper_2',
 *     tableMap: {
 *         'x_53417_scoper_1_scoper_task': 'x_53417_scoper_2_scoper_task'
 *     }
 * });
 * 
 * // Copy a business rule
 * var targetBusinessRule = scoper.copyBusinessRule('e509c3784764561058ceeb02d16d4399');
 * 
 * // Copy a script include
 * var targetScriptInclude = scoper.copyScriptInclude('e509c3784764561058ceeb02d16d4399');
 * 
 * // Copy a column
 * var targetColumn = scoper.copyColumn('e509c3784764561058ceeb02d16d4399', 'x_53417_scoper_2_scoper_task');
 */
global.KLF_Scoper = function(config) {
    var _config = config || {};
    var sourceScopeSysId = this.getScopeSysId(_config.sourceScope);
    if (!sourceScopeSysId) {
        throw 'Source scope not found';
    }

    var targetScopeSysId = this.getScopeSysId(_config.targetScope);
    if (!targetScopeSysId) {
        throw 'Target scope not found';
    }

    this.sourceScope = _config.sourceScope;
    this.sourceScopeSysId = sourceScopeSysId;
    this.targetScope = _config.targetScope;
    this.targetScopeSysId = targetScopeSysId;
    this.tableMap = _config.tableMap || {};
};

/**
 * Extracts all non-system field names from a GlideRecord.
 * 
 * This function iterates through all fields of the given GlideRecord
 * and returns an array of field names that do not start with 'sys_'.
 * 
 * @param {GlideRecord} glideRecord - The GlideRecord to extract field names from.
 * @returns {string[]} An array of non-system field names.
 */
global.KLF_Scoper.getNonSysFields = function(glideRecord) {
    var glideElements = glideRecord.getFields();
    var elementNames = [];
    for (var i = 0; i < glideElements.size(); i++) {
        var glideElement = glideElements.get(i);
        var name = glideElement.getName();
        if (!name.startsWith('sys_')) {
            elementNames.push(name);
        }
    }
    return elementNames;
};

/**
 * Used to copy a UI View from the source scope to the target scope.
 * Note: An empty string is a valid value for the viewName parameter
 * The empty viewName is the 'Default view' for a table
 * 
 * NOTE: The UI View (sys_ui_view) record cannot be copied. The UI View record is a unique record in the sys_ui_view table.
 * There can only be one, so copying it would result in an error. You must account for the UI View record yourself. Sometimes
 * this record is in global and does not need to be copied, but other times this record was created by a non-global app and may
 * need to be created in the target scope.
 * 
 * @param {string} viewName sys_ui_view.name
 * @param {string} tableName This is used to find the related form, form section, and list/related
 * records associated with the view.
 * @param {global.KLF_Scoper} scoper 
 * 
 * @example
 * var viewCopier = new global.KLF_Scoper.ViewCopier('My View', 'x_53417_scoper_1_scoper_task');
 * viewCopier.copy();
 */
global.KLF_Scoper.ViewCopier = function(viewName, tableName, scoper) {
    if (!tableName || !new GlideRecord(tableName).isValid()) {
        throw 'Table not found';
    }

    if (typeof viewName != 'string') {
        throw 'View name must be a string';
    }

    this.viewName = viewName;
    this.tableName = tableName;
    this.scoper = scoper;
    var view = new GlideRecord('sys_ui_view');
    view.addQuery('name', this.viewName);
    view.query();
    if (!view.next()) {
        throw 'Source UI view not found';
    }
    this.view = view;
};

global.KLF_Scoper.ViewCopier.prototype = {
    /**
     * Copies the entire view. Copies the UI View, Form, Form Section, 
     * Section Element, List, and Related List
     * records from the source scope to the target scope.
     */
    copy: function() {
        this.copyFormView();
    },

    /**
     * Cop
     * @param {GlideRecord} view sys_ui_view record
     */
    copyUiView: function(view) {

    },

    /**
     * Copies a Form (sys_ui_form) record from the source scope to the target scope.
     * @param {GlideRecord} form sys_ui_form record
     */
    copyUiForm: function(form) {
        var source = form;
        var target = new GlideRecord('sys_ui_form');
        target.newRecord();

        var elementNames = global.KLF_Scoper.getNonSysFields(form);

        for (var i = 0; i < elementNames.length; i++) {
            var fieldName = elementNames[i];
            target.setValue(fieldName, source.getValue(fieldName));
        }

        // sys fields are not copied a automatically. need to manually set them.
        target.setValue('sys_name', source.getValue('sys_name'));

        // Update the scope
        target.setValue('sys_scope', this.scoper.targetScopeSysId);

        // Update the table name
        target.setValue('name', this.scoper.updateTableNames(source.getValue('name')));

    },

    /**
     * Copies a form view from the source scope to the target scope.
     * This includes:
     * - Form (sys_ui_form), // This looks like it is only created if there are multiple form sections on th form
     * - Form Section (sys_ui_form_section), // This controls where the section is positioned in the form
     * - Form Section (sys_ui_section), // This is the container for all the fields in the section
     * - Section Element (sys_ui_element), // This defines what fields are displayed in the section
     */
    copyFormView: function() {
        // I'm only looking for the first form. I don't think there should be multiple forms
        // that are not personalized that are associated with a view.
        var form = new GlideRecord('sys_ui_form');
        form.addQuery('view', this.view.getUniqueValue());
        form.addNotNullQuery('sys_user'); // Intentionally excluding personalized views
        form.orderBy('sys_updated_on'); // Just in case there are multiple forms. I want the one that was updated most recently
        form.addQuery('name', this.tableName);
        form.addQuery('sys_scope', this.scoper.sourceScopeSysId);
        form.query();
        if (form.next()) {
            this.copyUiForm(form);
        }

        // Each form section is a collection of fields that are displayed in the section.
        var formSection = new GlideRecord('sys_ui_section');
        formSection.addNotNullQuery('sys_user'); // Intentionally excluding personalized views
        formSection.addQuery('view', this.view.getUniqueValue());
        formSection.addQuery('name', this.tableName);
        formSection.query();
        while (formSection.next()) {
            gs.info('Form section found: ' + formSection.getUniqueValue());

            // Each form section could have multiple Section Elements (sys_ui_element) records. These are records
            // that define what fields are displayed in the section.
            var sectionElement = new GlideRecord('sys_ui_element');
            sectionElement.addQuery('sys_ui_section', formSection.getUniqueValue());
            sectionElement.query();
            while (sectionElement.next()) {
                gs.info('Section element found: ' + sectionElement.getUniqueValue());
            }
        }
    }
};

global.KLF_Scoper.prototype = {
    /**
     * Copies a UI Policy from the source scope to the target scope.
     * Includes any related UI Policy Action (sys_ui_policy_action) records.
     * Includes any related UI Policy Related List Action (sys_ui_policy_rl_action) records.
     * @param {string} uiPolicySysId 
     */
    copyUiPolicy: function(uiPolicySysId) {},

    /**
     * Copies a UI View from the source scope to the target scope.
     * This includes:
     * - UI View (sys_ui_view), // This is the container for all the lists and forms related to a view name
     * - Form (sys_ui_form), // This looks like it is only created if there are multiple form sections on th form
     * - Form Section (sys_ui_form_section), // This controls where the section is positioned in the form
     * - Form Section (sys_ui_section), // This is the container for all the fields in the section
     * - Section Element (sys_ui_element), // This defines what fields are displayed in the section
     * - List (sys_ui_list), // This defines the columns in the list
     * - Related List (sys_ui_related_list) // This defines the columns in the related list
     * @param {string} viewName 
     * @param {string} tableName 
     */
    copyUiView: function(viewName, tableName) {
        // @ts-ignore
        var viewCopier = new global.KLF_Scoper.ViewCopier(viewName, tableName, this.targetScope, this.targetScopeSysId);
        viewCopier.copy();
    },

    /**
     * Copies a UI Action from the source scope to the target scope.
     * Includes any related UI Action Visibility (sys_ui_action_view) record.
     * @param {string} uiActionSysId 
     */
    copyUiAction: function(uiActionSysId) {
        var source = new GlideRecord('sys_ui_action');
        if (!source.get(uiActionSysId)) {
            throw 'Source UI action not found';
        }

        var elementNames = global.KLF_Scoper.getNonSysFields(source);

        var target = new GlideRecord('sys_ui_action');
        target.newRecord();

        for (var i = 0; i < elementNames.length; i++) {
            var fieldName = elementNames[i];
            target.setValue(fieldName, source.getValue(fieldName));
        }

        // Update the scope
        target.setValue('sys_scope', this.targetScopeSysId);

        // Update the table name
        target.setValue('table', this.updateTableNames(source.getValue('table')));

        // Update the script field
        target.setValue('script', this.updateTableNames(source.getValue('script')));

        // Add any related UI Action Visibility records
        var uiActionVisibilityGr = new GlideRecord('sys_ui_action_view');
        uiActionVisibilityGr.addQuery('sys_ui_action', uiActionSysId);
        uiActionVisibilityGr.query();
        while (uiActionVisibilityGr.next()) {
            var targetVisibility = new GlideRecord('sys_ui_action_view');
            // Check if the target visibility record already exists
            targetVisibility.addQuery('sys_ui_action', target.getUniqueValue());
            targetVisibility.addQuery('sys_ui_view', uiActionVisibilityGr.getValue('sys_ui_view'));
            targetVisibility.query();
            if (!targetVisibility.next()) {
                // Doesn't exist, so create a new record
                targetVisibility.newRecord();
            }

            targetVisibility.sys_ui_action = target.getUniqueValue();
            targetVisibility.sys_ui_view = uiActionVisibilityGr.getValue('sys_ui_view');
            targetVisibility.visibility = uiActionVisibilityGr.getValue('visibility');
            targetVisibility.setValue('sys_scope', this.targetScopeSysId);
            targetVisibility.update();
        }

        if (target.update()) {
            return target;
        } else {
            throw 'Failed to copy UI action';
        }
    },

    /**
     * Copies a business rule from the source scope to the target scope.
     * @param {string} businessRuleSysId 
     * @returns {GlideRecord?} the target business rule
     */
    copyBusinessRule: function(businessRuleSysId) {
        var source = new GlideRecord('sys_script');
        if (!source.get(businessRuleSysId)) {
            return null;
        }
        var elementNames = global.KLF_Scoper.getNonSysFields(source);

        // Now that we have the element names, we can copy the business rule
        var target = new GlideRecord('sys_script');
        target.newRecord();

        for (var i = 0; i < elementNames.length; i++) {
            var fieldName = elementNames[i];
            target.setValue(fieldName, source.getValue(fieldName));
        }

        // Update the table name
        target.setValue('collection', this.updateTableNames(source.getValue('collection')));

        // Update script field
        target.setValue('script', this.updateTableNames(source.getValue('script')));

        // Set the scope to the target scope
        target.setValue('sys_scope', this.targetScopeSysId);

        if (target.update()) {
            return target;
        } else {
            throw 'Failed to copy business rule';
        }
    },

    /**
     * Copies a script include from the source scope to the target scope.
     * @param {string} scriptIncludeSysId 
     */
    copyScriptInclude: function(scriptIncludeSysId) {
        var source = new GlideRecord('sys_script_include');
        if (!source.get(scriptIncludeSysId)) {
            throw 'Source script include not found';
        }

        var elementNames = global.KLF_Scoper.getNonSysFields(source);

        // Now that we have the element names, we can copy the business rule
        var target = new GlideRecord('sys_script_include');
        target.newRecord();

        for (var i = 0; i < elementNames.length; i++) {
            var fieldName = elementNames[i];
            if (fieldName === 'api_name') {
                continue;
            }
            target.setValue(fieldName, source.getValue(fieldName));
        }

        // Update the script field
        target.setValue('script', this.updateTableNames(source.getValue('script')));

        // Update the scope
        target.setValue('sys_scope', this.targetScopeSysId);

        if (target.update()) {
            return target;
        } else {
            throw 'Failed to copy script include';
        }
    },

    /**
     * Copies a column from the source table to the target table.
     * @param {string} sysDictionarySysId
     * @param {string} targetTableName
     * @returns {GlideRecord?} the sys_dictionary record of the target table
     */
    copyColumn: function(sysDictionarySysId, targetTableName) {
        var source = new GlideRecord('sys_dictionary');
        if (!source.get(sysDictionarySysId)) {
            throw 'Source column not found';
        }

        // Check if the target table exists
        if (!new GlideRecord(targetTableName).isValid()) {
            throw 'Target table not found';
        }

        var target = new GlideRecord('sys_dictionary');
        target.newRecord();

        // Copy all non-system fields
        var elementNames = global.KLF_Scoper.getNonSysFields(source);
        elementNames.forEach(function(fieldName) {
            target.setValue(fieldName, source.getValue(fieldName));
        });

        // Update the scope and table name
        target.setValue('sys_scope', this.targetScopeSysId);
        target.setValue('name', targetTableName);

        if (target.update()) {
            return target;
        } else {
            throw 'Failed to copy column';
        }
    },

    copySPWidget: function() {

    },

    copySPWidgetInstance: function() {},

    copySPPage: function() {

    },

    copySPPortal: function() {

    },

    copyReport: function() {

    },

    /**
     * @param {string} uiPageSysId 
     */
    copyUiPage: function(uiPageSysId) {},

    /**
     * Updates the table names found in the string using the table map.
     * 
     * @param {string} string 
     * @returns {string}
     */
    updateTableNames: function(string) {
        if (!string) {
            return string;
        }

        for (var sourceTableName in this.tableMap) {
            var targetTableName = this.tableMap[sourceTableName];
            string = string.replace(new RegExp(sourceTableName, 'g'), targetTableName);
        }
        return string;
    },


    /**
     * Retrieves the sys_id of a scope by its name.
     * @param {string} scopeName - The name of the scope to look up.
     * @returns {string|null} The sys_id of the scope if found, null otherwise.
     */
    getScopeSysId: function(scopeName) {
        var scopeGr = new GlideRecord('sys_scope');
        if (scopeGr.get('scope', scopeName)) {
            return scopeGr.getUniqueValue();
        }
        // Could be global scope. Need to check by name
        var globalScope = new GlideRecord('sys_scope');
        globalScope.addQuery('name', scopeName);
        globalScope.query();
        if (globalScope.getRowCount() === 1) {
            globalScope.next();
            return globalScope.getUniqueValue();
        } else if (globalScope.getRowCount() > 1) {
            throw 'Ambiguous scope name. More than one scope found with the name: ' + scopeName;
        }

        return null;
    },
};
var global = global || {};
/**
 * Object used to copy application elements from one scope to another.
 * This is useful when you want to duplicate a scoped application to a new scope.
 * Without this object copying the application elements by hand would be a manual and error prone process.
 * 
 * TODO:
 * - Add a way to find scripts that need to have "global" prefix to applied to objects. If the global
 * prefix is not applied the object will not be referenced correctly when the script is scoped.
 * - Log statements in script includes may need to be updated to use gs.info instead of gs.log because
 * gs.log is not available in scoped scripts.
 * 
 * When copying artifacts the scope name will be updated. Table names will be updated based on the provided table map. Sometimes artifacts will have references
 * to other artifacts. When that is the case the metadata map will update the sys_ids for those references.
 * 
 * The following ServiceNow objects can be copied:
 * - Script Include (sys_script_include)
 * - Business Rule (sys_script)
 * - UI Action (sys_ui_action)
 * - UI View (sys_ui_view)
 * - UI Form (sys_ui_form)
 * - UI Form Section (sys_ui_section)
 * - UI List (sys_ui_list)
 * - UI Related List (sys_ui_related_list)
 * - Relationship (sys_relationship)
 * - Column (sys_ui_column)
 * 
 * - System Property (sys_properties)
 * - Report (sys_report)
 * - UI Page (sys_ui_page)
 * - UI Policy (sys_ui_policy)
 * - UI Script (sys_ui_script)
 * - Client Script (sys_client_script)
 * - REST Message (sys_rest_message)
 * - Reponsive Dashboard
 */

/**
 * @typedef {Object} KLF_ScoperUtilsConfig
 * @property {string} sourceScope - The scope of the source records.
 * @property {string} targetScope - The scope of the target records.
 * @property {{[sourceTableName: string]: string}} [tableMap] - A map of source table names to target table names.
 * @property {{[sourceMetadataSysId: string]: string}} [metadataMap] - A map of source metadata sys_ids to target metadata sys_ids. 
 */

/**
 * @param {KLF_ScoperUtilsConfig} config 
 * @example
 * var scoper = new global.KLF_ScoperUtils({
 *     sourceScope: 'x_53417_scoper_1',
 *     targetScope: 'x_53417_scoper_2',
 *     tableMap: {
 *         'x_53417_scoper_1_scoper_task': 'x_53417_scoper_2_scoper_task'
 *     }
 * });
 * 
 * // Copy a business rule
 * var targetBusinessRule = scoper.copyBusinessRule('e509c3784764561058ceeb02d16d4399');
 * 
 * // Copy a script include
 * var targetScriptInclude = scoper.copyScriptInclude('e509c3784764561058ceeb02d16d4399');
 * 
 * // Copy a column
 * var targetColumn = scoper.copyColumn('e509c3784764561058ceeb02d16d4399', 'x_53417_scoper_2_scoper_task');
 */
global.KLF_ScoperUtils = function(config) {
    var _config = config || {};
    var sourceScopeSysId = this.getScopeSysId(_config.sourceScope);
    if (!sourceScopeSysId) {
        throw 'Source scope not found';
    }

    var targetScopeSysId = this.getScopeSysId(_config.targetScope);
    if (!targetScopeSysId) {
        throw 'Target scope not found';
    }

    this.sourceScope = _config.sourceScope;
    this.sourceScopeSysId = sourceScopeSysId;
    this.targetScope = _config.targetScope;
    this.targetScopeSysId = targetScopeSysId;
    this.tableMap = _config.tableMap || {};
    this.checkTableMap();

    // Map of source metadata sys_id to target metadata sys_id
    if (_config.metadataMap) {
        this.metadataMap = _config.metadataMap;
    } else {
        // Load the metadata map from the database
        var metadataMapJson = this.getSysProperty('KLF_ScoperUtils.metadata_map');
        this.metadataMap = metadataMapJson ? JSON.parse(metadataMapJson) : {};
    }
};

/**
 * @typedef {Object} KLF_ScoperUtilsMetadataResult
 * @property {Document} targetRecordDocument
 * @property {string} targetRecordSysId
 */

global.KLF_ScoperUtils.prototype = {
    /**
     * Checks the table map to make sure that all the source table names are valid.
     * Throws an error if any of the source table names are not found.
     */
    checkTableMap: function() {
        var me = this;
        Object.keys(this.tableMap).forEach(function(sourceTableName) {
            var source = new GlideRecord(sourceTableName);
            if (!source.isValid()) {
                throw 'Source table not found for ' + sourceTableName;
            }
        });
    },

    /**
     * Generates a new metadata XML string using the source metadata record and the target scope.
     * The new metadata XML that is returned can be used to create a new artifact in the target scope.
     * @param {GlideRecord} source sys_metadata.sys_id
     * @returns {{targetRecordXml: string, targetRecordSysId: string}}
     */
    createTargetMetadataFromSourceMetadata: function(source) {
        if (!source.isValid() || !source.isValidRecord()) {
            throw 'Source metadata is not valid';
        }

        // I need to get the actual record from the source metadata record
        // The sys_metadata record will not give me access to all the fields
        var _source = new GlideRecord(source.getRecordClassName());
        if (!_source.get(source.getUniqueValue())) {
            throw 'Source metadata not found';
        }

        var type = _source.getRecordClassName();
        var targetParts;
        switch (type) {
            case 'sys_ui_policy_action':
                targetParts = this.createUiPolicyActionTargetMetadataFromSourceMetadata(_source);
                break;
            case 'sys_ui_action_view':
                targetParts = this.createUiActionVisibilityTargetMetadataFromSourceMetadata(_source);
                break;
            case 'sys_ui_view':
                targetParts = this.createUiViewTargetMetadataFromSourceMetadata(_source);
                break;
            case 'sys_ui_list':
                targetParts = this.createUiListTargetMetadataFromSourceMetadata(_source);
                break;
            case 'sys_ui_related_list':
                targetParts = this.createUiRelatedListTargetMetadataFromSourceMetadata(_source);
                break;
            case 'sys_ui_section':
                targetParts = this.createUiSectionTargetMetadataFromSourceMetadata(_source);
                break;
            case 'sys_ui_form':
                targetParts = this.createUiFormTargetMetadataFromSourceMetadata(_source);
                break;
            case 'sys_user_role':
                targetParts = this.defaultCreateTargetMetadataFromSourceMetadata(_source);
                break;
            default:
                targetParts = this.defaultCreateTargetMetadataFromSourceMetadata(_source);
        }

        return {
            targetRecordXml: this.getUpdatedXml(targetParts.targetRecordDocument),
            targetRecordSysId: targetParts.targetRecordSysId
        };
    },

    /**
     * Updates the document so all the references and table names that were in the source document
     * are updated to the target scope. Returns the updated XML.
     * @param {Document} document 
     * @returns {string} The updated XML
     */
    getUpdatedXml: function(document) {
        var xml = this.documentToString(document, true);
        xml = this.updateTableNames(xml);
        xml = this.updateReferences(xml);
        xml = this.updateScope(xml);
        if (xml.indexOf(this.sourceScope) > -1) {
            var error = 'KLF_ScoperUtils.getUpdatedXml() - Source scope still exists in target XML even after XML update\n\n' + xml;
            throw error;
        }
        return xml;
    },

    /**
     * Creates XML for the target UI Section record
     * @param {GlideRecord} source sys_ui_form record
     */
    createUiFormTargetMetadataFromSourceMetadata: function(source) {
        var targetParts = this.defaultCreateTargetMetadataFromSourceMetadata(source);
        var targetDocument = targetParts.targetRecordDocument;

        // Get the related UI Form Sections
        var uiFormSectionGr = new GlideRecord('sys_ui_form_section');
        uiFormSectionGr.addQuery('sys_ui_form', source.getUniqueValue());
        uiFormSectionGr.orderBy('position');
        uiFormSectionGr.query();
        while (uiFormSectionGr.next()) {
            this.defaultCreateTargetMetadataFromSourceMetadata(uiFormSectionGr, null, targetDocument);
            // The form section will have a reference to the UI Section
            if (!uiFormSectionGr.sys_ui_section.nil()) {
                if (!this.isProcessed(uiFormSectionGr.getValue('sys_ui_section'))) {
                    var uiSection = uiFormSectionGr.sys_ui_section.getRefRecord();
                    this.createUiSectionTargetMetadataFromSourceMetadata(uiSection, targetDocument);
                }
            }
        }

        return targetParts;
    },

    /**
     * Creates XML for the target UI Section record
     * @param {GlideRecord} source sys_ui_section record
     * @param {Document} [providedDocument]
     */
    createUiSectionTargetMetadataFromSourceMetadata: function(source, providedDocument) {
        var targetParts = this.defaultCreateTargetMetadataFromSourceMetadata(source, null, providedDocument);
        var targetDocument = targetParts.targetRecordDocument;

        // Get the related UI Elements
        var uiElementGr = new GlideRecord('sys_ui_element');
        uiElementGr.addQuery('sys_ui_section', source.getUniqueValue());
        uiElementGr.orderBy('position');
        uiElementGr.query();
        while (uiElementGr.next()) {
            this.defaultCreateTargetMetadataFromSourceMetadata(uiElementGr, null, targetDocument);
        }

        return targetParts;
    },

    /**
     * Creates XML for the target UI Related List record
     * - sys_ui_related_list is a container for the set of related lists that are displayed on a form.
     * - sys_ui_related_list_entry defines the specific related list that is displayed. It serves as a pointer
     * to either a ${table}.${field} or a defined relationship in the format of REL:${sys_relationship.sys_id}.  
     * For example:
     *   - REL:d559ab8b87a89290e2041f8d3fbb35c4 // For a relationship
     *   - x_53417_scoper_1_scoper_task.parent // For a related list that points to the task table using the parent field
     * @param {GlideRecord} source sys_ui_related_list record
     */
    createUiRelatedListTargetMetadataFromSourceMetadata: function(source) {
        var targetParts = this.defaultCreateTargetMetadataFromSourceMetadata(source);
        var targetDocument = targetParts.targetRecordDocument;

        // Get the related list elements
        var listElementGr = new GlideRecord('sys_ui_related_list_entry');
        listElementGr.addQuery('list_id', source.getUniqueValue());
        listElementGr.query();
        while (listElementGr.next()) {
            // If the related list entry is pointing to a relationship, then I need to update the sys_id
            // The relationship sys_id is in the format of REL:${sys_relationship.sys_id}
            if (listElementGr.getValue('related_list').startsWith('REL:')) {
                var relatedListValue = listElementGr.getValue('related_list');
                var relatedListParts = relatedListValue.split(':');
                var relationshipSysId = relatedListParts[1];
                if (relationshipSysId) {
                    listElementGr.setValue('related_list', 'REL:' + this.getOrGenerateGUID(relationshipSysId));
                }
            }

            this.defaultCreateTargetMetadataFromSourceMetadata(listElementGr, null, targetDocument);
        }

        return targetParts;
    },

    /**
     * Creates XML for the target UI List record
     * @param {GlideRecord} source sys_ui_list record
     */
    createUiListTargetMetadataFromSourceMetadata: function(source) {
        var targetParts = this.defaultCreateTargetMetadataFromSourceMetadata(source);
        var targetDocument = targetParts.targetRecordDocument;

        // Get the related list elements
        var listElementGr = new GlideRecord('sys_ui_list_element');
        listElementGr.addQuery('list_id', source.getUniqueValue());
        listElementGr.query();
        while (listElementGr.next()) {
            this.defaultCreateTargetMetadataFromSourceMetadata(listElementGr, null, targetDocument);
        }

        return targetParts;
    },

    /**
     * Creates XML for the target UI Policy Action record
     * @param {GlideRecord} source sys_ui_policy_action record
     */
    createUiPolicyActionTargetMetadataFromSourceMetadata: function(source) {
        // UI Policy Action has to point to the correct UI Policy record
        if (!source.ui_policy.nil()) {
            var sysId = source.getValue('ui_policy');
            source.ui_policy = this.getOrGenerateGUID(sysId);
        }
        return this.defaultCreateTargetMetadataFromSourceMetadata(source);
    },

    /**
     * Creates XML for the target UI Action Visibility record
     * @param {GlideRecord} source sys_ui_action_view record
     */
    createUiActionVisibilityTargetMetadataFromSourceMetadata: function(source) {
        // UI Action Visibility has to point to the correct UI Action record
        if (!source.sys_ui_action.nil()) {
            var sysId = source.getValue('sys_ui_action');
            source.sys_ui_action = this.getOrGenerateGUID(sysId);
        }

        return this.defaultCreateTargetMetadataFromSourceMetadata(source);
    },

    /**
     * 
     * @param {GlideRecord} source sys_metadata record
     * @param {string?} [targetRecordSysId] 
     * @param {Document} [providedDocument]
     * @returns {KLF_ScoperUtilsMetadataResult}
     */
    defaultCreateTargetMetadataFromSourceMetadata: function(source, targetRecordSysId, providedDocument) {
        var _targetRecordSysId = targetRecordSysId || this.getOrGenerateGUID(source.getUniqueValue());
        if (source.isValidField('sys_scope')) {
            source.sys_scope = this.targetScopeSysId;
        }
        if (source.isValidField('sys_package')) {
            source.sys_package = this.targetScopeSysId;
        }
        if (source.isValidField('sys_id')) {
            source.sys_id = _targetRecordSysId;
        }

        var document = providedDocument ? providedDocument : this.createUnloadDocument();

        this.unloadRecord(source, document);

        return {
            targetRecordDocument: document,
            targetRecordSysId: _targetRecordSysId
        };
    },

    /**
     * Copies the data from the source scope to the target scope.
     * @param {GlideRecord} source 
     * @param {string?} [targetRecordSysId] 
     * @param {Document} [providedDocument]
     * @returns {KLF_ScoperUtilsMetadataResult}
     */
    copyData: function(source, targetRecordSysId, providedDocument) {
        return this.defaultCreateTargetMetadataFromSourceMetadata(source, targetRecordSysId, providedDocument);
    },

    /**
     * @overload
     * @param {string} sysId 
     * @returns {GlideRecord} 
     */
    /**
     * @overload
     * @param {string} sysId 
     * @param {boolean} quiet
     * @returns {GlideRecord?}
     */
    /**
     * Copies the metadata from the source scope to the target scope.
     * @param {string} sysId 
     * @param {boolean} [quiet] - If true, then do not throw an error if the metadata cannot be copied
     * @returns {GlideRecord?} The target metadata record or null if quiet is true and the metadata cannot be copied
     */
    copyMetadataBySysId: function(sysId, quiet) {
        if (this.isProcessed(sysId)) {
            var processedMetadata = new GlideRecord('sys_metadata');
            if (processedMetadata.get(this.metadataMap[sysId])) {
                return processedMetadata;
            } else {
                throw 'Target metadata not found for sourcesys_id: ' + sysId;
            }
        }

        var metadata = new GlideRecord('sys_metadata');
        if (!metadata.get(sysId)) {
            throw 'Source metadata not found for sys_id: ' + sysId;
        }

        // Check to see if we can copy this type of metadata
        if (!this.canCopyMetadata(metadata)) {
            var error = 'Cannot copy metadata for source sys_id: ' + sysId + ' of type: ' + metadata.getRecordClassName();
            if (!quiet) {
                throw error;
            } else {
                gs.error(error);
                return null;
            }
        }

        if (metadata.getRecordClassName() === 'sys_documentation') {
            // Check if the sys_documentation already exists in the target scope
            var source = new GlideRecord('sys_documentation');
            if (source.get(sysId)) {
                var target = new GlideRecord('sys_documentation');
                target.addQuery('name', source.getValue('name'));
                target.addQuery('element', source.getValue('element'));
                target.addQuery('language', source.getValue('language'));
                target.query();
                if (target.next()) {
                    // We need to make sure the sys_id in the metadata map is the target sys_id we found
                    this.metadataMap[sysId] = target.getUniqueValue();
                    // Mark this as copied
                    this.markRecordAsCopied(sysId, target.getUniqueValue());
                    return target;
                }
            }
        }

        var targetParts = this.createTargetMetadataFromSourceMetadata(metadata);
        var metadataXml = targetParts.targetRecordXml;
        var targetRecordSysId = targetParts.targetRecordSysId;

        // Try to load the metadata into the target scope
        // @ts-ignore
        var updateManager = new global.GlideUpdateManager2();
        updateManager.loadXML(metadataXml);

        // Check if the metadata was loaded successfully
        var targetMetadata = new GlideRecord(metadata.getRecordClassName());
        if (!targetMetadata.get(targetRecordSysId)) {
            throw 'Target metadata not found for target sys_id: ' + targetRecordSysId + ' source sys_id: ' + sysId + ' of type: ' + metadata.getRecordClassName();
        }

        // For now we are going to track what records are copied
        this.markRecordAsCopied(sysId, targetRecordSysId);

        return targetMetadata;
    },

    /**
     * Checks to see if we can copy this type of metadata
     * @param {GlideRecord} metadata 
     * @returns {boolean}
     */
    canCopyMetadata: function(metadata) {
        var recordClassName = metadata.getRecordClassName();
        /** @type {string[]} */
        var blackList = ['sys_scope_privilege', 'ua_table_licensing_config'];

        if (blackList.indexOf(recordClassName) > -1) {
            return false;
        }

        // We aren't going to attempt to copy persononalized views. The personalized views
        // are customizations users have made to specific forms and lists.
        // This would include:
        // - sys_ui_form
        // - sys_ui_section
        // - sys_ui_list
        // - sys_ui_related_list
        var viewTableNames = ['sys_ui_form', 'sys_ui_section', 'sys_ui_list', 'sys_ui_related_list'];
        if (viewTableNames.indexOf(recordClassName) > -1) {
            // If the view is personalized it will have a value in the sys_user field
            var viewGr = new GlideRecord(recordClassName);
            viewGr.get(metadata.getUniqueValue());
            return viewGr.sys_user.nil();
        }

        return true;
    },

    /**
     * Marks a record as copied.
     * @param {string} sourceSysId 
     * @param {string} targetSysId 
     */
    markRecordAsCopied: function(sourceSysId, targetSysId) {
        // Working through the GlideRecord API because it's quicker than using gs.getProperty / gs.setProperty
        var processedRecords = this.getSysProperty('KLF_ScoperUtils.processed_records') ? JSON.parse(this.getSysProperty('KLF_ScoperUtils.processed_records')) : {};
        processedRecords[sourceSysId] = targetSysId;
        this.setSysProperty('KLF_ScoperUtils.processed_records', JSON.stringify(processedRecords, null, 4));

        this.metadataMap[sourceSysId] = targetSysId;
        this.setSysProperty('KLF_ScoperUtils.metadata_map', JSON.stringify(this.metadataMap, null, 4));
    },

    /**
     * Returns true if the record has been processed.
     * @param {string} sourceSysId 
     */
    isProcessed: function(sourceSysId) {
        var processedRecords = JSON.parse(this.getSysProperty('KLF_ScoperUtils.processed_records') || '{}');
        return processedRecords[sourceSysId] ? true : false;
    },

    /**
     * Copies a UI View from the source scope to the target scope.
     * @param {GlideRecord} source 
     * @returns {KLF_ScoperUtilsMetadataResult}
     */
    createUiViewTargetMetadataFromSourceMetadata: function(source) {
        // First check to make sure the view is in the source scope
        if (source.getValue('sys_scope') !== this.sourceScopeSysId) {
            throw 'View must be in source scope to be copied to target scope';
        }

        // For sys_ui_view records the sys_id will not change. The existing record will be
        // overwritten by the new record. So we don't need to generate a new GUID.
        return this.defaultCreateTargetMetadataFromSourceMetadata(source, source.getUniqueValue());
    },

    /**
     * Updates the scope found in the string using the source scope.
     * @param {string} string 
     * @returns {string}
     */
    updateScope: function(string) {
        return string.replace(new RegExp(this.sourceScope, 'g'), this.targetScope);
    },

    /**
     * Updates the table names found in the string using the table map.
     * 
     * @param {string} string 
     * @returns {string}
     */
    updateTableNames: function(string) {
        if (!string) {
            return string;
        }

        for (var sourceTableName in this.tableMap) {
            var targetTableName = this.tableMap[sourceTableName];
            string = string.replace(new RegExp(sourceTableName, 'g'), targetTableName);
        }
        return string;
    },


    /**
     * Retrieves the sys_id of a scope by its name.
     * @param {string} scopeName - The name of the scope to look up.
     * @returns {string|null} The sys_id of the scope if found, null otherwise.
     */
    getScopeSysId: function(scopeName) {
        var scopeGr = new GlideRecord('sys_scope');
        if (scopeGr.get('scope', scopeName)) {
            return scopeGr.getUniqueValue();
        }
        // Could be global scope. Need to check by name
        var globalScope = new GlideRecord('sys_scope');
        globalScope.addQuery('name', scopeName);
        globalScope.query();
        if (globalScope.getRowCount() === 1) {
            globalScope.next();
            return globalScope.getUniqueValue();
        } else if (globalScope.getRowCount() > 1) {
            throw 'Ambiguous scope name. More than one scope found with the name: ' + scopeName;
        }

        return null;
    },

    /**
     * Creates a document object that can be passed to {@link global.KLF_RecordSync.unloadRecord}
     * This is useful when you want to add multiple unloaded records to the same document
     * @returns {Document}
     */
    createUnloadDocument: function() {
        // @ts-ignore
        var document = global.GlideXMLUtil.newDocument('unload');
        var date = new GlideDateTime();
        document.documentElement.setAttribute('unload_date', date.toString());
        return document;
    },

    /**
     * Generates XML from GlideRecord that is like the XML generated by exporting a record from ServiceNow.
     * This XML can be used to import a record into ServiceNow.
     * @param {GlideRecord} glideRecord 
     * @param {Document} [document]
     * @returns {Document}
     */
    unloadRecord: function(glideRecord, document) {
        // I'm going to write to this glideRecord so I don't want something downstream
        // to write to the database so I'm disabling write operations just in case
        // something downstream tries to write
        glideRecord.setAbortAction(true);

        // @ts-ignore
        var _document = document || global.GlideXMLUtil.newDocument('unload');
        if (!document) {
            // If the document was not passed in, then add the unload_date attribute
            var date = new GlideDateTime();
            _document.documentElement.setAttribute('unload_date', date.toString());
        }

        // If this is an extended table then I need the true record and not the base record
        // If I detect this isn't the extended record I query for the extended record
        if (glideRecord.getTableName() != glideRecord.getRecordClassName()) {
            var extended = new GlideRecord(glideRecord.getRecordClassName());
            extended.get(glideRecord.getUniqueValue());
            // @ts-ignore
            new global.GlideUnloader().unloadGlideRecord(_document, extended, 'INSERT_OR_UPDATE');
        } else {
            // @ts-ignore
            new global.GlideUnloader().unloadGlideRecord(_document, glideRecord, 'INSERT_OR_UPDATE');
        }

        return _document;
    },

    /**
     * Returns the XML representation of the Document
     * @param {Document} document 
     * @param {boolean} [prettyPrint]
     * @returns {string}
     */
    documentToString: function(document, prettyPrint) {
        if (prettyPrint) {
            // @ts-ignore
            return String(global.GlideXMLUtil.toIndentedString(document));
        } else {
            // @ts-ignore
            return String(global.GlideXMLUtil.toString(document));
        }
    },

    /**
     * Updates the references in the metadata XML using the metadata map
     * @param {string} xml 
     */
    updateReferences: function(xml) {
        for (var sourceSysId in this.metadataMap) {
            var targetSysId = this.metadataMap[sourceSysId];
            xml = xml.replace(new RegExp(sourceSysId, 'g'), targetSysId);
        }
        return xml;
    },
    /**
     * Generates a GUID for a source metadata record.
     * This also adds the source sys_id and target sys_id to the metadata map. Everytime
     * we generate a GUID we are tracking the relationship so this can be used later to update
     * references the existing GUID was using. For example, when a target UI Policy get a new
     * GUID, we need to update the target UI Policy Action records that were using the old GUID.
     * @param {string} sourceSysId 
     * @returns {string}
     */
    getOrGenerateGUID: function(sourceSysId) {
        // If the metadata map already has the source sys_id, return the target sys_id
        var guid = this.metadataMap[sourceSysId];
        if (!guid) {
            guid = gs.generateGUID();
            this.metadataMap[sourceSysId] = guid;
            // Save the metadata map
            this.setSysProperty('KLF_ScoperUtils.metadata_map', JSON.stringify(this.metadataMap, null, 4));
        }
        return guid;
    },

    /**
     * Retrieves the value of a system property. This is quicker than using gs.getProperty
     * @param {string} name 
     * @returns {string}
     */
    getSysProperty: function(name) {
        var property = new GlideRecord('sys_properties');
        if (property.get('name', name)) {
            return property.getValue('value');
        } else {
            throw 'System property ' + name + ' not found';
        }
    },

    /**
     * Directly sets the value of a system property. This is quicker than using gs.setProperty
     * @param {string} name 
     * @param {string} value 
     */
    setSysProperty: function(name, value) {
        var property = new GlideRecord('sys_properties');
        if (!property.get('name', name)) {
            throw 'System property ' + name + ' not found';
        }
        property.setValue('value', value);
        property.setWorkflow(false);
        property.autoSysFields(false);
        property.update();
    }
};
/**
 * @todo This object is broken right now. Remove the ts-nocheck and fix the issues.
 */
var global = global || {};

/**
 * Object that can be used to transfer data from one scope to another.
 * @param {global.KLF_ScoperUtils} scoper 
 */
global.KLF_ScoperUtils_DataMigrator = function(scoper) {
    this.scoper = scoper;
};

global.KLF_ScoperUtils_DataMigrator.prototype = {
    /**
     * Checks the table map to make sure that the source and target table name is valid.
     * Throws an error if the source table name is not found.
     * @param {string} tableName 
     */
    checkTable: function(tableName) {
        var source = new GlideRecord(tableName);
        if (!source.isValid()) {
            throw 'Source table not found for ' + tableName;
        }
        var target = new GlideRecord(this.scoper.tableMap[tableName]);
        if (!target.isValid()) {
            throw 'Target table not found for ' + tableName;
        }
    },

    /**
     * Transfers all tables from the source scope to the target scope.
     * @param {{tableName: string, encodedQueryString: string}[]} tables 
     */
    transferTables: function(tables) {
        var me = this;
        tables.forEach(function(table) {
            me.transferTable(table.tableName, table.encodedQueryString);
        });
    },

    /**
     * Transfers a single record from the source scope to the target scope.
     * @param {GlideRecord} source
     */
    transferRecord: function(source) {
        // Check to make sure there is a target table
        if (!this.scoper.tableMap[source.getRecordClassName()]) {
            throw 'No target table found for ' + source.getRecordClassName();
        }

        this.checkTable(source.getRecordClassName());

        var targetParts = this.scoper.copyData(source);
        var updatedXml = this.scoper.getUpdatedXml(targetParts.targetRecordDocument);
        // @ts-ignore
        var updateManager = new global.GlideUpdateManager2();
        updateManager.loadXML(updatedXml);

    },

    /**
     * Transfers a table from the source scope to the target scope.
     * @param {string} tableName 
     * @param {string} [encodedQueryString]
     */
    transferTable: function(tableName, encodedQueryString) {
        this.checkTable(tableName);
        var source = new GlideRecord(tableName);
        if (encodedQueryString) {
            source.addEncodedQuery(encodedQueryString);
        }
        source.query();
        while (source.next()) {
            this.transferRecord(source);
        }
    },

    /**
     * Adds the record's related journal entries to the update set
     * @param {GlideRecord} parent
     * @param {Document} document
     * @returns {global.KLF_RecordSync.Manifest}
     */
    addJournalEntries: function(parent, document) {
        var manifest = new global.KLF_RecordSync.Manifest();

        var journal = new GlideRecord("sys_journal_field");
        // Intentionally using GlideRecord.getRecordClassName because it will correctly
        // handle returning the correct table name when dealing with extended records
        journal.addQuery("name", parent.getRecordClassName());
        journal.addQuery("element_id", parent.getUniqueValue());
        journal.query();
        while (journal.next()) {
            manifest.addRecordByGlideRecord(journal);
            this.unloadRecord(journal, document);
        }
        return manifest;
    },

    /**
     * Unloads a record from the update set
     * @param {GlideRecord} gr
     * @param {Document} document
     */
    unloadRecord: function(gr, document) {
        throw 'unloadRecord method not implemented';
    },

    /**
     * Adds the record's related audit entries to the update set
     * @param {GlideRecord} parent
     * @param {Document} document
     * @returns {global.KLF_RecordSync.Manifest}
     */
    addAuditEntries: function(parent, document) {
        var manifest = new global.KLF_RecordSync.Manifest();

        var audit = new GlideRecord("sys_audit");
        // Intentionally using GlideRecord.getRecordClassName because it will correctly
        // handle returning the correct table name when dealing with extended records
        audit.addQuery("tablename", parent.getRecordClassName());
        audit.addQuery("documentkey", parent.getUniqueValue());
        audit.query();
        while (audit.next()) {
            manifest.addRecordByGlideRecord(audit);
            this.unloadRecord(audit, document);
        }
        return manifest;
    },

    /**
     * Adds the record's related currency entries to the update set
     * @param {GlideRecord} parent
     * @param {Document} document
     * @returns {global.KLF_RecordSync.Manifest}
     */
    addCurrencyEntries: function(parent, document) {
        var manifest = new global.KLF_RecordSync.Manifest();

        var currency = new GlideRecord("fx_currency_instance");
        // Intentionally using GlideRecord.getRecordClassName because it will correctly
        // handle returning the correct table name when dealing with extended records
        currency.addQuery("table", parent.getRecordClassName());
        currency.addQuery("id", parent.getUniqueValue());
        currency.query();
        while (currency.next()) {
            manifest.addRecordByGlideRecord(currency);
            this.unloadRecord(currency, document);
        }
        return manifest;
    },

    /**
     * Adds the record's related currency entries to the update set
     * @param {GlideRecord} parent
     * @param {Document} document
     * @returns {global.KLF_RecordSync.Manifest}
     */
    addPriceEntries: function(parent, document) {
        var manifest = new global.KLF_RecordSync.Manifest();

        var price = new GlideRecord("fx_price");
        // Intentionally using GlideRecord.getRecordClassName because it will correctly
        // handle returning the correct table name when dealing with extended records
        price.addQuery("table", parent.getRecordClassName());
        price.addQuery("id", parent.getUniqueValue());
        price.query();
        while (price.next()) {
            manifest.addRecordByGlideRecord(price);
            this.unloadRecord(price, document);
        }
        return manifest;
    },
};
/**
 * This script implements some enhancements to the Service Portal.
 * 
 * - applyGlideRecordTemplate - Applies a sys_template to a ServicePortal form to easily populate fields
 * - getActivityEntries - Enhances the Ticket Conversations widget by providing a complete list of activities.
 * By default, the widget only shows comments and work notes. This function provides the same list of activities
 * that are displayed in platform UI.
 * - getSPClientUIActions - This is used to display client actions in ServicePortal. Retrieves all the client actions for a table.
 * By default, ServicePortal will only display server side UI actions. This function retrieves client side UI actions that are
 * configured to be displayed on a ServicePortal view.
 * - setRedirectURL - Used in the form widget in ServicePortal to provide a redirect URL. This is to provide some standardization on
 * how routing is performed in ServicePortal after a UI Action is executed.
 */
// @ts-ignore 
var global = global || {};
/**
 * @class global.KLF_SPUtils
 * contains utility functions
 */
function KLF_SPUtils() {}
KLF_SPUtils.prototype = {
    /**
     * Applies a sys_template to a ServicePortal form
     * @param {string} templateName The name of the sys_template to apply
     * @param {*} spForm The form returned from $sp.getForm
     */
    applyGlideRecordTemplate: function(templateName, spForm) {
        var template = new GlideRecord('sys_template');
        if (template.get('name', templateName)) {
            var gr = new GlideRecord(spForm.table);
            gr.applyTemplate(templateName);
            var fields = spForm._fields;

            Object.keys(fields).filter(function(fieldName) {
                return !!gr.getValue(fieldName);
            }).forEach(function(fieldName) {
                var field = fields[fieldName];
                if (field.value) return; // Don't overwrite existing values
                if (field.type == 'boolean') {
                    var booleanValue = gr.getValue(fieldName) == '1' ? 'true' : 'false';
                    field.value = booleanValue;
                    field.displayValue = booleanValue;
                } else {
                    field.value = gr.getValue(fieldName);
                    field.displayValue = gr.getDisplayValue(fieldName);
                }
            });

            // Apply dot walked values
            // Be careful with these. Dot walked values are skipped in the default behavior
            // I still wanted these to apply though. If you aren't careful you can mistakenly
            // overwrite values in reference field tables
            var nameValueStrings = template.getValue('template').split('^');
            var nameValuePairs = nameValueStrings.map(function(nameValueString) {
                return nameValueString.split('=');
            });
            var dotWalkedPairs = nameValuePairs.filter(function(nameValuePair) {
                return nameValuePair[0].indexOf('.') >= 0;
            });
            dotWalkedPairs.forEach(function(nameValuePair) {
                var field = fields[nameValuePair[0]];
                field.value = nameValuePair[1];
                field.displayValue = nameValuePair[1];
            });
        }
    },

    /**
     * substitute call for $sp.getStream. For some reason $sp.getStream was returning a
     * NullPointerException in Rome, so I replaced it with an equivalent call. This is used
     * in the snb-ticket-conversation widget
     * @param {string} tableName
     * @param {string} sysId
     * @returns {Object}
     */
    getStream: function(tableName, sysId) {
        var gr = new GlideRecord(tableName);
        if (gr.get(sysId)) {
            return {
                "display_ value": gr.getDisplayValue(),
                "sys_id": sysId,
                "number": gr.getValue('number'),
                "entries": [],
                "user sys_id": gs.getUserID(),
                "user full_name": gs.getUserDisplayName(),
                "user login": gs.getUserName(),
                "label": gr.getlabel(),
                "table": tableName,
                "journal_flelds": [{
                    "can_read ": true,
                    "color": "gold",
                    "can_write": true,
                    "name": "work_notes",
                    "label": "Work Notes"
                }]
            };
        } else {
            return {};
        }
    },
    /**
     * Returns a list of field names that have changed on a record
     * @param {GlideRecord} glideRecord Record to find changed field names
     * @returns {string[]} List of field names that have changed
     */
    getChangedFieldNames: function(glideRecord) {
        var elements = new global.ArrayUtil().convertArray(glideRecord.getElements());
        return elements.filter(function(element) {
            return element.changes();
        }).map(function(element) {
            return element.getName();
        });
    },
    /**
     * @typedef ChangeRecord
     * Represents the set of changes for 1 update of a record. Each field changed
     * is stored in the changes array.
     * @property {string} sys_updated_on
     * @property {string} sys_updated_by
     * @property { object[]} changes
     * @property {string} changes[].fieldName Name of the field that changed
     * @property {string} changes[].fieldLabel Label of the field that changed
     * @property {string} changes[].currentValue Current value of the field that changed
     * @property {string} changes[].currentDisplayValue Current display value of the field that changed
     * @property {string} changes[].previousValue Previous value of the field that changed
     * @property {string} changes[].previousDisplayValue Previous display value of the field that changed
     */
    /**
     *
     * @param {string} tableName Name of table to retrieve history
     * @param {string} sysId sys_id of record to retrieve history
     * @returns {ChangeRecord[]}
     */
    getHistory: function(tableName, sysId) {
        //@ts-ignore
        var walker = new sn_hw.HistoryWalker(tableName, sysId);
        walker.walkBackward();
        var current = walker.getWalkedRecordCopy();
        /** @type {GlideRecord} */
        var previous;
        var history = [];
        while (walker.walkBackward()) {
            previous = walker.getWalkedRecordCopy();
            var changedFieldNames = this.getChangedFieldNames(current);
            var changes = changedFieldNames.map(function(fieldName) {
                return {
                    fieldName: fieldName,
                    fieldLabel: current[fieldName].getlabel(),
                    currentValue: current.getValue(fieldName),
                    currentDisplayValue: current.getDisplayValue(fieldName),
                    previousValue: previous.getValue(fieldName),
                    previousDisplayValue: previous.getDisplayValue(fieldName)
                };
            });
            var changeRecord = {
                sys_updated_on: current.getValue('sys_updated_on'),
                sys_updated_by: current.getValue('sys_updated_by'),
                changes: changes
            };
            history.push(changeRecord);
            current = previous;
        }
        return history;
    },
    /**
    @typedef Activity
    Represents an object that can be displayed as an entry in the Ticket Conversations widget
    The widget requires a set of properties to be filled in to render the entry correctly. You can see how
    * these properties are used by looking at the HTML Template section. The list is stored in "data.mergedEntries".
    * @property {string} element Type of activity: attachment,. field_changes, comments, work_notes
    * @property {string} field_label Display value of the type of activity
    * @property {string} value A description of the activity that happened
    * @property {string} name The label of the activity
    * @property {string} user_sys_id sys_id from sys_user
    * @property {string} sys_created_on Date when activity happened
    */
    /**
     * Gets a list of entries that can be rendered in the "Ticket Conversations" widget. This function
     * is called in the "Server Script" to help populate the list of entries that are displayed
     * @param {ChangeRecord[]} history
     * @param {string} tableName
     * @returns {Activity[]} A list of activities that can be displayed in the "Ticket Conversations" widget
     */
    getActivityEntries: function(history, tableName) {
        var configuredActivityFieldString = gs.getProperty('glide.ui.' + tableName + '_activity.fields');
        var activityFields = configuredActivityFieldString ? configuredActivityFieldString.split(',') : ['status'];
        return history.map(function(changeRecord) {
            function getUser( /** @type {string}**/ username) {
                var user = new GlideRecord('sys_user');
                if (user.get('user name', username)) {
                    return user;
                } else {
                    return null;
                }
            }
            var changes = changeRecord.changes;
            var changelines = changes.filter(function(change) {
                return activityFields.indexOf(change.fieldName) >= 0;
            }).map(function(change) {
                return change.fieldLabel + ': ' + '<span style="display: inline-block; width : lOpx"/>' + change.currentDisplayValue + ' was ' +
                    change.previousDisplayValue;
            });
            var summary = changelines.join(' <br/>');
            var user = getUser(changeRecord.sys_updated_by) || null;
            var createdAdjusted = '';
            if (changeRecord.sys_updated_on) {
                var createdDate = new GlideDateTime(changeRecord.sys_updated_on);
                createdAdjusted = createdDate.getLocalDate().getByFormat('YYYY-MM-dd') + '' +
                    createdDate.getLocalTime().getByFormat('HH:mm:ss');
            }
            return {
                element: 'field_ changes',
                field_label: 'Field Changes',
                value: summary,
                name: user ? user.getDisplayValue() : '',
                user_sys_id: user ? user.getUniqueValue() : '',
                sys_created_on: changeRecord.sys_updated_on,
                sys_created_on_adjusted: createdAdjusted
            };
        }).filter(function(entry) {
            return entry.value;
        });
    },
    /**
     * Retrieves all the client actions for a table. This is used to display client actions in ServicePortal.
     * This will only retrieve client actions that are configured to be displayed on a ServicePortal view
     * by configuring the "UI Action Visibility" of the UI Action. Setting the view to "Service Portal" and
     * "Visibility" to "Include". Result of this function is used in data.f._ui_actions list in form widget
     * @param {string} tableName Name of table to retrieve actions
     * @param {GlideRecord} current GlideRecord used to evaluate conditions against
     * @param {string} [viewName=sp]
     * @param {SPAction[]} [actions] Not needed. This is used as an accumulator in recursive calls
     * @returns {SPAction[]} A list of SPAction objects that can be displayed in the Form widget
     */
    getSPClientUIActions: function(tableName, current, viewName, actions) {
        var uiView = new GlideRecord('sys_ui_view');
        viewName = viewName || 'sp';
        if (!uiView.get('name', viewName)) {
            gs.error('Utils.getSPClientUIActions - could not find Service Portal view');
            return [];
        }
        var actionGr = new GlideRecord('sys_ui_action');
        actionGr.addQuery('client', true);
        actionGr.addQuery('active', true);
        //filter for only client side UI actions with an UI Action Visibility of Service Portal
        actionGr.addJoinQuery('sys_ui_action_view', 'sys_id', 'sys_ui_action')
            .addCondition('sys_ui_ view', uiView.getUniqueValue());
        actionGr.addQuery('table', tableName);
        actionGr.query();
        actions = actions || [];
        var evaluator = new GlideScopedEvaluator();
        while (actionGr.next()) {
            var include = evaluator.evaluateScript(actionGr, 'condition', {
                current: current
            });
            //if the action already exists then the action in the parent table
            //has been overridden in the extension table
            var actionExists = actions.filter(function(action) {
                return action.action_name == actionGr.getValue('action_name');
            }).length > 0;
            if (include && !actionExists) {
                actions.push({
                    sys_id: actionGr.getUniqueValue(),
                    action_name: actionGr.getValue('action_name'),
                    form_style: actionGr.getValue('form_style'),
                    hint: actionGr.getValue('hint'),
                    is_button: Boolean(actionGr.form_button),
                    is_context: Boolean(actionGr.form_context_menu),
                    is_link: Boolean(actionGr.form_link),
                    is_custom: true,
                    display_order: parseInt(actionGr.getValue('order')) || 100,
                    name: actionGr.getValue('name'),
                    fn: actionGr.getValue('script'),
                    onclick: actionGr.getValue('onclick'),
                    is_client: Boolean(actionGr.client)
                });
            }
        }
        var dbRecord = new GlideRecord('sys_db_object');
        if (dbRecord.get('name', tableName) && !dbRecord.super_class.nil()) {
            var superDbRecord = dbRecord.super_class.getRefRecord();
            var superTableName = superDbRecord.getValue('name');
            return this.getSPClientUIActions(superTableName, current, viewName, actions);
        } else {
            return actions;
        }
    },
    /**
     * This goes through the set of SPActions and applies the view rules
     * so included and excluded actions are displayed properly in Service Portal
     * @param {SPAction[]} spActions
     * @param {string} viewName
     * @returns {SPAction[]}
     */
    filterForSPActionsInView: function(spActions, viewName) {
        var view = new GlideRecord('sys_ui_view');
        var viewSysId = (viewName && view.get('name', viewName)) ? view.getUniqueValue() : '';
        return spActions.filter(function(spAction) {
            // Look for include rule first
            // If the sys_ui_action has the view on the list than include it
            var includeViewRule = new GlideRecord('sys_ui_action_view');
            includeViewRule.addQuery('sys_ui_action', spAction.sys_id);
            includeViewRule.addQuery('visibility', 'Include');
            includeViewRule.addQuery('sys_ui_view', viewSysId);
            includeViewRule.query();
            if (includeViewRule.getRowCount() > 0) {
                return true;
            }
            // Now look for exclude rule
            // If the sys_ui_action has the view on the exclude list than exclude it
            var excludeViewRule = new GlideRecord('sys_ui_action_view');
            excludeViewRule.addQuery('sys_ui_action', spAction.sys_id);
            excludeViewRule.addQuery('visibility', 'Exclude');
            excludeViewRule.addQuery('sys_ui_view', viewSysId);
            excludeViewRule.query();
            if (excludeViewRule.getRowCount() > 0) {
                return false;
            }
            // Wasn't on an include or exclude list, so check to see if we have
            // an include list. If there was an include list then we know this view
            // isn't on it so exclude it. Otherwise either there isn't a list or
            // this view isn't on the exclude list so include it
            var hasIncludeViewRule = new GlideRecord('sys_ui_action_view');
            hasIncludeViewRule.addQuery('sys_ui_action', spAction.sys_id);
            hasIncludeViewRule.addQuery('visibility', 'Include');
            hasIncludeViewRule.query();
            return hasIncludeViewRule.getRowCount() === 0; // Including if we don't have any include view rules
        });
    },
    /**
     * @callback getUrl
     * @returns {string} A URL to be used
     */
    /**
     * Used in the form widget in ServicePortal to provide a redirect URL. This is used
     * in combination with a UI action. The UI action sys_id is used as a key in the user
     * session to store a redirect URL that is picked up by the client after the UI action
     * executes
     * @param {string} actionSysId sys_id of a UI Action
     * @param {getUrl} getUrl function used to generate URL
     */
    setRedirectURL: function(actionSysId, getUrl) {
        var session = gs.getSession();
        session.putClientData(actionSysId, JSON.stringify({
            redirectUrl: getUrl()
        }));
    },

    /** !Important: This field must be at the bottom of this object */
    /** @type {'KLF_SPUtils'} */
    type: 'KLF_SPUtils'
};

global.KLF_SPUtils = KLF_SPUtils;
/**
 * Maybe create a UI Action that has a mapping of old table names to new table names.
 * Then you can click the UI Action and it would clone the script into the target scope as
 * well as modify the script to use the new table names.
 */

/**
 * Object used to generate a table in a target scope based on a global table.
 * This is to make it faster to scope a global application.
 * 
 * The column names of the resulting scoped table will be the same as the global table
 * including any columns with a u_ prefix.
 * 
 * The following tables are included in the process:
 * - sys_db_object
 * - sys_dictionary
 * - sys_documentation
 * - sys_embedded_help_role
 * - sys_security_acl
 * - sys_security_acl_role
 * - sys_user_role
 * - sys_wizard_answer
 * - ua_table_licensing_config
 */
var global = global || {};

/**
 * @param {string} targetScope 
 */
global.KLF_TableScoper = function(targetScope) {
    this.targetScope = targetScope;
};

global.KLF_TableScoper.prototype = {};
/**
 * Used to validate the table and column names between two tables.
 * 
 * The following things are validated:
 * 
 * TABLE:
 * - table sys_db_object
 * - table sys_dictionary collection record
 * - sys_number entry if the table has automatic numbering
 * - sys_number_counter. if the table has automatic numbering sys_number_counter must be set to a higher value than the source table.
 * 
 * TABLE FIELDS:
 * - sys_dictionary entry for the field
 * - sys_documentation entry for the field. This includes the label and help text
 * - sys_choice entry for the field if it is a choice field
 * - sys_dictionary.attributes entry for the field
 * - sys_dictionary_override entry for the field
 * 
 * @example
 * // Assign a local reference to the validator
 * var validator = KLF_TableValidator.TableValidator; 
 * 
 * // Set to true to disable debug logging. You can set this to false to see greater detail.
 * KLF_TableValidator.quiet = true; 
 * 
 * // Validate the table and column names between two tables. First argument is the source table, second argument is the target table.
 * // This will validate the table has been scoped properly and log the results to the system log.
 * // The log uses "KLF_TableValidator" as the source.
 * validator.validateAndLogResults('u_klf_test_task', 'x_53417_klf_test_test_task');
 */

/** 
 * The keys are either a table name or a field name with the table name as a prefix.
 * The values are an array of error messages for that field or table.
 * @typedef {{
 *   title:string,
 *   columnNameResult: string,
 *   results: {[fieldOrTable:string]:string[]}
 * }} KLF_ValidationReport
 */

/**
 * @typedef {{name:string,tableName:string,type:string}} KLF_ColumnValidator_Field
 */

/**
 * @typedef {{sourceField:KLF_ColumnValidator_Field,targetField:KLF_ColumnValidator_Field}} KLF_ColumnValidator_Pair
 */

/**
 * Object to validate the table and column names between two tables.
 */
var KLF_TableValidator = (function() {

    var BULLET = '\u2022 ';
    var CHECKMARK = '\u2713 ';
    var XMARK = '\u2717 ';

    var FLDS = {
        SYS_CHOICE: [
            'dependent_value',
            'element',
            'hint',
            'inactive',
            'label',
            'language',
            'sequence',
            'synonyms',
            'value'
        ],

        SYS_DB_OBJECT: [
            'access',
            'actions_access',
            'alter_access',
            'caller_access',
            'client_scripts_access',
            'configuration_access',
            'create_access',
            'delete_access',
            'extension_model',
            'is_extendable',
            'label',
            'live_feed_enabled',
            'provider_class',
            'read_access',
            'scriptable_table',
            'super_class',
            'update_access',
            'ws_access'
        ],

        SYS_DICTIONARY: [
            'active',
            'array',
            'array_denormalized',
            'audit',
            'choice',
            'choice_field',
            'choice_table',
            'column_label',
            'comments',
            'create_roles',
            'defaultsort',
            'default_value',
            'delete_roles',
            'dependent',
            'dependent_on_field',
            'display',
            'dynamic_creation',
            'dynamic_creation_script',
            'dynamic_default_value',
            'dynamic_ref_qual',
            'element',
            'element_reference',
            'foreign_database',
            'function_definition',
            'function_field',
            'internal_type',
            'mandatory',
            'max_length',
            'next_element',
            'primary',
            'read_only',
            'read_roles',
            'reference',
            'reference_cascade_rule',
            'reference_floats',
            'reference_key',
            'reference_qual',
            'reference_qual_condition',
            'reference_type',
            'spell_check',
            'staged',
            'table_reference',
            'text_index',
            'unique',
            'use_dependent_field',
            'use_dynamic_default',
            'use_reference_qualifier',
            'widget',
            'write_roles',
            'xml_view'
        ],

        SYS_DICTIONARY_OVERRIDE: [
            'attributes',
            'attributes_override',
            'base_table',
            'calculation',
            'calculation_override',
            'default_value',
            'default_value_override',
            'dependent',
            'dependent_override',
            'display_override',
            'element',
            'mandatory',
            'mandatory_override',
            'read_only',
            'read_only_override',
            'reference_qual',
            'reference_qual_override'
        ],

        SYS_DOCUMENTATION: [
            'element',
            'help',
            'hint',
            'label',
            'language',
            'plural',
            'url',
            'url_target'
        ]
    };

    var logSource = 'KLF_TableValidator';
    /**
     * Info level logging
     * @param {string} message
     */
    function logInfo(message) {
        gs.log('INFO: ' + message, logSource);
    }

    /**
     * Info error logging
     * @param {string} message
     */
    function logError(message) {
        gs.log('ERROR: ' + message, logSource);
    }

    /**
     * Debug logging
     * @param {string} message
     */
    function logDebug(message) {
        if (!KLF_TableValidator.quiet) {
            gs.log('DEBUG: ' + message, logSource);
        }
    }

    /**
     * @param {string} tableName
     * @param {string} fieldName
     * @returns {KLF_ColumnValidator_Field}
     */
    function getFieldForTable(tableName, fieldName) {
        var fieldGR = new GlideRecord(tableName);
        var element = fieldGR.getElement(fieldName);
        var type = String(element.getED().getInternalType());
        return {
            name: String(element.getName()),
            tableName: String(element.getTableName()),
            type: type
        };
    }

    /**
     * @param {string} tableName
     * @returns {KLF_ColumnValidator_Field[]}
     */
    function getFieldsForTable(tableName) {
        var fields = [];
        var fieldGR = new GlideRecord(tableName);
        var elements = fieldGR.getElements();
        // @ts-ignore
        for (var i = 0; i < elements.size(); i++) {
            // @ts-ignore
            var element = elements.get(i);
            var type = String(element.getED().getInternalType());
            if (type === 'related_tags') {
                continue;
            }
            fields.push({
                name: String(element.getName()),
                tableName: String(element.getTableName()),
                type: type
            });
        }

        fields.sort(function(f1, f2) {
            return f1.name.localeCompare(f2.name);
        });

        return fields;
    }

    /**
     * @param {KLF_ColumnValidator_Field} field 
     * @returns {GlideRecord} sys_dictionary
     */
    function getDictionaryEntry(field) {
        var dictionaryEntry = new GlideRecord('sys_dictionary');
        dictionaryEntry.addQuery('name', field.tableName);
        dictionaryEntry.addQuery('element', field.name);
        dictionaryEntry.query();
        if (dictionaryEntry.getRowCount() === 0) {
            throw ('No dictionary entry found for field: ' + JSON.stringify(field));
        }
        if (dictionaryEntry.getRowCount() > 1) {
            throw ('Multiple dictionary entries found for field: ' + JSON.stringify(field));
        }
        dictionaryEntry.next();
        return dictionaryEntry;
    }


    /**
     * Looks up the dictionary entries based on the fields list
     * @param {KLF_ColumnValidator_Field[]} fields 
     * @returns {GlideRecord[]} sys_dictionary[]
     */
    function getDictionaryEntries(fields) {
        var dictionaryEntries = fields.map(function(field) {
            return getDictionaryEntry(field);
        });
        return dictionaryEntries;
    }
    /**
     * Validates the fields in a column are the same between two tables
     */
    var _KLF_ColumnValidator = (function() {


        /**
         * Validates the fields in a column are the same between two tables
         * @param {string} sourceTable - The source table to validate
         * @param {string} targetTable - The target table to validate
         * @param {string} columnName - The column name to validate
         * @returns {string[]} - An array of error messages
         */
        function validateColumn(sourceTable, targetTable, columnName) {
            var sourceField = getFieldForTable(sourceTable, columnName);
            var targetField = getFieldForTable(targetTable, columnName);

            return validateColumnPair(sourceTable, targetTable, { sourceField: sourceField, targetField: targetField });
        }

        /**
         * Compares the sys_dictionary.attributes field between two dictionary entries
         * @param {GlideRecord} sourceDictionaryEntry 
         * @param {GlideRecord} targetDictionaryEntry 
         * @returns {string[]}
         */
        function validateAttributes(sourceDictionaryEntry, targetDictionaryEntry) {
            var excludedAttributes = ['edge_encryption_enabled'];
            /**
             * Attributes will look like this:
             * ref_ac_columns=user_name;first_name;last_name,ref_ac_columns_search=true 
             * 
             * They get converted to a map like this:
             * {
             *   ref_ac_columns: 'user_name;first_name;last_name',
             *   ref_ac_columns_search: 'true'
             * }
             * @param {string?} attributes 
             * @returns {{[key:string]:string?}}
             */
            function toAttributeMap(attributes) {
                if (!attributes) {
                    return {};
                }
                var attributeParts = attributes.split(',');
                return attributeParts.reduce(function(map, part) {
                    var parts = part.split('=');
                    if (parts.length === 2) {
                        map[parts[0].trim()] = parts[1].trim();
                    } else {
                        map[parts[0].trim()] = null;
                    }
                    return map;
                }, /** @type {{[key:string]:string?}} */ ({}));
            }

            /**
             * @param {{[key:string]:string?}} sourceMap 
             * @param {{[key:string]:string?}} targetMap 
             * @returns {string[]}
             */
            function compareAttributeMap(sourceMap, targetMap) {
                var errors = /** @type string[] */ ([]);

                Object.keys(sourceMap).forEach(function(key) {
                    if (excludedAttributes.indexOf(key) >= 0) {
                        return;
                    }

                    if (targetMap[key] !== sourceMap[key]) {
                        errors.push('Attribute ' + key + ' does not match: ' + sourceMap[key] + ' vs ' + targetMap[key]);
                    }
                });

                return errors;
            }

            // Validate the attributes field
            var sourceAttributes = sourceDictionaryEntry.getValue('attributes');
            var sourceAttributeMap = toAttributeMap(sourceAttributes);
            var targetAttributes = targetDictionaryEntry.getValue('attributes');
            var targetAttributeMap = toAttributeMap(targetAttributes);
            return compareAttributeMap(sourceAttributeMap, targetAttributeMap);
        }


        /**
         * @param {string} sourceTable - The source table to validate
         * @param {string} targetTable - The target table to validate
         * @param {KLF_ColumnValidator_Pair} columnPair
         * @returns {string[]}
         */
        function validateColumnPair(sourceTable, targetTable, columnPair) {
            var errors = [];

            var sourceField = columnPair.sourceField;
            var targetField = columnPair.targetField;

            if (sourceField.type !== targetField.type) {
                errors.push('Field types do not match: ' + sourceField.name + ' (' + sourceField.type + ') vs ' + targetField.name + ' (' + targetField.type + ')');
            }

            // Add more validation logic here
            // For example, you can check if the field is mandatory, unique, etc.
            var sourceDictionaryEntry = getDictionaryEntry(sourceField);
            var targetDictionaryEntry = getDictionaryEntry(targetField);
            errors = errors.concat(validateColumnDictionaryEntry(sourceTable, sourceDictionaryEntry, targetTable, targetDictionaryEntry));

            if (errors.length === 0) {
                logDebug(CHECKMARK + ' "' + columnPair.sourceField.name + '" column configuration is valid');
            } else {
                logDebug(XMARK + ' "' + columnPair.sourceField.name + '" column configuration is not valid');
            }

            return errors;
        }

        /**
         * @param {GlideRecord} sourceGR
         * @param {GlideRecord} targetGR
         * @param {string[]} fieldsToCheck
         * @returns {string[]}
         */
        function validateGlideRecordFields(sourceGR, targetGR, fieldsToCheck) {
            var errors = /** @type string[] */ ([]);
            fieldsToCheck.forEach(function(field) {
                var fieldType = String(sourceGR[field].getED().getInternalType());
                var sourceValue = sourceGR.getValue(field);
                var targetValue = targetGR.getValue(field);

                if (fieldType === 'boolean') {
                    if (Boolean(sourceGR[field]) !== Boolean(targetGR[field])) {
                        errors.push('Field "' + sourceGR.getTableName() + '.' + field + '" does not match: "' + sourceValue + '" vs "' + targetValue + '"');
                    }
                } else {
                    if (sourceValue !== targetValue) {
                        errors.push('Field "' + sourceGR.getTableName() + '.' + field + '" does not match: "' + sourceValue + '" vs "' + targetValue + '"');
                    }
                }
            });
            return errors;
        }

        /**
         * Validates the choices associated with a dictionary entry
         * @param {GlideRecord} sourceDictionaryEntry 
         * @param {GlideRecord} targetDictionaryEntry 
         * @returns {string[]} errors
         */
        function validateChoices(sourceDictionaryEntry, targetDictionaryEntry) {
            var errors = /** @type string[] */ ([]);

            // Query source choices first
            var sourceChoices = [];
            var sourceChoiceGR = new GlideRecord('sys_choice');
            sourceChoiceGR.addQuery('name', sourceDictionaryEntry.getValue('name'));
            sourceChoiceGR.addQuery('element', sourceDictionaryEntry.getValue('element'));
            sourceChoiceGR.query();
            while (sourceChoiceGR.next()) {
                sourceChoices.push({
                    sysId: sourceChoiceGR.getUniqueValue(),
                    name: sourceChoiceGR.getValue('name'),
                    element: sourceChoiceGR.getValue('element'),
                    label: sourceChoiceGR.getValue('label'),
                    value: sourceChoiceGR.getValue('value'),
                    sequence: sourceChoiceGR.getValue('sequence'),
                    inactive: sourceChoiceGR.getValue('inactive')
                });
            }

            // Loop through source choices and make sure there is a target choice that matches
            sourceChoices.forEach(function(sourceChoice) {
                var name = targetDictionaryEntry.getValue('name');
                var element = targetDictionaryEntry.getValue('element');

                var targetChoiceGR = new GlideRecord('sys_choice');
                targetChoiceGR.addQuery('name', name);
                targetChoiceGR.addQuery('element', element);
                targetChoiceGR.addQuery('label', sourceChoice.label);
                targetChoiceGR.addQuery('value', sourceChoice.value);
                targetChoiceGR.query();
                if (!targetChoiceGR.next()) {
                    errors.push('Choice missing - ' + name + '.' + element + ': ' + sourceChoice.label + '[' + sourceChoice.value + ']');
                    return;
                }

                var sourceChoiceGR = new GlideRecord('sys_choice');
                if (!sourceChoiceGR.get(sourceChoice.sysId)) {
                    throw 'Could not find source choice: ' + sourceChoice.sysId;
                }

                var recordErrors = validateGlideRecordFields(sourceChoiceGR, targetChoiceGR, FLDS.SYS_CHOICE);
                if (recordErrors.length > 0) {
                    var errorHeader = ('Choice mismatch - ' + sourceChoice.label + '[' + sourceChoice.value + ']');
                    var subErrors = recordErrors.map(function(error) {
                        return '  ' + error;
                    }).join('\n');
                    errors.push(errorHeader + '\n' + subErrors);
                }
            });

            return errors;
        }

        /**
         * Validates the sys_dictionary_override records associated with a dictionary entry
         * @param {string} sourceTable
         * @param {GlideRecord} sourceDictionaryEntry 
         * @param {string} targetTable
         * @param {GlideRecord} targetDictionaryEntry 
         * @returns {string[]} errors
         */
        function validateDictionaryOverrides(sourceTable, sourceDictionaryEntry, targetTable, targetDictionaryEntry) {
            var errors = /** @type string[] */ ([]);

            // Get sys_dictionary_override table for source and target. There should be one for each
            var sourceOverride = new GlideRecord('sys_dictionary_override');
            sourceOverride.addQuery('name', sourceTable);
            sourceOverride.addQuery('element', sourceDictionaryEntry.getValue('element'));
            sourceOverride.query();
            if (!sourceOverride.next()) {
                // No need to validate if there is no override
                return [];
            }

            var targetOverride = new GlideRecord('sys_dictionary_override');
            targetOverride.addQuery('name', targetTable);
            targetOverride.addQuery('element', targetDictionaryEntry.getValue('element'));
            targetOverride.query();
            if (!targetOverride.next()) {
                errors.push('Dictionary override not found for column ' + targetDictionaryEntry.getValue('name') + '.' + targetDictionaryEntry.getValue('element'));
                return errors;
            }

            // Validate the sys_dictionary_override fields
            errors = errors.concat(validateGlideRecordFields(sourceOverride, targetOverride, FLDS.SYS_DICTIONARY_OVERRIDE));

            return errors;
        }

        /**
         * Validates the sys_documentation label associated with a dictionary entry
         * @param {GlideRecord} sourceDictionaryEntry 
         * @param {GlideRecord} targetDictionaryEntry 
         * @returns {string[]} errors
         */
        function validateLabel(sourceDictionaryEntry, targetDictionaryEntry) {
            var errors = [];

            // Check the field label
            // How to get the sys_documentation field related to a sys_dictionary?
            /**
             * @param {GlideRecord} dictionaryEntry
             * @returns {GlideRecord?} sys_documentation | null
             */
            function getLabel(dictionaryEntry) {
                var label = new GlideRecord('sys_documentation');
                label.addQuery('element', dictionaryEntry.getValue('element'));
                label.addQuery('name', dictionaryEntry.getValue('name'));
                label.query();
                if (label.next()) {
                    return label;
                }
                return null;
            }

            var sourceLabel = getLabel(sourceDictionaryEntry);
            var targetLabel = getLabel(targetDictionaryEntry);
            if (!sourceLabel) {
                errors.push('Could not find sys_documentation label for source: ' + sourceDictionaryEntry.getValue('name') + '.' + sourceDictionaryEntry.getValue('element'));
            }
            if (!targetLabel) {
                errors.push('Could not find sys_documentation  label for target: ' + targetDictionaryEntry.getValue('name') + '.' + targetDictionaryEntry.getValue('element'));
            }

            if (sourceLabel && targetLabel) {
                errors = errors.concat(validateGlideRecordFields(sourceLabel, targetLabel, FLDS.SYS_DOCUMENTATION));
            }

            return errors;
        }

        /**
         * Returns true if this dictionary entry has choices
         * @param {GlideRecord} dictionaryEntry
         * @returns {boolean}
         */
        function isChoice(dictionaryEntry) {
            var choiceType = dictionaryEntry.getValue('choice');
            return choiceType == '3' || choiceType == '1';
        }

        /**
         * Validates the Calculated Value section of sys_dictionary
         * @param {GlideRecord} sourceDictionaryEntry 
         * @param {GlideRecord} targetDictionaryEntry 
         * @returns {string[]}
         */
        function validateCalculatedValue(sourceDictionaryEntry, targetDictionaryEntry) {

            var errors = [];

            // Validate the calculation field
            var sourceVirtual = sourceDictionaryEntry.getValue('virtual');
            var targetVirtual = targetDictionaryEntry.getValue('virtual');
            if (sourceVirtual !== targetVirtual) {
                errors.push('"Calculated[virtual]" value does not match. Check "Calculated Value" section: ' + sourceVirtual + ' vs ' + targetVirtual);
            }

            if (Boolean(sourceDictionaryEntry.virtual)) {
                var sourceCalculation = sourceDictionaryEntry.getValue('calculation');
                var targetCalculation = targetDictionaryEntry.getValue('calculation');
                if (sourceCalculation !== targetCalculation) {
                    errors.push('"Calculated[calculation]" value does not match. Check "Calculated Value" section: ' + sourceCalculation + ' vs ' + targetCalculation);
                }
            }

            return errors;
        }

        /**
         * Validates the dictionary entry fields for the columns are the same
         * @param {string} sourceTable
         * @param {GlideRecord} sourceDictionaryEntry 
         * @param {string} targetTable
         * @param {GlideRecord} targetDictionaryEntry 
         * @returns {string[]}
         */
        function validateColumnDictionaryEntry(sourceTable, sourceDictionaryEntry, targetTable, targetDictionaryEntry) {
            var errors = /** @type string[] */ ([]);

            // Validate the sys_dictionary record for the field
            errors = errors.concat(validateGlideRecordFields(sourceDictionaryEntry, targetDictionaryEntry, FLDS.SYS_DICTIONARY));

            // Validate the associated sys_dictionary.attributes 
            errors = errors.concat(validateCalculatedValue(sourceDictionaryEntry, targetDictionaryEntry));

            // Check the field dictionary overrides
            errors = errors.concat(validateDictionaryOverrides(sourceTable, sourceDictionaryEntry, targetTable, targetDictionaryEntry));

            // Validate the associated sys_dictionary.attributes 
            errors = errors.concat(validateAttributes(sourceDictionaryEntry, targetDictionaryEntry));

            // Validate the associated sys_documentation record
            errors = errors.concat(validateLabel(sourceDictionaryEntry, targetDictionaryEntry));

            // Check field choices if the field is a choice field
            if (isChoice(sourceDictionaryEntry)) {
                errors = errors.concat(validateChoices(sourceDictionaryEntry, targetDictionaryEntry));
            }

            return errors;
        }

        return {
            validateColumn: validateColumn,
            validateColumnPair: validateColumnPair,
            validateGlideRecordFields: validateGlideRecordFields
        };

    })();

    var _KLF_TableValidator = (function() {

        /**
         * @param {KLF_ValidationReport} report
         * @returns {string} - A formatted report of the validation results
         */
        function formatReport(report) {
            var _results = report.results;
            var filteredResults = Object.keys(_results).reduce(function(filteredResults, fieldOrTable) {
                var results = _results[fieldOrTable];
                if (results.length === 0) {
                    return filteredResults;
                } else {
                    filteredResults[fieldOrTable] = results;
                    return filteredResults;
                }
            }, /** @type {{[fieldOrTable:string]:string[]}} */ ({}));

            var separator = '\n=======================================================================================================================================\n';

            if (Object.keys(filteredResults).length === 0) {
                return '\n\n' + report.title + '\n\n' + CHECKMARK + ' No errors found' + separator;
            }


            var formattedResults = Object.keys(filteredResults).map(function(fieldOrTable) {
                var results = filteredResults[fieldOrTable];
                var formattedResults = results.map(function(result) {
                    return BULLET + result;
                });
                return '\n' + fieldOrTable + '\n\n' + formattedResults.join('\n\n');
            });


            formattedResults.unshift('\n' + report.columnNameResult);
            formattedResults.unshift('\n\n' + report.title);
            formattedResults.push('');

            return formattedResults.join(separator);
        }

        /**
         * Validates the fields in a column are the same between two tables
         * @param {KLF_ColumnValidator_Field[]} sourceFields - The source table to validate
         * @param {KLF_ColumnValidator_Field[]} targetFields - The target table to validate
         * @returns {string[]} - An array of error messages
         */
        function validateColumnNames(sourceFields, targetFields) {
            var errors = [];

            // Make sure the field names are the same
            var sourceFieldNames = sourceFields.map(function(field) {
                return field.name;
            });

            var targetFieldNames = targetFields.map(function(field) {
                return field.name;
            });
            var missingFields = sourceFieldNames.filter(function(fieldName) {
                return targetFieldNames.indexOf(fieldName) === -1;
            });
            if (missingFields.length > 0) {
                errors.push('Missing columns in target table: ' + missingFields.join(','));
            }


            if (errors.length === 0) {
                logDebug(CHECKMARK + ' All table columns exist in target table');
            } else {
                logDebug(XMARK + ' Table columns are missing');
            }

            return errors;
        }

        /**
         * Zips the source and target fields together. If
         * the source field is not found in the target
         * table, it will not be included in the result.
         * @param {KLF_ColumnValidator_Field[]} sourceFields 
         * @param {KLF_ColumnValidator_Field[]} targetFields 
         * @returns {KLF_ColumnValidator_Pair[]}
         */
        function pairColumns(sourceFields, targetFields) {
            return sourceFields.map(function(sourceField) {
                var targetField = null;
                for (var i = 0; i < targetFields.length; i++) {
                    var candidateTargetField = targetFields[i];
                    if (candidateTargetField.name === sourceField.name) {
                        targetField = candidateTargetField;
                        break;
                    }
                }
                if (!targetField) {
                    return null;
                }
                return {
                    sourceField: sourceField,
                    targetField: targetField
                };
            }).filter(function(pair) {
                return pair !== null;
            });
        }

        /**
         * Validates the source and target tables objects. This is the object that holds
         * the table name and other metadata about the table, as well as the fields in the table.
         * @param {string} sourceTableName 
         * @param {string} targetTableName 
         * @returns {string[]} Any errors that were found
         */
        function validateTableDbObject(sourceTableName, targetTableName) {
            logDebug('Validating table sys_db_object for ' + sourceTableName + ' against ' + targetTableName);

            var errors = [];

            var sourceDbObject = new GlideRecord('sys_db_object');
            if (!sourceDbObject.get('name', sourceTableName)) {
                throw new Error('Source table ' + sourceTableName + ' does not exist in sys_db_object');
            }

            var targetDbObject = new GlideRecord('sys_db_object');
            if (!targetDbObject.get('name', targetTableName)) {
                throw new Error('Target table ' + targetTableName + ' does not exist in sys_db_object');
            }

            // Validate number ref
            if (!sourceDbObject.number_ref.nil()) {
                // Make sure the sys_number_counter is set to a higher value than the source table
                if (targetDbObject.number_ref.nil()) {
                    errors.push('Target table ' + targetTableName + ' does not have a number reference');
                }

                var sourceNumberPrefix = sourceDbObject.number_ref.prefix.toString();
                var targetNumberPrefix = targetDbObject.number_ref.prefix.toString();
                if (sourceNumberPrefix !== targetNumberPrefix) {
                    errors.push(
                        'Target table ' +
                        targetTableName +
                        ' does not have the same number reference\n  prefix as source table ' +
                        sourceTableName + ' - "' + sourceNumberPrefix + '" vs "' + targetNumberPrefix + '"');
                }

                // Make sure the sys_number_counter is set to a higher value than the source table
                /**
                 * @param {string} tableName
                 * @returns {GlideRecord?}
                 */
                function getNumberCounter(tableName) {
                    var counter = new GlideRecord('sys_number_counter');
                    if (!counter.get('table', tableName)) {
                        errors.push('Number Counter not found for table ' + tableName);
                        return null;
                    }
                    return counter;
                }
                var sourceNumberCounter = getNumberCounter(sourceTableName);
                var targetNumberCounter = getNumberCounter(targetTableName);
                if (sourceNumberCounter && targetNumberCounter) {
                    var sourceNumber = Number(sourceNumberCounter.getValue('number'));
                    var targetNumber = Number(targetNumberCounter.getValue('number'));
                    if (targetNumber < sourceNumber) {
                        errors.push(
                            'Target table ' +
                            targetTableName +
                            ' does not have a higher number reference\n  counter than source table ' +
                            sourceTableName + ' [' + sourceNumber + '] vs ' + targetTableName + '[' + targetNumber + ']');
                    }
                }
            }

            // Validate sys_db_object fields
            errors = errors.concat(_KLF_ColumnValidator.validateGlideRecordFields(sourceDbObject, targetDbObject, FLDS.SYS_DB_OBJECT));

            return errors;
        }

        /**
         * Validates the sys_dictionary entry for the source and target tables. This is
         * the "collection" record that is in the sys_dictionary table.
         * @param {string} sourceTable 
         * @param {string} targetTable 
         * @returns {string[]} Any errors that were found
         */
        function validateSysDictionaryCollection(sourceTable, targetTable) {
            var sourceDictionary = new GlideRecord('sys_dictionary');
            sourceDictionary.addQuery('name', sourceTable);
            sourceDictionary.addQuery('internal_type', 'collection');
            sourceDictionary.query();
            if (!sourceDictionary.next()) {
                throw new Error('Source table ' + sourceTable + ' does not exist in sys_dictionary as a collection');
            }

            var targetDictionary = new GlideRecord('sys_dictionary');
            targetDictionary.addQuery('name', targetTable);
            targetDictionary.addQuery('internal_type', 'collection');
            targetDictionary.query();
            if (!targetDictionary.next()) {
                throw new Error('Target table ' + targetTable + ' does not exist in sys_dictionary as a collection');
            }

            return _KLF_ColumnValidator.validateGlideRecordFields(sourceDictionary, targetDictionary, FLDS.SYS_DICTIONARY);
        }

        /**
         * @param {string} sourceTable 
         * @param {string} targetTable 
         */
        function validateAndLogResults(sourceTable, targetTable) {
            var report = validate(sourceTable, targetTable);
            var formattedReport = formatReport(report);
            logInfo(formattedReport);
        }

        /**
         * @param {string} sourceTable 
         * @param {string} targetTable 
         * @returns {KLF_ValidationReport}
         */
        function validate(sourceTable, targetTable) {
            logDebug('Validating ' + sourceTable + ' against ' + targetTable);
            var errors = /** @type string[] */ ([]);

            /** @type {{[fieldOrTable:string]:string[]}} */
            var results = {};
            results[sourceTable] = [];

            var sourceGR = new GlideRecord(sourceTable);
            if (!sourceGR.isValid()) {
                throw new Error('Invalid source table name ' + sourceTable);
            }

            var targetGR = new GlideRecord(sourceTable);
            if (!targetGR.isValid()) {
                throw new Error('Invalid target table name ' + targetTable);
            }

            errors = errors.concat(validateTableDbObject(sourceTable, targetTable));

            errors = errors.concat(validateSysDictionaryCollection(sourceTable, targetTable));

            // First we need to get a list of all the fields in the source table
            var sourceFields = getFieldsForTable(sourceTable);
            var targetFields = getFieldsForTable(targetTable);

            // We need to make sure each field in the column is the same between the two tables
            var columnNameErrors = validateColumnNames(sourceFields, targetFields);
            var columnNameResult = (columnNameErrors.length === 0) ?
                (CHECKMARK + ' All table columns exist in target table') :
                (XMARK + ' Table columns are missing');
            errors = errors.concat(columnNameErrors);

            var columnPairs = pairColumns(sourceFields, targetFields);

            columnPairs.forEach(function(columnPair) {
                var source = columnPair.sourceField;
                results[sourceTable + '.' + source.name] = _KLF_ColumnValidator.validateColumnPair(sourceTable, targetTable, columnPair);
            });

            // Add your validation logic here
            results[sourceTable] = errors;
            return {
                title: 'Validation Results for ' + sourceTable + ' against ' + targetTable,
                columnNameResult: columnNameResult,
                results: results
            };
        }

        return {
            validate: validate,
            validateAndLogResults: validateAndLogResults,
            validateColumnNames: validateColumnNames,
            pairColumns: pairColumns,
            formatReport: formatReport
        };
    })();

    return {
        ColumnValidator: _KLF_ColumnValidator,
        TableValidator: _KLF_TableValidator,
        quiet: true
    };
})();
var global = global || {};

/**
 * Creates a mock RESTAPIRequest object for testing purposes.
 * @constructor
 * @param {Object} config - Configuration object for the mock request.
 * @param {string} [config.url='https://example.com/api/endpoint'] - The full URL of the request.
 * @param {string} [config.uri='/api/endpoint'] - The URI part of the URL.
 * @param {string} [config.queryString=''] - The query string part of the URL.
 * @param {Object} [config.body] - The request body.
 */
global.KLF_TestMockRESTAPIRequest = function(config) {
    config = config || {};
    this.url = config.url || 'https://example.com/api/endpoint';
    this.uri = config.uri || '/api/endpoint';
    this.queryString = config.queryString || '';
    this.body = config.body || new global.KLF_TestMockRESTAPIRequest.MockRESTAPIRequestBody();
    /** @type {{[key:string]:string}} */
    this.headers = {};
    /** @type {{[key:string]:string}} */
    this.queryParams = {};
    this.parseQueryString();
};

/**
 * Gets the value of the specified header.
 * @param {string} headerName - The name of the header.
 * @returns {string} The value of the header, or an empty string if not found.
 */
global.KLF_TestMockRESTAPIRequest.prototype.getHeader = function(headerName) {
    return this.headers[headerName] || '';
};

/**
 * Gets the list of supported response content types.
 * @returns {string[]} An array of supported content types.
 */
global.KLF_TestMockRESTAPIRequest.prototype.getSupportedResponseContentTypes = function() {
    return ['application/json', 'application/xml', 'text/plain'];
};

/**
 * Gets the requested query category from the query parameters.
 * @returns {string} The value of the 'sysparm_query_category' parameter, or an empty string if not found.
 */
global.KLF_TestMockRESTAPIRequest.prototype.getRequestedQueryCategory = function() {
    return this.queryParams['sysparm_query_category'] || '';
};

/**
 * Sets a header value.
 * @param {string} headerName - The name of the header.
 * @param {string} headerValue - The value of the header.
 */
global.KLF_TestMockRESTAPIRequest.prototype.setHeader = function(headerName, headerValue) {
    this.headers[headerName] = headerValue;
};

/**
 * Sets the query string and parses it.
 * @param {string} queryString - The query string to set.
 */
global.KLF_TestMockRESTAPIRequest.prototype.setQueryString = function(queryString) {
    this.queryString = queryString;
    this.parseQueryString();
};

/**
 * Parses the query string into key-value pairs.
 */
global.KLF_TestMockRESTAPIRequest.prototype.parseQueryString = function() {
    this.queryParams = {};
    if (this.queryString) {
        var pairs = this.queryString.split('&');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            var key = decodeURIComponent(pair[0]);
            var value = decodeURIComponent(pair[1] || '');
            this.queryParams[key] = value;
        }
    }
};

/**
 * Creates a mock RESTAPIRequestBody object for testing purposes.
 * @constructor
 * @param {string} [dataString='{"key": "value"}'] - The JSON string representing the body data.
 * @param {Object} [dataStream=null] - The data stream object (not implemented in this mock).
 */
global.KLF_TestMockRESTAPIRequest.MockRESTAPIRequestBody = function(dataString, dataStream) {
    this.dataString = dataString || '{"key": "value"}';
    this.dataStream = dataStream || null;
    /** @type {any} */
    this.jsonData = null;
    this.currentIndex = 0;
};

/**
 * Gets the next entry from the body data.
 * @returns {Object|null} The next entry, or null if there are no more entries.
 */
global.KLF_TestMockRESTAPIRequest.MockRESTAPIRequestBody.prototype.nextEntry = function() {
    if (!this.jsonData) {
        this.jsonData = JSON.parse(this.dataString);
    }

    if (Array.isArray(this.jsonData)) {
        if (this.currentIndex < this.jsonData.length) {
            return this.jsonData[this.currentIndex++];
        }
    } else {
        if (this.currentIndex === 0) {
            this.currentIndex++;
            return this.jsonData;
        }
    }

    return null;
};

/**
 * Checks if there are more entries in the body data.
 * @returns {boolean} True if there are more entries, false otherwise.
 */
global.KLF_TestMockRESTAPIRequest.MockRESTAPIRequestBody.prototype.hasNext = function() {
    if (!this.jsonData) {
        this.jsonData = JSON.parse(this.dataString);
    }

    if (Array.isArray(this.jsonData)) {
        return this.currentIndex < this.jsonData.length;
    } else {
        return this.currentIndex === 0;
    }
};
var global = global || {};

/**
 * Creates a mock RESTAPIResponse object for testing purposes.
 * @constructor
 * @param {Object} config - Configuration object for the mock response.
 * @param {number} [config.status=200] - The HTTP status code of the response.
 * @param {{[key:string]:string}} [config.headers={}] - The response headers.
 * @param {*} [config.body=null] - The response body.
 */
global.KLF_TestMockRESTAPIResponse = function(config) {
    config = config || {};
    this.status = config.status || 200;
    /** @type {{[key:string]:string}} */
    this.headers = config.headers || {};
    this.body = config.body || null;
    /** @type {string} */
    this.error = '';
    /** @type {any} */
    this.streamWriter = null;
};

/**
 * Sets the HTTP status code of the response.
 * @param {number} code - The HTTP status code to set.
 */
global.KLF_TestMockRESTAPIResponse.prototype.setStatus = function(code) {
    this.status = code;
};

/**
 * Sets multiple headers at once.
 * @param {{[key:string]:string}} headers - An object containing header key-value pairs.
 */
global.KLF_TestMockRESTAPIResponse.prototype.setHeaders = function(headers) {
    for (var key in headers) {
        if (headers.hasOwnProperty(key)) {
            this.headers[key] = headers[key];
        }
    }
};

/**
 * Sets a single header.
 * @param {string} name - The name of the header.
 * @param {string} value - The value of the header.
 */
global.KLF_TestMockRESTAPIResponse.prototype.setHeader = function(name, value) {
    this.headers[name] = value;
};

/**
 * Sets the Location header.
 * @param {string} locationValue - The value for the Location header.
 */
global.KLF_TestMockRESTAPIResponse.prototype.setLocation = function(locationValue) {
    this.setHeader('Location', locationValue);
};

/**
 * Sets the Content-Type header.
 * @param {string} contentType - The value for the Content-Type header.
 */
global.KLF_TestMockRESTAPIResponse.prototype.setContentType = function(contentType) {
    this.setHeader('Content-Type', contentType);
};

/**
 * Sets an error for the response.
 * @param {*} error - The error to set.
 */
global.KLF_TestMockRESTAPIResponse.prototype.setError = function(error) {
    this.error = error;
};

/**
 * Sets the response body.
 * @param {*} body - The body content to set.
 */
global.KLF_TestMockRESTAPIResponse.prototype.setBody = function(body) {
    this.body = body;
};

/**
 * Gets a stream writer for the response.
 * @returns {global.KLF_TestMockRESTAPIResponse.MockRESTAPIResponseStream} A mock stream writer.
 */
global.KLF_TestMockRESTAPIResponse.prototype.getStreamWriter = function() {
    if (!this.streamWriter) {
        this.streamWriter = new global.KLF_TestMockRESTAPIResponse.MockRESTAPIResponseStream();
    }
    return this.streamWriter;
};

/**
 * Creates a mock RESTAPIResponseStream object for testing purposes.
 * @constructor
 */
global.KLF_TestMockRESTAPIResponse.MockRESTAPIResponseStream = function() {
    this.content = '';
};

/**
 * Writes a string to the stream.
 * @param {string} stringToWrite - The string to write to the stream.
 */
global.KLF_TestMockRESTAPIResponse.MockRESTAPIResponseStream.prototype.writeString = function(stringToWrite) {
    this.content += stringToWrite;
};

/**
 * Simulates writing a stream to the response.
 * @param {*} inputStream - The input stream to write (not actually used in this mock).
 */
global.KLF_TestMockRESTAPIResponse.MockRESTAPIResponseStream.prototype.writeStream = function(inputStream) {
    this.content += '[Stream Content]';
};

// Additional methods for testing and debugging
global.KLF_TestMockRESTAPIResponse.prototype.getStatus = function() {
    return this.status;
};

global.KLF_TestMockRESTAPIResponse.prototype.getHeaders = function() {
    return this.headers;
};

global.KLF_TestMockRESTAPIResponse.prototype.getBody = function() {
    return this.body;
};

global.KLF_TestMockRESTAPIResponse.prototype.getError = function() {
    return this.error;
};

global.KLF_TestMockRESTAPIResponse.MockRESTAPIResponseStream.prototype.getContent = function() {
    return this.content;
};
/**
 * This script include provides utility functions for unit testing.
 * 
 * Like creating a user, creating a group, deleting records created by a user, impersonating a user etc.
 * 
 * It includes functions that allow you to:
 * - Delete records created by a specific user so that you can clean up after a test
 * - Run a function as a specific user so that you can test functionality that requires a specific user
 * - Create a common user that has no roles or groups
 * - Impersonate the common user
 * - Create a group, including adding users to the group
 * - Create a user
 */
//@ts-ignore
var global = global || {};

/**
 * @typedef {{sysId:string,tableName:string}} KLF_Document
 */


/**
 * @typedef {{recordTracker?: global.KLF_TestUtils.RecordTracker,adminUsername?:string}} KLF_TestUtilsConfig
 */

/**
 * General utility functions for to help with testing using ATF
 * @class global.KLF_TestUtils
 * contains utility functions
 * @param {KLF_TestUtilsConfig} [config]
 */
global.KLF_TestUtils = function(config) {
    var _config = config || /** @type {KLF_TestUtilsConfig} */ ({});
    this.recordTracker = _config.recordTracker || new global.KLF_TestUtils.RecordTracker();
    this.adminUsername = _config.adminUsername || gs.getProperty('KLF_TestUtils.admin_username', 'KLF_TestAdminUser');
};

global.KLF_TestUtils.matchers = {
    /**
     * Copied from the jasmine deep equality matcher. The only difference
     * is that this version allows for an additional message to be provided
     * so that the message can be more descriptive in the case of a test failure
     * @param {any} util 
     * @param {any} customEqualityTesters 
     */
    toBeEqual: function(util, customEqualityTesters) {
        customEqualityTesters = customEqualityTesters || [];

        return {
            /**
             * @param {any} actual 
             * @param {any} expected 
             * @param {string} [additionalMessage] 
             * @returns {{pass:boolean,message?:string}}
             */
            compare: function(actual, expected, additionalMessage) {
                var result = {
                    pass: false,
                    message: ''
                };

                // @ts-ignore
                var diffBuilder = jasmine.DiffBuilder();

                result.pass = util.equals(actual, expected, customEqualityTesters, diffBuilder);

                // TODO: only set error message if test fails
                var message = diffBuilder.getMessage();
                if (additionalMessage) {
                    var formattedAdditionalMessage = "'" + additionalMessage + "'";
                    result.message = message + ', ' + formattedAdditionalMessage;
                } else {
                    result.message = message;
                }

                return result;
            }
        };
    }
};

/**
 * Gets the property or throws an error if the property is not found
 * @param {string} property - The name of the property to get
 * @returns {string} The value of the property
 */
global.KLF_TestUtils.getProperty = function(property) {
    var value = gs.getProperty(property);
    if (!value) {
        throw new Error('Property ' + property + ' not found');
    }
    return value;
};

/**
 * Used to keep track of records that are created. This is useful for cleaning up after tests
 * Has the ability to delete the records after the test is done
 */
global.KLF_TestUtils.RecordTracker = function() {
    /** @type {KLF_Document[]} */
    this.documents = [];
    /** @type {{[tableSysId:string]:boolean}} */
    this.documentIndex = {};
};

global.KLF_TestUtils.RecordTracker.prototype = {

    /**
     * Returns the list of tracked documents
     * @returns {KLF_Document[]}
     */
    getDocuments: function() {
        return this.documents;
    },

    /**
     * Returns true if the given GlideRecord is being tracked
     * @param {GlideRecord} glideRecord
     */
    hasGlideRecord: function(glideRecord) {
        return this.documentIndex[glideRecord.getUniqueValue() + glideRecord.getRecordClassName()] === true;
    },

    /**
     * Returns true if the given document is being tracked
     * @param {KLF_Document} document
     */
    hasDocument: function(document) {
        return this.documentIndex[document.sysId + document.tableName] === true;
    },

    /**
     * @param {string} sysId 
     * @param {string} tableName 
     */
    trackBySysId: function(sysId, tableName) {
        // if it's already being tracked, don't add it again
        if (this.documentIndex[sysId + tableName]) return this;

        this.documentIndex[sysId + tableName] = true;
        this.documents.push({
            sysId: sysId,
            tableName: tableName
        });
        return this;
    },

    /**
     * @param {GlideRecord} glideRecord 
     */
    trackByGlideRecord: function(glideRecord) {
        this.trackBySysId(glideRecord.getUniqueValue(), glideRecord.getTableName());
        return this;
    },

    /**
     * Deletes all records that were tracked
     * @param {boolean} [includeSystemTables] - If true, records from system tables will also be deleted
     */
    deleteAll: function(includeSystemTables) {
        this.documents.forEach(function(doc) {
            if (!includeSystemTables && doc.tableName.startsWith('sys_')) return;
            var gr = new GlideRecord(doc.tableName);
            if (gr.get(doc.sysId)) {
                gr.deleteRecord();
            }
        });
    }
};

global.KLF_TestUtils.prototype = {

    /**
     * Returns true if this script is executing in an ATF context
     * @returns {boolean}
     */
    isAtf: function() {
        return typeof jasmine === 'object' && typeof describe === 'function';
    },

    glideRecordUtils: new global.KLF_GlideRecordUtils(),

    /** @type {Chance.Chance} */
    // @ts-ignore
    chance: global.KLF_TestChance,

    /**
     * Uses the chance library to generate a string 
     * containing only letters
     * @param {number} [length=10] - The length of the string to generate
     * @returns {string}
     */
    getRandomAlphaNumericString: function(length) {
        return this.chance.string({
            length: length || 10,
            pool: 'abcdefghijklmnopqrstuvwxyz'
        });
    },

    /**
     * Uses the chance library to generate a string that looks
     * like a username
     * @returns {string}
     */
    getRandomUsername: function() {
        return this.chance.string({
            length: 7,
            pool: 'abcdefghijklmnopqrstuvwxyz'
        });
    },

    /**
     * Uses the chance library to generate a string that looks
     * like a group name
     * @returns {string}
     */
    getRandomGroupName: function() {
        return 'KLF_TestGroup_' + this.getRandomUsername();
    },

    /**
     * @param {GlideRecord} glideRecord
     * @returns {GlideRecord}
     */
    updateAndTrack: function(glideRecord) {
        glideRecord.update();
        this.recordTracker.trackByGlideRecord(glideRecord);
        return glideRecord;
    },

    /**
     * Cleans up all records that were created during the test
     */
    cleanup: function() {
        this.recordTracker.deleteAll();
    },

    /**
     * Creates a new RecordTracker instance
     * @returns {global.KLF_TestUtils.RecordTracker} The newly created RecordTracker instance
     */
    createRecordTracker: function() {
        return new global.KLF_TestUtils.RecordTracker();
    },

    /**
     * Deletes records from the given tables that the specified
     * user has created. Tables can be specified as a string or an array of strings
     * @param {string} createdBySysId sys_user.sys_id
     * @param {string|string[]} tableNames The names of the tables to delete records from
     */
    deleteRecordsCreatedBy: function(createdBySysId, tableNames) {
        if (typeof tableNames === 'string') {
            tableNames = [tableNames];
        }

        // first i need to transform the createdBySysId sys_user.sys_id
        //into a sys_user.user_name
        var createdBy = new GlideRecord('sys_user');
        if (!createdBy.get(createdBySysId)) {
            throw new Error('Could not find user with sys_id: ' + createdBySysId);
        }
        var createdByUserName = createdBy.getValue('user_name');

        tableNames.forEach(function(tableName) {
            if (tableName.startsWith('sys_')) {
                throw new Error('Cannot delete records from system tables');
            }
            var gr = new GlideRecord(tableName);
            if (!gr.isValid()) {
                throw new Error('Invalid table name: ' + tableName);
            }
            gr.addQuery('sys_created_by', createdByUserName);
            gr.deleteMultiple();
        });
    },

    /**
     * Deletes records from the given tables that the common user
     * has created. Tables can be specified as a string or an array of strings
     * @param {string|string[]} tableNames The names of the tables to delete records from
     */
    deleteRecordsCreatedByCommonUser: function(tableNames) {
        var commonUser = this.getCommonUser();
        if (commonUser === null) {
            throw new Error('Could not find common user');
        }
        this.deleteRecordsCreatedBy(commonUser.getUniqueValue(), tableNames);
    },

    /**
     * Executes the given function as the common user and then reverts back to the original user
     * @param {function} func The function to execute as the given user
     */
    runAsCommonUser: function(func) {
        this.runAsUser(this.createCommonUser().getUniqueValue(), func);
    },

    /**
     * Executes the given function as the given user and then reverts back to the original user
     * @param {string} userSysId The sys_id of the user to impersonate
     * @param {function} func The function to execute as the given user
     */
    runAsUser: function(userSysId, func) {
        var previousUserSysId = this.impersonateUser(userSysId);
        try {
            func();
        } catch ( /** @type {*} */ e) {
            gs.error(e);
        }
        this.impersonateUser(previousUserSysId);
    },

    /**
     * Always returns null to indicate that there is no common user by default.
     * It was found that user deletion during ATF tests has a significant performance impact.
     * @returns {?GlideRecord} The sys_user record of the common user or null if it does not exist
     */
    getCommonUser: function() {
        return null;
    },

    /**
     * Creates a user with the admin role
     * @returns {GlideRecord} The newly created sys_user record
     */
    createAdminUser: function() {
        var user = this.createUser(this.adminUsername);
        this.addRoleToUser(user, 'admin');
        this.recordTracker.trackByGlideRecord(user);
        return user;
    },

    /**
     * Returns the admin user sys_user record or creates it if it does not exist
     * @returns {GlideRecord} The sys_user record of the admin user
     */
    getOrCreateAdminUser: function() {
        var user = new GlideRecord('sys_user');
        if (user.get('user_name', this.adminUsername)) {
            return user;
        } else {
            return this.createAdminUser();
        }
    },

    /**
     * Sets the password for the given user
     * @param {GlideRecord} user 
     * @returns {string} The password that was set
     */
    setPasswordForUser: function(user) {
        // @ts-ignore
        var password = SNC.PasswordPolicyEvaluator.generateUserPassword(user.getValue('user_name'));
        user.setDisplayValue('user_password', password);
        user.update();
        return password;
    },

    /**
     * Creates a user with no roles or groups to simulate a common user
     * @returns {GlideRecord} The newly created sys_user record
     */
    createCommonUser: function() {
        var user = this.createUser(this.getRandomUsername());
        this.recordTracker.trackByGlideRecord(user);
        return user;
    },

    /**
     * Creates a group with no roles and whose only member is the common user.
     * If the common user does not exist, it will be created.
     * @returns {{group:GlideRecord,user:GlideRecord,groupMember:GlideRecord}} The newly created sys_user_group and associated sys_user and sys_user_grmember records
     */
    createCommonGroup: function() {
        var group = this.createGroup(this.getRandomGroupName());
        var user = this.createUser(this.getRandomUsername());
        var groupMember = this.addUserToGroup(group, user);
        return {
            group: group,
            user: user,
            groupMember: groupMember
        };
    },

    /**
     * Retrieves a user that has admin access
     * @returns {GlideRecord} Some user that has admin access
     */
    getAdminUser: function() {
        var user = new GlideRecord('sys_user');
        if (user.get('user_name', 'admin')) {
            return user;
        } else {
            throw new Error('Could not find admin user');
        }
    },

    /**
     * Impersonates the admin user and returns the GlideRecord of the admin user
     * Returns the sys_id of the current user before impersonation
     * @returns {[GlideRecord, string]} The sys_user record for admin user and the
     * sys_id of the current user before impersonation
     */
    impersonateAdminUser: function() {
        var adminUser = this.getAdminUser();
        var currentUser = this.impersonateUser(adminUser.getUniqueValue());
        return [adminUser, currentUser];
    },

    /**
     * Returns the common user sys_user record or creates it if it does not exist
     * @returns {GlideRecord} The sys_user record of the common user
     */
    getOrCreateCommonUser: function() {
        var user = this.getCommonUser();
        if (user) {
            return user;
        } else {
            return this.createCommonUser();
        }
    },

    /**
     * Impersonates the admin user
     * Returns the GlideRecord of the common user that was impersonated
     * Returns the sys_id of the current user before impersonation
     * @returns {[GlideRecord, string]} The sys_user record for common user and the
     * sys_id of the current user before impersonation
     */
    impersonateCommonUser: function() {
        var commonUser = this.getOrCreateCommonUser();
        var currentUser = this.impersonateUser(commonUser.getUniqueValue());
        return [commonUser, currentUser];
    },

    /**
     * Impersonates the user with the given sys_id
     * @param {string} userSysId The sys_id of the user to impersonate
     * @returns {string} The sys_id of the current user before impersonation
     */
    impersonateUser: function(userSysId) {
        var impersonator = new GlideImpersonate();
        return impersonator.impersonate(userSysId);
    },

    /**
     * Returns the role if it already exists or creates it if it does not exist
     * @param {string} roleName - The name of the role to get or create
     */
    getOrCreateRole: function(roleName) {
        var role = new GlideRecord('sys_user_role');
        return role.get('name', roleName) ? role : this.createRole(roleName);
    },

    /**
     * Creates a new sys_user_role 
     * @param {string} roleName
     */
    createRole: function(roleName) {
        // Check if the role already exists
        var role = new GlideRecord('sys_user_role');
        if (role.get('name', roleName)) {
            throw new Error('Role already exists');
        }

        role = new GlideRecord('sys_user_role');
        role.newRecord();
        role.name = roleName;
        role.update();
        this.recordTracker.trackByGlideRecord(role);
        return role;
    },

    /**
     * Returns the group or creates it if it does not exist
     * @param {string} groupName 
     */
    getOrCreateGroup: function(groupName) {
        var group = new GlideRecord('sys_user_group');
        return group.get('name', groupName) ? group : this.createGroup(groupName);
    },

    /**
     * Creates a new sys_user_group record
     * @param {string} groupName - The name of the group to create
     * @returns {GlideRecord} - The newly created sys_user_group record
     */
    createGroup: function(groupName) {
        // Check if the group already exists
        var group = new GlideRecord('sys_user_group');
        if (group.get('name', groupName)) {
            throw new Error('Group already exists');
        }

        group = this.glideRecordUtils.insertRecord('sys_user_group', {
            name: groupName
        });
        this.recordTracker.trackByGlideRecord(group);
        return group;
    },

    /**
     * Returns the user or creates it if it does not exist
     * @param {string} username 
     */
    getOrCreateUser: function(username) {
        var user = new GlideRecord('sys_user');
        return user.get('user_name', username) ? user : this.createUser(username);
    },

    /**
     * Creates a new sys_user record
     * @param {string} username - The name of the user to create
     * @returns {GlideRecord} - The newly created sys_user record
     */
    createUser: function(username) {
        // Check if the user already exists
        var user = new GlideRecord('sys_user');
        if (user.get('user_name', username)) {
            throw new Error('User already exists');
        }

        user = this.glideRecordUtils.insertRecord('sys_user', {
            user_name: username,
            first_name: username + 'first',
            last_name: username + 'last',
            email: username + '@example.com'
        });
        this.recordTracker.trackByGlideRecord(user);
        return user;
    },

    /**
     * Adds a user to a group
     * @param {GlideRecord} group - The group to add the user to
     * @param {GlideRecord} user - The user to add to the group
     * @returns {GlideRecord} The newly created sys_user_grmember record
     */
    addUserToGroup: function(group, user) {
        // Check if the user is already a member of the group
        var groupMember = new GlideRecord('sys_user_grmember');
        groupMember.addQuery('user', user.getUniqueValue());
        groupMember.addQuery('group', group.getUniqueValue());
        groupMember.query();
        if (groupMember.next()) {
            return groupMember;
        }

        groupMember = this.glideRecordUtils.insertRecord('sys_user_grmember', {
            user: user.getUniqueValue(),
            group: group.getUniqueValue()
        });
        this.recordTracker.trackByGlideRecord(groupMember);
        return groupMember;
    },

    /**
     * Adds a role to a group
     * @param {GlideRecord} group - The group to add the role to
     * @param {string} roleName - The role to add to the group
     * @returns {GlideRecord} The newly created sys_group_has_role record
     */
    addRoleToGroup: function(group, roleName) {
        var role = new GlideRecord('sys_user_role');
        if (!role.get('name', roleName)) {
            throw new Error('Could not find role with name: ' + roleName);
        }

        // Check if the group already has the role
        var groupHasRole = new GlideRecord('sys_group_has_role');
        groupHasRole.addQuery('role', role.getUniqueValue());
        groupHasRole.addQuery('group', group.getUniqueValue());
        groupHasRole.query();
        if (groupHasRole.next()) {
            return groupHasRole;
        }

        groupHasRole = this.glideRecordUtils.insertRecord('sys_group_has_role', {
            role: role.getUniqueValue(),
            group: group.getUniqueValue()
        });
        this.recordTracker.trackByGlideRecord(groupHasRole);
        return groupHasRole;
    },

    /**
     * Adds a role to a user
     * @param {GlideRecord} user - The user to add the role to
     * @param {string} roleName - The role to add to the user
     * @returns {GlideRecord} The newly created sys_user_has_role record
     */
    addRoleToUser: function(user, roleName) {
        var role = new GlideRecord('sys_user_role');
        if (!role.get('name', roleName)) {
            throw new Error('Could not find role with name: ' + roleName);
        }

        // Check if the user already has the role
        var userHasRole = new GlideRecord('sys_user_has_role');
        userHasRole.addQuery('role', role.getUniqueValue());
        userHasRole.addQuery('user', user.getUniqueValue());
        userHasRole.query();
        if (userHasRole.next()) {
            return userHasRole;
        }

        userHasRole = this.glideRecordUtils.insertRecord('sys_user_has_role', {
            role: role.getUniqueValue(),
            user: user.getUniqueValue()
        });
        this.recordTracker.trackByGlideRecord(userHasRole);
        return userHasRole;
    },

    /**
     * Creates a sys_scope record
     * @param {string} scopeName - The name of the scope to create
     * @returns {GlideRecord} - The newly created sys_scope record
     */
    createScope: function(scopeName) {
        if (!scopeName) {
            throw new Error('Scope name cannot be falsy');
        }

        var scope = new GlideRecord('sys_scope');
        if (scope.get('scope', scopeName)) {
            throw new Error('Scope already exists');
        }
        scope.newRecord();
        scope.scope = scopeName;
        scope.name = scopeName;
        scope.short_description = 'Scope used in ATF. You can delete this';
        scope.version = '1.0';
        scope.update();
        this.recordTracker.trackByGlideRecord(scope);
        return scope;
    },

    /**
     * Returns the sys_id of the given scopeName
     * @param {string} scopeName
     * @returns {string} The sys_id of the scope with the given name
     */
    getScopeSysId: function(scopeName) {
        var scope = new GlideRecord('sys_scope');
        if (!scope.get('scope', scopeName)) {
            throw new Error('Scope ' + scopeName + ' does not exist');
        }
        return scope.getUniqueValue();
    }
};