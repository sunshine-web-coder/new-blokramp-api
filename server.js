require("dotenv").config();
Object.defineProperty(global, '_bitcore', { get(){ return undefined }, set(){} });
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const { ethers, BigNumber } = require('ethers');
const Flutterwave = require('flutterwave-node-v3');
const got = require("got");
const axios = require("axios");
const abi20 = require("./constants");



const app = express();

// parse application/json
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())


const INFURA_URL_TESTNETeth = process.env.INFURA_URL_TESTNETeth;
const INFURA_URL_TESTNETbnb = process.env.INFURA_URL_TESTNETbnb;



let returnValue = false;

let paidCrypto = false;





//for contract 1
const getErcContract = async (address, chain) => {
  let provider;
  console.log(address, chain);
  if(chain == 1) {
    provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNETeth);
  } else if(chain == 56) {
    provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNETbnb);
    //provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL_BNBTESTNET);
  } else {
    provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL_BNBTESTNET);
  }
   
  const walletget = new ethers.Wallet( process.env.PRIVATEKEY, provider);
  return new ethers.Contract(address, abi20, walletget);
}



  app.get("/", function(req, res) {
  res.send("Welcome");
  });



  
/*
app.get("/test/:id/:chain", async function(req, res) {
    console.log("Called data");
    //const providerBSC = new ethers.providers.JsonRpcProvider("https://goerli.infura.io/v3/5078ef13112242c983a5945da4b8a4ae");
    let provider;
    if(req.params.chain == 1) {
      provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNETeth);
    } else if(req.params.chain == 56) {
      provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNETbnb);
    } else if(req.params.chain == 137) {
      provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL_POLYGON);
    } else if(req.params.chain == 5) {
      provider = new ethers.providers.JsonRpcProvider("https://goerli.infura.io/v3/5078ef13112242c983a5945da4b8a4ae");
    } else {
      provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL_BNBTESTNET);
    }
    provider.once(req.params.id, async (transaction) => {
      // Emitted when the transaction has been mined
      const value = await provider.getTransaction(req.params.id);
      console.log(Math.round((value.value/ 10) * 10 ) / 10**18);
      console.log(req.params.id, "working");
      console.log(value);
      console.log(Math.round((transaction.gasUsed/ 10) * 10 ) / 10**18 );
      console.log("Working");
      console.log("events, Tracking");
    });
})
*/

//get to check if tx has been mined
 app.get("/tx/:id/:chain/:address", async function(req, res) {

    let provider;
    if(req.params.chain == 1) {
      provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNETeth);
    } else if(req.params.chain == 56) {
      provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNETbnb);
    } else if(req.params.chain == 137) {
      provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL_POLYGON);
    } else if(req.params.chain == 5) {
      console.log("running in here main");
    provider = new ethers.providers.JsonRpcProvider("https://goerli.infura.io/v3/5078ef13112242c983a5945da4b8a4ae");
     } else {
      provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL_BNBTESTNET);
    }


    // Emitted when the transaction has been mined
    let tx = await provider.getTransaction(req.params.id);
    //console.log(tx)
    
    const amount = Math.round((tx.value/ 10) * 10 ) / 10**18;
    //const compare = await provider.getBlock(tx.blockNumber);
    
      if(tx.blockNumber !== null) {
        if(req.params.address === tx.from) {
          if(tx.to === "0xef15cB58639c116d66C283a1bF63415F2e3015Ae") {
              res.send({
                data: true,
                amount: amount
              });
          }
        }
      } else {
        res.send({
           data: false,
           });
      }
  

    

  

 })


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
        res.send({response: response});
    } catch (err) {
        console.log(err);  
    }
})



  app.get('/payment-callback', async (req, res) => {
    if (req.query.status === 'successful') {
            // Success! Confirm the customer's payment
            //Transfer the crypto
            console.log(req.query.tx_ref);
            const mix = req.query.tx_ref;

            const value = mix.split(',');

            if(value[1] === "ethereum") {
                
                const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNETeth); //main
                
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

              returnValue = true;
    
              setTimeout(() => {
                returnValue = false;
              }, 3000);

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


                returnValue = true;

                setTimeout(() => {
                  returnValue = false;
                }, 3000);

            } else if(value[1] === "matic-network") {

              const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL_POLYGON);

              tx = {
                  to: value[2],
                  value: ethers.utils.parseEther(value[3])
                }
   
              //instantiate wallet
              const walletget = new ethers.Wallet( process.env.PRIVATEKEY, provider )
  
                // Signing a transaction
              await walletget.signTransaction(tx)
  
              // Sending ether
              const done = await walletget.sendTransaction(tx);
              await done.wait();


              returnValue = true;

              setTimeout(() => {
                returnValue = false;
              }, 3000);

            } else {

              const Contract = await getErcContract(value[4], value[5]);
              const transfer = Contract.transfer(value[2], ethers.utils.parseUnits(String(value[3])) );

              returnValue = true;

              setTimeout(() => {
                returnValue = false;
              }, 3000);
            }

      } 
    });






//order callback url
  app.get('/order-callback', async (req, res) => {
    paidCrypto = true;
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
app.post('/transfertobank', async (req, res) => {

  //callback_url: "https://blockramp.vercel.app",
  console.log(req.body);

  if(req.body.country == 'NGN') {

    const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
      const details = {
        account_bank: req.body.accountbank,
        account_number: req.body.accountnumber,
        amount: req.body.amount,
        narration: "Payment for Service",
        currency: "NGN",
        reference: "transfer_"+Date.now(),
        debit_currency: "NGN"
          }

        const response = await flw.Transfer.initiate(details);
        if(response.status === "success") {
          paidCrypto = true;
          res.send(true);
        }


    } else if(req.body.country == 'USD') {

    const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
      const detailstwo = {
        amount: req.body.amount,
        narration: "Payment for Service",
        currency: "USD",
        beneficiary_name: req.body.beneficiaryname,
        meta:
          {
           AccountNumber: req.body.accountnumber,
           RoutingNumber: req.body.routingnumber,
           SwiftCode: req.body.swiftcode,
           BankName: req.body.bankname,
           BeneficiaryName: req.body.beneficiaryname,
           BeneficiaryAddress: req.body.BeneficiaryAddress,
           BeneficiaryCountry: req.body.BeneficiaryCountry
          }
        }
    const response = await flw.Transfer.initiate(detailstwo);
    if(response.status === "success") {
      paidCrypto = true;
      res.send(true);
    }

  } else {
    const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
      const detailsthree = {
        amount: req.body.amount,
        narration: "Payment for Service",
        currency: req.body.country,
        beneficiary_name: req.body.beneficiaryname,
        meta:
          {
           AccountNumber: req.body.accountnumber,
           RoutingNumber: req.body.routingnumber,
           SwiftCode: req.body.swiftcode,
           BankName: req.body.bankname,
           BeneficiaryName: req.body.beneficiaryname,
           BeneficiaryCountry: req.body.BeneficiaryCountry,
           PostalCode: req.body.PostalCode,
           StreetNumber: req.body.streetnumber,
           StreetName: req.body.StreetName,
           City: req.body.city
          }
        }
    const response = await flw.Transfer.initiate(detailsthree);
    if(response.status === "success") {
      paidCrypto = true;
      res.send(true);
    }
  }

  

})






app.listen(process.env.PORT || 8000,  function(){
    console.log("App is listening on url http://localhost:8000");
  });
  