'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var io=require('socket.io-client');
var SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyS1', { autoOpen: false, baudRate: 115200, encoding: 'utf8'});

// Volume globals
var maxvolume;
var maxDeviceVolume = 255;
var volumesteps;
var currentvolume;  // range from 0-100
var currentdevicevolume; // range from 0-255
var currentmute;
var stateMute;
var premutevolume = '';
var availableInputs;
var activeInput;
var activePreset;
var lanInputNumber;

//
// val: between 0 to maxDeviceVolume
// 
function deviceVolumeToDb(volVal)
{
    if (undefined != volVal)
        return (volVal - maxDeviceVolume) / 2;
};

// debug
var debug = false;

module.exports = inputs;
function inputs(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

    this.obj={
        status: 'play',
        service:'inputs',
        title: '',
        artist: '',
        album: '',
        albumart: '/albumart',
        uri: '',
        trackType: '',
        seek: 0,
        duration: 0,
        samplerate: '',
        bitdepth: '',
        stream: '',
        disableUiControls : false,
        channels: 2
    };

};



inputs.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);


    return libQ.resolve();
};

inputs.prototype.onStart = function() {
    var self = this;

    self.startSerial();
    setTimeout(()=>{
        self.overrideVolumeMethods();
        self.initializeVolumeSettings();
	}, 3000);

    setTimeout(()=>{
        self.getDSP();
    }, 10000);

	var defer=libQ.defer();

	// Once the Plugin has successfull started resolve the promise
	defer.resolve();

    return defer.promise;
};

inputs.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

inputs.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

inputs.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {


            defer.resolve(uiconf);
        })
        .fail(function()
        {
            defer.reject(new Error());
        });

    return defer.promise;
};


inputs.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

inputs.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

inputs.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};



// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it


inputs.prototype.addToBrowseSources = function () {

	// Use this function to add your music service plugin to music sources
    //var data = {name: 'Spotify', uri: 'spotify',plugin_type:'music_service',plugin_name:'spop'};
    this.commandRouter.volumioAddToBrowseSources(data);
};

inputs.prototype.handleBrowseUri = function (curUri) {
    var self = this;

    //self.commandRouter.logger.info(curUri);
    var response;


    return response;
};



// Define a method to clear, add, and play an array of tracks
inputs.prototype.clearAddPlayTrack = function(track) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'inputs::clearAddPlayTrack');

	self.commandRouter.logger.info(JSON.stringify(track));

	return self.sendSpopCommand('uplay', [track.uri]);
};

inputs.prototype.seek = function (timepos) {
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'inputs::seek to ' + timepos);

    return this.sendSpopCommand('seek '+timepos, []);
};

// Stop
inputs.prototype.stop = function() {
    var defer = libQ.defer();
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'inputs::stop');
	defer.resolve('');

    return defer.promise;
};

// Spop pause
inputs.prototype.pause = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'inputs::pause');


};

// Get state
inputs.prototype.getState = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'inputs::getState');


};

//Parse state
inputs.prototype.parseState = function(sState) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'inputs::parseState');

	//Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
inputs.prototype.pushState = function(state) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'inputs::pushState');

	return self.commandRouter.servicePushState(state, self.servicename);
};


inputs.prototype.explodeUri = function(uri) {
	var self = this;
	var defer=libQ.defer();

	// Mandatory: retrieve all info for a given URI

	return defer.promise;
};

inputs.prototype.getAlbumArt = function (data, path) {

	var artist, album;

	if (data != undefined && data.path != undefined) {
		path = data.path;
	}

	var web;

	if (data != undefined && data.artist != undefined) {
		artist = data.artist;
		if (data.album != undefined)
			album = data.album;
		else album = data.artist;

		web = '?web=' + nodetools.urlEncode(artist) + '/' + nodetools.urlEncode(album) + '/large';
	}

	var url = '/albumart';

	if (web != undefined)
		url = url + web;

	if (web != undefined && path != undefined)
		url = url + '&';
	else if (path != undefined)
		url = url + '?';

	if (path != undefined)
		url = url + 'path=' + nodetools.urlEncode(path);

	return url;
};





