## input-defaults uninstallation script
echo "Uninstalling input-defaults and its dependencies..."
INSTALLING="/home/volumio/input-defaults-plugin.uninstalling"

if [ ! -f $INSTALLING ]; then

	touch $INSTALLING

	#unlink /data/plugins/audio_interface/minidspshd-input-defaults

  pluginPath="/data/plugins/audio_interface"
  pluginInputs="/volumio/app/plugins/music_service/inputs/index.js"
	echo "Remove special config for minidsp inputs plugin ..."
  if [ $(grep -c "minidspshd-input-defaults" $pluginInputs ) -gt 0 ]; then
    sed -i "/\/\/ added by input-defaults plugin installation/d" $pluginInputs
    sed -i "/this.commandRouter.executeOnPlugin('audio_interface', 'minidspshd-input-defaults', 'setDefaultValues', activeInput);/d" $pluginInputs
  fi

	rm $INSTALLING

	#required to end the plugin uninstall
	echo "pluginuninstallend"
else
	echo "Plugin is already uninstalling! Not continuing..."
fi
