const fs = require('fs');
const si = require('systeminformation');

// location to store the result
//const RESULT_DATA_PATH = '/home/vagrant/monitoring_result.csv';
const RESULT_DATA_PATH = 'monitoring_result.csv';

// duration of TOTAL recording in milliseconds
// remember to consider adding the interval duration
// e.g. if you want to record every 1 second in 10 seconds then
// set INTERVAL to 1000 and DURATION to 11000 (+INTERVAL)
const DURATION = 41000;
// duration of INTERVAL between recording in milliseonds
const INTERVAL = 1000;

// index for the network interface to be monitored
// run 'ipconfig' or 'ifconfig'
// count from top to bottom beginning with 0
const NETWORK_INTERFACE_INDEX = 2;

function consturctHeader(cores) {
    let string = "timestamp,mem_used,rx_sec,tx_sec,cpu_avgload,cpu_currentload";
    for (i = 0; i < cores; i++) {
        string += ",cpu_" + i;
    }
    string += "\r\n";
    return string;
}

function constructRow(time, mem, net, cpu, cores) {
    let string = time.current + "," + mem.used + "," + net[0].rx_sec + "," + net[0].tx_sec + "," + cpu.avgload + "," + cpu.currentload;
    for (i = 0; i < cores; i++) {
        string += "," + cpu.cpus[i].load;
    }
    string += "\r\n";
    return string;
}

async function makeHeader() {
    try {
        const data = await si.cpu();
        const header = consturctHeader(data.cores);
        fs.appendFileSync(RESULT_DATA_PATH, header);
    } catch (e) {
        console.log(e);
    }
}

async function makeRow() {
    try {
        const data = await si.cpu();
        const time = await si.time();
        const mem = await si.mem();
        const netInt = await si.networkInterfaces();
        const netStat = await si.networkStats(netInt[NETWORK_INTERFACE_INDEX].iface);
        const cpuLoad = await si.currentLoad();

        const row = constructRow(time, mem, netStat, cpuLoad, data.cores);
        fs.appendFileSync(RESULT_DATA_PATH, row);
    } catch (e) {
        console.log(e);
    }
}

function main() {
    try {
        console.log('Begin Recording...');

        if (fs.existsSync(RESULT_DATA_PATH)) {
            fs.unlinkSync(RESULT_DATA_PATH);
        }
        makeHeader();

        const timerId = setInterval(makeRow, INTERVAL);
        setTimeout(() => {
            clearInterval(timerId);
            console.log('Recording Completed!');
        }, DURATION);
    } catch (e) {
        console.log(e);
    }
}

main();