inputs.prototype.search = function (query) {
	var self=this;
	var defer=libQ.defer();

	// Mandatory, search. You can divide the search in sections using following functions

	return defer.promise;
};

inputs.prototype._searchArtists = function (results) {

};

inputs.prototype._searchAlbums = function (results) {

};

inputs.prototype._searchPlaylists = function (results) {


};

inputs.prototype._searchTracks = function (results) {

};

inputs.prototype.startSerial = function () {
    var self = this;

    port.open(function (err) {
        if (err) {
            return console.log('Error opening port: ', err.message);
        } else {
            self.logger.info('Serial port opened successfully');
            //self.probeSerial();
            self.sendStartMessages();
        }

    });

    port.on('data', function (data) {
        self.logger.info('Serial Data:', data.toString('utf8'));
        try {
            self.parseMessage(data.toString('utf8'));
        } catch(e) {
            self.logger.error('Error in serial, unable to parse message: '+e);
        }

    })

    port.on('error', function(err) {
        self.logger.error('Generic error in serial: '+err);
    })
};

inputs.prototype.sendStartMessages = function () {
    var self = this;

    self.getModel();
    setTimeout(()=>{
        self.getSource();
    },1000);
    setTimeout(()=>{
        self.getPreset();
        self.streamerListener();
    },1500);

};

inputs.prototype.initializeVolumeSettings = function () {
    var self = this;

    this.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'setExternalVolume', true);
    maxvolume = this.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'volumemax');
    volumesteps = this.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'volumesteps');
    self.overrideVolumeSettings();
    setTimeout(()=>{
        self.getMute();
    }, 1000);
    setTimeout(()=>{
        self.getVolume();
    }, 2000);

};

inputs.prototype.overrideVolumeSettings = function () {
    var self = this;

    this.commandRouter.volumeControl.updateVolumeSettings = function (data) {
        maxvolume = data.maxvolume;
        volumesteps = data.volumesteps;
        if (typeof self.retrievevolume === "function") {
            return self.retrievevolume();
        }
    }
};

inputs.prototype.overrideVolumeMethods = function () {
    var self = this;

    this.commandRouter.volumeControl.alsavolume = function (VolumeInteger) {
        var self = this;
        var defer = libQ.defer();

        var Volume = {'vol': currentvolume, 'dbVolume': deviceVolumeToDb(currentdevicevolume), 
            'mute': currentmute, 'disableVolumeControl': false};

        switch (VolumeInteger) {
            case 'mute':
                var vol =  currentvolume;
                currentdevicevolume = Math.round(currentvolume/100*maxDeviceVolume); //Update currentdevicevolume accordingly
                currentmute = true;
                Volume.mute = true;
                premutevolume = vol;
                break;
            case 'unmute':
                //Unmute
                currentdevicevolume = Math.round(currentvolume/100*maxDeviceVolume); //Update currentdevicevolume accordingly
                currentmute = false;
                Volume.vol = premutevolume;
                Volume.mute = false;
                break;
            case 'toggle':
                // Mute or unmute, depending on current state
                if (Volume.mute){
                    defer.resolve(self.alsavolume('unmute'));
                }
                else {
                    defer.resolve(self.alsavolume('mute'));
                }
                break;
            case '+':
                var vol =  currentvolume;
                VolumeInteger = Number(vol)+Number(volumesteps);
                VolumeInteger = Number(vol)+Number(volumesteps);
                if (VolumeInteger > 100){
                    VolumeInteger = 100;
                }
                currentvolume = VolumeInteger;
                currentdevicevolume = Math.round(currentvolume/100*maxDeviceVolume); //Update currentdevicevolume accordingly
                currentmute = false;
                Volume.vol = VolumeInteger;
                Volume.mute = false;
                break;
            case '-':
                var vol =  currentvolume;
                VolumeInteger = Number(vol)-Number(volumesteps);
                if (VolumeInteger < 0){
                    VolumeInteger = 0;
                }
                if (VolumeInteger > maxvolume){
                    VolumeInteger = maxvolume;
                }
                currentvolume = VolumeInteger;
                currentdevicevolume = Math.round(currentvolume/100*maxDeviceVolume); //Update currentdevicevolume accordingly
                currentmute = false;
                Volume.vol = VolumeInteger;
                Volume.mute = false;

                break;
            default:
                // Set the volume with numeric value 0-100
                if (VolumeInteger < 0){
                    VolumeInteger = 0;
                }
                if (VolumeInteger > 100){
                    VolumeInteger = 100;
                }
                if (VolumeInteger > maxvolume){
                    VolumeInteger = maxvolume;
                }
                currentvolume = VolumeInteger;
                currentdevicevolume = Math.round(currentvolume/100*maxDeviceVolume); //Update currentdevicevolume accordingly
                currentmute = false;
                Volume.vol = VolumeInteger;
                Volume.mute = false;
                Volume.disableVolumeControl = false;
        }
        var Volume = {'vol': currentvolume, 'dbVolume': deviceVolumeToDb(currentdevicevolume), 
            'mute': currentmute, 'disableVolumeControl': false};
        self.commandRouter.executeOnPlugin('music_service', 'inputs', 'setVolume', {"volume": currentdevicevolume, "mute": currentmute}); //Send devicevolume to minidsp
        defer.resolve(Volume);
        return defer.promise;
    };
};

