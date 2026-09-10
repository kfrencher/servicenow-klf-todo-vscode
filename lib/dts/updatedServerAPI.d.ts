declare var $: any;
declare var sn_dt_api: any;
declare var current: GlideRecord;
declare var previous: GlideRecord;
declare var input: any;
declare var data: any;
declare var options: any;
declare var $sp: any;
declare var template: any;
declare var email: any;
declare var email_action: any;
declare var action: SN_UI_Action;
declare var answer: boolean;
declare var AnswerUtils: any;
declare var GwtMessage: any;
declare var FilteredGlideRecord: GlideRecord;
declare var GlideRelationship: any;
declare var GlideStringUtil: any;
declare var sn_assessment_core: any;

declare class GlideChoice {
    constructor(value: string, label: string);
    constructor(value: string, label: string, sysId: string);
    getLabel(): string;
    getValue(): string;
    getId(): string;
    setId(id: string): void;
    getImage(): string;
    getSelected(): boolean;
    setLabel(label: string): void;
    setValue(value: string): void;
    setImage(image: string): void;
    setSelected(selected: boolean): void;
    setParameter(name: string, value: any): void;
    getParameter(name: string): any;
}

declare class GlideChoiceList {
    sort(): void;
    addNone(): GlideChoice;
    removeNone(): void;
    add(choice: GlideChoice): GlideChoice;
    add(value: string, label: string): GlideChoice;
    addFirst(value: string, label: string): void;
    addAll(choice: GlideChoiceList): void;
    getChoice(value: string): GlideChoice;
    getChoiceNoTrim(value: string): GlideChoice;
    removeChoice(value: string): GlideChoice;
    removeChoice(index: number): GlideChoice;
    getLabelOf(value: string): string;
    getValueOf(label: string): string;
    getSize(): number;
    toXML(xmlDocument: XMLDocument): number;
    /** Returns a Java JSONArray */
    toJSON(): any;
    /** Takes a GlideController */
    getNullOverride(glideController: any): string;
    static getChoiceList(tableName: string, fieldName: string): GlideChoiceList;
}

declare class GlideImportSetRun {
    constructor(importSetID: string);
    /** The sys_id of the transform histories [sys_import_set_run] record associatedwith the transform */
    getImportSetRunSysID(): string;
}

declare class GlideImportSetTransformer {
    constructor();
    setMapID(mapID: string): void;
    transformAllMaps(importSetGr: GlideRecord): void;
    getImportSetRun(): GlideImportSetRun;
    isError: boolean;
    setImportSetID(id: string): void;
    setImportSetRun(importSetRun: GlideImportSetRun): void;
}

interface String {
    endsWith(x: string): boolean;
    startsWith(x: string): boolean;
}

interface SPAction {
    [key: string]: any;
    primary?: boolean;
    sys_id: string;
    action_name: string;
    form_style: string;
    hint: string;
    is_button: boolean;
    is_context: boolean;
    is_link: boolean;
    is_custom: boolean;
    display_order: number;
    name: string;
    fn: string;
    onclick: string;
    is_client: boolean;
}

interface AngularScope extends angular.IScope {
    [key: string]: any;
}

interface SN_UI_Action {
    /**
     * Gets a GlideURI object to determine the user view.
     */
    getGlideURI(): GlideURI;

    /**
     * Gets the URL of the return page in view after a UI action is complete.
     */
    getReturnURL(): string;

    /**
     * Gets the value of a URL parameter.
     */
    getURLParameter(parameterName: string): string;

    /**
     * Opens a page with a GlideRecord in the user view.
     */
    openGlideRecord(glideRecord: GlideRecord): void;

    /**
     * Indicates whether to enable or disable pop-up windows on the page in the current view.
     * @param
     */
    setNoPop(noPop: boolean): void;
    /**
     * Sets the redirect URI for this transaction, which determines the next page the user sees.
     * @param url URL to set as the redirect. You can provide the URL as a string or a
     * GlideRecord. If you pass the URL as a GlideRecord, this value takes the focus to
     * that record's form.
     */
    setRedirectURL(url: string | GlideRecord): void;

    /**
     * Sets the return URI for this transaction after a UI action is complete. You can
     * use this method to determine what page the user has in view when they return
     * from submit.
     * @param url URI to set as the return location after a UI action is complete. You
     * can provide the URL as a string or a GlideRecord.
     */
    setReturnURL(url: string | GlideRecord): void;

    /**
     * Sets a URL parameter name and value.
     */
    setURLParameter(parameterName: string, parameterValue: string): void;
}

interface GlideURI {
    /**
     * Returns the value of the specified parameter
     */
    get(name: string): string;
    /**
     * Returns the file name portion of the URI.
     */
    getFileFromPath(): string;
    /**
     * Sets the specified parameter to the specified value.
     */
    set(name: string, value: string): void;
    /**
     * Reconstructs the URI string and performs the proper URL encoding by
     * converting non-valid characters to their URL code.
     * For example, converting & to '%26'.  Parameters set with the set()
     * method are encoded with the URI as well.
     */
    toString(): string;
}

declare class GlideDBObjectManager {
    /**
     * Returns a java.util.Collection
     * Must be converted to a JavaScript array before use.
     * @example
     * GlideDBObjectManager.getTables('incident').toArray().join()
     */
    static getTables(tableName: string): any;
}

declare class GlideTableDescriptor {
    static get(tableName: string): GlideTableDescriptor;
    static isValid(tableName: string): boolean;

    getED(): GlideElementDescriptor;
}

declare class GlideImpersonate {
    /**
     * Verifies whether the specified user can perform debugging on scripts.
     * In order for a user to be able to debug scripts, they must be on a developer instance. Debugging is not allowed on production instances.
     */
    canDebug(userSysId: string): boolean;

    /**
     * Verifies whether the current user can impersonate the specified user.
     * If the current user is not assigned the admin role, the user to impersonate is inactive,
     * or there are other issues with impersonating the specified user, the method returns "false" and the user cannot be impersonated.
     */
    canImpersonate(userSysId: string): boolean;

    /**
     * Sets the user ID for the current administrator to the passed-in user ID, enabling the administrator to act as that user.
     * @param userSysId
     * @returns Sys_id of the user that was logged in prior to the impersonation request.
     */
    impersonate(userSysId: string): string;

    /**
     * Determines whether the current user is impersonating another user.
     * @returns {boolean} True if the current user is impersonating another user, false otherwise.
     */
    isImpersonating(): boolean;
}

