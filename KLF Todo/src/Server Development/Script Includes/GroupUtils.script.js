/**
 * Utility functions for sys_user_group
 */
const GroupUtils = (function() {
    class GroupUtils {
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
            return gr.next();
        }

        /**
         * Returns the sys_user_group record by name or null
         * if the group name does not exist
         * @param {string} name 
         * @returns {GlideRecord?}
         */
        getGroupByName(name) {
            if (!name) {
                return null;
            }
            const group = new GlideRecord('sys_user_group');
            if (group.get('name', name)) {
                return group;
            } else {
                return null;
            }
        }

    }

    return new GroupUtils();

})();