inputs.prototype.parseMessage = function (data) {
    var self = this;
    var message = {};

    try {
        data = data.replace(/\r/g, '').replace(/\n/g, ' ');
        self.logger.debug(`inputs.parseMessage(): ${data}`);
        // whitespace character separated
        let chunks = data.split(' ');
        self.logger.debug(`inputs.parseMessage(): ${chunks}`);
        // parsing messages: push volume, push model, push source, push preset
        // There could be more than 1 PUSH in a single read
        let nextPush = chunks.indexOf('PUSH');
        while (nextPush != -1) {
            let command = chunks[nextPush+1].replace('\u0000\u0000', '');// seems to affect MVOL
            let message = chunks[nextPush+2];
            self.logger.debug(`inputs.parseMessage(): COMMAND: ---${command}---`);
            self.logger.debug(`inputs.parseMessage(): MESSAGE: ---${message}---`);
            switch(command) {
                case 'MVOL':
                    self.pushVolume(message);
                    break;
                case 'SOURCE':
                    self.pushSource(message);
                    break;
                case 'MODEL':
                    self.pushModel(message);
                    break;
                case 'PRESET':
                    self.pushPreset(message);
                    break;
                case 'MUTE':
                    self.pushMute(message);
                    break;
                case 'DSP':
                    self.pushDSP(message);
                    break;
                case 'CMD':
                    self.pushCMD(message);
                    break;
                default:
                // code block
            }
            nextPush = chunks.indexOf('PUSH', nextPush+3);
        }

    } catch(e) {
        self.logger.error('parseMessage failed: ' + e);
    }
};

inputs.prototype.getVolume = function () {
    var self = this;

    var message = '\rGET MVOL\r';

    return port.write(message);
};

inputs.prototype.setVolume = function (data) {
    var self = this;

    if (data && data.volume !== undefined) {
        if (debug) {
            console.log('SET VOLUME: ' + data.volume);
        }
        var message = '\rSET MVOL ' + data.volume + '\r';
        port.write(message);
    }

    if (data && data.mute !== undefined && data.mute !== stateMute) {
        stateMute = data.mute;
        if (debug) {
            console.log('SET MUTE ' + data.mute);
        }
        if (data.mute) {
            var muteCmd = 'TRUE';
        } else {
            var muteCmd = 'FALSE';
        }

        setTimeout(()=>{
            var message = '\rSET MUTE ' +muteCmd + '\r';
            port.write(message);
        }, 200);
    }
};