/** The scoped GlideDate class provides methods for performing operations on GlideDate objects, such as instantiating GlideDate objects or working with GlideDate fields */
declare class GlideDate {
    constructor();
    /** Gets the duration difference between two GlideDate values */
    subtract(start: GlideDate, end: GlideDate): GlideDuration;
    /** Gets the date in the given date format */
    getByFormat(format: string): string;
    /** Gets the date in the current user's display format and time zone */
    getDisplayValue(): string;
    /** Gets the display value in the internal format (yyyy-MM-dd). Note: This method is useful for date or time fields, but not date fields */
    getDisplayValueInternal(): string;
    /** Gets the date value stored in the database by the GlideDate object in the internal format, yyyy-MM-dd, and the system time zone, UTC by default */
    getValue(): string;
    /** Sets a date value using the current user's display format and time zone */
    setDisplayValue(asDisplayed: string): void;
    /** Sets the date of the GlideDate object */
    setValue(o: any): void;
    /** Returns the day part of a date with no timezone conversion */
    getDayOfMonthNoTZ(): number;
    /** Returns the month part of a date with no timezone conversion */
    getMonthNoTZ(): number;
    /** Returns the year part of a date with no timezone conversion */
    getYearNoTZ(): number;
    getYearLocalTime(): number;
}
/** The scoped GlideDateTime default constructor, instantiates a new GlideDateTime object with the current date and time in Greenwich Mean Time (GMT). Optional 'value' parameter with a date and time value in the UTC time zone specified with the format yyyy-MM-dd HH:mm:ss */
declare class GlideDateTime {
    constructor(dateString?: string);
    static subtract(start: GlideDateTime, end: GlideDateTime): GlideDuration;
    /** Gets the date in the system time zone */
    getDate(): GlideDate;
    /** Gets the duration difference between two GlideDateTime values. Pass a single paramter which specifies milliseconds to subtract from the current GlideDateTime object */
    subtract(start: GlideDateTime | number, end?: GlideDateTime): GlideDuration;
    /** Gets the date for the user's time zone */
    getLocalDate(): GlideDate;
    /** Returns a GlideTime object that represents the time portion of the GlideDateTime object in the user's time zone */
    getLocalTime(): GlideTime;
    /** Returns a GlideTime object that represents the time portion of the GlideDateTime object */
    getTime(): GlideTime;
    /** Adds a specified number of days to the current GlideDateTime object, expressed in the user's timezone */
    addDaysLocalTime(amount: number): void;
    /** Adds a specified number of days to the current GlideDateTime object, expressed in the UTC time zone */
    addDaysUTC(amount: number): void;
    /** Adds a specified number of months to the current GlideDateTime object, expressed in the user's time zone */
    addMonthsLocalTime(amount: number): void;
    /** Adds a specified number of months to the current GlideDateTime object, expressed in the UTC time zone */
    addMonthsUTC(amount: number): void;
    /** Adds a specified number of seconds to the current GlideDateTime object */
    addSeconds(value: number): void;
    /** Adds a specified number of weeks to the current GlideDateTime object, expressed in the user's timezone */
    addWeeksLocalTime(amount: number): void;
    /** Adds a specified number of weeks to the current GlideDateTime object, expressed in the UTC time zone */
    addWeeksUTC(amount: number): void;
    /** Adds a specified number of years to the current GlideDateTime object, expressed in the user's time zone */
    addYearsLocalTime(amount: number): void;
    /** Adds a specified number of years to the current GlideDateTime object, expressed in the UTC time zone */
    addYearsUTC(amount: number): void;
    /** Compares two GlideDateTime objects */
    compareTo(Object: GlideDateTime): number;
    equals(Object: GlideDateTime): boolean;
    /** Gets the day of the month stored by the GlideDateTime object, expressed in the current user's time zone */
    getDayOfMonthLocalTime(): number;
    /** Gets the day of the month stored by the GlideDateTime object, expressed in the UTC time zone */
    getDayOfMonthUTC(): number;
    /** Gets the day of the week stored by the GlideDateTime object, expressed in the user's time zone */
    getDayOfWeekLocalTime(): number;
    /** Gets the day of the week stored by the GlideDateTime object, expressed in the UTC time zone */
    getDayOfWeekUTC(): number;
    /** Sets the day of the month to a specified value in the user's time zone */
    getDaysInMonthLocalTime(): number;
    /** Gets the number of days in the month stored by the GlideDateTime object, expressed in the UTC time zone */
    getDaysInMonthUTC(): number;
    /** Gets the datetime in the current user's display format and time zone */
    getDisplayValue(): string;
    /** Gets the display value in the internal datetime format */
    getDisplayValueInternal(): string;
    getDisplayValueWithoutTZ(): string;
    /** Gets the amount of time that daylight savings time is offset */
    getDSTOffset(): number;
    /** Gets the current error message */
    getErrorMsg(): string;
    /** Gets the month stored by the GlideDateTime object, expressed in the current user's time zone */
    getMonthLocalTime(): number;
    /** Gets the month stored by the GlideDateTime object, expressed in the UTC time zone */
    getMonthUTC(): number;
    /** Gets the number of milliseconds since January 1, 1970, 00:00:00 Greenwich Mean Time (GMT) */
    getNumericValue(): number;
    getTZOffset(): number;
    /** Gets a datetiime value in the same format as it is stored in the database */
    getValue(): string;
    /** Gets the number of the week stored by the GlideDateTime object, expressed in the user's time zone */
    getWeekOfYearLocalTime(): number;
    /** Gets the number of the current week of the current year */
    getWeekOfYearUTC(): number;
    /** Gets the year stored by the GlideDateTime object, expressed in the current user's time zone */
    getYearLocalTime(): number;
    /** Gets the year stored by the GlideDateTime object, expressed in the UTC time zone */
    getYearUTC(): number;
    /** Determines if an object's date is set */
    hasDate(): boolean;
    hashCode(): number;
    /** Determines if an object's time uses a daylight savings offset */
    isDST(): boolean;
    /** Determines if a value is a valid datetime */
    isValid(): boolean;
    /** Sets the day of the month to a specified value in the local time zone */
    setDayOfMonthLocalTime(day: number): void;
    /** Sets the day of the month to a specified value in the UTC time zone */
    setDayOfMonthUTC(day: number): void;
    /** Sets a date and time value using the current user's display format and time zone. Also set an optional parameter 'format', to set date and time format */
    setDisplayValue(value: string, format?: string): void;
    /** Sets a date and time value using the internal format and the current user's time zone */
    setDisplayValueInternal(value: string): void;
    /** Sets the month stored by the GlideDateTime object to a specified value using the current user's time zone */
    setMonthLocalTime(month: number): void;
    /** Sets the month stored by the GlideDateTime object to a specified value using the UTC time zone */
    setMonthUTC(month: number): void;
    /** Sets the date and time */
    setValue(value: number): void;
    /** Sets a date and time value using the UTC time zone and the specified date and time format */
    setValueUTC(dt: string, format: string): void;
    /** Sets the year stored by the GlideDateTime object to a specified value using the current user's time zone */
    setYearLocalTime(year: number): void;
    /** Sets the year stored by the GlideDateTime object to a specified value using the UTC time zone */
    setYearUTC(year: number): void;
    /** Sets the date and time of the current object using an existing GlideDateTime object. This method is equivalent to instantiating a new object with a GlideDateTime parameter */
    setGlideDateTime(gdt: GlideDateTime): void;
    /** Adds a GlideTime object to the current GlideDateTime object */
    add(gt: GlideTime): void;
    /** Converts a datetime value to a string */
    toString(): string;
    /** Returns local time with user time format */
    getUserFormattedLocalTime(): string;
    /** Returns local time with internal time format */
    getInternalFormattedLocalTime(): string;
    /** Returns true if the object's data time is after the input argument */
    after(Object: GlideDateTime): boolean;
    /** Returns true if the object's data time is before the input argument */
    before(Object: GlideDateTime): boolean;
    /** Returns true if the object's data time is on or after the input argument */
    onOrAfter(Object: GlideDateTime): boolean;
    /** Returns true if the object's data time is on or before the input argument */
    onOrBefore(Object: GlideDateTime): boolean;
}
/** The scoped GlideDuration class provides methods for working with spans of time or durations. GlideDuration objects store the duration as a date and time from January 1, 1970, 00:00:00. As a result, setValue() and getValue() use the GlideDateTime object for parameters and return values */
declare class GlideDuration {
    constructor(milliseconds?: number);
    /** Adds a given duration to the current duration */
    add(value: GlideDuration): GlideDuration;
    subtract(value: GlideDuration): GlideDuration;
    /** Gets the current duration in the given format */
    getByFormat(format: string): string;
    /** Gets the number of days */
    getDayPart(): number;
    /** Gets the display value of the duration in number of days, hours, and minutes */
    getDisplayValue(): string;
    /** Gets the duration value in d HH:mm:ss format */
    getDurationValue(): string;
    /** Gets the rounded number of days. If the time part is more than 12 hours, the return value is rounded up. Otherwise, it is rounded down */
    getRoundedDayPart(): number;
    /** Gets internal value of the this duration object. GlidDuration is stored as DateTime */
    getValue(): string;
    /** Sets the display value */
    setDisplayValue(asDisplayed: string): void;
    /** Sets the internal value of the GlideDuration object. Internally, GlidDuration is stored as DateTime */
    setValue(o: any): void;
}
/** The scoped GlideTime class provides methods for performing operations on GlideTime objects, such as instantiating GlideTime objects or working with GlideTime fields */
declare class GlideTime {
    constructor();
    /** Gets the duration difference between two GlideTime values */
    subtract(start: GlideTime, end: GlideTime): GlideDuration;
    /** Gets the time in the given time format */
    getByFormat(format: string): string;
    /** Gets the time in the current user's display format and time zone */
    getDisplayValue(): string;
    /** Gets the display value in the current user's time zone and the internal format (HH:mm:ss). Useful for date/time fields, but not for date fields */
    getDisplayValueInternal(): string;
    /** Gets the time value stored in the database by the GlideTime object in the internal format, HH:mm:ss, and the system time zone, UTC by default */
    getValue(): string;
    /** Sets a time value using the current user's display format and time zone */
    setDisplayValue(asDisplayed: string): void;
    /** Sets the time of the GlideTime object in the internal time zone, which is UTC by default or the value of the glide.sys.internal.tz property, if set */
    setValue(value: any): void;
    /** Returns the hour-of-the-day part of UTC time 0-23 */
    getHourOfDayUTC(): number;
    /** Returns hour part of UTC time 0-11 */
    getHourUTC(): number;
    /** Returns minutes part of UTC time */
    getMinutesUTC(): number;
    /** Returns hour-of-the-day part of local time 0-23 */
    getHourOfDayLocalTime(): number;
    /** Returns hour part of local time 0-11 */
    getHourLocalTime(): number;
    /** Returns minutes part of local time */
    getMinutesLocalTime(): number;
    /** Returns seconds part of time */
    getSeconds(): number;
}
/** The scoped GlideSchedule API provides methods for performing operations on GlideSchedule objects, such as adding new schedule segments to a schedule, determining if a datetime is within the schedule, or setting the schedule timezone */
declare class GlideSchedule {
    constructor(scheduledSysId: string);
    isInSchedule(time: GlideDateTime): boolean;
    /** Adds a new schedule segment to the current schedule */
    add(startDate: GlideDateTime, offset: GlideDuration): GlideDateTime;
    /** Determines the elapsed time in the schedule between two date time values using the timezone of the schedule or, if that is not specified, the timezone of the session */
    duration(startDate: GlideDateTime, endDate: GlideDateTime): GlideDuration;
    /** Determines if the current schedule is valid. A schedule is valid if it has at least one schedule span */
    isValid(): boolean;
    /** Gets the current schedule name */
    getName(): string;
    /** Loads a schedule with the schedule information. If a timezone is not specified or is nil, the current session timezone is used for the schedule */
    load(sysID: string, timeZone: string, excludeSpanID: string): void;
    /** Sets the timezone for the current schedule */
    setTimeZone(tz: string): void;
}
/** The Scoped GlideUser API provides access to information about the current user and current user roles. Using the Scoped GlideUser API avoids the need to use the slower GlideRecord queries to get user information */
declare class GlideUser {
    constructor();
    /** Gets the sys_id of current user */
    getID(): string;
    /** Gets the user id, or login name, of the current user */
    getName(): string;
    /** Gets the display name of the current user */
    getDisplayName(): string;
    /** Gets the Company ID of the current user */
    getCompanyID(): string;
    /** Determines if the current user is a member of the specified group */
    isMemberOf(group: string): boolean;
    /** Determines if the current user has the specified role */
    hasRole(role: string): boolean;
    /** Saves a user preference value to the database */
    savePreference(name: string, value: string): void;
    /** Gets the specified user preference value for the current user */
    getPreference(name: string): string;
    getMyGroups(): string[];
}
/** GlideSession manages all of the information for a user session. You can retrieve this from gs.getSession() */
declare class GlideSession {
    constructor();
    impersonate(userSysId: string): void;
    /** Returns true if the user is impersonating another user. */
    isImpersonating(): boolean;
    /** Checks if the current session is interactive */
    isInteractive(): boolean;
    /** Determines if the current user is currently logged in */
    isLoggedIn(): boolean;
    /** Get the Time Zone name associated with the user */
    getTimeZoneName(): string;
    /** Language used by the user */
    getLanguage(): string;
    /** Gets the current URI for the session */
    getUrlOnStack(): string;
    /** Gets the ID of current application, defined as a user preference and set by the application picker */
    getCurrentApplicationId(): string;
    /** Gets the client IP address */
    getClientIP(): string;
    /** Fetch the value in active session based on the name */
    getClientData(name: string): string;
    /** Store a value in an active session */
    putClientData(name: string, value: string): void;
    /** Clears a session client value previously set with putClientData(). */
    clearClientData(name: string): void;
}
/** The scoped GlideAggregate class is an extension of GlideRecord and allows database aggregation (COUNT, SUM, MIN, MAX, AVG) queries to be done. This can be helpful in creating customized reports or in calculations for calculated fields. The GlideAggregate class works only on number fields. Since currency fields are strings, you can't use the GlideAggregate class on currency fields */
declare class GlideAggregate {
    [index: string]: any;
    constructor(tableName: string);
    /** Adds a query to the aggregate */
    addQuery(field: string, operator: string, value: any): GlideQueryCondition;
    addQuery(field: string, value: any): GlideQueryCondition;
    /** Adds a NULL query to the aggregate */
    addNullQuery(field: string): GlideQueryCondition;
    /** Adds a NOT NULL query to the aggregate */
    addNotNullQuery(field: string): GlideQueryCondition;
    /** Issues the query and gets the results */
    query(): void;
    /** Adds an aggregate */
    addAggregate(aggregate: string, field?: string): void;
    /** Gets the value of the specified aggregate */
    getAggregate(aggregate: string, field?: string): string;
    /** Retrieves the number of rows in the GlideRecord */
    getRowCount(): number;
    /** Retrieves the table name associated with this GlideRecord */
    getTableName(): string;
    /** Gets the value of a field */
    getValue(field: string): string;
    /** Retrieves the encoded query */
    getEncodedQuery(): string;
    /** Adds a query to the aggregate. Adds an encoded query to the other queries that may have been set for this aggregate */
    addEncodedQuery(query: string): void;
    /** Gets the query necessary to return the current aggregate */
    getAggregateEncodedQuery(): string;
    /** Provides the name of a field to use in grouping the aggregates. May be called numerous times to set multiple group fields */
    groupBy(field: string): void;
    /** Orders the aggregates using the value of the specified field. The field will also be added to the group-by list */
    orderBy(field: string): void;
    /** Sorts the aggregates into descending order based on the specified field */
    orderByDesc(field: string): void;
    /** Sorts the aggregates based on the specified aggregate and field */
    orderByAggregate(aggregate: string, field: string): void;
    /** Moves to the next record in the GlideAggregate */
    next(): boolean;
    /** Determines if there are any more results in the GlideAggregate */
    hasNext(): boolean;
    /** Sets whether the results are to be grouped */
    setGroup(value: boolean): void;
}
/** The Scoped GlideElement API provides methods for dealing with fields and their values. Scoped GlideElement methods are available for the fields of the current GlideRecord */
declare class GlideElement {
    constructor();
    /** Retrieves the choice list for a field */
    getChoices(dependent: string): [];
    /** Sets the display value of the field */
    setDisplayValue(value: any): void;
    /** Sets the display value of the field */
    setValue(value: any): void;
    /** Gets a GlideRecord object for a reference element */
    getRefRecord(): GlideRecord;
    /** Converts the value to a string */
    toString(): string;
    /** Gets the field's element descriptor */
    getED(): GlideElementDescriptor;
    /** Gets the decrypted value */
    getDecryptedValue(): string;
    /** Gets the formatted display value of the field */
    getDisplayValue(maxCharacters?: number): string;
    /** Determines whether the field is null */
    nil(): boolean;
    /** Determines if the current field has been modified */
    changes(): boolean;
    /** Gets the object's label */
    getLabel(): string;
    /** Gets the name of the field */
    getName(): string;
    /** Gets the table name */
    getTableName(): string;
    /** Determines if the user's role permits creation of new records in this field */
    canCreate(): boolean;
    /** Determines if the GlideRecord table can be read from */
    canRead(): boolean;
    /** Determines if the GlideRecord table can be written to */
    canWrite(): boolean;
    /** Gets the value of the attribute on the field in question from the dictionary as a string. If the attribute is a boolean attribute, use getBooleanAttribute(String) to get the value as a boolean rather than as a string */
    getAttribute(attribute: string): string;
    /** Gets the value of the attribute on the field in question from the dictionary as a string. To get the value as a string, use getAttribute(string) */
    getBooleanAttribute(attribute: string): boolean;
    /** Determines whether a field has a particular attribute */
    hasAttribute(attribute: string): boolean;
    /** Adds an error message. Can be retrieved using getError() */
    setError(message: string): void;
    /** Gets table name for a reference field */
    getReferenceTable(): string;
    /** Determines if the new value of a field after a change matches a certain object */
    changesTo(value: any): boolean;
    /** Determines the previous value of the current field matched a certain object */
    changesFrom(value: any): boolean;
    /** Gets the currency ISO code for a record */
    getCurrencyCode(): string;
    /** Gets the currency display value */
    getCurrencyDisplayValue(): string;
    /** Gets currency in a string */
    getCurrencyString(): string;
    /** Gets a currency value */
    getCurrencyValue(): string;
    /** The currency ISO code, in the base system currency */
    getReferenceCurrencyCode(): string;
    /** Gets the display value */
    getReferenceDisplayValue(): string;
    /** Gets the reference value */
    getReferenceValue(): string;
    /** Gets the sessions currency ISO code */
    getSessionCurrencyCode(): string;
    /** Gets the currency value in the sessions currency format */
    getSessionDisplayValue(): string;
    /** Gets the ammount in the sessions currency */
    getSessionValue(): string;
    /** Sets a date to a numeric value */
    setDateNumericValue(value: any): void;
    /** Gets date in numberic value */
    dateNumericValue(): number;
}
/** The scoped GlideElementDescriptor class provides information about individual fields */
declare class GlideElementDescriptor {
    constructor();
    /** Returns the field's name */
    getName(): string;
    /** Returns the field's data type */
    getInternalType(): string;
    /** Returns the field's label */
    getLabel(): string;
    /** Returns the field's length */
    getLength(): number;
    /** Returns the field attribute as a boolean */
    getBooleanAttribute(attributeName: string): boolean;
}
/** Scoped GlideRecord is used for database operations instead of writing SQL queries. Provides data access APIs to retrieve, update, and delete records from a table */
declare class GlideRecord {
    constructor(tableName: string);
    /**
     * Apply a template record from the Template table [sys_template] to the current record.
     *  If the specified template is not found, no action is taken.
     * Note: This method automatically instantiates a now_GR.insert() method if a template
     * has the Next Related Child Template field filled. For information, see Create
     * templates for related task records.
     * @param template Name of a template from the Templates [sys_template] table.
     */
    applyTemplate(template: string): void;
    [fieldName: string]: any;
    /** Insert a new record using the field values that have been set for the current record */
    insert(): string;
    /** Runs the query against the table based on the specified filters by addQuery and addEncodedQuery */
    query(): void;
    /** Defines a GlideRecord based on the specified expression of name = value */
    get(name: any, value?: any): boolean;
    /** Updates the current GlideRecord with any changes that have been made */
    update(reason?: any): string;
    /** Updates each GlideRecord in the list with any changes that have been made */
    updateMultiple(): void;
    /** Deletes the current record */
    deleteRecord(): boolean;
    /** Deletes records that satisfy current query condition */
    deleteMultiple(): void;
    /** Sets the value for the specified field. */
    setValue(fieldName: string, value: any): void;
    /** Sets a flag to indicate if the next database action (insert, update, delete) is to be aborted */
    setAbortAction(b: boolean): void;
    /** Enables and disables the running of business rules and script engines. When disabled, inserts and updates are not audited */
    setWorkflow(e: boolean): void;
    /** Adds a filter to return records by specifying a field and value. You can use an optional 'operator' as a second parameter */
    addQuery(name: string, value: any): GlideQueryCondition;
    addQuery(name: string, operator: string, value: any): GlideQueryCondition;
    /** Adds a filter to return active records */
    addActiveQuery(): GlideQueryCondition;
    /** Adds a filter to return records where the specified field is null */
    addNullQuery(fieldName: string): GlideQueryCondition;
    /** Adds a filter to return records where the specified field is not null */
    addNotNullQuery(fieldName: string): GlideQueryCondition;
    /** Adds a filter to return records based on a relationship in a related table */
    addJoinQuery(
        joinTable: string,
        primaryField: any,
        joinTableField: any
    ): GlideQueryCondition;
    /** Retrieves the GlideElement for a specified field */
    getElement(fieldName: string): GlideElement;
    getElements(): GlideElement[];
    /** Retrieves the number of rows in the GlideRecord */
    getRowCount(): number;
    /** Retrieves the table name associated with this GlideRecord */
    getTableName(): string;
    /** Retrieves the class name for the current record */
    getRecordClassName(): string;
    /** Retrieves the query condition of the current result set as an encoded query string */
    getEncodedQuery(): string;
    /** Adds an encoded query to the other queries that may have been set */
    addEncodedQuery(query: string): void;
    /** Moves to the next record in the GlideRecord */
    next(): boolean;
    /** Determines if there are any more records in the GlideRecord */
    hasNext(): boolean;
    /** Retrieves the underlying value of a field */
    getValue(fieldName: string): string;
    /** Gets the primary key of the record, which is usually the sys_id unless otherwise specified */
    getUniqueValue(): string;
    /** Retrieves the name of the display field */
    getDisplayName(): string;
    /** Retrieves the display value for the current record */
    getDisplayValue(fieldName?: string): string;
    getClassDisplayValue(): string;
    /** The label of the field as a String */
    getLabel(): string;
    /** Determines if current record is a valid record */
    isValidRecord(): boolean;
    /** Determines if the given field is defined in the current table */
    isValidField(fieldName: string): boolean;
    /** Creates an empty record suitable for population before an insert */
    initialize(): void;
    /** Creates a new GlideRecord, sets the default values for the fields, and assigns a unique ID to the record */
    newRecord(): void;
    /** Checks if the current record is a new record that has not yet been inserted into the database */
    isNewRecord(): boolean;
    /** Determines whether the table exists or not */
    isValid(): boolean;
    /** Retrieves the current operation being performed, such as insert, update, or delete */
    operation(): string;
    /** Specifies an orderBy column */
    orderBy(fieldName: string): void;
    /** Specifies a descending orderBy */
    orderByDesc(fieldName: string): void;
    /** Sets the maximum number of records in the GlideRecord to be fetched in the next query */
    setLimit(limit: number): void;
    /** Sets a range of rows to be returned by subsequent queries. If forceCount is true, getRowCount() method will return all possible records */
    chooseWindow(firstRow: number, lastRow: number, forceCount?: boolean): void;
    /** Determines if the Access Control Rules which include the user's roles permit inserting new records in this table */
    canCreate(): boolean;
    /** Determines if the Access Control Rules which include the user's roles permit deleting records in this table */
    canDelete(): boolean;
    /** Determines if the Access Control Rules which include the user's roles permit reading records in this table */
    canRead(): boolean;
    /** Determines if the Access Control Rules which include the user's roles permit editing records in this table */
    canWrite(): boolean;
    /** Sets sys_id value for the current record */
    setNewGuidValue(guid: string): void;
    /** Retrieves a link to the current record */
    getLink(nostack: boolean): string;
    /** Retrieves the last error message */
    getLastErrorMessage(): string;
    /** Gets the attributes on the field in question from the dictionary */
    getAttribute(attribute: string): string;
    getCategory(): string;
    setCategory(category: string): void;
    autoSysFields(b: boolean): void;
    /** Determines whether the current database action is to be aborted. Available in Fuji patch 3 */
    isActionAborted(): boolean;
    /** Retrieve the specified platform function in addition of the field values */
    addFunction(functionDefinition: string): void;
}
/** GlideRecordSecure is a class inherited from GlideRecord that performs the same functions as GlideRecord, and also enforces ACLs */
declare class GlideRecordSecure extends GlideRecord {}
/** The scoped QueryCondition API provides additional AND or OR conditions that can be added to the current condition, allowing you to build complex queries such as: category='hardware' OR category='software' AND priority='2' AND priority='1' */
declare class GlideQueryCondition {
    constructor();
    /** Adds an OR condition to the current condition. oper is an optional parameter */
    addOrCondition(name: string, oper: string, value: any): GlideQueryCondition;
    addOrCondition(name: string, value: any): GlideQueryCondition;
    /** Adds an AND condition to the current condition. oper is an optional parameter */
    addCondition(name: string, oper: string, value: any): GlideQueryCondition;
    addCondition(name: string, value: any): GlideQueryCondition;
}
/** The API allows you to evaluate scripts from a GlideRecord field */
declare class GlideScopedEvaluator {
    constructor();
    /** Evaluates a script from a GlideRecord field. variables parameter is optional */
    evaluateScript(gr: GlideRecord, scriptField: string, variables: any): any;
    /** Puts a variable into the GlideScopedEvaluator object */
    putVariable(name: string, value: any): void;
    /** Gets a variable from a GlideScopedEvaluator object */
    getVariable(name: string): any;
}
/** A wrapper around an InputStream. No functions are provided to manipulate the stream from script. Rather this object can be passed to any API which takes an InputStream as an input parameter */
declare class GlideScriptableInputStream {}
/** ServiceNow processors are equivalent to Java servlets. Processors provide a customizable URL endpoint that can execute arbitrary server-side Javascript code and produce output such as TEXT, JSON, or HTML. The GlideScriptedProcessor APIs are used in processor scripts to access the the processor (servlet) capabilities. There are no constructors for the GlideScriptedProcessor APIs. The methods are called using the global variable g_processor. A useful global variable, g_target, is available in processor scripts. It contains the table name extracted from the URL. The URL to a processor has the format: https://<instance name.servicenow.com>/<path endpoint>.do?<parameter endpoint>=<value> where the path endpoint and parameter endpoint are defined on the processor form */
declare class GlideScriptedProcessor {
    constructor();
    /** Redirects to the specified URL */
    redirect(url: string): void;
    /** Writes the contents of the given string to the response */
    writeOutput(contentType: string, value: string): void;
    /** Writes a JSON object to the current URL. Note: Works only in scoped apps */
    writeJSON(jsonObject: any): void;
}
/** ServiceNow processors are equivalent to Java servlets. Processors provide a customizable URL endpoint that can execute arbitrary server-side Javascript code and produce output such as TEXT, JSON, or HTML. The GlideServletRequest API is used in processor scripts to access the HttpServletRequest object. The GlideServletRequest object provides a subset of the HttpServletRequest APIs. The methods are called using the global variable g_request. A useful global variable, g_target, is available in processor scripts. It contains the table name extracted from the URL. The URL to a processor has the format: https://<instance name.servicenow.com>/<path endpoint>.do?<parameter endpoint>=<value> where the path endpoint and parameter endpoint are defined on the processor form */
declare class GlideServletRequest {
    constructor();
    /** Returns the content type */
    getContentType(): string;
    /** Returns the header */
    getHeader(name: string): string;
    /** Returns an array of headers as a string */
    getHeaders(name: string): string[];
    /** Returns an array of header names as a string */
    getHeaderNames(): string[];
    /** Returns an object */
    getParameter(name: string): any;
    /** Returns an array of parameter names as a string */
    getParameterNames(): string[];
    /** Returns the query string from the request */
    getQueryString(): string;
}
/** ServiceNow processors are equivalent to Java servlets. Processors provide a customizable URL endpoint that can execute arbitrary server-side Javascript code and produce output such as TEXT, JSON, or HTML. The GlideServletResponse API is used in processor scripts to access the HttpServletResponse object. The GlideServletResponse object provides a subset of the HttpServletResponse APIs. The methods are called using the global variable g_response. A useful global variable, g_target, is available in processor scripts. It contains the table name extracted from the URL. The URL to a processor has the format: https://<instance name.servicenow.com>/<path endpoint>.do?<parameter endpoint>=<value> where the path endpoint and parameter endpoint are defined on the processor form */
declare class GlideServletResponse {
    constructor();
    /** Sends a temporary redirect to the client */
    sendRedirect(location: string): void;
    /** Sets the MIME type of the response */
    setContentType(type: string): void;
    /** Sets the status code for the response */
    setStatus(status: number): void;
    /** Sets a response header to the specified value */
    setHeader(key: string, value: string): void;
}
/** The scoped GlideFilter class allows you to determine if a record meets a specified set of requirements. There is no constructor for scoped GlideFilter, it is accessed by using the global object 'GlideFilter' */
declare class GlideFilter {
    /** Returns true when the record meets the filter condition */
    static checkRecord(
        gr: GlideRecord,
        filter: string,
        value?: boolean
    ): boolean;
    /**
     * @param filter encoded query string in standard glide format
     * @param title Descriptive title for filter
     */
    constructor(filter: string, title: string);
    /**
     * @param gr GlideRecord to evaluate
     * @param match Flag that indicates whether all filter conditions must match default false
     */
    match(gr: GlideRecord, match: boolean): boolean;
    setCaseSensitive(caseSensitive: boolean): void;
}

