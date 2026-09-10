/**
 * Object that represents the currently authenticated user.
 */
const Authenticated = (function() {

    class Authenticated {
        constructor() {}

        /**
         * Returns an array of sys_user_group.sys_id for the currently authenticated user.
         * @returns {string[]} - An array of sys_user_group.sys_id
         */
        getGroups() {
            const userSysId = this.getUserSysId();
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
         * Returns the sys_user.sys_id of the currently authenticated user.
         * @returns {string} - sys_user.sys_id
         */
        getUserSysId() {
            return gs.getUserID();
        }

        /**
         * Returns true if user is member of the
         * sys_user_group.sys_id
         * @param {string} groupSysId - sys_user_group.sys_id
         */
        isMemberOf(groupSysId) {
            const userSysId = this.getUserSysId();
            const gr = new GlideRecord('sys_user_grmember');
            gr.addQuery('group', groupSysId);
            gr.addQuery('user', userSysId);
            gr.query();
            return gr.hasNext();
        }

        /**
         * Returns true if user is a ServiceNow admin.
         * @returns {boolean} true if user is ServiceNow admin
         */
        isAdmin() {
            return gs.hasRole('admin');
        }
    }

    return new Authenticated();
})();