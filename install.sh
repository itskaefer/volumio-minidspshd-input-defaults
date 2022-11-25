## input-defaults installation script
echo "Installing input-defaults and its dependencies..."
INSTALLING="/home/volumio/input-defaults-plugin.installing"

if [ ! -f $INSTALLING ]; then
	/bin/touch $INSTALLING

	dist=$(cat /etc/os-release | grep '^VERSION=' | cut -d '(' -f2 | tr -d ')"')
	arch=$(arch)
  variant=$(cat /etc/os-release | grep '^VOLUMIO_VARIANT=' | cut -d '=' -f2 | tr -d '"')

  if [ $variant = "minidspshd" ]; then
    pluginPath="/data/plugins/audio_interface"
    pluginInputs="/volumio/app/plugins/music_service/inputs/index.js"
    echo "Load corrected index.js for plugin inputs ..."
    sudo cp /volumio/app/plugins/music_service/inputs/index.js /volumio/app/plugins/music_service/inputs/index.js.bak
    sudo wget -q -O /volumio/app/plugins/music_service/inputs/index.js https://raw.githubusercontent.com/itskaefer/volumio-minidspshd-input-defaults/main/plugin-inputs/index.js
  	echo "Add special config for minidsp inputs plugin ..."
    if [ $(grep -c "minidspshd-input-defaults" $pluginInputs ) -eq 0 ]; then
      # enable the inputs plugin to call function from this plugin
      sudo sed -i "s|activeInput = data;|activeInput = data;\n    // added by input-defaults plugin installation\n    this.commandRouter.executeOnPlugin('audio_interface', 'minidspshd-input-defaults', 'setDefaultValues', activeInput);|g" $pluginInputs

      # correct the setting point of activeInput to our needs
      # makes no difference for the inputs plugin
      sudo sed -i "/activeInput = inputid;/d" $pluginInputs
      sudo sed -i "s|self.setSource(inputid);|self.setSource(inputid);\n        activeInput = inputid;|g" $pluginInputs

      # add function to get actual preset
      if [ $(grep -c "inputs.prototype.getActivePreset" $pluginInputs ) -eq 0 ]; then
        sudo echo "" >> $pluginInputs
        sudo echo "" >> $pluginInputs
        sudo echo "// added by minidspshd-input-defaults" >> $pluginInputs
        sudo echo "inputs.prototype.getActivePreset = function () {" >> $pluginInputs
        sudo echo "  var self = this;" >> $pluginInputs
        sudo echo "  return activePreset;" >> $pluginInputs
        sudo echo "};" >> $pluginInputs
      fi
    else
      echo "Plugin inputs already updated ..."
    fi
  else
    echo "Detected non-miniDSP device. Plugin is not compatible with your device. [$variant]"
  fi

	rm $INSTALLING

	# Required to end the plugin install
	echo "plugininstallend"
else
	echo "Plugin is already installing! Not continuing..."
fi