/** GlideLocale is a global object that can be called in scripts. Use the get() method to get a GlideLocale object */
declare class GlideLocale {
    constructor();
    /** Returns the GlideLocale object */
    static get(): GlideLocale;
    /** Returns the grouping separator */
    getDecimalSeparator(): string;
    /** Returns the decimal separator */
    getGroupingSeparator(): string;
}
/** Scoped API for PluginManager */
declare class GlidePluginManager {
    constructor();
    /** Determine if a plugin is activated */
    isActive(pluginID: string): boolean;
    static isActive(pluginID: string): boolean;
}
/** The Scoped GlideTableHierarchy API provides methods for handling information about table relationships */
declare class GlideTableHierarchy {
    constructor(tableName: string);
    /** Returns the table's name */
    getName(): string;
    /** Returns a list of the table names in the hierarchy */
    getTables(): [];
    /** Returns a list of all tables that extend the current table */
    getTableExtensions(): [];
    /** Returns a list of all tables that extend the current table and includes the current table */
    getAllExtensions(): [];
    /** Returns a list of all classes in the hierarchy of the given table */
    getHierarchy(): [];
    /** Returns the top level class in the hierarchy */
    getRoot(): string;
    /** Returns the parent class */
    getBase(): string;
    /** Returns true if this is a base class */
    isBaseClass(): boolean;
    /** Returns true if this table is not in a hierarchy */
    isSoloClass(): boolean;
    /** Returns true of this class has been extended */
    hasExtensions(): boolean;
}
/** The Scoped GlideDBFunctionBuilder provides a builder API for creating platform function definition */
declare class GlideDBFunctionBuilder {
    constructor();
    /** Add a field parameter to the current function */
    field(fieldName: string): GlideDBFunctionBuilder;
    /** Add a constant parameter to the current function */
    constant(constant: string): GlideDBFunctionBuilder;
    /** End the current function */
    endfunc(): GlideDBFunctionBuilder;
    /** Return the completed function definition */
    build(): string;
    /** Start a length function */
    length(): GlideDBFunctionBuilder;
    /** Start a concatenation function */
    concat(): GlideDBFunctionBuilder;
    /** Start an addition function */
    add(): GlideDBFunctionBuilder;
    /** Start a subtraction function */
    subtract(): GlideDBFunctionBuilder;
    /** Start a multiplication function */
    multiply(): GlideDBFunctionBuilder;
    /** Start a division function */
    divide(): GlideDBFunctionBuilder;
    /** Start a function that return the duration between 2 dates */
    datediff(): GlideDBFunctionBuilder;
    /** Start a function that returns the day of the week of a given date */
    dayofweek(): GlideDBFunctionBuilder;
    /** Start a function that returns the current timestamp in the UTC timezone. This function should be used as a parameter to the datediff function to calculate a duration between the current datetime and another datetime field or datetime constant */
    now(): GlideDBFunctionBuilder;
}
/** XMLDocument2 is a JavaScript Object wrapper for parsing and extracting XML data from an XML string. Use this JavaScript class to instantiate an object from an XML string, usually a return value from a Web Service invocation, or the XML payload of ECC Queue */
declare class XMLDocument2 {
    constructor();
    /** Gets the node specified in the xpath */
    getNode(xpath: string): XMLNode;
    /** Gets the first node in the specified xpath */
    getFirstNode(xpath: string): XMLNode;
    /** Gets the node after the specified node */
    getNextNode(prev: XMLNode): XMLNode;
    /** Creates and adds an element node to the current node. The element name is the string passed in as a parameter. The new element node has no text child nodes */
    createElement(name: string): XMLNode;
    /** Creates an element node with a text child node and adds it to the current node */
    createElementWithTextValue(name: string, value: string): XMLNode;
    /** Makes the node passed in as a parameter the current node */
    setCurrentElement(element: XMLNode): void;
    /** Gets the document element node of the XMLDocument2. The document element node is the root node */
    getDocumentElement(): XMLNode;
    /** Parses the XML string and loads it into the XMLDocument2 object */
    parseXML(xmlDoc: string): boolean;
    /** Gets all the text child nodes from the node referenced in the xpath */
    getNodeText(xpath: string): string;
    /** Checks if the XMLDocument is valid */
    isValid(): boolean;
    /** Returns a string containing the XML */
    toString(): string;
    /** 
     * When set to true, the XMLDocument2 object processes the document with XML namespaces.
     * If you don't set this, an XML document with namespaces won't be enumerated correctly,
     * and an XPath search would fail.
     */
    setNamespaceAware(value: boolean): void;
}
/** The scoped XMLNode API allows you to query values from XML nodes. XMLNodes are extracted from XMLDocument2 objects, which contain XML strings */
declare class XMLNode {
    constructor();
    /** Gets the node's last child node */
    getLastChild(): XMLNode;
    /** Gets the node's first child node */
    getFirstChild(): XMLNode;
    /** Gets the node's XMLNodeIterator object */
    getChildNodeIterator(): XMLNodeIterator;
    /** Gets the node's text content */
    getTextContent(): string;
    /** Gets the node's value */
    getNodeValue(): string;
    /** Gets the node's name */
    getNodeName(): string;
    /** Determines if the node has the specified attribute */
    hasAttribute(attribute: string): boolean;
    /** Gets the value of the specified attribute */
    getAttribute(attribute: string): string;
    setAttribute(attribute: string, value: string): void;
    appendChild(newChild: XMLNode): void;
    /** Gets the node's string value */
    toString(): string;
}
/** The scoped XMLNodeIterator class allows you to iterate through a node of a XML document */
declare class XMLNodeIterator {
    constructor();
    /** Gets the next element in the iteration */
    next(): XMLNode;
    /** Determines if the iteration has more elements */
    hasNext(): boolean;
}
/** The scoped GlideSystem (referred to by the variable name 'gs' in any server-side JavaScript) API provides a number of convenient methods to get information about the system, the current logged in user, etc. */
declare const gs: gs;
interface gs {
    getScopeLabelByRecordId(sysId: string): string;
    getCurrentApplicationName(): string;
    hasRightsTo(entity: string, obj: any): boolean;
    beginningOfToday(): string;
    logWarning(msg: string, source?: string): void;
    logError(msg: string, source?: string): void;
    log(msg: string, source?: string): void;
    /** Returns a reference to the GlideUser object for the current user */
    getUser(): GlideUser;
    /** Gets a reference to the current Glide session */
    getSession(): GlideSession;
    /** Queues an event for the event manager */
    eventQueue(
        name: string,
        record: GlideRecord,
        parm1?: string | string[] | null,
        parm2?: string | string[] | null,
        queue?: string
    ): void;
    eventQueueScheduled(
        name: string,
        record: GlideRecord,
        parm1: string | string[] | null,
        parm2: string | string[] | null,
        date: GlideDateTime | GlideElement
    ): void;
    /** Retrieves a message from UI messages */
    getProperty(key: string, alt?: Object): string;
    setProperty(key: string, value: any):void;
    urlDecode(url: string): string;
    urlEncode(url: string): string;
    base64Decode(s: string): string;
    base64Encode(s: string): string;
    xmlToJSON(xmlString: string): Object;
    /** Gets the name of the current scope */
    getCurrentScopeName(): string;
    /** Gets the caller scope name, or returns null if there is no caller */
    getCallerScopeName(): string;
    /** Queries an object and returns true if the object is null, undefined, or contains an empty string */
    nil(o: Object): boolean;
    /** Retrieves a message from UI messages. args is an optional paramter */
    getMessage(id: string, args: any): string;
    getMessage(id: string): string;
    /** Determines if the current user has the specified role */
    hasRole(role: string): boolean;
    /** Provides a safe way to call from the sandbox, allowing only trusted scripts to be included */
    include(name: string): boolean;
    /** Gets the GlideSession Session ID */
    getSessionID(): string;
    /** Determines if a database table exists */
    tableExists(name: string): boolean;
    /** Gets a string representing the cache version for a CSS file */
    getCssCacheVersionString(): string;
    /** Generates a GUID that can be used when a unique identifier is required */
    generateGUID(): string;
    getNewAppScopeCompanyPrefix(): string;
    getMaxSchemaNameLength(): number;
    /** Adds an error message for the current session */
    addErrorMessage(message: string): void;
    /** Adds an info message for the current session */
    addInfoMessage(message: string): void;
    /** Gets the display name of the current user (e.g., Abel Tuter, as opposed to abel.tuter) */
    getUserDisplayName(): string;
    /** Gets the sys_id of the current user */
    getUserID(): string;
    /** Gets the username, or User ID, of the current user (e.g., abel.tuter) */
    getUserName(): string;
    /** Set the redirect URI for this transaction. This determines the next page the user will see */
    setRedirect(url: string): void;
    /** Checks if the current session is interactive */
    isInteractive(): boolean;
    /** Determines if the current user is currently logged in */
    isLoggedIn(): boolean;
    /** Gets the current URI for the session */
    getUrlOnStack(): string;
    /** Gets the ID of current application, defined as a user preference and set by the application picker */
    getCurrentApplicationId(): string;
    /** Returns (UTC) 24 hours ago adjusted for the timezone of the current session */
    yesterday(): string;
    /** Returns the (UTC) start of the day that was the specified number of days ago adjusted for the timezone of the server */
    daysAgo(days: number): string;
    /** Returns the (UTC) start of the day that was the specified number of days ago adjusted for the timezone of the server */
    daysAgoStart(daysAgo: number): string;
    /** Returns the (UTC) end of the day that was the specified number of days ago adjusted for the timezone of the server */
    daysAgoEnd(daysAgo: number): string;
    /** Returns the (UTC) beginning of the specified week adjusted for the timezone of the current session */
    beginningOfWeek(o: Object): string;
    /** Returns the (UTC) end of the specified week adjusted for the timezone of the current session */
    endOfWeek(o: Object): string;
    /** Returns the (UTC) end of next week adjusted for the timezone of the server */
    endOfNextWeek(): string;
    /** Gets the date and time for the beginning of next week in UTC, adjusted for the timezone of the server */
    beginningOfNextWeek(): string;
    /** Returns the (UTC) end of last week adjusted for the timezone of the server */
    endOfLastWeek(): string;
    /** Gets the date and time for the beginning of last week in UTC, adjusted for the timezone of the server */
    beginningOfLastWeek(): string;
    /** Gets the date and time for the beginning of this week in UTC, adjusted for the timezone of the server */
    beginningOfThisWeek(): string;
    /** Gets the date and time for the end of this week in UTC, adjusted for the timezone of the server */
    endOfThisWeek(): string;
    /** Gets the date and time for the beginning of this month in UTC, adjusted for the timezone of the server */
    beginningOfThisMonth(): string;
    /** Gets the date and time for the end of this month in UTC, adjusted for the timezone of the server */
    endOfThisMonth(): string;
    /** Gets the date and time for the beginning of next month in UTC, adjusted for the timezone of the server */
    beginningOfNextMonth(): string;
    /** Gets the date and time for the end of next month in UTC, adjusted for the timezone of the server */
    endOfNextMonth(): string;
    /** Gets the date and time for the beginning of last month in UTC, adjusted for the timezone of the server */
    beginningOfLastMonth(): string;
    /** Gets the date and time for the end of last month in UTC, adjusted for the timezone of the server */
    endOfLastMonth(): string;
    /** Returns the (UTC) start of the quarter that was the specified number of months ago adjusted for the timezone of the server */
    monthsAgo(month: number): string;
    /** Returns the (UTC) start of the quarter that was the specified number of months ago adjusted for the timezone of the server */
    monthsAgoStart(month: number): string;
    /** Gets the date and time for the beginning of this quarter in UTC, adjusted for the timezone of the server */
    beginningOfThisQuarter(): string;
    /** Gets the date and time for the end of this quarter in UTC, adjusted for the timezone of the server */
    endOfThisQuarter(): string;
    /** Returns the (UTC) start of the quarter that was the specified number of quarters ago adjusted for the timezone of the server */
    quartersAgoStart(quarters: number): string;
    /** Returns the (UTC) end of the quarter that was the specified number of quarters ago adjusted for the timezone of the server */
    quartersAgoEnd(quarters: number): string;
    /** Gets the date and time for the beginning of this year in UTC, adjusted for the timezone of the server */
    beginningOfThisYear(): string;
    /** Gets the date and time for the end of this year in UTC, adjusted for the timezone of the server */
    endOfThisYear(): string;
    /** Gets the date and time for the beginning of last year in UTC, adjusted for the timezone of the server */
    beginningOfLastYear(): string;
    /** Gets the date and time for the end of last year in UTC, adjusted for the timezone of the server */
    endOfLastYear(): string;
    /** Gets the date and time for the beginning of next year in UTC, adjusted for the timezone of the server */
    beginningOfNextYear(): string;
    /** Gets the date and time for the end of next year in UTC, adjusted for the timezone of the server */
    endOfNextYear(): string;
    /** Returns the (UTC) start of the hour that was the specified number of hours ago adjusted for the timezone of the server */
    hoursAgoStart(hours: number): string;
    /** Returns the (UTC) end of the hour that was the specified number of hours ago adjusted for the timezone of the server */
    hoursAgoEnd(hours: number): string;
    /** number of hours ago */
    hoursAgo(hours: number): string;
    /** number of minutes ago */
    minutesAgo(minutes: number): string;
    /** Returns the (UTC) start of the minute that was the specified number of minutes ago adjusted for the timezone of the serve */
    minutesAgoStart(minutes: number): string;
    /** Returns the (UTC) end of the minute that was the specified number of minutes ago adjusted for the timezone of the serve */
    minutesAgoEnd(minutes: number): string;
    /** Returns the date of the duration time after January 1 */
    getDurationDate(duration: string): string;
    /** Returns a String of the form :interval,value,operator */
    datePart(interval: string, value: string, operator: string): string;
    /** Uses the error level to log a message to the system log */
    error(
        message: string,
        parm1?: Object,
        parm2?: Object,
        parm3?: Object,
        parm4?: Object,
        parm5?: Object
    ): void;
    /** Uses the warn level to log a message to the system log */
    warn(
        message: string,
        parm1?: Object,
        parm2?: Object,
        parm3?: Object,
        parm4?: Object,
        parm5?: Object
    ): void;
    /** Uses the info level to log a message to the system log */
    info(
        message: string,
        parm1?: Object,
        parm2?: Object,
        parm3?: Object,
        parm4?: Object,
        parm5?: Object
    ): void;
    /** Uses the debug level to log a message to the system log */
    debug(
        message: string,
        parm1?: Object,
        parm2?: Object,
        parm3?: Object,
        parm4?: Object,
        parm5?: Object
    ): void;
    /** Determines if debugging is active for a specific scope */
    isDebugging(): boolean;
}

