url="https://github.com/itskaefer/volumio-minidspshd-input-defaults/raw/main/minidspshd-input-defaults.zip"
pluginpath="/data/plugins/audio_interface/minidspshd-input-defaults"

sudo mkdir $pluginpath
sudo chown volumiooem:volumio $pluginpath
sudo chmod 775 $pluginpath
cd /tmp
wget -q -O /tmp/minidspshd-input-defaults.zip $url
miniunzip -d $pluginpath /tmp/minidspshd-input-defaults.zip
sudo $pluginpath/install.sh

echo "Cleanup ..."
rm /tmp/minidspshd-input-defaults.zip

echo "Restart volumio ..."
sudo systemctl restart volumio
