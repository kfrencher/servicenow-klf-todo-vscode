gs.info('Trying to change script scope');
const script = new GlideRecord('sys_script_include');
script.get('db3431fa83598b143c9299e0deaad30a');
script.sys_scope = '785f7e9b97161110fa6733121153afdb';
script.sys_package = '785f7e9b97161110fa6733121153afdb';
script.setWorkflow(false);
script.update();
gs.info('Completed change script scope');