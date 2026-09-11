/**
 * Object for managing todo tasks.
 * This object uses the Table Manager Pattern. 
 * 
 * Initial status will be DRAFT.
 * Then user will submit the task using {@link TaskManager.submit} UI Action.
 * 
 * When submitted a busines rule will trigger {@link TaskManager.onSubmit}.
 * {@link TaskManager.onSubmit} will set the assigned group and submitted by fields.
 * 
 * A member from the assigned group will then approve the task using {@link TaskManager.approve} UI Action.
 * Or a member from the assigned group will then reject the task using {@link TaskManager.reject} UI Action.
 * 
 * The task will then be in In Progress status if approved.
 * The task will be in Rejected status if rejected and the task will be inactive.
 * 
 * Once the task is in In Progress status, the assignee will complete the task using {@link TaskManager.complete} UI Action.
 * 
 * NOTE: {@link TaskManager.onQuery} is a business rule that filters the tasks that the user can see instead of a read ACL.
 * This is so the user doesn't see a message in the list view that rows have been removed due to ACLs.
 */
const TaskManager = (function() {
    /**
     * Values for x_912467_klf_todo_task.status field
     * @type {{DRAFT:string, SUBMITTED:string, IN_PROGRESS:string, COMPLETED:string, REJECTED:string, CANCELED:string}}
     */
    const STATUS = {
        DRAFT: 'draft',
        SUBMITTED: 'submitted',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        REJECTED: 'rejected',
        CANCELED: 'canceled'
    };

    const groupUtils = GroupUtils;

    class TaskManager {
        constructor() {
            this.STATUS = STATUS;
        }

        /**
         * Responsible for filtering the tasks that the user can see
         * Admin can see everything
         * User can see tasks they've submitted
         * User can see tasks that are assigned to them or their group
         * @param {GlideRecord} task 
         */
        onQuery(task) {
            if (Authenticated.isAdmin()) return;

            task.addQuery('opened_by', Authenticated.getUserSysId())
                .addOrCondition('assigned_to', Authenticated.getUserSysId())
                .addOrCondition('assigned_group', 'IN', Authenticated.getGroups());
        }

        /**
         * Called by before business rule when task is completed
         * @param {GlideRecord} task 
         */
        onComplete(task) {
            task.closed_on = new GlideDateTime();
            task.closed_by = Authenticated.getUserSysId();
        }

        /**
         * Show Reject UI Action whenever we show Approve UI Action
         * @param {GlideRecord} task x_912467_klf_todo_task to check
         * @returns {boolean}
         */
        showReject(task) {
            return this.showApprove(task);
        }

        /**
         * UI Action to approve a task. This approves the task
         * @param {GlideRecord} task x_912467_klf_todo_task to approve
         */
        reject(task) {
            task.status = STATUS.REJECTED;
            task.update();
        }

        /**
         * Returns true if user has access to "Approve" UI Action
         * Show approve when task is in progress or submitted status
         * @param {GlideRecord} task x_912467_klf_todo_task to check
         * @returns {boolean}
         */
        showApprove(task) {
            return this.canWrite(task) &&
                this.isInAssignedGroup(task) &&
                task.status == STATUS.SUBMITTED;
        }

        /**
         * UI Action to approve a task. This approves the task
         * @param {GlideRecord} task x_912467_klf_todo_task to approve
         */
        approve(task) {
            task.status = STATUS.IN_PROGRESS;
            task.update();
        }

        /**
         * Returns true if user has access to "Complete" UI Action
         * Show complete when task is in progress or submitted status
         * @param {GlideRecord} task x_912467_klf_todo_task to check
         * @returns {boolean}
         */
        showComplete(task) {
            return this.canWrite(task) &&
                task.status == STATUS.IN_PROGRESS;
        }

        /**
         * UI Action to complete a task. This completes the task
         * @param {GlideRecord} task x_912467_klf_todo_task to complete
         */
        complete(task) {
            task.status = STATUS.COMPLETED;
            task.update();
        }

        /**
         * Returns true if user can write to the task
         * User can write to the task if the task is a new record
         * if the user is the creator and the task is in draft or in_progress status
         * if the user is the original submitter of the task and the task is in draft or in_progress status
         * if the user is the assignee of the task and the task is in submitted
         * if the user is a member of the task's assigned group and the task is in submitted
         * @param {GlideRecord} task x_912467_klf_todo_task to check
         */
        canWrite(task) {
            return task.isNewRecord() ||
                (this.isSubmitter(task) && (task.status == STATUS.DRAFT || task.status == STATUS.IN_PROGRESS)) ||
                (this.isCreator(task) && (task.status == STATUS.DRAFT || task.status == STATUS.IN_PROGRESS)) ||
                (this.isAssigned(task) && (task.status == STATUS.SUBMITTED)) ||
                (this.isInAssignedGroup(task) && (task.status == STATUS.SUBMITTED));
        }

        /**
         * Returns true if user can read the task
         * if task is new record
         * if the user is the creator
         * if the user is the original submitter of the task
         * if the user is the assignee of the task
         * if the user is a member of the task's group 
         * @param {GlideRecord} task x_912467_klf_todo_task to check
         * @returns {boolean} True if user can read the task
         */
        canRead(task) {
            return task.isNewRecord() ||
                this.isSubmitter(task) ||
                this.isCreator(task) ||
                this.isAssigned(task) ||
                this.isInAssignedGroup(task);
        }

        /**
         * Returns true if user is in assigned group
         * @param {GlideRecord} task
         * @returns {boolean}
         */
        isInAssignedGroup(task) {
            return Authenticated.isMemberOf(task.assigned_group) || Authenticated.isAdmin();
        }

        /**
         * Returns true if user is assigned to the task
         * @param {GlideRecord} task
         * @returns {boolean}
         */
        isAssigned(task) {
            return task.assigned_to == Authenticated.getUserSysId();
        }

        /**
         * Returns true if user opened the task
         * @param {GlideRecord} task
         * @returns {boolean}
         */
        isCreator(task) {
            return task.opened_by == Authenticated.getUserSysId();
        }

        /**
         * Returns true if the user is the original submitter of the task
         * @param {GlideRecord} task 
         * @returns {boolean}
         */
        isSubmitter(task) {
            return task.submitted_by == Authenticated.getUserSysId();
        }

        /**
         * Called by business rule when task is submitted
         * @param {GlideRecord} task x_912467_klf_todo_task submitted task
         */
        onSubmit(task) {
            // set submitted fields
            task.submitted_by = Authenticated.getUserSysId();
            task.submitted_on = new GlideDateTime();
            task.assigned_group = this.getDefaultAssignedGroup();
        }

        /**
         * Returns the default assigned group for the task
         * @returns {string} sys_id of the default assigned group
         */
        getDefaultAssignedGroup() {
            const groupName = gs.getProperty('x_912467_klf_todo.default_assigned_group');
            const group = groupUtils.getGroupByName(groupName);
            if (group) {
                return group.getUniqueValue();
            } else {
                gs.error(`Default assigned group ${groupName} not found. Please update x_912467_klf_todo.default_assigned_group property`);
                return '';
            }
        }


        /**
         * Returns true if user has access to "Submit" UI Action
         * @param {GlideRecord} task x_912467_klf_todo_task to check
         * @returns {boolean} True if user has access to "Submit" UI Action
         */
        showSubmit(task) {
            return this.canWrite(task) &&
                (task.isNewRecord() || task.status == STATUS.DRAFT);
        }

        /**
         * UI Action to submit a task. This initiates
         * the first state in the workflow.
         * @param {GlideRecord} task x_912467_klf_todo_task to submit
         */
        submit(task) {
            task.status = STATUS.SUBMITTED;
            task.update();
        }

        /**
         * Returns true if user has access to "Save" UI Action
         * @param {GlideRecord} task x_912467_klf_todo_task to check
         * @returns {boolean} True if user has access to "Save" UI Action
         */
        showSave(task) {
            if (this.showSaveAsDraft(task)) return false;

            if (Authenticated.isAdmin()) return true;

            return this.canWrite(task) &&
                (task.status == STATUS.SUBMITTED || task.status == STATUS.IN_PROGRESS);
        }

        /**
         * UI Action to save a task. This saves the task
         * @param {GlideRecord} task x_912467_klf_todo_task to save
         */
        save(task) {
            task.update();
        }

        /**
         * Returns true if user has access to "Save as Draft" UI Action
         * @param {GlideRecord} task x_912467_klf_todo_task to check
         * @returns {boolean} True if user has access to "Save as Draft" UI Action
         */
        showSaveAsDraft(task) {
            return task.isNewRecord() ||
                task.status == STATUS.DRAFT;
        }

        /**
         * UI Action to save a task as draft. When task is
         * saved as draft, it is not submitted to the workflow.
         * @param {GlideRecord} task x_912467_klf_todo_task to save as draft
         */
        saveAsDraft(task) {
            task.status = STATUS.DRAFT;
            task.update();
        }

    }

    return new TaskManager();
})();