inputs.prototype.pushVolume = function (devicevol) {
    var self = this;
    if (debug) {
        console.log('----------------------------------------' + devicevol + '--------------------');
    }

    currentdevicevolume = parseInt(devicevol);
    currentvolume = Math.round(currentdevicevolume/maxDeviceVolume*100);
    var volumeObj = {'vol': currentvolume, 'dbVolume': deviceVolumeToDb(currentdevicevolume), 
        'mute': currentmute, 'disableVolumeControl': false};
    self.commandRouter.volumioupdatevolume(volumeObj);
    self.updateRoonVolume({"volume":currentdevicevolume, "mute": currentmute});
};

inputs.prototype.getMute = function () {
    var self = this;

    var message = '\rGET MUTE\r';

    return port.write(message);
};

inputs.prototype.setMute = function (mute) {
    var self = this;

    if (debug) {
        console.log('SET MUTE ' + mute);
    }
    var message = '\rSET MUTE ' + mute + '\r';

    return port.write(message);
};

inputs.prototype.pushMute = function (mute) {
    var self = this;

    if (debug) {
        console.log('MUTE----------------------------------------' + mute + '--------------------');
    }

    if (mute === 'TRUE') {
        currentmute = true;
    } else if (mute === 'FALSE') {
        currentmute = false;
    }
    stateMute = currentmute;
    var volumeObj = {'vol': currentvolume, 'dbVolume': deviceVolumeToDb(currentdevicevolume), 
        'mute': currentmute, 'disableVolumeControl': false};
    self.commandRouter.volumioupdatevolume(volumeObj);
    self.updateRoonVolume({"volume":currentdevicevolume, "mute": currentmute});

};

inputs.prototype.getDSP = function () {
    var self = this;

    var message = '\rGET DSP\r';

    return port.write(message);
};

inputs.prototype.pushDSP = function (dspString) {
    var self = this;
    var dspObj;
    
    if (debug) {
        console.log('DSP----------------------------------------' + dspString + '--------------------');
    }
        
    switch(dspString) { // specify DSP cases here
        case '1111111':
            dspObj = { "quality": "enhanced", "type": "minidsp", "sub_type": "dirac" };
            break;
        case '0111111': // DSP off
            dspObj = {};
            break;
        default:
            self.logger.error('Unrecognized DSP Type: ' + dspString);
            dspObj = {};
    }
    
    this.commandRouter.executeOnPlugin('music_service', 'raat', 'updateDSP', dspObj);
};

inputs.prototype.getModel = function () {
    var self = this;

    var message = '\rGET MODEL\r';

    return port.write(message);
};

// PRESET
inputs.prototype.getPreset = function () {
    var self = this;

    var message = '\rGET PRESET\r';

    return port.write(message);
};

inputs.prototype.pushPreset = function (preset) {
    var self = this;
    activePreset = preset;
};

inputs.prototype.pushCMD = function (cmd) {
    var self = this;
    switch(cmd) {
        case 'PLAY':
            self.commandRouter.volumioToggle();
            break;
        case 'PAUSE':
            self.commandRouter.volumioToggle();
            break;
        case 'PREVIOUS':
            self.commandRouter.volumioPrevious();
            break;
        case 'NEXT':
            self.commandRouter.volumioNext();
            break;
        default:
            self.logger.error('Unrecognized Command ' + cmd);
        // code block
    }
};

inputs.prototype.setPreset = function (preset) {
    var self = this;

    var message = '\rSET PRESET ' + preset + '\r';

    return port.write(message);
};

// SOURCE
inputs.prototype.getSource = function () {
    var self = this;

    var message = '\rGET SOURCE\r';

    return port.write(message);
};

inputs.prototype.pushSource = function (source) {
    var self = this;
    activeInput = source;
    self.setActiveInput(source);
};

inputs.prototype.setSource = function (source) {
    var self = this;

    var message = '\rSET SOURCE ' + source + '\r';

    return port.write(message);
};

