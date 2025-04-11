const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Create a MongoDB model for storing image URLs
const Trader = mongoose.model('Trader', {
    name: String,
      frequency: String,
      risk: String,
      id: String,
      signal: String,
      winrate:  String,
      drawdown: String,
      photo:  String,
      strategy: String,
      type: String,
      profit: String,
      confidence: String,
      membership: String,
      return: String,
      country: String,
      maxEarn: String,
      range: String,
      followers: String,
      history:  Array,
      trades:  Array,

   
});






router.post("/register", async (req, res) => {
    const {name,
      frequency,
      risk,
      id,
      signal,
      winrate,
      drawdown,
      photo,
      strategy,
      type,
      profit,
      confidence,
      membership,
      returns,
      country,
      maxEarn,
      range,
      followers,
      history,
      trades,
  
} = req.body;
    try {
      // Check if any user has that id
      const user = await Trader.findOne({ id: id });
    
      if (user) {
        return res.status(400).json({
          success: false,
          message: "Id is already in use",
        });
      }
    
      const newTrader={
        name,
        frequency,
        risk,
        id,
        signal,
        winrate,
        drawdown,
        photo,
        strategy,
        type,
        profit,
        confidence,
        membership,
        returns,
        country,
        maxEarn,
        range,
        followers,
        history:[],
        trades:[],
      }
      const createdUser = await Trader.create(newTrader);
      const token = uuidv4();
      
      return res.status(200).json({ code: "Ok", data: createdUser });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
    
  })
  
  

// Middleware to parse JSON in requests
router.use(express.json());

router.post("/trader/login", async function (request, response) {
    const { id} = request.body;
    /**
     * step1: check if a user exists with that email
     * step2: check if the password to the email is correct
     * step3: if it is correct, return some data
     */
  
    // step1
    const user = await Trader.findOne({ id: id });
  
    if (user) {
      // step2
      // const passwordIsCorrect = compareHashedPassword(user.receiverName, receiverName);
  
        response.status(200).json({ code: "Ok", data: user });
      }
       else if(!user) {
        response.status(502).json({ code: "no user found" });
      }
     else {
      response.status(404).json({ code: "invalid credentials" });
    }
  })
  ;
  
// Generic endpoint to handle 'kyc2' and 'kyc3' logic

// Endpoint for fetching traders
router.get('/trader/fetch-trader', async (req, res) => {
  try {
    const trader = await Trader.find();
    res.json(trader);
  } catch (error) {
    console.error('Error fetching traders:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get("/trader/fetch-trader/:id", async function (req, res, next) {
    const { id } = req.params;
  
    const user = await Trader.findOne({ _id:id  });
  
    if (!user) {
      res.status(404).json({ message: "user not found" });
      return;
    }
  
    res.status(200).json({ code: "Ok", data: user });
  });
  

  router.put("/:_id/profile/update", async function (req, res, next) {
    const { _id } = req.params;
  
    const user = await Trader.findOne({ _id: _id });
  
    if (!user) {
      res.status(404).json({ message: "user not found" });
      return;
    }
  
    try {
      await user.update({
        ...req.body,
      });
  
      return res.status(200).json({
        message: "update was successful",
      });
    } catch (error) {
      console.log(error);
    }
  });

module.exports = router;