/** Authentication API */
declare namespace sn_auth {
    class GlideOAuthClient {
        getToken(requestor:string, oauthEntityProfileSysId: string): GlideOAuthToken;
        /** Retrieves the token for the client, with the request parameters encoded in JSON format */
        requestToken(clientName: string, jsonString: string): GlideOAuthClientResponse;
        /** Retrieves the token for the client, with the request and optional header parameters set into a GlideOAuthClientRequest object */
        requestTokenByRequest(clientName: string, request: GlideOAuthClientRequest): GlideOAuthClientResponse;
        /** Revokes the access or refresh token for the client, with the request and optional header parameters set into a GlideOAuthClientRequest object */
        revokeToken(
            clientName: string,
            accessToken: string,
            refreshToken: string,
            request: GlideOAuthClientRequest
        ): GlideOAuthClientResponse;
    }
    class GlideOAuthClientRequest {
        /** Retrieves the parameter for the parameter name you provide */
        getParameter(name: string): void;
        /** Sets the parameters for the name:value pair of strings you provide */
        setParameter(name: string, value: string): void;
        /** Retrieves the HTTP headers */
        getHeaders(): any;
        /** Retrieves the HTTP headers for the string you provide */
        getHeader(name: string): void;
        /** Sets the HTTP headers for the nave:value pair that you provide */
        setHeader(name: string, value: string): void;
        /** Retrieves the grant type */
        getGrantType(): void;
        /** Sets the grant type with the string you provide */
        setGrantType(): void;
        /** Retrieves the scope */
        getScope(): string;
        /** Sets the scope with the string you provide */
        setScope(scope: string): void;
        /** Retrieves the user name */
        getUserName(): string;
        /** Sets the user name with the string you provide */
        setUserName(userName: string): void;
        /** Retrieves the password */
        getPassword(): string;
        /** Sets the password with the string you provide */
        setPassword(password: string): void;
        /** Retrieves the refresh token */
        getRefreshToken(): string;
        /** Sets the refresh token with the string you provide */
        setRefreshToken(refreshToken: string): void;
    }
    /** Use these methods for retrieving the access token and information about the access token */
    class GlideOAuthToken {
        /** Retrieves the access token */
        getAccessToken(): string;
        /** Retrieves the sys_id of the token ID */
        getAccessTokenSysID(): string;
        /** Retrieves the lifespan of the access token in seconds */
        getExpiresIn(): number;
        /** Retrieves the refresh token */
        getRefreshToken(): number;
        /** Retrieves the sys_id of the refresh token */
        getRefreshTokenSysID(): string;
        /** Retrieves the scope, which is the amount of access granted by the access token */
        getScope(): string;
    }
    class GlideOAuthClientResponse {
        /** Retrieves the refresh token */
        getToken(): GlideOAuthToken;
        /** Retrieves the error message if authentication is not successful */
        getErrorMessage(): string;
        /** Retrieves the response content from an external OAuth provider. The response is in a name:value pair */
        getResponseParameters(): any;
        /** Retrieves the HTTP response content header from an external OAuth provider */
        getContentType(): string;
        /** Retrieves all of the response information, including instance information */
        getBody(): string;
        /** Retrieves the HTTP response code from the external OAuth provider */
        getResponseCode(): string;
    }
}