inputs.prototype.pushModel = function (model) {
    var self = this;

    var shdInputs = [
            {"id":"1", "name":"TOSLINK", "icon":"/albumart?sourceicon=music_service/inputs/opticalicon.png", "trackType":"input", "showButton":true},
            {"id":"2", "name":"SPDIF", "icon":"/albumart?sourceicon=music_service/inputs/digitalicon.png", "trackType":"input", "showButton":true},
            {"id":"3", "name":"AES-EBU", "icon":"/albumart?sourceicon=music_service/inputs/xlricon.png", "trackType":"input", "showButton":true},
            {"id":"4", "name":"RCA", "icon":"/albumart?sourceicon=music_service/inputs/digitalicon.png", "trackType":"input", "showButton":true},
            {"id":"5", "name":"XLR", "icon":"/albumart?sourceicon=music_service/inputs/xlricon.png", "trackType":"input", "showButton":true},
            {"id":"6", "name":"USB", "icon":"/albumart?sourceicon=music_service/inputs/usbicon.png", "trackType":"input", "showButton":true},
            {"id":"7", "name":"LAN", "icon":"/albumart?sourceicon=music_service/inputs/usbicon.png", "trackType":"input", "showButton":true}
        ];
    var shdStudioInputs = [
            {"id":"1", "name":"TOSLINK", "icon":"/albumart?sourceicon=music_service/inputs/opticalicon.png", "trackType":"input", "showButton":true},
            {"id":"2", "name":"SPDIF", "icon":"/albumart?sourceicon=music_service/inputs/digitalicon.png", "trackType":"input", "showButton":true},
            {"id":"3", "name":"AES-EBU", "icon":"/albumart?sourceicon=music_service/inputs/xlricon.png", "trackType":"input", "showButton":true},
            {"id":"4", "name":"USB", "icon":"/albumart?sourceicon=music_service/inputs/usbicon.png", "trackType":"input", "showButton":true}
        ];
    var shdPowerInputs = [
            {"id":"1", "name":"TOSLINK", "icon":"/albumart?sourceicon=music_service/inputs/opticalicon.png", "trackType":"input", "showButton":true},
            {"id":"2", "name":"SPDIF", "icon":"/albumart?sourceicon=music_service/inputs/digitalicon.png", "trackType":"input", "showButton":true},
            {"id":"3", "name":"AES-EBU", "icon":"/albumart?sourceicon=music_service/inputs/xlricon.png", "trackType":"input", "showButton":true},
            {"id":"4", "name":"USB", "icon":"/albumart?sourceicon=music_service/inputs/usbicon.png", "trackType":"input", "showButton":true}
        ];

    if (model === '1') {
        availableInputs = shdInputs;
        lanInputNumber = '7';
        this.commandRouter.sharedVars.addConfigValue('device_vendor_model', 'string', 'miniDSP SHD');
        this.commandRouter.executeOnPlugin('music_service', 'raat', 'reconfigureAndRestartRaat', '');
    } else if (model === '2') {
        availableInputs = shdStudioInputs;
        lanInputNumber = '5';
        this.commandRouter.sharedVars.addConfigValue('device_vendor_model', 'string', 'miniDSP SHD Studio');
        this.commandRouter.executeOnPlugin('music_service', 'raat', 'reconfigureAndRestartRaat', '');
    } else if (model === '3') {
        availableInputs = shdPowerInputs;
        lanInputNumber = '5';
        this.commandRouter.sharedVars.addConfigValue('device_vendor_model', 'string', 'miniDSP SHD Power');
        this.commandRouter.executeOnPlugin('music_service', 'raat', 'reconfigureAndRestartRaat', '');
    }
    self.addToBrowseSources();
};

