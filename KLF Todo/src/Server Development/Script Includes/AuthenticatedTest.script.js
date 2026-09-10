// @ts-ignore
function AuthenticatedTest(outputs, steps, params, stepResult, assertEqual) {
    const impersonatorSysId = gs.getUserID();
    /** @type {Chance.Chance} */
    // @ts-ignore
    const chance = global.KLF_TestChance;

    describe('', function() {
        /** @type {global.KLF_TestUtils} */
        let testUtils;
        /** @type {string} */
        beforeEach(function() {
            testUtils = new global.KLF_TestUtils();
        });

        afterEach(function() {
            testUtils.impersonateUser(impersonatorSysId);
            testUtils.cleanup();
        });

        describe('isAdmin()', function() {
            it('should return true if the currently authenticated user is a ServiceNow admin', function() {
                const admin = testUtils.createUser(chance.name());
                testUtils.addRoleToUser(admin, 'admin');
                testUtils.impersonateUser(admin.getUniqueValue());
                expect(Authenticated.isAdmin()).toBe(true);
            });

            it('should return false if the currently authenticated user is not a ServiceNow admin', function() {
                const nonAdmin = testUtils.createUser(chance.name());
                testUtils.impersonateUser(nonAdmin.getUniqueValue());
                expect(Authenticated.isAdmin()).toBe(false);
            });
        });

        describe('getUserSysId()', function() {
            it('should return the sys_id of the currently authenticated user', function() {
                expect(Authenticated.getUserSysId()).toBe(gs.getUserID());
            });
        });

        describe('getGroups()', function() {
            it('should return an array of sys_user_group.sys_id for the currently authenticated user', function() {
                const group1 = testUtils.createGroup(chance.name());
                const group2 = testUtils.createGroup(chance.name());
                const user = testUtils.createUser(chance.name());
                testUtils.addUserToGroup(group1, user);
                testUtils.addUserToGroup(group2, user);
                const expected = [group1.getUniqueValue(), group2.getUniqueValue()].sort();

                testUtils.impersonateUser(user.getUniqueValue());
                expect(Authenticated.getGroups().sort()).toEqual(expected);
            });
        });

        describe('isMemberOf()', function() {
            /** @type {GlideRecord} */
            let testGroup;
            /** @type {GlideRecord} */
            let testMember;
            /** @type {GlideRecord} */
            let testNonMember;
            beforeEach(function() {
                testGroup = testUtils.createGroup(chance.name());
                testMember = testUtils.createUser(chance.name());
                testNonMember = testUtils.createUser(chance.name());
                testUtils.addUserToGroup(testGroup, testMember);
            });

            it('should return true if the user is a member of the specified group', function() {
                testUtils.impersonateUser(testMember.getUniqueValue());
                expect(Authenticated.isMemberOf(testGroup.getUniqueValue())).toBe(true);
            });

            it('should return false if the user is not a member of the specified group', function() {
                testUtils.impersonateUser(testNonMember.getUniqueValue());
                expect(Authenticated.isMemberOf(testGroup.getUniqueValue())).toBe(false);
            });

            it('should return false if group is empty', function() {
                expect(Authenticated.isMemberOf('')).toBe(false);
                // @ts-ignore
                expect(Authenticated.isMemberOf(null)).toBe(false);
            });
        });
    });

}