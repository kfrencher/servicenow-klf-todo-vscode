(function() {
  gs.info('Trying to add role');
  const helpDesk = '679434f053231300e321ddeeff7b12d8'
  const targetGroupSysId = helpDesk;
  const demoAdmin = '3595415a83d187143c9299e0deaad3a4';
  const todoApprover = '7fc6bc3c47541a1058ceeb02d16d4307';
  const groupRole = new GlideRecord('sys_group_has_role');
  groupRole.newRecord();
  groupRole.group = targetGroupSysId;
  groupRole.role = demoAdmin;
  groupRole.update();
  gs.info('Completed add role');
})();