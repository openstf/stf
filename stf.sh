#!/bin/bash

# 
# Copyright 2020 VMware, Inc
# SPDX-License-Identifier:Apache2.0
# 


# Bash Menu Script Example
Black='\033[0;30m'        # Black
Red='\033[0;31m'          # Red
Green='\033[0;32m'        # Green
Yellow='\033[0;33m'       # Yellow
Blue='\033[0;34m'         # Blue
Purple='\033[0;35m'       # Purple
Cyan='\033[0;36m'         # Cyan
White='\033[0;37m'        # White
# Bold
BBlack='\033[1;30m'       # Black
BRed='\033[1;31m'         # Red
BGreen='\033[1;32m'       # Green
BYellow='\033[1;33m'      # Yellow
BBlue='\033[1;34m'        # Blue
BPurple='\033[1;35m'      # Purple
BCyan='\033[1;36m'        # Cyan
BWhite='\033[1;37m'       # White

# Underline
UBlack='\033[4;30m'       # Black
URed='\033[4;31m'         # Red
UGreen='\033[4;32m'       # Green
UYellow='\033[4;33m'      # Yellow
UBlue='\033[4;34m'        # Blue
UPurple='\033[4;35m'      # Purple
UCyan='\033[4;36m'        # Cyan
UWhite='\033[4;37m'       # White

# Background
On_Black='\033[40m'       # Black
On_Red='\033[41m'         # Red
On_Green='\033[42m'       # Green
On_Yellow='\033[43m'      # Yellow
On_Blue='\033[44m'        # Blue
On_Purple='\033[45m'      # Purple
On_Cyan='\033[46m'        # Cyan
On_White='\033[47m'       # White

# High Intensity
IBlack='\033[0;90m'       # Black
IRed='\033[0;91m'         # Red
IGreen='\033[0;92m'       # Green
IYellow='\033[0;93m'      # Yellow
IBlue='\033[0;94m'        # Blue
IPurple='\033[0;95m'      # Purple
ICyan='\033[0;96m'        # Cyan
IWhite='\033[0;97m'       # White

# Bold High Intensity
BIBlack='\033[1;90m'      # Black
BIRed='\033[1;91m'        # Red
BIGreen='\033[1;92m'      # Green
BIYellow='\033[1;93m'     # Yellow
BIBlue='\033[1;94m'       # Blue
BIPurple='\033[1;95m'     # Purple
BICyan='\033[1;96m'       # Cyan
BIWhite='\033[1;97m'      # White

# High Intensity backgrounds
On_IBlack='\033[0;100m'   # Black
On_IRed='\033[0;101m'     # Red
On_IGreen='\033[0;102m'   # Green
On_IYellow='\033[0;103m'  # Yellow
On_IBlue='\033[0;104m'    # Blue
On_IPurple='\033[0;105m'  # Purple
On_ICyan='\033[0;106m'    # Cyan
On_IWhite='\033[0;107m'   # White
echo ""
echo -e "Welcome to ${BYellow} STF ${White}"
# echo ""
# echo -e "This script can ${BWhite}Install${White} & ${BWhite}Run${White} ADF for both ${Cyan} Mac ${White} & ${Cyan} Ubuntu ${White} OS"
echo ""
echo -e "${Cyan}For Provider Unit:${White}"
echo "1) Install Basic STF Setup          [-Role -Command] "
echo "2) Run Provider                     [-Role -Command -IP]"
echo ""
echo -e "${Cyan}For Master Server:${White}"
echo "1) Install Basic STF Setup          [-Role -Command]"
echo "2) Link Master Setup                [-Role -Command]"
echo "3) Run DataBase                     [-Role -Command]"
echo "4) Run STF Master                   [-Role -Command -IP]"
echo ""
echo ""
echo -e "${Yellow}Options${White}"
# echo -e " -OS        [ ${BWhite}mac${White} , ${BWhite}ubuntu${White} ]        ${Cyan}Required${White}"
echo -e " -Role      [ ${BWhite}Provider${White} , ${BWhite}Master${White} ]   ${Cyan}Required${White}"
echo -e " -Command   [ ${BWhite}1${White} , ${BWhite}2${White} , ${BWhite}3${White} , ${BWhite}4${White} ]       ${Cyan}Required${White}"
echo -e " -IP        [ ${BWhite}MasterIp${White} ]     "
echo ""
echo ""
echo -e "${Yellow}For Example${White}"
echo -e " Installing Master Setup :      [ ${BWhite} ./stf.sh -Role Master -Command 1 ${White} ]"
echo -e " Running Provider Setup  :      [ ${BWhite} ./stf.sh -Role Provider -Command 2 -IP 10.XX.XX.XX ${White} ]"
echo ""
echo ""

