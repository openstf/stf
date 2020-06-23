# 
# Copyright 2020 VMware, Inc
# SPDX-License-Identifier:Apache2.0
# 


# Mac Run Provider Unit
stf provider --connect-sub tcp://$1:7114 --connect-push tcp://$1:7116 --storage-url http://$1:7100 --name $2