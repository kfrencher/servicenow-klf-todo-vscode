// @ts-ignore
function GroupUtilsTest(outputs, steps, params, stepResult, assertEqual) {

    /** @type {global.KLF_TestUtils} */
    let testUtils;
    /** @type {Chance.Chance} */
    // @ts-ignore
    const chance = global.KLF_TestChance;
    beforeEach(function() {
        testUtils = new global.KLF_TestUtils();
    });

    afterEach(function() {
        testUtils.cleanup();
    });

    describe('isMemberOf()', function() {

        it('should return true if the user is a member of the group', function() {
            const group = testUtils.createGroup(chance.name());
            const user = testUtils.createUser(chance.name());
            testUtils.addUserToGroup(group, user);

            expect(GroupUtils.isMemberOf(group.getUniqueValue(), user.getUniqueValue())).toBe(true);
        });

        it('should return false if user is not a member of the group', function() {
            const group = testUtils.createGroup(chance.name());
            const user = testUtils.createUser(chance.name());

            expect(GroupUtils.isMemberOf(group.getUniqueValue(), user.getUniqueValue())).toBe(false);
        });

        it('should return false if the group does not exist', function() {
            const user = testUtils.createUser(chance.name());

            expect(GroupUtils.isMemberOf('invalid-sys-id', user.getUniqueValue())).toBe(false);
        });

        it('should return false if the user does not exist', function() {
            const group = testUtils.createGroup(chance.name());

            expect(GroupUtils.isMemberOf(group.getUniqueValue(), 'invalid-sys-id')).toBe(false);
        });

        it('should return false if group is falsy', function() {
            const user = testUtils.createUser(chance.name());
            // @ts-ignore
            expect(GroupUtils.isMemberOf(null, user.getUniqueValue())).toBe(false);
        });

        it('should return false if user is falsy', function() {
            const group = testUtils.createGroup(chance.name());
            // @ts-ignore
            expect(GroupUtils.isMemberOf(group.getUniqueValue(), null)).toBe(false);
        });
    });

    describe('getGroupByName()', function() {

        it('should return group if the group name exists', function() {
            const groupName = chance.name();
            const group = testUtils.createGroup(groupName);

            // @ts-ignore
            expect(GroupUtils.getGroupByName(groupName).getUniqueValue()).toBe(group.getUniqueValue());
        });

        it('should return null if the group name does not exist', function() {
            expect(GroupUtils.getGroupByName('invalid-group-name')).toBe(null);
        });

        it('should return null if the group name is falsy', function() {
            // @ts-ignore
            expect(GroupUtils.getGroupByName(null)).toBe(null);
        });

    });

}