const si = require('systeminformation');
 
async function cpuData() {
    try {
        const data = await si.cpu();
        console.log('CPU Information:');
        console.log('- manufucturer: ' + data.manufacturer);
        console.log('- brand: ' + data.brand);
        console.log('- speed: ' + data.speed);
        console.log('- cores: ' + data.cores);
        console.log('- physical cores: ' + data.physicalCores);
        console.log('...');
    } catch (e) {
        console.log(e);
    }
}

async function timeData() {
    try {
        const time = await si.time();
        console.log('Current Time: ' + time.current);
    } catch (e) {
        console.log(e);
    }
}

async function cpuLoad() {
    try {
        const cpuLoad = await si.currentLoad();
        console.log('Current Load: ' + cpuLoad.currentload);
        console.log('CPU 0 Load: ' + cpuLoad.cpus[0].load);
        console.log('CPU 1 Load: ' + cpuLoad.cpus[1].load);
    } catch (e) {
        console.log(e);
    }
}

async function ramUsage() {
    try {
        const ram = await si.mem();
        console.log('Memory Total: ' + ram.total);
        console.log('Memory Used: ' + ram.used);
        console.log('Memory Free: ' + ram.free);
    } catch (e) {
        console.log(e);
    }
}

async function netUsage() {
    try {
        const netInt = await si.networkInterfaces();
        // make sure to use the correct network interface here
        const netStat = await si.networkStats(netInt[3].iface);
        console.log('Network Interface: ' + netStat[0].iface);
        console.log('Rx bytes: ' + netStat[0].rx_bytes);
        console.log('Tx bytes: ' + netStat[0].tx_bytes);
    } catch (e) {
        console.log(e);
    }
}

cpuData();
timeData();
cpuLoad();
ramUsage();
netUsage();