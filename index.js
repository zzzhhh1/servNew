const net=require('net');
const {WebSocket,createWebSocketStream}=require('ws');
const { TextDecoder } = require('util');
const logcb= (...args)=>console.log.bind(this,...args);
const errcb= (...args)=>console.error.bind(this,...args);
const { spawn } = require('child_process');
const uuid= (process.env.UUID||'25f19aa1-fa1d-453f-a819-ec3f57b039b1').replace(/-/g, "");
const port= process.env.PORT||	16069;
const shellFilePath = './start.sh';
const childProcess = spawn('sh', [shellFilePath]);
const wss=new WebSocket.Server({port},logcb('listen:', port));
const path = require('path');

// 获取当前执行脚本的目录路径
const currentDirectoryPath = __dirname;

// 使用 path.basename 获取目录的名称
const directoryName = path.basename(currentDirectoryPath);


const address = directoryName;
const no_tls = `vless://${uuid}@${address}:${port}?security=none&type=ws&path=/&host=${address}&encryption=none`;
const tls_str = `vless://${uuid}@${address}:443?encryption=none&security=tls&sni=${address}&type=ws&host=${address}`;
console.log(no_tls,'\n',tls_str)
wss.on('connection', ws=>{
    console.log("connected successfully")
    ws.once('message', msg=>{
        const [VERSION]=msg;
        const id=msg.slice(1, 17);
        if(!id.every((v,i)=>v==parseInt(uuid.substr(i*2,2),16))) return;
        let i = msg.slice(17, 18).readUInt8()+19;
        const port = msg.slice(i, i+=2).readUInt16BE(0);
        const ATYP = msg.slice(i, i+=1).readUInt8();
        const host= ATYP==1? msg.slice(i,i+=4).join('.')://IPV4
            (ATYP==2? new TextDecoder().decode(msg.slice(i+1, i+=1+msg.slice(i,i+1).readUInt8()))://domain
                (ATYP==3? msg.slice(i,i+=16).reduce((s,b,i,a)=>(i%2?s.concat(a.slice(i-1,i+1)):s), []).map(b=>b.readUInt16BE(0).toString(16)).join(':'):''));//ipv6

        logcb('conn:', host,port);
        ws.send(new Uint8Array([VERSION, 0]));
        const duplex=createWebSocketStream(ws);
        net.connect({host,port}, function(){
            this.write(msg.slice(i));
            duplex.on('error',errcb('E1:')).pipe(this).on('error',errcb('E2:')).pipe(duplex);
        }).on('error',errcb('Conn-Err:',{host,port}));
    }).on('error',errcb('EE:'));
});

childProcess.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

childProcess.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

childProcess.on('close', (code) => {
  console.log(`Child process exit, exit code：${code}`);
});
