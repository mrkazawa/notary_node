const iota_engine = require('../payment/iota_engine');

const RECIPIENT_ADDRESS = 'OPWZTSFCTVNDYXFLCAJPOQAONK9THEHWZPDT9JMRPHXSJNXNM9PXARVBDUM9YTDG9YRYEPNJNIFZRWNZCZWDWBEGWY';
const TAG = makeRandomIotaTag();
const RENT_FEE = 1;


do_iota_payment();

async function do_iota_payment() {
    await iota_engine.getCurrentBalance(RECIPIENT_ADDRESS);
    const tailHash = await iota_engine.sendTransaction(RECIPIENT_ADDRESS, RENT_FEE, TAG);
    const txResult = await iota_engine.verifyTransaction(tailHash, RECIPIENT_ADDRESS, RENT_FEE, TAG);
    if (txResult) {
        console.log("Car Payment Done!");
    }
}

function makeRandomIotaTag() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
    const charactersLength = characters.length;
    const length = 27; // IOTA tag length is 27 trytes

    var result = '';
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }