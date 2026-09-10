function onChange(control, oldValue, newValue, isLoading, isTemplate) {
    if (isLoading || newValue === '') {
        return;
    }

    // Make sure due date is in the future
    // Date will look like 2024-08-25
    // Make date an ISO 8601 date string
    var iso8601Date = newValue + 'T00:00:00';
    var dueDate = new Date(iso8601Date);
    var currentDate = new Date();
    if (dueDate <= currentDate) {
        g_form.clearValue('due_date');
        g_form.showErrorBox('due_date', 'Due date must be in the future.');
    }

}