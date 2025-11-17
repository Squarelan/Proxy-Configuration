//QX 自动切换配置脚本

//[task_local]
//event-network https://raw.githubusercontent.com/Squarelan/Proxy-Configuration/main/Tasks/QuantumultX/Auto-switch-config.js, tag=自动切换配置, img-url=https://raw.githubusercontent.com/fmz200/wool_scripts/main/icons/apps/Quantumult_X_1.png, enabled=true

//三套配置说明：
//result.conf：最终和 QX 关联配置
//withOP.conf：软路由环境下配置
//noOP.conf：蜂窝网络环境下配置

//https://www.v2ex.com/t/1062890
//也就是说网络环境变化时做一些东西，相当于个钩子函数，在 Auto-switch-config.js 用 $enviorment 去获取 ssid ，有 ssid 就是 wifi ，没 ssid 就是蜂窝。同时也可以根据 ssid 的名字去判断在哪个 wifi 下有网络环境就好办了，然后就是切换配置，用 qx 的$iCloud 去读写那三套的配置，只要不同配置最终写入 result.conf 就行

const isWIFI = $environment.hasOwnProperty('ssid')
const opSSIDS = ['钵钵鸡-5G']

let underOpenwrt = false
if(isWIFI){
  let ssid = $environment.ssid
  if(opSSIDS.includes(ssid)){
    underOpenwrt = true
  }else{
    underOpenwrt = false
  }
}


const withOpenwrt = "../Profiles/withOp.conf"
const noOpenwrt = "../Profiles/noOp.conf"
const resultConfig = "../Profiles/result.conf"
const filePath = underOpenwrt ? withOpenwrt : noOpenwrt


let read_bytes = $iCloud.readFile(filePath);
let textDecoder = new TextDecoder();
let readContent = textDecoder.decode(read_bytes)


let encoder = new TextEncoder();
let writeUint8Array = encoder.encode(readContent);

if ($iCloud.writeFile(writeUint8Array, resultConfig)) {
    console.log(`iCloud 内容已替换为${underOpenwrt?"简约模式":"丰富模式"}`);
} else {
    console.log("iCloud 内容已替换失败");
}

$done()
