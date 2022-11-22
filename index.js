'use strict';

var libQ = require('kew');
var libNet = require('net');
var libFast = require('fast.js');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var nodetools = require('nodetools');

module.exports = ControllerInputDefaults;
function ControllerInputDefaults(context) {
	// This fixed variable will let us refer to 'this' object at deeper scopes
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}


ControllerInputDefaults.prototype.onVolumioStart = function()
{
	var self = this;
	var defer=libQ.defer();
	self.logger.info("[input-defaults] plugin initialized");
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

        // var promise = libQ.nfcall(fs.writeFile, '/tmp/message', 'Hello World', 'utf8');

        return defer.promise;;
}

ControllerInputDefaults.prototype.onStart = function()
{
	var self = this;
	var defer = libQ.defer();
	return defer.promise;
}


ControllerInputDefaults.prototype.onStop = function()
{
	var self = this;
	var defer = libQ.defer();
	return defer.promise;
}

ControllerInputDefaults.prototype.setDefaultValues = function(input)
{
	var self = this;
	var defer = libQ.defer();

	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

	var volume = self.config.get(input + "_volume");
	var preset = self.config.get(input + "_preset");

	self.commandRouter.executeOnPlugin('music_service','inputs','setPreset', preset );
	self.commandRouter.volumiosetvolume.call(self.commandRouter, volume);


	return defer.promise;
}

