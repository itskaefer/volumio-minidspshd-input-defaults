## input-defaults installation script
echo "Installing input-defaults and its dependencies..."
INSTALLING="/home/volumio/input-defaults-plugin.installing"

if [ ! -f $INSTALLING ]; then
	/bin/touch $INSTALLING

	if [ ! -d /opt/squeezelite ]; then
		dist=$(cat /etc/os-release | grep '^VERSION=' | cut -d '(' -f2 | tr -d ')"')
		arch=$(arch)
    		variant=$(cat /etc/os-release | grep '^VOLUMIO_VARIANT=' | cut -d '=' -f2 | tr -d '"')

    		# Fix executable rights
		#chown volumio:volumio /opt/squeezelite
		#chmod 755 /opt/squeezelite

    		if [ $variant = "minidspshd" ]; then
      			pluginPath="/data/plugins/audio_interface"
      			pluginInputs="/volumio/app/plugins/music_service/inputs/index.js"
			echo "Add special config for minidsp ..."
      			if [ $(grep -c "input-defaults" $pluginInputs ) -eq 0 ]; then
        			sed -i "s/self.commandRouter.volumioToggle();/self.commandRouter.volumioToggle();\nthis.commandRouter.executeOnPlugin('audio_interface', 'input-defaults', 'setDefaultValues');/g" $pluginInputs
        		else
        			echo "Plugin inputs already updated ..."
      			fi
    		fi
	else
		echo "Plugin already exists, not continuing." 
	fi
	rm $INSTALLING

	# Required to end the plugin install
	echo "plugininstallend"
else
	echo "Plugin is already installing! Not continuing..."
fi