arg_os="os"

# store arguments in a special array 
args=("$@") 
# get number of elements 
ELEMENTS=${#args[@]} 


# for loop 
for (( i=0;i<$ELEMENTS;i+=2)); do 
    # echo ${args[${i}]}

    if [ ${args[${i}]} == "-Role" ]; then
        Role="${args[${i}+1]}"
    elif [ ${args[${i}]} == "-Command" ]; then
        Command="${args[${i}+1]}"
    elif [ ${args[${i}]} == "-IP" ]; then
        IP="${args[${i}+1]}"
    fi
done

if [ -z "$Role" ]; then
    echo -e "Missing or Inappropriate required Argument ${Red} -Role ${White}"
    exit 1
elif [ $Role == "Master" ]; then
    temp="temp"
elif [ $Role == "Provider" ]; then
    temp="temp"
else
    echo -e "Inappropriate required Argument ${Red} -Role ${White}"
    exit 1
fi

if [ -z "$Command" ]; then
    echo -e "Missing or Inappropriate required Argument ${Red} -Command ${White}"
    exit 1
elif [ $Command == "1" ]; then
    temp="temp"
elif [ $Command == "2" ]; then
    temp="temp"
elif [ $Command == "3" ]; then
    temp="temp"
    if [ $Role == "Provider" ]; then
        echo -e "Missing or Inappropriate required Argument ${Red} -Command ${White}"
        exit 1
    fi
elif [ $Command == "4" ]; then
    temp="temp"
    if [ $Role == "Provider" ]; then
        echo -e "Missing or Inappropriate required Argument ${Red} -Command ${White}"
        exit 1
    fi
else
    echo -e "Missing or Inappropriate required Argument ${Red} -Command ${White}"
    exit 1
fi


if [ $Role == "Provider" ] && [ $Command == "2" ] && [ -z "$IP" ]; then
    echo -e "Missing Argument ${Red} -IP ${White}"
    exit 1
elif [ $Role == "Master" ] && [ $Command == "4" ] && [ -z "$IP" ]; then
    echo -e "Missing Argument ${Red} -IP ${White}"
    exit 1
fi


# IP="127.0.0.1" # Default IP


if [ "$(uname)" == "Darwin" ]; then
    # echo "This is Mac"
    os="mac"

    if [ $Command == "1" ]; then
        ./Setup/Mac/Install.sh
        exit 0
    elif [ $Command == "2" ] && [ $Role == "Master" ]; then
        ./Setup/Mac/Master.sh
        exit 0
    elif [ $Command == "2" ] && [ $Role == "Provider" ]; then
        ./Setup/Mac/Provider.sh $IP
        exit 0
    elif [ $Command == "3" ]; then
        ./Setup/runDB.sh
        exit 0
    elif [ $Command == "4" ] && [ $Role == "Master" ]; then
        # osascript -e 'tell application "Terminal" to do script "./Setup/Mac/runDB.sh"'
        ./Setup/Mac/Run.sh $IP
        exit 0
    fi
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    # echo "This is Linux"
    os="ubuntu"

    if [ $Command == "1" ]; then
        ./Setup/Ubuntu/Install.sh
        exit 0
    elif [ $Command == "2" ] && [ $Role == "Master" ]; then
        ./Setup/Ubuntu/Master.sh
        exit 0
    elif [ $Command == "2" ] && [ $Role == "Provider" ]; then
        ./Setup/Ubuntu/Provider.sh $IP
        exit 0
    elif [ $Command == "3" ]; then
        ./Setup/runDB.sh
        exit 0
    elif [ $Command == "4" ] && [ $Role == "Master" ]; then
        ./Setup/Ubuntu/Run.sh $IP
        exit 0
    fi
else
    echo -e "${Red} STF Doesn't Support any other OS than Mac & Linux ${White}"
    exit 0
fi