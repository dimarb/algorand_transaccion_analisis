const algosdk = require('algosdk');
const util = require('util')
const algokit = require('@algorandfoundation/algokit-utils');
require('dotenv').config()

// Cliente de algorand configurado internamente con los datos de la testnet
const algorand = algokit.AlgorandClient.testNet();

const client = algorand.client.algod

// Datos de la cuenta remitente traidos en la variable de entorno DISPENSEER_MNEMONIC
const account = algosdk.mnemonicToSecretKey(process.env.DISPENSEER_MNEMONIC); 

async function crearTransaccion() {
    // Obtener los parámetros de transacción sugeridos (First Round, Last Round,Genesis ID y Genesis Hash )
    let params = await client.getTransactionParams().do();
    params.fee = 1000; // Se modifica la tarifa para que quede como  Tarifa mínima
    let to = "CUENTA_DE_DESTINO";

    // Crear la transacción
    let txn = {
        from: account.addr,
        to,
        amount: 1000000, // 1 ALGO = 1,000,000 microAlgos
        suggestedParams: params,
        "note": new Uint8Array(Buffer.from("Primera transacción en Algorand")), // Nota opcional
    };

    // Firmar la transacción
    let signedTxn = algosdk.signTransaction(txn, account.sk);

    // Enviar la transacción
    let tx = await client.sendRawTransaction(signedTxn.blob).do();

    console.log("ID de la transacción: ", tx.txId);

    // Esperar la confirmación de la transacción
    await esperarConfirmacion(tx.txId);

    // Obtener y mostrar la transacción completa
    let transaccion = await client.pendingTransactionInformation(tx.txId).do();
    console.info("Transacción completada:");
    console.log(util.inspect(transaccion, false, null, true /* enable colors */));
}

async function esperarConfirmacion(txId) {
    let confirmedRound = null;
    while (confirmedRound === null) {
        let txInfo = await client.pendingTransactionInformation(txId).do();
        confirmedRound = txInfo['confirmed-round'];
        if (confirmedRound !== null && confirmedRound > 0) {
            console.log("Transacción confirmada en la ronda:", confirmedRound);
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo antes de volver a comprobar
    }
}

crearTransaccion().catch(console.error);
