url="https://github.com/itskaefer/volumio-minidspshd-input-defaults/raw/main/minidspshd-input-defaults.zip"
pluginpath="/data/plugins/audio_interface/minidspshd-input-defaults"

sudo mkdir -p $pluginpath
sudo chown volumiooem:volumio $pluginpath
sudo chmod 775 $pluginpath
cd /tmp
wget -q -O /tmp/minidspshd-input-defaults.zip $url
miniunzip /tmp/minidspshd-input-defaults.zip -d $pluginpath
sudo $pluginpath/install.sh

echo "Cleanup ..."
rm /tmp/minidspshd-input-defaults.zip

echo "Restart volumio ..."
sudo systemctl restart volumio
