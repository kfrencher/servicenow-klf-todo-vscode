// @ts-ignore
function TaskManagerTest(outputs, steps, params, stepResult, assertEqual) {
    describe('TaskManagerTest', function() {
        const impersonatorSysId = gs.getUserID();

        /**
         * Represents a random other user that is not the common user
         * @returns {GlideRecord}
         */
        function createOtherUser() {
            return testUtils.getOrCreateUser('KLF_Todo_other_user');
        }

        /**
         * Creates a non-persisted todo that has all the required fields
         * set but has not been persisted
         * @param {global.KLF_TestUtils} testUtils
         * @returns {GlideRecord} x_912467_klf_todo_task
         */
        function createTask(testUtils) {
            const todo = new GlideRecord('x_912467_klf_todo_task');
            todo.newRecord();
            todo.label = 'Test Task';
            testUtils.recordTracker.trackByGlideRecord(todo);
            return todo;
        }

        /**
         * Returns a task that has been submitted and approved
         * If openedBy is not provided, the common user will be used
         * @param {global.KLF_TestUtils} testUtils 
         * @param {GlideRecord} [openedBy]
         * @returns {{task: GlideRecord, submitter: GlideRecord, openedBy: GlideRecord}}
         */
        function createDraftTask(testUtils, openedBy) {
            const _openedBy = openedBy || testUtils.getOrCreateCommonUser();
            testUtils.impersonateUser(_openedBy.getUniqueValue());

            const task = createTask(testUtils);
            TaskManager.saveAsDraft(task);

            testUtils.impersonateUser(impersonatorSysId);

            return {
                task: task,
                submitter: _openedBy,
                openedBy: _openedBy
            };
        }

        /**
         * Returns a task that has been submitted and approved
         * If openedBy is not provided, the common user will be used
         * 
         * NOTE: If you want to specify the approver you must call createApprover() first
         * @param {global.KLF_TestUtils} testUtils 
         * @param {GlideRecord} [openedBy]
         * @returns {{task: GlideRecord, submitter: GlideRecord, openedBy: GlideRecord}}
         */
        function createSubmittedTask(testUtils, openedBy) {
            const _openedBy = openedBy || testUtils.getOrCreateCommonUser();
            testUtils.impersonateUser(_openedBy.getUniqueValue());

            const task = createTask(testUtils);
            TaskManager.submit(task);

            testUtils.impersonateUser(impersonatorSysId);

            return {
                task: task,
                submitter: _openedBy,
                openedBy: _openedBy
            };
        }

        /**
         * Returns a task that has been submitted and approved
         * If openedBy is not provided, the common user will be used
         * @param {global.KLF_TestUtils} testUtils 
         * @param {GlideRecord} [openedBy]
         * @returns {{task: GlideRecord, submitter: GlideRecord, openedBy: GlideRecord, approverUser: GlideRecord}}
         */
        function createApprovedTask(testUtils, openedBy) {
            const { approverUser } = createApprover(testUtils);
            const _openedBy = openedBy || testUtils.getOrCreateCommonUser();

            testUtils.impersonateUser(_openedBy.getUniqueValue());
            const task = createTask(testUtils);
            TaskManager.submit(task);

            testUtils.impersonateUser(approverUser.getUniqueValue());
            TaskManager.approve(task);

            testUtils.impersonateUser(impersonatorSysId);

            return {
                task: task,
                submitter: _openedBy,
                openedBy: _openedBy,
                approverUser: approverUser
            };
        }

        /**
         * Returns a task that has been submitted and approved
         * If openedBy is not provided, the common user will be used
         * @param {global.KLF_TestUtils} testUtils 
         * @param {GlideRecord} [openedBy]
         * @returns {{task: GlideRecord, submitter: GlideRecord, openedBy: GlideRecord, approverUser: GlideRecord}}
         */
        function createInProgressTask(testUtils, openedBy) {
            const approvedParts = createApprovedTask(testUtils, openedBy);
            const {
                task,
                approverUser
            } = approvedParts;

            testUtils.impersonateUser(approverUser.getUniqueValue());
            TaskManager.approve(task);

            testUtils.impersonateUser(impersonatorSysId);

            return approvedParts;
        }

        /**
         * Returns a task that has been submitted and approved
         * If openedBy is not provided, the common user will be used
         * @param {global.KLF_TestUtils} testUtils 
         * @param {GlideRecord} [openedBy]
         * @returns {{task: GlideRecord, submitter: GlideRecord, openedBy: GlideRecord, approverUser: GlideRecord}}
         */
        function createCompletedTask(testUtils, openedBy) {
            const result = createInProgressTask(testUtils, openedBy);
            const { task, openedBy: _openedBy } = result;

            testUtils.impersonateUser(_openedBy.getUniqueValue());
            TaskManager.complete(task);

            testUtils.impersonateUser(impersonatorSysId);

            return result;
        }


        /**
         * NOTE: This must be called before the task is submitted. This intentionally
         * replaces the default approver group with a new one that has the approver role
         * @param {global.KLF_TestUtils} testUtils 
         * @returns {{approverUser:GlideRecord, approverGroup:GlideRecord}}
         */
        function createApprover(testUtils) {
            const approverGroup = testUtils.getOrCreateGroup('KLF_Todo_Approver');
            spyOn(TaskManager, 'getDefaultAssignedGroup').and.returnValue(approverGroup.getUniqueValue());
            testUtils.addRoleToGroup(approverGroup, 'x_912467_klf_todo.approver');
            const approverUser = testUtils.getOrCreateUser('KLF_Todo_Approver_User');
            testUtils.addUserToGroup(approverGroup, approverUser);
            return { approverUser, approverGroup };
        }

        /** @type {global.KLF_TestUtils} */
        let testUtils;

        beforeEach(function() {
            testUtils = new global.KLF_TestUtils();
        });

        afterEach(function() {
            testUtils.impersonateUser(impersonatorSysId);
            testUtils.cleanup();
        });


        describe('onQuery()', function() {
            it('general user should see their tasks', function() {
                const commonUser = testUtils.getOrCreateCommonUser();
                // Create a couple tasks the common user can see
                const task1 = createDraftTask(testUtils, commonUser).task;
                const task2 = createDraftTask(testUtils, commonUser).task;

                // Create a task the common user cannot see
                const task3 = createDraftTask(testUtils, createOtherUser()).task;

                testUtils.impersonateUser(commonUser.getUniqueValue());
                const task = new GlideRecord('x_912467_klf_todo_task');
                task.query();

                expect(task.getRowCount()).toBe(2);
            });

            it('approver should see all submitted tasks', function() {
                const { approverUser } = createApprover(testUtils);

                // Create a couple tasks for the common user
                const { task: task1 } = createSubmittedTask(testUtils);
                const { task: task2 } = createSubmittedTask(testUtils);

                // Creste a task for a different user
                const { task: task3 } = createSubmittedTask(testUtils, createOtherUser());

                testUtils.impersonateUser(approverUser.getUniqueValue());
                const task = new GlideRecord('x_912467_klf_todo_task');
                const expectedSysIds = [task1.getUniqueValue(), task2.getUniqueValue(), task3.getUniqueValue()];
                task.addQuery('sys_id', 'IN', expectedSysIds.join(','));
                task.query();

                // Approver should see all the tasks
                expect(task.getRowCount()).toBe(3);
            });
        });

        describe('canWrite()', function() {
            it('should return true if user is opened by and is in Draft', function() {
                const { task, openedBy } = createDraftTask(testUtils);
                testUtils.impersonateUser(openedBy.getUniqueValue());
                expect(TaskManager.canWrite(task)).toBe(true);
            });

            it('should return false if user didnt create task and is Draft', function() {
                // Create a task for common user
                const task = createDraftTask(testUtils).task;

                // Impersonate other user
                testUtils.impersonateUser(createOtherUser().getUniqueValue());

                expect(TaskManager.canWrite(task)).toBe(false);
            });

            it('should return true if is approver and is in Submitted', function() {
                const { approverUser } = createApprover(testUtils);
                const { task } = createSubmittedTask(testUtils);

                testUtils.impersonateUser(approverUser.getUniqueValue());

                expect(TaskManager.canWrite(task)).toBe(true);
            });

            it('should return false if user is submitter and is in Submitted', function() {
                const { task, submitter } = createSubmittedTask(testUtils);

                testUtils.impersonateUser(submitter.getUniqueValue());

                expect(TaskManager.canWrite(task)).toBe(false);
            });

            it('should return false if user is not approver and is in Submitted', function() {
                const { task } = createSubmittedTask(testUtils);

                testUtils.impersonateUser(createOtherUser().getUniqueValue());

                expect(TaskManager.canWrite(task)).toBe(false);
            });

            it('should return true if user is submitter and is in In Progress', function() {
                const { task, submitter } = createInProgressTask(testUtils);

                testUtils.impersonateUser(submitter.getUniqueValue());

                expect(TaskManager.canWrite(task)).toBe(true);
            });

            it('should return false if user is not submitter and is in In Progress', function() {
                const { task } = createInProgressTask(testUtils);

                testUtils.impersonateUser(createOtherUser().getUniqueValue());

                expect(TaskManager.canWrite(task)).toBe(false);
            });

            it('should return false if user is approver and is in In Progress', function() {
                const { task, approverUser } = createInProgressTask(testUtils);

                testUtils.impersonateUser(approverUser.getUniqueValue());

                expect(TaskManager.canWrite(task)).toBe(false);
            });

            it('should return false if user is submitter and is in Completed', function() {
                const { task, submitter } = createCompletedTask(testUtils);

                testUtils.impersonateUser(submitter.getUniqueValue());

                expect(TaskManager.canWrite(task)).toBe(false);
            });

            it('should return false if user is not submitter and is in Completed', function() {
                const { task } = createCompletedTask(testUtils);

                testUtils.impersonateUser(createOtherUser().getUniqueValue());

                expect(TaskManager.canWrite(task)).toBe(false);
            });

        });

        describe('onComplete()', function() {
            it('should set closed_on and closed_by when task set to Completed', function() {
                var { task } = createApprovedTask(testUtils);

                expect(task.closed_on.nil()).toBe(true);
                expect(task.closed_by.nil()).toBe(true);

                testUtils.impersonateCommonUser();
                TaskManager.complete(task);

                expect(task.closed_on.nil()).toBe(false);
                expect(task.getValue('closed_by')).toBe(gs.getUserID());
            });
        });

        describe('showReject()', function() {
            it('should return false when task is in Draft', function() {
                const { task } = createDraftTask(testUtils);
                expect(TaskManager.showReject(task)).toBe(false);
            });

            it('should show reject when task is in Submtted and user is approver', function() {
                const { approverUser } = createApprover(testUtils);
                const { task } = createSubmittedTask(testUtils);

                testUtils.impersonateUser(approverUser.getUniqueValue());

                expect(TaskManager.showReject(task)).toBe(true);
            });

            it('should not show reject when task is in Submtted and user is not approver', function() {
                const { task, submitter } = createSubmittedTask(testUtils);

                testUtils.impersonateUser(submitter.getUniqueValue());

                expect(TaskManager.showReject(task)).toBe(false);
            });

            it('should return false when task is in Completed', function() {
                const { task } = createCompletedTask(testUtils);
                expect(TaskManager.showReject(task)).toBe(false);
            });
        });

        describe('reject()', function() {
            it('should set state to Rejected', function() {
                const { approverUser } = createApprover(testUtils);
                const task = createSubmittedTask(testUtils).task;

                testUtils.impersonateUser(approverUser.getUniqueValue());
                TaskManager.reject(task);

                expect(task.getValue('status')).toBe(TaskManager.STATUS.REJECTED);
            });
        });

        describe('showApprove()', function() {
            it('should return false when task is in Draft', function() {
                const task = createDraftTask(testUtils).task;
                expect(TaskManager.showApprove(task)).toBe(false);
            });

            it('should show approve when task is in Submtted and user is approver', function() {
                const { approverUser } = createApprover(testUtils);
                const task = createSubmittedTask(testUtils).task;

                testUtils.impersonateUser(approverUser.getUniqueValue());
                expect(TaskManager.showApprove(task)).toBe(true);
            });

            it('should not show approve when task is in Submtted and user is not approver', function() {
                const { task, submitter } = createSubmittedTask(testUtils);

                testUtils.impersonateUser(submitter.getUniqueValue());

                expect(TaskManager.showApprove(task)).toBe(false);
            });

            it('should return false when task is in Completed', function() {
                const task = createCompletedTask(testUtils).task;
                expect(TaskManager.showApprove(task)).toBe(false);
            });
        });

        describe('approve()', function() {
            it('should set state to In Progress', function() {
                const { approverUser } = createApprover(testUtils);
                const { task } = createSubmittedTask(testUtils);

                testUtils.impersonateUser(approverUser.getUniqueValue());

                TaskManager.approve(task);

                expect(task.getValue('status')).toBe(TaskManager.STATUS.IN_PROGRESS);
            });
        });

        describe('showComplete()', function() {
            it('should return false when task is in Draft', function() {
                const task = createDraftTask(testUtils).task;
                expect(TaskManager.showComplete(task)).toBe(false);
            });

            it('should return false when task is in Submitted', function() {
                const { task } = createSubmittedTask(testUtils);
                expect(TaskManager.showComplete(task)).toBe(false);
            });

            it('should return true when task is in In Progress and user is submitter', function() {
                const { task, submitter } = createInProgressTask(testUtils);

                testUtils.impersonateUser(submitter.getUniqueValue());

                expect(TaskManager.showComplete(task)).toBe(true);
            });

            it('should return false when task is in In Progress and user is not submitter', function() {
                const { task, approverUser } = createInProgressTask(testUtils);

                testUtils.impersonateUser(approverUser.getUniqueValue());

                expect(TaskManager.showComplete(task)).toBe(false);
            });

            it('should return false when task is in Completed', function() {
                const { task } = createCompletedTask(testUtils);
                expect(TaskManager.showComplete(task)).toBe(false);
            });
        });

        describe('complete()', function() {
            it('should set state to Completed', function() {
                const { task, submitter } = createApprovedTask(testUtils);

                testUtils.impersonateUser(submitter.getUniqueValue());
                TaskManager.complete(task);

                expect(task.getValue('status')).toBe(TaskManager.STATUS.COMPLETED);
            });

            it('should set closed_on and closed_by', function() {
                const { task, submitter } = createApprovedTask(testUtils);

                testUtils.impersonateUser(submitter.getUniqueValue());
                TaskManager.complete(task);

                expect(task.closed_on.nil()).toBe(false);
                expect(task.getValue('closed_by')).toBe(gs.getUserID());
            });
        });

        describe('showSubmit()', function() {
            it('should return true when task is in Draft and user is opened by', function() {
                const { task, openedBy } = createDraftTask(testUtils);
                testUtils.impersonateUser(openedBy.getUniqueValue());
                expect(TaskManager.showSubmit(task)).toBe(true);
            });

            it('should return false when task is in Draft and user is not opened by', function() {
                const { task } = createDraftTask(testUtils);
                testUtils.impersonateUser(createOtherUser().getUniqueValue());
                expect(TaskManager.showSubmit(task)).toBe(false);
            });

            it('should return false when task is in Submitted', function() {
                const { task } = createSubmittedTask(testUtils);
                expect(TaskManager.showSubmit(task)).toBe(false);
            });

            it('should return false when task is in In Progress', function() {
                const { task } = createInProgressTask(testUtils);
                expect(TaskManager.showSubmit(task)).toBe(false);
            });

            it('should return false when task is in Completed', function() {
                const { task } = createCompletedTask(testUtils);
                expect(TaskManager.showSubmit(task)).toBe(false);
            });
        });

        describe('submit()', function() {
            it('should set state to Submitted and set: Submitted By, Assigned Group', function() {
                const { approverGroup } = createApprover(testUtils);
                const { task, openedBy, submitter } = createDraftTask(testUtils);
                testUtils.impersonateUser(openedBy.getUniqueValue());
                TaskManager.submit(task);

                expect(task.getValue('status')).toBe(TaskManager.STATUS.SUBMITTED);
                expect(task.getValue('submitted_by')).toBe(submitter.getUniqueValue());
                expect(task.getValue('submitted_on')).toBe(new GlideDate().getValue());
                expect(task.getValue('assigned_group')).toBe(approverGroup.getUniqueValue());
            });
        });

        describe('showSave()', function() {
            it('should return false when task is in Draft and user is opened by', function() {
                const { task, openedBy } = createDraftTask(testUtils);
                testUtils.impersonateUser(openedBy.getUniqueValue());
                expect(TaskManager.showSave(task)).toBe(false);
            });

            it('should return false when task is in Draft and user is not opened by', function() {
                const { task } = createDraftTask(testUtils);
                testUtils.impersonateUser(createOtherUser().getUniqueValue());
                expect(TaskManager.showSave(task)).toBe(false);
            });

            it('should return false when task is in Submitted and note approver', function() {
                const { task, submitter } = createSubmittedTask(testUtils);

                testUtils.impersonateUser(submitter.getUniqueValue());

                expect(TaskManager.showSave(task)).toBe(false);
            });

            it('should return true when task is in Submitted and approver', function() {
                const { approverUser } = createApprover(testUtils);
                const { task } = createSubmittedTask(testUtils);

                testUtils.impersonateUser(approverUser.getUniqueValue());

                expect(TaskManager.showSave(task)).toBe(true);
            });

            it('should return false when task is in In Progress and approver', function() {
                const { task, approverUser } = createInProgressTask(testUtils);

                testUtils.impersonateUser(approverUser.getUniqueValue());

                expect(TaskManager.showSave(task)).toBe(false);
            });

            it('should return true when task is in In Progress and submitter', function() {
                const { task, submitter } = createInProgressTask(testUtils);

                testUtils.impersonateUser(submitter.getUniqueValue());

                expect(TaskManager.showSave(task)).toBe(true);
            });

            it('should return false when task is in Completed and submitter', function() {
                const { task, submitter } = createCompletedTask(testUtils);

                testUtils.impersonateUser(submitter.getUniqueValue());

                expect(TaskManager.showSave(task)).toBe(false);
            });

            it('should return false when task is in Completed and approver', function() {
                const { task, approverUser } = createCompletedTask(testUtils);

                testUtils.impersonateUser(approverUser.getUniqueValue());

                expect(TaskManager.showSave(task)).toBe(false);
            });
        });


    });
}