/** Web Services API, to send a message to a web service provider */
declare namespace sn_ws {
    /** Instantiates a RESTMessageV2 object. When you have a REST message record, you can add the optional name and methodName information */
    class RESTMessageV2 {
        constructor(restMessageName?: string, functionName?: string);
        /** Send the REST message to the endpoint */
        execute(): RESTResponseV2;
        /** Send the REST message to the endpoint asynchronously. The instance does not wait for a response from the web service provider when making asynchronous calls */
        executeAsync(): RESTResponseV2;
        /** The HTTP method this REST message performs, such as GET or PUT. You must set an HTTP method when using the RESTMessageV2() constructor with no parameters */
        setHttpMethod(method: string): void;
        /** Set the amount of time the REST message waits for a response from the REST provider */
        setHttpTimeout(timeoutMs: number): void;
        /** Set basic authentication headers for the REST message */
        setBasicAuth(userName: string, userPass: string): void;
        /** Set the mutual authentication protocol profile for the REST message */
        setMutualAuth(profileName: string): void;
        /** Set the credentials for the REST message using an existing basic auth or OAuth 2.0 profile. Valid types are 'basic' and 'oauth2'. Valid profileIds are the sys_id of a Basic Auth Configuration [sys_auth_profile_basic] record or an OAuth Entity Profile [oauth_entity_profile] record */
        setAuthenticationProfile(type: string, profileId: string): void;
        /** Associate outbound requests and the resulting response record in the ECC queue */
        setEccCorrelator(correlator: string): void;
        /** Override a value from the database by writing to the REST message payload */
        setEccParameter(name: string, value: string): void;
        /** Configure the REST message to communicate through a MID Server */
        setMIDServer(midServer: string): void;
        /** Set the endpoint for the REST message */
        setEndpoint(endpoint: string): void;
        /** Set the ECC topic for the REST message. The default ECC topic is RESTProbe if topic is not set. In most cases it is unnecessary to set ECC topic */
        setEccTopic(topic: string): void;
        /** Set the body content of a PUT or POST request. Mutually exclusive with setRequestBodyFromAttachment */
        setRequestBody(body: string): void;
        /** Uses the specified attachment as the request body of this REST Message. Mutually exclusive with setRequestBody */
        setRequestBodyFromAttachment(attachmentSysId: string): void;
        /** Setup the response body to be saved into the specified attachment when the request is sent. encryptCtxSysId is optional */
        saveResponseBodyAsAttachment(
            tableName: string,
            recordSysId: string,
            filename: string,
            encryptCtxSysId: string
        ): void;
        /** Set an HTTP header to the specified value */
        setRequestHeader(name: string, value: string): void;
        /** Set a REST message function variable to the specified value */
        setStringParameter(name: string, value: string): void;
        /** Set a REST message function variable to the specified value without escaping XML reserved characters */
        setStringParameterNoEscape(name: string, value: string): void;
        /** Append a name-value parameter to the request URL */
        setQueryParameter(name: string, value: string): void;
        /** Get the content of the REST message body */
        getRequestBody(): string;
        /** Get the URL of the endpoint for the REST message */
        getEndpoint(): string;
        /** Get the ECC topic for the REST message */
        getEccTopic(): string;
        /** Get the value for an HTTP header specified by the REST client */
        getRequestHeader(headerName: string): string;
        /** Get name and value for all HTTP headers specified by the REST client */
        getRequestHeaders(): Object;
    }
    /** The RESTResponseV2 API allows you to use the data returned by an outbound REST message in JavaScript code. A RESTResponseV2 object is returned by the RESTMessageV2 functions execute() and executeAsync() */
    class RESTResponseV2 {
        constructor();
        /** Set the amount of time the instance waits for the response */
        waitForResponse(timeoutSecs: number): void;
        /** Get the numeric HTTP status code returned by the REST provider */
        getStatusCode(): number;
        /** Get the value for a specified header */
        getHeader(name: string): string;
        /** Deprecated -- use getAllHeaders instead */
        getHeaders(): Object;
        /** Get all headers returned in the REST response and the associated values */
        getAllHeaders(): GlideHTTPHeader[];
        /** Get the content of the REST response body */
        getBody(): string;
        /** Indicate if there was an error during the REST transaction */
        haveError(): boolean;
        /** Get the numeric error code, if there was an error during the REST transaction */
        getErrorCode(): number;
        /** Get the error message if there was an error during the REST transaction */
        getQueryString(): string;
        /** Get the query used for this request */
        getErrorMessage(): string;
    }
    /** Instantiates a SOAPMessageV2 object. Specify optional message and a function if there is a SOAP message record */
    class SOAPMessageV2 {
        constructor();
        /** Send the SOAP Message to the endpoint */
        execute(): SOAPResponse;
        /** Send the SOAP Message to the endpoint asynchronously */
        executeAsync(): SOAPResponse;
        /** Define the SOAP action this SOAP message performs */
        setSOAPAction(soapAction: string): void;
        /** Set the amount of time the request waits for a response from the web service provider before the request times out */
        setHttpTimeout(timeoutMs: number): void;
        /** Set basic authentication headers for the SOAP message */
        setBasicAuth(userName: string, userPass: string): void;
        /** Set the mutual authentication protocol profile for the SOAP message */
        setMutualAuth(profileName: string): void;
        /** Set web service security values for the SOAP message */
        setWSSecurity(
            keystoreId: string,
            keystoreAlias: string,
            keystorePassword: string,
            certificateId: string
        ): void;
        /** Set a variable from the SOAP message record to the specified value */
        setStringParameter(name: string, value: string): void;
        /** Set a variable from the SOAP message record to the specified value without escaping XML reserved characters */
        setStringParameterNoEscape(name: string, value: string): void;
        /** Associate outbound requests and the resulting response record in the ECC queue */
        setEccCorrelator(correlator: string): void;
        /** Override a value from the database by writing to the SOAP message payload */
        setEccParameter(name: string, value: string): void;
        /** Set an HTTP header in the SOAP message to the specified value */
        setRequestHeader(headerName: string, headerValue: string): void;
        /** Set the body content to send to the web service provider */
        setRequestBody(requestBody: string): void;
        /** Set the endpoint for the SOAP message */
        setEndpoint(endpoint: string): void;
        /** Configure the SOAP message to be sent through a MID Server */
        setMIDServer(midServerName: string): void;
        /** Get the content of the SOAP message body */
        getRequestBody(): string;
        /** Get the URL of the endpoint for the SOAP message */
        getEndpoint(): string;
        /** Get the value for an HTTP header specified by the SOAP client */
        getRequestHeader(headerName: string): string;
        /** Get name and value for all HTTP headers specified by the SOAP client */
        getRequestHeaders(): Object;
        /** Set WS-Security Username token */
        setWSSecurityUsernameToken(username: string, password: string): void;
        /** Set WS-Security X.509 token */
        setWSSecurityX509Token(
            keystoreId: string,
            keystoreAlias: string,
            keystorePassword: string,
            certificateId: string
        ): void;
    }
    /** The SOAPResponseV2 API allows you to use the data returned by an outbound SOAP message in JavaScript code. A SOAPResponseV2 object is returned by the SOAPMessageV2 functions execute() and executeAsync() */
    class SOAPResponseV2 {
        constructor();
        /** Set the amount of time the instance waits for a response */
        waitForResponse(timeoutSecs: number): void;
        /** Get the numeric HTTP status code returned by the SOAP provider */
        getStatusCode(): number;
        /** Get the value for a specified HTTP header */
        getHeader(name: string): string;
        /** Deprecated -- use getAllHeaders instead */
        getHeaders(): Object;
        /** Get all HTTP headers returned in the SOAP response and the associated values */
        getAllHeaders(): GlideHTTPHeader[];
        /** Get the content of the SOAP response body */
        getBody(): string;
        /** Indicate if there was an error during the SOAP transaction */
        haveError(): boolean;
        /** Get the numeric error code if there was an error during the SOAP transaction */
        getErrorCode(): number;
        /** Get the error message if there was an error during the SOAP transaction */
        getErrorMessage(): string;
    }
}
/** These objects are relevant to Scripted REST APIs and are accessed via the request or response input parameters to Scripted APIs */
declare const sn_ws_int: sn_ws_int;
interface sn_ws_int {
    /** Allows you to access request details in Scripted REST APIs */
    RESTAPIRequest: RESTAPIRequest;
    /** Allows you to access the request body as a stream, as a string, de-serialized into an object, or as an array of obects */
    RESTAPIRequestBody: RESTAPIRequestBody;
    /** Allows you to configure the HTTP response in Scripted REST APIs */
    RESTAPIResponse: RESTAPIResponse;
    /** Allows you to write streams or strings directly to the response stream in a Scripted REST API */
    RESTAPIResponseStream: RESTAPIResponseStream;
    /** Provides access to request input parameters */
    WSRequest: WSRequest;
    /** Allows setting response output parameters */
    WSResponse: WSResponse;
    /** SOAP request object as a String */
    WSSoapRequestXML: string;
    /** SOAP request object as a DOM Document or XMLDocument2 (for new application scope) */
    WSSoapRequestDocument: WSSoapRequestDocument;
}
/** Allows you to access request details in Scripted REST APIs */
declare class RESTAPIRequest {
    constructor();
    /** The body of the request */
    body: body;
    /** Get the value of a specific header from the request */
    getHeader(headerName: string): string;
    /** The entire request URL, including domain */
    url: string;
    /** The request URI, excluding domain information */
    uri: string;
    /** The entire query string from the request URI */
    queryString: string;
    /** Obtain a set of media types that are common between what the client request accepts and what this service is able to produce */
    getSupportedResponseContentTypes(): Object;
    /** Get the query category (i.e. read replica category) from query parameter 'sysparm_query_category' */
    getRequestedQueryCategory(): string;
}
/** Allows you to access the request body as a stream, as a string, de-serialized into an object, or as an array of obects */
declare class RESTAPIRequestBody {
    constructor();
    /** The body of the request as a stream. Note, this object provides no functions to manipulate the stream from script. Rather this object can be passed to another API which takes an InputStream as an input parameter */
    dataStream: dataStream;
    /** The request body as a string -- be careful to consider impact to memory */
    dataString: string;
    /** Returns the next entry from the request body as an object if request is array. If not an array then returns entire request body as an object */
    nextEntry(): Object;
    /** Return true if request has more entries. Use this in conjunction with nextEntry */
    hasNext(): boolean;
}
/** Allows you to configure the HTTP response in Scripted REST APIs */
declare class RESTAPIResponse {
    constructor();
    /** Set response HTTP status code */
    setStatus(code: number): void;
    /** Set response headers from the specified object */
    setHeaders(headers: any): void;
    /** Set a response header */
    setHeader(name: string, value: string): void;
    /** Set the Location header */
    setLocation(locationValue: string): void;
    /** Set the Content-Type header */
    setContentType(contentType: string): void;
    /** Set Response Error */
    setError(error: any): void;
    /** Use the specified object as the response body */
    setBody(body: any): void;
    /** Return stream writer. Caller responsible to set proper content type and status using setStatus and setHeader methods. Caller responsible to populate all headers on response before actually writing to stream */
    getStreamWriter(): RESTAPIResponseStream;
}
/** Allows you to write streams or strings directly to the response stream in a Scripted REST API */
declare class RESTAPIResponseStream {
    constructor();
    /** Write a string directly to the response stream. Can be called multiple times. Caller responsible for response format and setting proper Content-Type and status code prior to calling */
    writeString(stringToWrite: string): void;
    /** Write an InputStream directly to the response stream. Can be called multiple times. Caller responsible for response format and setting proper Content-Type and status code prior to calling */
    writeStream(inputStream: Object): void;
}
/** Provides access to request input parameters */
declare class WSRequest {
    constructor();
}
/** Allows setting response output parameters */
declare class WSResponse {
    constructor();
}
/** Error types which can be set as the response body of a Scripted REST API */
declare const sn_ws_err: sn_ws_err;
interface sn_ws_err {
    /** Sets status code 404 and includes the specified message in the response */
    NotFoundError(message: string): void;
    /** Sets status code 409 and includes the specified message in the response */
    ConflictError(message: string): void;
    /** Sets status code 415 and includes the specified message in the response */
    UnsupportedMediaTypeError(message: string): void;
    /** Sets status code 406 and includes the specified message in the response */
    NotAcceptableError(message: string): void;
    /** Sets status code 400 and includes the specified message in the response */
    BadRequestError(message: string): void;
    /** A generic error message wrapper to set status code and detailed error message in the response */
    ServiceError: ServiceError;
}
/** A generic error message wrapper to set status code and detailed error message in the response */
declare class ServiceError {
    constructor();
    /** The response status code -- defaults to 500 */
    setStatus(code: number): void;
    /** The error message */
    setMessage(message: string): void;
    /** The detailed error message */
    setDetail(detail: string): void;
}
/** MetricBase JavaScript API */
declare const sn_clotho: sn_clotho;
interface sn_clotho {
    /** Instantiates a MetricBase transformer for the specified GlideRecord */
    Transformer: Transformer;
    /** Defines a transformer's transforms */
    TransformPart: TransformPart;
    /** An object that contains a transform execution result */
    TransformResult: TransformResult;
    /** Stores a single series of MetricBase data */
    Data: Data;
    /** Interacts with the MetricBase database */
    Client: Client;
    /** Builds data to put into MetricBase */
    DataBuilder: DataBuilder;
}
/** Instantiates a MetricBase transformer for the specified GlideRecord */
declare class Transformer {
    constructor();
    /** Groups the subject records by the specified field */
    groupBy(field: string): TransformPart;
    /** Specifies the metric field that this transformer operates on */
    metric(metricName: string): TransformPart;
    /** Executes the transforms defined by this transformer over the specified time range and returns an object containing the results */
    execute(
        rangeStart: GlideDateTime,
        rangeEnd: GlideDateTime
    ): TransformResult;
}
/** Defines a transformer's transforms */
declare class TransformPart {
    constructor();
    /** Groups the subject records by the specified field */
    groupBy(field: string): TransformPart;
    /** Specifies the metric field that this transformer operates on */
    metric(metricName: string): TransformPart;
    /** Includes this intermediate transform as part of the result */
    collect(): TransformPart;
    /** Produces a new series where each value is the average of all of the values at each timestamp */
    avg(): TransformPart;
    /** Produces a new series where each value is the sum of all of the values at each timestamp */
    sum(): TransformPart;
    /** Labels this series */
    label(label: string): TransformPart;
    /** Produces a new series that counts the number of series with values in the input */
    count(): TransformPart;
    /** Adds the specified constant quantity to all values */
    add(summand: number): TransformPart;
    /** Subtracts the specified constant quantity from all values */
    sub(substrahend: number): TransformPart;
    /** Multiplies all values by the specified constant quantity */
    mul(factor: number): TransformPart;
    /** Divides all values by the specified constant quantity */
    div(divisor: number): TransformPart;
    /** Performs a logarithm on all values with the specified constant base */
    log(base: number): TransformPart;
    /** Aligns all series to have the specified number of data points */
    resample(numValues: number): TransformPart;
    /** Produces a set of new series by specified condition */
    where(condition: Condition): TransformPart;
    /** Populates missing (NaN) values with two-point linear regression using the specified tolerance for maximum range of missing data */
    interpolate(countOrDuration: Object): TransformPart;
    /** Produces a set of series with the top 'count' (specified) largest values at each timestamp */
    top(count: number): TransformPart;
    /** Produces a set of series with the bottom 'count' (specified) smallest values at each timestamp */
    bottom(count: number): TransformPart;
    /** Produces a new series with the smallest values at each timestamp */
    min(): TransformPart;
    /** Produces a new series with the largest values at each timestamp */
    max(): TransformPart;
    /** Produces a new series with the standard deviation of the values at each timestamp */
    stddev(): TransformPart;
    /** Produces a new series with the median of the values at each timestamp */
    median(): TransformPart;
    /** Produces a new series with the values filtered (AVG, MAX, MIN or LAST) by sliding windows */
    filter(_aggregator: string, _window: string): TransformPart;
    /** Fits the series to the specified model using the specified parameters */
    fit(_params: Object): TransformPart;
    /** Produces a new series with the values filtered (AVG, MAX, MIN or LAST) by non-overlapping windows */
    partition(
        _aggregator: string,
        _window: string,
        _base: string
    ): TransformPart;
    /** Produces a set of series where each is one of the specified percentiles of all of the data */
    fractiles(fractions: number[]): TransformPart;
    /** Rounds all values to the specified precision */
    round(precision: number): TransformPart;
    /** Ceils all values to the specified precision */
    ceil(precision: number): TransformPart;
    /** Floors all values to the specified precision */
    floor(precision: number): TransformPart;
    /** Limits the number of data points in each series to the specified count */
    limit(count: number): TransformPart;
}
/** An object that contains a transform execution result */
declare class TransformResult {
    constructor();
    /** Returns a series with the specified label */
    getByLabel(label: string): Data;
    /** Returns the all series of this TransformResult in the form of an array */
    toArray(): Data[];
    /** Returns this result's series, assuming that there is a single resultant series */
    getData(): Data;
    /** Returns a mapping of group names to their series */
    byGroup(): map;
}
/** Stores a single series of MetricBase data */
declare class Data {
    constructor();
    /** Returns the label of this series */
    getLabel(): string;
    /** Returns the name of the metric this series operates on */
    getMetricName(): string;
    /** Returns the name of the table this series operates on */
    getTableName(): string;
    /** Returns the value of the subject this series operates on */
    getSubject(): string;
    /** Returns the start time of this series */
    getStart(): GlideDateTime;
    /** Returns the end time of this series */
    getEnd(): GlideDateTime;
    /** Returns the period of this series */
    getPeriod(): number;
    /** Returns the number of values in this series */
    size(): number;
    /** Returns the values in this series in the form of an array of numbers */
    getValues(): number[];
    /** Converts this series into a model string */
    toModelString(): string;
    /** Converts the specified model string into a series */
    fromModelString(model: string): Data;
}
/** Interacts with the MetricBase database */
declare class Client {
    constructor();
    /** Uses the specified DataBuilder to put data into MetricBase */
    put(dataBuilder: DataBuilder): void;
    /** Performs the specified transform(s) over the specified range */
    transform(o1: Object, o2: GlideDateTime, o3: GlideDateTime): Object;
}
/** Builds data to put into MetricBase */
declare class DataBuilder {
    constructor();
    /** Adds the specified value to the data at the specified time */
    add(start: GlideDateTime, value: number): DataBuilder;
}
// @ts-ignore
declare class JavaIterator {
    next(): any;
    hasNext(): boolean;
}
// @ts-ignore
declare class JavaSet {
    // @ts-ignore
    iterator(): Iterator;
    contains(item: any): boolean;
    toArray(): any[];
}