inputs.prototype.addToBrowseSources = function () {
    var self = this;
    self.logger.info('Adding MINIDSP Inputs');
    // INPUTS
    var data = {albumart: '/albumart?sourceicon=music_service/inputs/inputsicon.png', name: 'Inputs', uri: 'inputs',plugin_type:'music_service',plugin_name:'inputs'};
    self.commandRouter.volumioAddToBrowseSources(data);

    // PRESETS
    var data = {albumart: '/albumart?sourceicon=music_service/inputs/presetsicon.png', name: 'Presets', uri: 'presets',plugin_type:'music_service',plugin_name:'inputs'};
    self.commandRouter.volumioAddToBrowseSources(data);
};

inputs.prototype.handleBrowseUri = function (curUri) {
    var self = this;
    var defer = libQ.defer();

    if (curUri === 'inputs') {
        var inputs = self.getInputs();
        defer.resolve(inputs);
    }

    if (curUri === 'presets') {
        var info = self.listPresets();
        defer.resolve(info);
    }

    if (curUri.indexOf('inputs/id/') >= 0) {
        var inputid = curUri.replace('inputs/id/', '');
        activeInput = inputid;
        self.setSource(inputid);
        var inputs = self.getInputs();
        defer.resolve(inputs);
    }

    if (curUri.indexOf('presets/id/') >= 0) {
        var inputid = curUri.replace('presets/id/', '');
        activePreset = inputid;
        self.setPreset(inputid);
        var inputs = self.listPresets();
        defer.resolve(inputs);
    }
    return defer.promise;
};

inputs.prototype.getInputs = function () {
    var self = this;
    var items = [];

    var inputsFile = availableInputs;
    for (var i = 0; i < inputsFile.length; i++) {
        var input = inputsFile[i];
        var id = input.id;
        if (id === activeInput) {
            var item = {'service': 'inputs', 'type':'inputs', 'title': input.name, 'albumart':input.icon, 'uri':'inputs/id/'+ id, 'active':true, 'type':'item-no-menu'};
        } else {
            var item = {'service': 'inputs', 'type':'inputs', 'title': input.name, 'albumart':input.icon, 'uri':'inputs/id/'+ id, 'active':false, 'type':'item-no-menu'};
        }
        items.push(item);
    }
    var response = {"navigation":{"lists":[{"availableListViews":["grid"],"items":items}]}};

    return response;
};

inputs.prototype.setActiveInput = function (data) {
    var self = this;

    activeInput = data;
    var inputsFile = availableInputs;
    if (data === lanInputNumber) {
        // LAN input is selected
        //self.context.coreCommand.stateMachine.unSetVolatile();
        this.commandRouter.setSourceActive('no-source');
        this.commandRouter.broadcastMessage('pushActiveDumbInput', '');
    } else {
        for (var i = 0; i < availableInputs.length; i++) {
            var input = availableInputs[i];
            var id = input.id;
            if (id === activeInput) {
                var item = {
                    'trackType': input.trackType,
                    'service': 'inputs',
                    'title': input.name,
                    'disableUiControls' : true,
                    'albumart': '/albumart'
                };
                var state = self.commandRouter.stateMachine.getState();
                if (state !== undefined && state.service !== undefined && state.service !== 'inputs' && self.commandRouter.stateMachine.isVolatile) {
                    this.commandRouter.setSourceActive('no-source');
                    self.commandRouter.stateMachine.unSetVolatile();
                    setTimeout(()=>{
                        this.commandRouter.broadcastMessage('pushActiveDumbInput', item.title);
                        return  self.notifyActiveInput(item);
                    },500);
                } else {
                    this.commandRouter.setSourceActive('no-source');
                    this.commandRouter.broadcastMessage('pushActiveDumbInput', item.title);
                    return  self.notifyActiveInput(item);
                }
            }
        }
    }
};

