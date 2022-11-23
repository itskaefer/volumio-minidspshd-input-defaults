'use strict';

var libQ = require('kew');
//var libNet = require('net');
//var libFast = require('fast.js');
//var fs=require('fs-extra');
var config = new (require('v-conf'))();
//var exec = require('child_process').exec;
//var nodetools = require('nodetools');

module.exports = ControllerInputDefaults;

function ControllerInputDefaults(context) {
	// This fixed variable will let us refer to 'this' object at deeper scopes
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

  // TODO
  // for different miniDSP Models
  // available inputs
  self.inputs = ['TOSLINK','SPDIF','AES-EBU','RCA','XLR','USB','LAN'];
}


ControllerInputDefaults.prototype.onVolumioStart = function() {
	var self = this;
	var defer=libQ.defer();
	self.logger.info("[input-defaults] plugin initialized");
	this.configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
  self.getConf(this.configFile);
	//this.config = new (require('v-conf'))();
	//this.config.loadFile(configFile);

  // var promise = libQ.nfcall(fs.writeFile, '/tmp/message', 'Hello World', 'utf8');

  return defer.promise;
};

ControllerInputDefaults.prototype.onStart = function() {
	var self = this;
	var defer = libQ.defer();
	return defer.promise;
};


ControllerInputDefaults.prototype.onStop = function() {
	var self = this;
	var defer = libQ.defer();
	return defer.promise;
};

ControllerInputDefaults.prototype.getConfigurationFiles = function()
{
	return ['config.json'];
};

ControllerInputDefaults.prototype.getConf = function(configFile) {
	var self = this;
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
	return libQ.resolve();
};

ControllerInputDefaults.prototype.onInstall = function() {
	var self = this;
  self.logger.info("[input-defaults] performing onInstall action");
};

ControllerInputDefaults.prototype.onUninstall = function()
{
  var self = this;
  self.logger.info("[input-defaults] performing onUninstall action");
};


// get actual choosen input from /music_service/inputs plugin
// and set the volume and preset according to plugin settings
ControllerInputDefaults.prototype.setDefaultValues = function(input) {
	var self = this;
	var defer = libQ.defer();

	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

	var volume = self.config.get(input + "-volume");
	var preset = self.config.get(input + "-preset");

  // first set volume, than preset
  self.commandRouter.volumiosetvolume.call(self.commandRouter, volume);

  // TODO
  // check if preset is already the same as we like to set
	self.commandRouter.executeOnPlugin('music_service','inputs','setPreset', preset );

	return defer.promise;
};


ControllerInputDefaults.prototype.getUIConfig = function() {
  var self = this;
	var defer = libQ.defer();
  var lang_code = this.commandRouter.sharedVars.get('language_code');
	self.getConf(this.configFile);

  var presetList = ["1","2","3","4"];

  // TODO
  // var volumeOptions = ['1', .. ,'255'];

  self.commandRouter.i18nJson(__dirname+'/i18n/strings_' + lang_code + '.json',
                            	__dirname + '/i18n/strings_en.json',
                            	__dirname + '/UIConfig.json')
  .then(function(uiconf)
  {
    self.logger.info("[input-defaults] Populating UI for configuration...");
    var i = 0;

    self.logger.info("[input-defaults] available inputs: " + self.inputs);

    for ( var input in self.inputs ) {
      // set label in the UI
      uiconf.sections[0].content[i].label = self.inputs[input] + '-Volume';
      // set value from config
      uiconf.sections[0].content[i++].value = self.config.get(self.inputs[input] + '-volume');

      // add preset options and show actual preset from config-file
      for ( var preset in presetList ) {
        self.configManager.pushUIConfigParam(uiconf, 'sections[0].content['+ i +'].options', {
  				value: presetList[preset],
  				label: 'Preset ' + presetList[preset]
			  });
      }
      uiconf.sections[0].content[i].value.value = self.config.get(self.inputs[input] + '-preset');
      // set label in the UI
      uiconf.sections[0].content[i].label = self.inputs[input] + '-Preset';
      uiconf.sections[0].content[i++].value.label = 'Preset ' + self.config.get(self.inputs[input] + '-preset');
    }
		self.logger.info("[input-defaults] settings loaded");
    defer.resolve(uiconf);
  })
  .fail(function()
  {
    defer.reject(new Error());
  });

	return defer.promise;
};

ControllerInputDefaults.prototype.setUIConfig = function(data) {
	var self = this;
	var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');
	return libQ.resolve();
};

// get values from plugin settings page and update config.json
ControllerInputDefaults.prototype.updateInputDefaultsConfig = function(data) {
  var self = this;
	var defer = libQ.defer();

  for ( var input in self.inputs ) {
    self.config.set(self.inputs[input] + '-volume', data[self.inputs[input] + '-volume']);
    self.config.set(self.inputs[input] + '-preset', data[self.inputs[input] + '-preset'].value);
  }
 	self.logger.info("[input-defaults] Successfully updated configuration");
  self.commandRouter.pushToastMessage('info', "Save configuration", "Successfully saved configuration");

  return defer.promise;
};