declare class Hashtable<T> {
    get(key: T): unknown;
    put(key: any, value: any): any;
    // @ts-ignore
    keySet(): Set;
    toString(): string;
}

declare class GlideLDAPResult<T = any> {
    hasMore(): boolean;
    next(): Hashtable<T>;
}

declare class GlideLDAP {
    /**
     * Returns the configuration that is used for instance. Call
     * {@link GlideLDAP#setConfigID} before calling this method
     * protected ArrayList fBinaryAttributes = GlideProperties.getArrayList("glide.ldap.binary_attributes", "objectsid");
     * protected boolean fVerbose = GlideProperties.getBoolean("glide.ldap.listen.verbose");
     * protected boolean fFollowRefs = GlideProperties.getBoolean("glide.ldap.follow_referral");
     *
     * env.put("java.naming.factory.initial", this.fInitialContextFactory);
     * env.put("java.naming.provider.url", this.fLDAPUrl);
     * env.put("java.naming.ldap.derefAliases", "never");
     * env.put("java.naming.security.protocol", "ssl");
     * if (this.fFollowRefs) {
     *   env.put("java.naming.referral", "follow");
     * }
     * if (!StringUtil.nil(this.fDN)) {
     *   env.put("java.naming.security.principal", this.fDN);
     *   env.put("java.naming.security.credentials", this.fPassword);
     *   env.put("java.naming.security.authentication", "simple");
     * } else {
     *   env.put("java.naming.security.authentication", "none");
     * }
     *
     * env.put("java.naming.ldap.attributes.binary", StringUtil.join(this.fBinaryAttributes, " "));
     * Integer timeout = new Integer(this.fLdapTimeout * 1000);
     * env.put("com.sun.jndi.ldap.connect.timeout", timeout.toString());
     * timeout = new Integer(this.fLdapReadTimeout * 1000);
     * env.put("com.sun.jndi.ldap.read.timeout", timeout.toString());
     *
     */
    setup(): Hashtable<string>;
    /**
     * Sets the LDAP configuration for the instance of GlideLDAP and
     * initializes some of the configuration
     * @param sysId ldap_server_config.sys_id
     */
    setConfigID(sysId: string): void;
    getMatching(
        rdnAddOn: string,
        search: string,
        initialQuery: boolean,
        maxRecords: number
    ): GlideLDAPResult;
    getSearchRDN(rdnAddOn: string): string;
    authenticate(dn: string, password: string, user: string): boolean;
    getLDAPRecord(name: string, rdn: string): Hashtable<string>;
    getMatching(
        rdnAddOn: string,
        search: string,
        initialQuery: boolean,
        maxRecords: number
    ): GlideLDAPResult;
    getLDAPRecord(name: string, rdn: string): Hashtable<string>;
}
interface GlideHTTPHeader {}
interface SOAPResponse {}
interface WSSoapRequestDocument extends Object {}
interface body extends RESTAPIRequestBody {}
interface dataStream extends GlideScriptableInputStream {}
interface Condition {}
interface map {}

