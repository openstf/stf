adb devices | while read line
do
    if [ ! "$line" = "" ] && [ `echo $line | awk '{print $2}'` = "device" ]
    then
        device=`echo $line | awk '{print $1}'`
        echo "$device $@ rebooting..."
        adb -s $device reboot
        echo "$device $@ rebooted"
        echo "-----------------------"
    fi
done