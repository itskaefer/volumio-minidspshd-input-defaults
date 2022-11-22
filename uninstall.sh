## input-defaults uninstallation script
echo "Uninstalling input-defaults and its dependencies..."
INSTALLING="/home/volumio/input-defaults-plugin.uninstalling"

if [ ! -f $INSTALLING ]; then

	touch $INSTALLING

	#unlink /data/plugins/audio_interface/input-defaults

	rm $INSTALLING

	#required to end the plugin uninstall
	echo "pluginuninstallend"
else
	echo "Plugin is already uninstalling! Not continuing..."
fi
