require("dotenv").config();
Object.defineProperty(global, '_bitcore', { get(){ return undefined }, set(){} });
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const { ethers, BigNumber } = require('ethers');
const Flutterwave = require('flutterwave-node-v3');
const got = require("got");
const bitcore = require("bitcore-lib");
const axios = require("axios");
const explorers = require('bitcore-explorers');
const abi20 = require("./constants");



const app = express();

// parse application/json
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(bodyParser.json());
app.use(cors())


const INFURA_URL_TESTNETeth = process.env.INFURA_URL_TESTNETeth;
const INFURA_URL_TESTNETbnb = process.env.INFURA_URL_TESTNETbnb;


// main  0xdac17f958d2ee523a2206206994597c13d831ec7
// test 0x6c73a325b9fA2D17296f8008805bb3ddd2F4484d
const usdtAddress = 0xdac17f958d2ee523a2206206994597c13d831ec7;


let returnValue = false;

let paidCrypto = false;




//for contract 1
const getErcContract = async () => {
  const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNETeth);
  const walletget = new ethers.Wallet( process.env.PRIVATEKEY, provider);
  return new ethers.Contract(usdtAddress, abi20, walletget);
}



  app.get("/", function(req, res) {
  res.send("Welcome");
  });



  //get return value
  app.get("/check",  function(req, res){
    res.send({check: returnValue});
  });


  //get paid value
  app.get("/checkpaid",  function(req, res){
    res.send({check: paidCrypto});
  });