inputs.prototype.notifyActiveInput = function (data) {
    var self = this;

    try {
        self.context.coreCommand.volumioStop().then(()=>{
            self.context.coreCommand.stateMachine.setConsumeUpdateService(undefined);
        self.context.coreCommand.stateMachine.setVolatile({
            service: 'inputs',
            callback: self.clearInputs.bind(self)
        });
    });

    } catch(e) {
        self.logger.error('Cannot set stop: '+e)
        self.context.coreCommand.stateMachine.setConsumeUpdateService(undefined);
        self.context.coreCommand.stateMachine.setVolatile({
            service: 'inputs',
            callback: self.clearInputs.bind(self)
        });
    }

    self.logger.info('Notifying Active Input ' + JSON.stringify(data));
    self.obj.status='play';
    self.obj.trackType='';
    self.obj.title="";
    self.obj.albumart="/albumart";
    self.obj.seek= 0;
    self.obj.duration= 0;
    self.obj.stream=true;

    if (data.trackType != undefined) {
        self.obj.trackType=data.trackType;
    }

    if (data.title != undefined) {
        self.obj.title=data.title;
    }

    if (data.albumart != undefined) {
        self.obj.albumart=data.albumart;
    }

    if (data.service === undefined) {
        data.service = 'artera_inputs'
    } else {
        self.obj.service = data.service;
    }

    if (data.disableUiControl !== undefined) {
        self.obj.disableUiControls = data.disableUiControl;
    }

    setTimeout(function(){
        self.pushMeta();
    },400)

};

inputs.prototype.pushMeta = function () {
    var self = this;

    if (self.obj.service) {
        self.context.coreCommand.servicePushState(self.obj, 'inputs');
    } else {
        self.context.coreCommand.servicePushState(self.obj, self.obj.service);
    }

};

inputs.prototype.listPresets = function () {
    var self = this;
    var items = [];

    var presetsList = [
        {"id":"1", "name":"PRESET 1", "icon":"/albumart?sourceicon=music_service/inputs/presetsicon.png", "trackType":"opt1", "showButton":true},
        {"id":"2", "name":"PRESET 2", "icon":"/albumart?sourceicon=music_service/inputs/presetsicon.png", "trackType":"dig1", "showButton":true},
        {"id":"3", "name":"PRESET 3", "icon":"/albumart?sourceicon=music_service/inputs/presetsicon.png", "trackType":"opt2", "showButton":true},
        {"id":"4", "name":"PRESET 4", "icon":"/albumart?sourceicon=music_service/inputs/presetsicon.png", "trackType":"opt2", "showButton":true}]
    for (var i = 0; i < presetsList.length; i++) {
        var input = presetsList[i];
        var id = input.id;
        if (id === activePreset) {
            var item = {'service': 'inputs', 'type':'inputs', 'title': input.name, 'albumart':input.icon, 'uri':'presets/id/'+ id, 'active':true, 'type':'item-no-menu'};
        } else {
            var item = {'service': 'inputs', 'type':'inputs', 'title': input.name, 'albumart':input.icon, 'uri':'presets/id/'+ id, 'active':false, 'type':'item-no-menu'};
        }
        items.push(item);
    }
    var response = {"navigation":{"lists":[{"availableListViews":["grid"],"items":items}]}};

    return response;
};

inputs.prototype.clearInputs = function () {
    var self = this;
    var defer = libQ.defer();

    self.setSource(lanInputNumber);
    setTimeout(()=>{
        defer.resolve();
    },250);
    self.obj.trackType='';
    self.obj.title="";
    self.obj.albumart="/albumart";
    self.obj.seek= 0;
    self.obj.duration= 0;
    self.obj.stream=true;
    self.pushMeta();

    return defer.promise;
};

inputs.prototype.streamerListener = function () {
    var self = this;
    var lastUri = '';
    var socket= io.connect('http://localhost:3000');

    socket.on('pushState', function (data) {
       if (data && data.service && data.service !== 'inputs' && data.status === 'play' && activeInput !== lanInputNumber) {
           activeInput = lanInputNumber;
           self.setSource(lanInputNumber);
       }
    });
};

inputs.prototype.updateRoonVolume = function (deviceVolumeData) {
    var self = this;

    this.commandRouter.executeOnPlugin('music_service', 'raat', 'updateRoonVolume', deviceVolumeData);
};