declare namespace global {
    class JavaArray {
        size(): number;
        get(index: number): any;
    }

    class ArrayUtil {
        /**
         * Merge two arrays.
         */
        concat<T>(...arrays: T[][]): T[];

        /**
         * Searches the array for the specified element. Returns true if the element
         * exists in the array, otherwise returns false.
         */
        contains<T>(array: T[], obj: T): boolean;

        /**
         * Converts a Java object to an array.
         */
        convertArray(a: JavaArray | any[]): any[];

        /**
         * Finds the differences between two or more arrays.
         * Any number of arrays can be provided as parameters.
         */
        diff<T>(a: T[], b: T[]): T[];

        /**
         * Returns an array from the specified object.
         */
        ensureArray<T>(obj: T | T[]): T[];

        /**
         * Searches the array for the element. Returns the element index or -1 if not found.
         */
        indexOf<T>(array: T[], element: T): number;

        /**
         * Finds the elements present in all arrays.
         * Any number of arrays can be provided as parameters.
         */
        intersect<T>(...arrays: T[][]): T[];

        /**
         * Merge two or more arrays.
         * Any number of arrays can be provided as parameters.
         */
        union<T>(...arrays: T[][]): T[];

        /**
         * Removes duplicate items from an array.
         */
        unique<T>(a: T[]): T[];
    }

    class DurationCalculator {
        constructor();

        /**
         * * Set the schedule and time zone to be used for calculating the due date
         */
        setSchedule(scheduleId: string, timezone?: string): void;

        setTimeZone(timezone: string): void;

        /**
         * Set the start date/time for the duration calculations
         * (expects a value in GMT)
         *
         * If 'start' is blank, use current date/time
         */
        setStartDateTime(start: GlideDateTime | string): void;

        /**
         * Get the this.endDateTime property that was set by calcDuration/calcRelativeDuration
         * indicating the end date and time for the duration.
         */
        getEndDateTime(): GlideDateTime;

        /**
         * Get the this.seconds property that was set by calcDuration/calcRelativeDuration
         * indicating the total number of seconds of work to be performed for the duration.
         *
         * (Note: this is the total work time, not the total time between start and end times
         * and may be used to determine percentages of the work time)
         */
        getSeconds(): number;

        /**
         * Get the this.totalSeconds property that was set by calcDuration/calcRelativeDuration
         * indicating the total number of seconds between the start and end times of the duration.
         */
        getTotalSeconds(): number;

        /**
         * Get the (actual) duration, between startTime and endTime, within the already specified schedule
         * (and optionally overridden timezone)
         * Sets this.endDateTime (for completeness), this.seconds, and this.totalSeconds.
         * NB. returns 0 if endTime is before startTime
         */
        calcScheduleDuration(
            startTime: GlideDateTime | string,
            endTime: GlideDateTime | string
        ): number;

        /**
         * Calculate the end date and time.
         *
         * Upon completion this.endDateTime, this.seconds and this.totalSeconds properties
         * will be set to indicate the results of the calculation
         */
        calcDuration(seconds: number): boolean;

        /**
         * Calculate the duration using the specified relative duration script.
         *
         * Upon completion the this.endDateTime and this.seconds properties will
         * be set to indicate the results of the calculation
         * @param relativeDurationID cmn_relative_duration.sys_id
         */
        calcRelativeDuration(relativeDurationID: string): object;

        /**
         * Is 'time' of day after the time of day specified by glideDateTime?
         * @param glideDateTime if glideDateTime is blank, use this.startDateTime
         * @param time formatted as hh:mm:ss
         */
        isAfter(glideDateTime: GlideDateTime, time: string): boolean;

        /**
         * Called from relative duration definitions, initiated by calcRelativeDuration(), as
         *    calculator.calcRelativeDueDate(calculator.startDateTime, days);
         *
         * Calculate the due date starting at 'start' and adding 'days' using the
         * schedule and time zone.  When we find the day that the work is due on,
         * set the time to 'endTime' of that day.
         *
         * If there are not enough days left in the schedule, use the last day in the schedule
         * return false, if there were no days in the schedule
         *
         *    endTime is specified as "hh:mm:ss" or blank to indicate the end of
         *    the work day
         *
         * Upon completion, this.endDateTime, this.seconds and this.totalSeconds properties will be set
         * to indicate the results of the calculation.
         * @param start GlideDate time to use as start of relative duration
         * @param days Number of days for the duration
         * @param endTime Time in hh:mm:ss format that represents the time at end of the day
         */
        calcRelativeDueDate(
            start: GlideDateTime,
            days: number,
            endTime?: string
        ): boolean;
    }

    /**
     * ServiceNow TableUtils - TypeScript Definition File
     * Utility class for managing ServiceNow tables, extensions, and hierarchy operations.
     */

    /**
     * Utility class for table operations in ServiceNow
     */
    class TableUtils {
        /**
         * The name of the table this instance operates on
         */
        tableName: string;

        /**
         * Creates a new TableUtils instance
         * @param tableName - The name of the table to operate on
         */
        constructor(tableName?: string);

        /**
         * Determines if a table can be staged
         * @returns True if the table can be staged, false otherwise
         */
        canStage(): boolean;

        /**
         * Drops a table from the database
         * @param tableName - The name of the table to drop
         */
        drop(tableName: string): void;

        /**
         * Checks if the table exists in the database
         * @returns True if the table exists, false otherwise
         */
        tableExists(): boolean;

        /**
         * Validates if a field name exists on the table
         * @param fieldName - The name of the field to validate
         * @returns True if the field is valid, false otherwise
         */
        isValidField(fieldName: string): boolean;

        /**
         * Creates a class field for a table (used in table hierarchy)
         * @param tableName - The name of the table
         * @param scopeId - The scope ID for the table
         * @returns The table name
         */
        createClassField(tableName: string, scopeId: string): string | undefined;

        /**
         * Drops a table and cleans up associated records
         * @param tableName - The name of the table to drop and clean
         */
        dropAndClean(tableName: string): void;

        /**
         * Drops a table and all of its extensions
         * @param tableName - The name of the table to drop with extensions
         */
        dropTableAndExtensions(tableName: string): void;

        /**
         * Sanitizes a table name to adhere to database restrictions (80 chars, lowercase, alphanumeric + underscores)
         * @param tableName - The table name to sanitize
         * @returns The sanitized table name
         */
        sanitizeTableName(tableName: string): string;

        /**
         * Gets a valid scoped table name (prefixed with u_ or application scope)
         * @param sys_scope - The system scope or table name
         * @param tableName - Optional table name if sys_scope is actually the scope
         * @returns The valid scoped table name
         */
        getValidTableName(sys_scope: string, tableName?: string): string;

        /**
         * Creates a table dynamically from a reference field value
         * @param current - The table record to be created (GlideRecord)
         * @param value - The value/label for the new table
         * @param parent - The dictionary field record with the dynamic reference
         * @param grandparent - The sys_db_object table record of the dictionary field
         * @param scopeParam - Optional scope parameter
         * @returns The name of the created or existing table
         */
        createTableFromDynamicReference(
            current: GlideRecord,
            value: string,
            parent?: GlideRecord,
            grandparent?: GlideRecord,
            scopeParam?: string
        ): string;

        /**
         * Sets up module and user role metadata for dynamic reference table creation
         * @param current - The table record being created
         * @param parent - The dictionary field record with the dynamic reference
         * @param grandparent - The sys_db_object table record
         * @param newTableName - The valid table name of the dynamic table
         */
        setUpModuleAndUserRoleForDynamicReferenceTableCreate(
            current: GlideRecord,
            parent: GlideRecord,
            grandparent: GlideRecord,
            newTableName: string
        ): void;

        /**
         * Returns an array of table names in the table parent hierarchy
         * @returns ArrayList of table names in the hierarchy
         */
        getTables(): JavaArray;

        /**
         * Returns an array of table extensions (child tables)
         * @returns ArrayList of table extension names
         */
        getTableExtensions(): JavaArray;

        /**
         * Returns an array of all table extensions including the base table
         * @returns ArrayList of all extension names
         */
        getAllExtensions(): JavaArray;

        /**
         * Gets the absolute base table in the hierarchy
         * For example, cmdb_ci_server would return cmdb_ci
         * @returns The absolute base table name
         */
        getAbsoluteBase(): string;

        /**
         * Returns a list of all classes participating in the hierarchy of the given table
         * @returns List of all classes in the hierarchy
         */
        getHierarchy(): string[];

        /**
         * Checks if the table has extensions (child tables)
         * @returns True if the table has extensions, false otherwise
         */
        hasExtensions(): boolean;

        /**
         * Checks if the table is a base class (has no parents but has extensions)
         * @returns True if the table is a base class, false otherwise
         */
        isBaseClass(): boolean;

        /**
         * Checks if the table is a solo class (has no parents and no extensions)
         * @returns True if the table is a solo class, false otherwise
         */
        isSoloClass(): boolean;

        /**
         * Cleans up orphaned rows in hierarchical table structures before dropping
         * No-op for flattened tables (TPH)
         * @param tableName - The name of the table to clean
         */
        cleanHierarchicalData(tableName: string): void;

        /**
         * Internal method marker
         * @private
         */
        _dropFromDatabase(): void;

        /**
         * Returns the class identifier
         * @private
         * @returns "TableUtils"
         */
        _z(): string;
    }