//main link https://blok-ramp.herokuapp.com/payment-callback
//test link  http://localhost:8000/payment-callback
app.post('/paymentlink', async (req, res) => {
    console.log(req.body);
      try {
      const response = await got.post("https://api.flutterwave.com/v3/payments", {
            headers: {
                Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
            },
            json: {
                tx_ref: req.body.tx,
                amount: req.body.amount,
                currency: "USD",
                redirect_url: "http://localhost:8000/payment-callback",

                customer: { 
                  email: req.body.email,
              },  

            }
        }).json();
        //console.log(response);
        res.send({response: response});
        //res.send("<script>window.close();</script > ");
    } catch (err) {
        console.log(err);  
        //console.log(err.response.body);
    }
})



  app.get('/payment-callback', async (req, res) => {
     //console.log("Recieved and working on withdrawal");
     //console.log(req.query.tx_ref);
    if (req.query.status === 'successful') {
            // Success! Confirm the customer's payment
            //Transfer the crypto
            console.log(req.query.tx_ref);
            const mix = req.query.tx_ref;

            const value = mix.split(',');

            //console.log(id, "idget");
            //console.log(mix);
            //console.log(value[1]);
            //console.log(value[2]);

            if(value[1] === "ethereum") {

                const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNETeth);

                tx = {
                    to: value[2],
                    value: ethers.utils.parseEther(value[3])
                  }
     
                //instantiate wallet
                const walletget = new ethers.Wallet( process.env.PRIVATEKEY, provider)
    
                  // Signing a transaction
                await walletget.signTransaction(tx)
    
                // Sending ether
                const done = await walletget.sendTransaction(tx);
                await done.wait();
               //res.redirect(`http://127.0.0.1:5173/${req.query.tx_ref}`);
              //const done = await got(`http://127.0.0.1:5173/${req.query.tx_ref}`, { json: true });
              //res.send(done)
              returnValue = true;

            }  else if(value[1] === "binancecoin") {

                const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNETbnb);

                tx = {
                    to: value[2],
                    value: ethers.utils.parseEther(value[3])
                  }
     
                //instantiate wallet
                const walletget = new ethers.Wallet( process.env.PRIVATEKEY, provider)
    
                  // Signing a transaction
                await walletget.signTransaction(tx)
    
                // Sending ether
                const done = await walletget.sendTransaction(tx);
                await done.wait();

                //res.redirect(`http://127.0.0.1:5173/${req.query.tx_ref}`);
                //const done = await got(`http://127.0.0.1:5173/${req.query.tx_ref}`, { json: true });
                //res.send(done)
                returnValue = true;

            } else if(value[1] === "usdt") {
              /*
              const sochain_network = "BTCTEST"; // the Testnet network for sochain

               //your bitcoin address. The one you want to send funds from -- the one we just generated 
              const sourceAddress = `mpyEsPc1YFjrxTxryXAwpNSw3TFq4URQDx`;

              
              //because the outputs come in satoshis, and 1 Bitcoin is equal to 100,000,000 satoshies, we'll multiply the amount of bitcoin by 100,000,000 to get the value in satoshis.
              
                const satoshiToSend = value[3]/1 * 100000000;
                console.log(satoshiToSend)
                let fee = 0; 
                let inputCount = 0;
                let outputCount = 2; // we are going to use 2 as the output count because we'll only send the bitcoin to 2 addresses the receiver's address and our change address.

            
                const utxos = await axios.get(
                  `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`,
                  {
                    headers: {
                      'Accept-Encoding': 'application/json',
                    }

                  }
                );
                console.log(await utxos.data.data.txs, "one");
                
                let waitwait = await utxos.data.data.txs;

                const transaction = new bitcore.Transaction();
                let totalAmountAvailable = 0;
                let inputs = [];
                //let utxos = response.data.data.txs;
             
                for (const element of waitwait) {
                  let utxo = {};
                  utxo.satoshis = Math.floor(Number(element.value) * 100000000);
                  utxo.script = element.script_hex;
                  utxo.address = utxos.data.data.address;
                  utxo.txId = element.txid;
                  utxo.outputIndex = element.output_no;
                  totalAmountAvailable += utxo.satoshis;
                  inputCount += 1;
                  inputs.push(utxo);
                }

                console.log(totalAmountAvailable);

                const transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
                //console.log("here", 1);
                // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte

                fee = transactionSize * 20
                //console.log("here", 2);
                if (totalAmountAvailable - satoshiToSend - fee  <= 0) {
                  throw new Error("Balance is too low for this transaction");
                }
                //console.log("here", 3);

                //console.log(inputs);
                //Set transaction input
                transaction.from(inputs);
                //console.log("here", 4);

                // set the recieving address and the amount to send
                //const valuetosend = satoshiToSend/100000000;
                //console.log(valuetosend,"Send");
                //console.log(satoshiToSend, "main satoshi to send");
                //console.log(Math.floor(satoshiToSend), "Satoshi to send two");
                //console.log(value[2], "reciever");
                transaction.to(value[2], Math.floor(satoshiToSend));
                //console.log("here", 5);

                // Set change address - Address to receive the left over funds after transfer
                transaction.change(sourceAddress);

                //manually set transaction fees: 20 satoshis per byte
                transaction.fee(fee);
                console.log(transaction.toObject());


               
                // Sign transaction with your private key
                transaction.sign(process.env.PRIVATEKEYBTC);


                // serialize Transactions
                const serializedTransaction = transaction.serialize();
                
                // Send transaction
                const response = await got.post(`https://sochain.com/api/v2/send_tx/${sochain_network}`, {
                  json: {
                      tx_hex: serializedTransaction,
                  }

              }).json();
              */
              /*
              const unit = bitcore.Unit;
              const insight = new explorers.Insight();
              const minerFee = unit.fromMilis(0.128).toSatoshis(); //cost of transaction in satoshis (minerfee)
              const transactionAmount = unit.fromMilis(value[3]).toSatoshis(); //convert mBTC to Satoshis using bitcore unit
              const sourceAddress = `1NReB1o1feDnQBMeumoaX95AaMyNkmSZUW`;
              var privateKey = new bitcore.PrivateKey(process.env.PRIVATEKEYBTC);
              */
              /*
              insight.getUnspentUtxos(sourceAddress, function(error, utxos) {
                console.log("One");
                if (error) {
                  //any other error
                   //throw (error);
                   console.log("first error");
                   return;
                } else {
                  console.log(utxos, "UTXOS");
                  if (utxos.length == 0) {
                    //if no transactions have happened, there is no balance on the address.
                    return console.log("You don't have enough Satoshis to cover the miner fee.");
                  }
                  console.log("Two");
                  //get balance
                  let balance = unit.fromSatoshis(0).toSatoshis();
                  for (var i = 0; i < utxos.length; i++) {
                    balance += unit.fromSatoshis(parseInt(utxos[i]['satoshis'])).toSatoshis();
                  }
          
                  //check whether the balance of the address covers the miner fee
                  if ((balance - transactionAmount - minerFee) > 0) {
                    console.log("Three");
                    //create a new transaction
                    try {
                      let bitcore_transaction = new bitcore.Transaction()
                        .from(utxos)
                        .to(value[2], transactionAmount)
                        .fee(minerFee)
                        .change(sourceAddress)
                        .sign(privateKey);
          
                      //handle serialization errors
                      if (bitcore_transaction.getSerializationError()) {
                        let error = bitcore_transaction.getSerializationError().message;
                        switch (error) {
                          case 'Some inputs have not been fully signed':
                            return console.log('Please check your private key');
                            break;
                          default:
                            return console.log("Error serielize");
                        }
                      }
                      console.log("Four");
                      // broadcast the transaction to the blockchain
                      insight.broadcast(bitcore_transaction, function(error, body) {
                        if (error) {
                          console.log('Error in broadcast: ');
                        } else {
                          resolve({
                            transactionId: body
                          });
                        }
                      });
                      console.log("Five");
                      console.log("Reached here");
                      returnValue = true;
                    } catch (error) {
                       console.log("Last error");
                    }
                  } else {
                    return console.log("You don't have enough Satoshis to cover the miner fee.");
                  }
                }
              });
              */


              const Contract = await getErcContract();
              const transfer = Contract.transfer(value[2], ethers.utils.parseUnits(String(value[3])) );
              await transfer.wait();

              returnValue = true;
            }

      } 
    });



  /*
    app.get("/test/:address", async function(req, res) {
      const providerBSC = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-2-s3.binance.org:8545");
      console.log(req.params.address);
      providerBSC.on("pending", async (tx) => {

        console.log(tx.hash);

        if(tx.from === req.params.address) {
          console.log("gotten");
          let pendingTx = await providerBSC.getTransaction(tx.hash);
  
          if(pendingTx && pendingTx.blockNumber) {
            
            console.log("Done");
            res.send("Done");
  
          }
  
        }

      })


    })
    */

    //for sell calls
    //for callback "https://blok-ramp.herokuapp.com/payment-callbacktwo"
    app.post('/sellcrypto', async (req, res) => {
      console.log("called sell");
      console.log(req.body);


     
    if(req.body.crypto === "binancecoin") {
     //Sell for bsc
     const providerBSC = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL_TESTNETbnb);
     providerBSC.on("pending", async (tx) => {
          // Emitted when any new pending transaction is noticed
          console.log(tx);
          if(tx.from === req.body.address) {
            let pendingTx = await providerBSC.getTransaction(tx.hash);

            if(pendingTx && pendingTx.blockNumber) {

                if(req.body.country == 'NGN') {
                  res.redirect(`http://blokrampp-env.eba-ucsptawd.us-east-1.elasticbeanstalk.com/transfertobank?country=${req.body.country}&accountbank=${req.body.accountbank}&accountnumber=${req.body.accountnumber}&amount=${req.body.amount}`);
                } else if(req.body.country == 'USD') {
                  res.redirect(`http://blokrampp-env.eba-ucsptawd.us-east-1.elasticbeanstalk.com/transfertobank?country=${req.body.country}&bankname=${req.body.bankname}&accountnumber=${req.body.accountnumber}&amount=${req.body.amount}&beneficiaryname=${req.body.beneficiaryname}&BeneficiaryAddress=${req.body.BeneficiaryAddress}&BeneficiaryCountry=${req.body.BeneficiaryCountry}&swiftcode=${req.body.swiftcode}&routingnumber=${req.body.routingnumber}`);
                } else {
                  res.redirect(`http://blokrampp-env.eba-ucsptawd.us-east-1.elasticbeanstalk.com/transfertobank?country=${req.body.country}&bankname=${req.body.bankname}&accountnumber=${req.body.accountnumber}&amount=${req.body.amount}&beneficiaryname=${req.body.beneficiaryname}&BeneficiaryAddress=${req.body.BeneficiaryAddress}&BeneficiaryCountry=${req.body.BeneficiaryCountry}&swiftcode=${req.body.swiftcode}&routingnumber=${req.body.routingnumber}&PostalCode=${req.body.PostalCode}&streetnumber=${req.body.streetnumber}&StreetName=${req.body.StreetName}&city=${req.body.city}`);
                } 

            }

          }
      });

    } else if(req.body.crypto === "ethereum") {

     //Sell for eth
     const providerETH = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL_TESTNETeth);
     providerETH.on("pending", async (tx) => {
          // Emitted when any new pending transaction is noticed
          //console.log(tx);

          if(tx.from === req.body.address) {
            let pendingTx = await providerETH.getTransaction(tx.hash);

            if(pendingTx && pendingTx.blockNumber) {

                if(req.body.country == 'NGN') {
                  res.redirect(`http://blokrampp-env.eba-ucsptawd.us-east-1.elasticbeanstalk.com/transfertobank?country=${req.body.country}&accountbank=${req.body.accountbank}&accountnumber=${req.body.accountnumber}&amount=${req.body.amount}`);
                } else if(req.body.country == 'USD') {
                  res.redirect(`http://blokrampp-env.eba-ucsptawd.us-east-1.elasticbeanstalk.com/transfertobank?country=${req.body.country}&bankname=${req.body.bankname}&accountnumber=${req.body.accountnumber}&amount=${req.body.amount}&beneficiaryname=${req.body.beneficiaryname}&BeneficiaryAddress=${req.body.BeneficiaryAddress}&BeneficiaryCountry=${req.body.BeneficiaryCountry}&swiftcode=${req.body.swiftcode}&routingnumber=${req.body.routingnumber}`);
                } else {
                  res.redirect(`http://blokrampp-env.eba-ucsptawd.us-east-1.elasticbeanstalk.com/transfertobank?country=${req.body.country}&bankname=${req.body.bankname}&accountnumber=${req.body.accountnumber}&amount=${req.body.amount}&beneficiaryname=${req.body.beneficiaryname}&BeneficiaryAddress=${req.body.BeneficiaryAddress}&BeneficiaryCountry=${req.body.BeneficiaryCountry}&swiftcode=${req.body.swiftcode}&routingnumber=${req.body.routingnumber}&PostalCode=${req.body.PostalCode}&streetnumber=${req.body.streetnumber}&StreetName=${req.body.StreetName}&city=${req.body.city}`);
                }     

            }

          }

      });    
    

    } else {

      //const amount = req.body.amount;
      //const from = req.body.address;
      //const to = "0xef15cB58639c116d66C283a1bF63415F2e3015Ae";
      //usdt
      const Contract = await getErcContract();
      Contract.on("Transfer", (to, amount, from) => {
       
        if(req.body.address === from) {
            if(req.body.country == 'NGN') {
              res.redirect(`http://blokrampp-env.eba-ucsptawd.us-east-1.elasticbeanstalk.com/transfertobank?country=${req.body.country}&accountbank=${req.body.accountbank}&accountnumber=${req.body.accountnumber}&amount=${req.body.amount}`);
            } else if(req.body.country == 'USD') {
              res.redirect(`http://blokrampp-env.eba-ucsptawd.us-east-1.elasticbeanstalk.com/transfertobank?country=${req.body.country}&bankname=${req.body.bankname}&accountnumber=${req.body.accountnumber}&amount=${req.body.amount}&beneficiaryname=${req.body.beneficiaryname}&BeneficiaryAddress=${req.body.BeneficiaryAddress}&BeneficiaryCountry=${req.body.BeneficiaryCountry}&swiftcode=${req.body.swiftcode}&routingnumber=${req.body.routingnumber}`);
            } else {
              res.redirect(`http://blokrampp-env.eba-ucsptawd.us-east-1.elasticbeanstalk.com/transfertobank?country=${req.body.country}&bankname=${req.body.bankname}&accountnumber=${req.body.accountnumber}&amount=${req.body.amount}&beneficiaryname=${req.body.beneficiaryname}&BeneficiaryAddress=${req.body.BeneficiaryAddress}&BeneficiaryCountry=${req.body.BeneficiaryCountry}&swiftcode=${req.body.swiftcode}&routingnumber=${req.body.routingnumber}&PostalCode=${req.body.PostalCode}&streetnumber=${req.body.streetnumber}&StreetName=${req.body.StreetName}&city=${req.body.city}`);
            }
        }

      
      
      });


    }



  })



