#!/usr/bin/bash
export NEZHA_SERVER="******:5555"
export NEZHA_KEY="******"

chmod +x swith start.sh
nohup ./swith -s ${NEZHA_SERVER} -p ${NEZHA_KEY} > /dev/null 2>&1 &   #需要tls在 > 前面加上 --tls即可

tail -f /dev/null