    /**
     * Utility class for adding ServiceNow records and their dependencies to update sets
     */
    class addToUpdateSetUtils {
        /**
         * URL reference for update set batching documentation
         */
        updateSetBatchingURL: string;
        
        /**
         * Whether to include users when adding groups to update sets
         */
        includeUsersWithGroups: boolean;
        
        /**
         * Whether to include attachments when adding records to update sets
         */
        includeAttachments: boolean;
        
        /**
         * Whether to suppress photo attachments
         */
        suppressPhotoAttachments: boolean;
        
        /**
         * Whether to prevent adding records to the default update set
         */
        preventDefaultUpdateSet: boolean;
        
        /**
         * Whether to prevent adding protected NLU models
         */
        preventProtectedNLUModels: boolean;
        
        /**
         * Whether to include database view tables
         */
        includeDbViewTables: boolean;
        
        /**
         * ServiceNow update set API instance
         */
        updateSetAPI: any;
        
        /**
         * Current client session
         */
        clientSession: GlideSession;
        
        /**
         * System ID of this script include
         */
        scriptSysID: string;
        
        /**
         * API name of this script include
         */
        scriptAPIName: string;
        
        /**
         * Array of table names that should be excluded from update sets
         */
        excludedTables: string[];
        
        /**
         * Performance Analytics tracking data
         */
        PAData?: {
            sysPortalIDs: string[];
            indicatorIDs: string[];
            breakdownIDs: string[];
        };
        
        /**
         * Initialize the utility with user preferences from system properties
         */
        initialize(): void;
        
        /**
         * Check if the "Add to Update Set" UI Action should be displayed for a record
         * @param tableRec - The record to check
         * @returns True if the UI action should be displayed
         */
        checkDisplayCondition(tableRec: GlideRecord): boolean;
        
        /**
         * Main function to add a record and its dependencies to an update set
         * @param tableRec - The record to add to the update set
         */
        addToUpdateSet(tableRec: GlideRecord): void;
        
        /**
         * Compile and return the confirmation message after adding records to update sets
         * @param isList - Whether the action was performed from a list view
         * @returns HTML formatted confirmation message
         */
        compileConfirmationMessage(isList?: boolean): string;
        
        /**
         * Check the table type and add the record with appropriate dependencies
         * @param tableRec - The record to process
         * @param tableName - The table name
         */
        checkTable(tableRec: GlideRecord, tableName: string): void;
        
        /**
         * Save a record to the current update set
         * @param tableRec - The record to save
         * @param validRecordCheck - Whether to validate the record exists (default: true)
         * @param executeCustomScript - Whether to execute custom scripts (default: true)
         */
        saveRecord(tableRec: GlideRecord, validRecordCheck?: boolean, executeCustomScript?: boolean): void;
        
        /**
         * Add a scheduled job to the update set
         * @param scheduleJobFields - Object containing scheduled job field names and values
         */
        addScheduledJob(scheduleJobFields: Record<string, string>): void;
        
        /**
         * Parse a template string into an object
         * @param templateString - Template string with field=value pairs separated by ^
         * @returns Object with parsed field/value pairs
         */
        parseTemplateString(templateString: string): Record<string, string>;
    }
}

declare class ActionUtils {
    postInsert(current: GlideRecord): void;
}

declare namespace sn_atf {
    class UserTestProcessor {
        copyTest(sourceTestSysId: string): string;
    }
}

declare interface XMLDocument {
    /**
     * Uses xpath to return a node of type org.w3c.dom.Node.
     * Look at the JavaDoc for org.w3c.dom.Node for more information.
     */
    getNode(xpath: string): any;
}

declare class GlideSysAttachment {
    /** Returns comma delimited list of attachments that were copied */
    copy(
        sourceTable: string,
        sourceId: string,
        targetTable: string,
        targetId: string
    ): string;
    deleteAttachment(attachmentId: string): void;
    /** Returns unexecuted GlideRecord with list of attachment metadata */
    getAttachments(tableName: string, sysId: string): GlideRecord;
    /** Attachment contents as a string. Returns up to 5MB of data */
    getContent(sysAttachment: GlideRecord): string;
    /** Attachment contents as a base64 encoded string. Returns up to 5MB of data */
    getContentBase64(sysAttachment: GlideRecord): string;
    /** Returns stream given sys_id of an attachment. Can use the GlideTextReader API to read the content of stream */
    getContentStream(sysId: string): GlideScriptableInputStream;
    /** Attaches a specified attachment to the specified record. Returns attachment sys_id. Returns null if the attachment was not added */
    write(
        record: GlideRecord,
        fileName: string,
        contentType: string,
        content: string
    ): string;
    writeBase64(
        record: GlideRecord,
        fileName: string,
        contentType: string,
        contentAsBase64: string
    ): string;
    writeContentStream(
        record: GlideRecord,
        fileName: string,
        contentType: string,
        inputStream: GlideScriptableInputStream
    ): string;
}

declare namespace sn_ih {
  /**
   * Builder for creating XMLStreamingAPI objects.
   * Use this to configure attachment mode, expiration, etc.
   */
  class XMLStreamingBuilder {
    constructor();

    /**
     * Creates the XML document as an attachment in the Streaming Attachments table.
     */
    withAttachment(): this;

    /**
     * Sets an expiration date/time for the attachment.
     * Requires withAttachment() to be called first.
     */
    expiresAt(dateTime: GlideDateTime): this;

    /**
     * Builds and returns an XMLStreamingAPI object.
     */
    build(): XMLStreamingAPI;
  }

  /**
   * Streaming XML writer for building large XML payloads.
   * Returned by XMLStreamingBuilder.build().
   */
  class XMLStreamingAPI {
    /** Closes the stream and releases resources. */
    close(): void;

    /** Enables pretty-print formatting for subsequent elements. */
    enablePrettyPrint(): this;

    /** Disables pretty-print formatting. */
    disablePrettyPrint(): this;

    /** Starts the XML document with an optional root element and namespace map. */
    startDocument(rootElement?: string, namespaceDefinitionMap?: Record<string, string>): this;

    /** Ends the XML document. */
    endDocument(): this;

    /** Starts a new element with optional namespace and attribute maps. */
    startElement(
      name: string,
      namespaceMap?: Record<string, string>,
      attributeMap?: Record<string, string>,
      prefix?: string
    ): this;

    /** Ends the most recent element. */
    endElement(): this;

    /** Writes a simple element with text content. */
    writeTextElement(name: string, text: string, prefix?: Record<string, string>): this;

    /** Writes multiple elements from an array of values. */
    writeArray(elementName: string, data: string[], wrappingElement: string): this;

    /** Adds a single attribute to the current element. */
    writeAttribute(name: string, value: string): this;

    /** Adds multiple attributes to the current element. */
    writeAttributes(attributeMap: Record<string, string>): this;

    /** Adds a namespace declaration to the current element. */
    writeNamespace(prefix: string, namespaceURI?: string): this;

    /** Adds multiple namespaces to the current element. */
    writeNamespaces(namespaceMap: Record<string, string>): this;

    /** Writes raw character data inside the current element. */
    writeCharacters(text: string): this;

    /** Writes a comment node. */
    writeComment(comment: string): this;

    /** Writes a CDATA section. */
    writeCData(data: string): this;

    /** Writes a CDATA element with optional prefix map. */
    writeCDataElement(name: string, data?: string, prefix?: Record<string, string>): this;

    /** Writes a document type definition. */
    writeDtd(dtd: string): this;

    /** Returns the generated XML as a string (≤ 5 MB). */
    getXMLString(): string;

    /** Returns the sys_id of the generated attachment (≤ 200 MB). */
    getAttachmentId(): string;
  }
}

declare class AMBClient {
  connect(): void;
  disconnect(): void;
  abort(): void;
  batch(data: any): void;
  cancelTransaction(data: any): void;
  extendSession(): void;
  reestablishSession(): void;
  loginComplete(): void;

  getBaseURL(): string;
  getClientId(): string;
  getClientWindow(): Window;
  getConnectionState(): string;
  getConnectionEvents(): string[];
  getEvents(): string[];
  getState(): string;
  getServerConnection(): any;
  getTokenManagementExtension(): any;

  getChannel(name: string, filter?: any, callback?: Function): any;
  getChannel0(data: any, params?: any): any;
  getChannels(): any[];
  getRecordWatcherChannel(
    table: string,
    filter?: any,
    callback?: Function,
    data?: any,
    params?: any
  ): any;

  isLoggedIn(): boolean;

  subscribeToEvent(name: string, filter?: any, callback?: Function): void;
  unsubscribeFromEvent(name: string, filter?: any): void;

  registerExtension(name: string, extension: any): void;
  unregisterExtension(name: string): void;
}

declare class GlideScriptRecordUtil {
  static get(gr: GlideRecord): GlideScriptRecordUtil;
  /**
   * If record true record is a child class, but the specified record is a parent class
   * this will return the child class
   */
  getRealRecord(): GlideRecord;
  /**
   * Returns a list of field labels that have changed
   */
  getChangedFields(): string[];
  /**
   * Returns a list of field labels that have changed
   */
  getChangedFields(ignoreList: string[]): string[];
  getChanges(): GlideElement[];
  /**
   * Returns a list of field names that have changed
   */
  getChangedFieldNames(): string[];
}

declare class GlideTextReader {
    constructor(inputStream: GlideScriptableInputStream);
    readLine(): string;
    getEncoding(): string;
}

declare namespace sn_fd {
  interface FlowAPI {
    cancel(contextId: string, reason?: string): void;
    executeAction(name: string, inputs: Record<string, any>, timeout?: number): Record<string, any>;
    executeActionQuick(name: string, inputs: Record<string, any>, timeout?: number): Record<string, any>;
    executeDataStreamAction(name: string, inputs?: Record<string, any>, timeout?: number): ScriptableDataStream;
    executeFlow(name: string, inputs: Record<string, any>, timeout?: number): void;
    executeFlowQuick(name: string, inputs: Record<string, any>, timeout?: number): void;
    executeSubflow(name: string, inputs: Record<string, any>, timeout?: number): Record<string, any>;
    executeSubflowQuick(name: string, inputs: Record<string, any>, timeout?: number): Record<string, any>;
    getErrorMessage(contextId: string): string;
    getFlowStages(scopedFlowName: string): string; // JSON string
    getOutputs(contextId: string): Record<string, any>;
    getRunner(): ScriptableFlowRunner;
    hasApprovals(scopedFlowName: string): "ALWAYS" | "CONDITIONALLY" | "NO" | "UNKNOWN";
    restartFlowFromContext(contextId: string, providedInputs?: Record<string, any>): ScriptableFlowRunnerResult;
    scheduleCancel(contextId: string, reason: string, delaySeconds?: number): void;
    sendMessage(contextSysID: string, message: string, payload: string): void;
    setEncryptedOutput(password: string): string;
    startAction(name: string, inputs: Record<string, any>): string; // returns contextId
    startActionQuick(name: string, inputs: Record<string, any>): void;
    startFlow(name: string, inputs: Record<string, any>): string; // returns contextId
    startFlowQuick(name: string, inputs: Record<string, any>): void;
    startSubflow(name: string, inputs: Record<string, any>): string; // returns contextId
    startSubflowQuick(name: string, inputs: Record<string, any>): void;
  }

  interface ScriptableDataStream {
    close(): void;
    getItemIndex(): number;
    getItemInPageIndex(): number;
    getPageIndex(): number;
    hasNext(): boolean;
    next(): any;
  }

  interface ScriptableFlowRunner {
    action(scopedActionName: string): this;
    addInput(name: string, value: any): this;
    datastream(scopedDatastreamName: string): this;
    flow(scopedFlowName: string): this;
    inBackground(): this;
    inDomain(domainId: string): this;
    inForeground(): this;
    quick(): this;
    run(): ScriptableFlowRunnerResult;
    subflow(scopedSubflowName: string): this;
    timeout(ms: number): this;
    withConnectionAliasOverride(aliasName: string, overrideName: string): this;
    withInputs(inputs: Record<string, any>): this;
  }

  interface ScriptableFlowRunnerResult {
    debug(): any;
    getContextId(): string;
    getDataStream(): ScriptableDataStream;
    getDate(): string;
    getDomainId(): string;
    getFlowObjectName(): string;
    getFlowObjectType(): string;
    getOutputs(): Record<string, any>;
  }

  const FlowAPI: FlowAPI;
}