//order callback url
  app.get('/order-callback', async (req, res) => {
    console.log(req.query, "body");
    console.log(req.params, "params");
    console.log("called ordercallback");
    paidCrypto = true;
    res.send("<script>window.close();</script > ");
    //Transfer 
  })




//get banks
app.get("/getbanks/:country",  async function(req, res){


  console.log(req.params);

  const banks = await axios.get( `https://api.flutterwave.com/v3/banks/${req.params.country}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.FLW_SECRET_KEY}`
      }

    }
  );

  //console.log(banks.data);
  res.send(banks.data);
});



//confirm bank details
app.post('/confirmaccount', async (req, res) => {
  console.log(req.body);
   

       console.log("Running");
     

        const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
        const details = {
          account_number: req.body.accnumber,
          account_bank: req.body.bank
        };
        const response = await flw.Misc.verify_Account(details)

        console.log(response);
        res.send(response);


})


//Transfer to bank
app.get('/transfertobank', async (req, res) => {

  if(req.query.country == 'NGN') {

    const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
      const details = {
        account_bank: req.query.accountbank,
        account_number: req.query.accountnumber,
        amount: amount,
        narration: "Payment for Service",
        currency: "NGN",
        reference: "transfer_"+Date.now(),
        callback_url: "https://blockramp.vercel.app",
        debit_currency: "NGN"
          }

        const response = await flw.Transfer.initiate(details);
        paidCrypto = true;
        console.log(response);
        res.send(response);

    } else if(req.query.country == 'USD') {

    const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
      const detailstwo = {
        amount: req.query.amount,
        narration: "Payment for Service",
        currency: "USD",
        beneficiary_name: req.query.beneficiaryname,
        meta:
          {
           AccountNumber: req.query.accountnumber,
           RoutingNumber: req.query.routingnumber,
           SwiftCode: req.query.swiftcode,
           BankName: req.query.bankname,
           BeneficiaryName: req.query.beneficiaryname,
           BeneficiaryAddress: req.query.BeneficiaryAddress,
           BeneficiaryCountry: req.query.BeneficiaryCountry
          }
        }
    const response = await flw.Transfer.initiate(detailstwo);
    console.log(response);
    paidCrypto = true;
    res.send(response);

  } else {
    const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
      const detailsthree = {
        amount: req.query.amount,
        narration: "Payment for Service",
        currency: req.query.country,
        beneficiary_name: req.query.beneficiaryname,
        meta:
          {
           AccountNumber: req.query.accountnumber,
           RoutingNumber: req.query.routingnumber,
           SwiftCode: req.query.swiftcode,
           BankName: req.query.bankname,
           BeneficiaryName: req.query.beneficiaryname,
           BeneficiaryCountry: req.query.BeneficiaryCountry,
           PostalCode: req.query.PostalCode,
           StreetNumber: req.query.streetnumber,
           StreetName: req.query.StreetName,
           City: req.query.city
          }
        }
    const response = await flw.Transfer.initiate(detailsthree);
    console.log(response);
    paidCrypto = true;
    res.send(response);
  }

  

        /*
        const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
        const details = {
          account_number: req.body.accnumber,
          account_bank: req.body.bank
        };
        const response = await flw.Misc.verify_Account(details)
        */

})






app.listen(process.env.PORT || 8000,  function(){
    console.log("App is listening on url http://localhost:8000");
  });
  