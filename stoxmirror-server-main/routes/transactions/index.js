const UsersDatabase = require("../../models/User");
var express = require("express");
var router = express.Router();
const { sendDepositEmail,sendPlanEmail} = require("../../utils");
const { sendUserDepositEmail,sendUserPlanEmail,sendWithdrawalEmail,sendWithdrawalRequestEmail,sendKycAlert} = require("../../utils");
const cron = require('node-cron');
const { v4: uuidv4 } = require("uuid");
const app=express()




router.post("/:_id/deposit", async (req, res) => {
  const { _id } = req.params;
  const { method, amount, from ,timestamp,to} = req.body;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    await user.updateOne({
      transactions: [
        ...user.transactions,
        {
          _id: uuidv4(),
          method,
          type: "Deposit",
          amount,
          from,
          status:"pending",
          timestamp,
        },
      ],
    });

    res.status(200).json({
      success: true,
      status: 200,
      message: "Deposit was successful",
    });

    sendDepositEmail({
      amount: amount,
      method: method,
      from: from,
      timestamp:timestamp
    });


    sendUserDepositEmail({
      amount: amount,
      method: method,
      from: from,
      to:to,
      timestamp:timestamp
    });

  } catch (error) {
    console.log(error);
  }
});

router.post("/:_id/plan", async (req, res) => {
  const { _id } = req.params;
  const { subname, subamount, from ,timestamp,to} = req.body;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }
  try {
    // Calculate the new balance by subtracting subamount from the existing balance
    const newBalance = user.balance - subamount;

    await user.updateOne({
      planHistory: [
        ...user.planHistory,
        {
          _id: uuidv4(),
          subname,
          subamount,
          from,
          timestamp,
        },
      ],
      balance: newBalance, // Update the user's balance
    });



    res.status(200).json({
      success: true,
      status: 200,
      message: "Deposit was successful",
    });

    sendPlanEmail({
      subamount: subamount,
      subname: subname,
      from: from,
      timestamp:timestamp
    });


    sendUserPlanEmail({
      subamount: subamount,
      subname: subname,
      from: from,
      to:to,
      timestamp:timestamp
    });

  } catch (error) {
    console.log(error);
  }
});


router.post("/:_id/auto", async (req, res) => {
  const { _id } = req.params;
  const { copysubname, copysubamount, from ,timestamp,to} = req.body;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }
  try {
    // Calculate the new balance by subtracting subamount from the existing balance
    const newBalance = user.balance - copysubamount;

    await user.updateOne({
      plan: [
        ...user.plan,
        {
          _id: uuidv4(),
          subname:copysubname,
          subamount:copysubamount,
          from,
          timestamp,
        },
      ],
      balance: newBalance, // Update the user's balance
    });



    res.status(200).json({
      success: true,
      status: 200,
      message: "Deposit was successful",
    });

    sendPlanEmail({
      subamount: copysubamount,
      subname: copysubname,
      from: from,
      timestamp:timestamp
    });


    sendUserPlanEmail({
      subamount: copysubamount,
      subname: copysubname,
      from: from,
      to:to,
      timestamp:timestamp
    });

  } catch (error) {
    console.log(error);
  }
});




// Endpoint to handle copytradehistory logic
router.post("/:_id/Tdeposit", async (req, res) => {
  const { _id } = req.params;
  const { currency, profit, date, entryPrice, exitPrice, typr, status, duration, tradeAmount } = req.body;

  const user = await UsersDatabase.findOne({ _id});


  if (!user) {
    return res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });
  }

  try {
    const tradeId = uuidv4();
    const startTime = new Date();
    const userProfit = Number(user.profit || 0);
    const profitToAdd = Number(profit);
const newBalance = user.balance - tradeAmount;
    // Create initial trade record
    await user.updateOne({
      planHistory: [
        ...user.planHistory,
        {
          _id: tradeId,
          currency,
          entryPrice,
          typr,
          status: 'PENDING',
          exitPrice,
          profit: profitToAdd,
          date,
          duration,
          startTime
        },
      ],
      balance:newBalance,
    });

    // Schedule status update to 'active' after 1 minute
    setTimeout(async () => {
      await UsersDatabase.updateOne(
        { _id, "planHistory._id": tradeId },
        { $set: { "planHistory.$.status": "ACTIVE" } }
      );
    }, 60000);

    // Schedule completion after duration
    cron.schedule('* * * * *', async () => {
      try {
        const currentUser = await UsersDatabase.findOne({ _id });
        const trade = currentUser.planHistory.find(t => t._id === tradeId);
        
        if (!trade || trade.status !== 'ACTIVE') return;

        const currentTime = new Date();
        const elapsedTime = (currentTime - new Date(trade.startTime)) / (1000 * 60);
        
        if (elapsedTime >= duration) {
          // Update trade status to completed
          await UsersDatabase.updateOne(
            { _id, "planHistory._id": tradeId },
            { 
              $set: {
                "planHistory.$.status": "COMPLETED"
              }
            }
          );

          // Add the profit directly using $inc operator
          await UsersDatabase.updateOne(
            { _id },
            { $set: { profit: userProfit + profitToAdd } }
          );

          // Update related deposit status
          await UsersDatabase.updateOne(
            { 
              _id, 
              "transactions.currency": currency,
              "transactions.status": "pending"
            },
            { 
              $set: { "transactions.$.status": "completed" }
            }
          );
        }
      } catch (error) {
        console.error('Cron job error:', error);
      }
    });

    res.status(200).json({
      success: true,
      status: 200,
      message: "Trade initiated successfully",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      status: 500,
      message: "Internal server error",
    });
  }
});


router.put("/:_id/transactions/:transactionId/confirm", async (req, res) => {
  
  const { _id } = req.params;
  const { transactionId } = req.params;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    const depositsArray = user.transactions;
    const depositsTx = depositsArray.filter(
      (tx) => tx._id === transactionId
    );

    depositsTx[0].status = "Approved";
    // console.log(withdrawalTx);

    // const cummulativeWithdrawalTx = Object.assign({}, ...user.withdrawals, withdrawalTx[0])
    // console.log("cummulativeWithdrawalTx", cummulativeWithdrawalTx);

    await user.updateOne({
      transactions: [
        ...user.transactions
        //cummulativeWithdrawalTx
      ],
    });

    res.status(200).json({
      message: "Transaction approved",
    });

    return;
  } catch (error) {
    res.status(302).json({
      message: "Opps! an error occured",
    });
  }
});

router.put("/:_id/transactions/:transactionId/decline", async (req, res) => {
  
  const { _id } = req.params;
  const { transactionId } = req.params;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    const depositsArray = user.transactions;
    const depositsTx = depositsArray.filter(
      (tx) => tx._id === transactionId
    );

    depositsTx[0].status = "Declined";
    // console.log(withdrawalTx);

    // const cummulativeWithdrawalTx = Object.assign({}, ...user.withdrawals, withdrawalTx[0])
    // console.log("cummulativeWithdrawalTx", cummulativeWithdrawalTx);

    await user.updateOne({
      transactions: [
        ...user.transactions
        //cummulativeWithdrawalTx
      ],
    });

    res.status(200).json({
      message: "Transaction declined",
    });

    return;
  } catch (error) {
    res.status(302).json({
      message: "Opps! an error occured",
    });
  }
});



router.get("/:_id/deposit/history", async (req, res) => {
  const { _id } = req.params;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    res.status(200).json({
      success: true,
      status: 200,
      data: [...user.transactions],
    });

  
  } catch (error) {
    console.log(error);
  }
});


router.get("/:_id/deposit/plan/history", async (req, res) => {
  const { _id } = req.params;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    res.status(200).json({
      success: true,
      status: 200,
      data: [...user.planHistory],
    });

  
  } catch (error) {
    console.log(error);
  }
});


router.post("/kyc/alert", async (req, res) => {
  const {firstName} = req.body;

  

  try {
    res.status(200).json({
      success: true,
      status: 200,
     message:"admin alerted",
    });

    sendKycAlert({
      firstName
    })
  
  } catch (error) {
    console.log(error);
  }
});


router.post("/:_id/withdrawal", async (req, res) => {
  const { _id } = req.params;
  const { method, address, amount, from ,account,to,timestamp} = req.body;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    await user.updateOne({
      withdrawals: [
        ...user.withdrawals,
        {
          _id: uuidv4(),
          method,
          address,
          amount,
          from,
          account,
          status: "pending",
          timestamp
        },
      ],
    });

    res.status(200).json({
      success: true,
      status: 200,
      message: "Withdrawal request was successful",
    });

    sendWithdrawalEmail({
      amount: amount,
      method: method,
     to:to,
      address:address,
      from: from,
    });

    sendWithdrawalRequestEmail({
      amount: amount,
      method: method,
      address:address,
      from: from,
    });
  } catch (error) {
    console.log(error);
  }
});

// router.put('/approve/:_id', async (req,res)=>{
//   const { _id} = req.params;
//   const user = await UsersDatabase();
//   const looper=user.map(function (userm){
  
//     const withdd=userm.withdrawal.findOne({_id})
  
//   withdd.status="approved"
//    })
//    looper();

//    res.send({ message: 'Status updated successfully', data });

// })

// // endpoint for updating status
// router.put('/update-status/:userId/:_id', async (req, res) => {

//   const { _id} = req.params; // get ID from request parameter
//   const { userId}=req.params;
//   // const user = await UsersDatabase.findOne({userId}); // get array of objects containing ID from request body


//   const withd=user.withdrawals.findOne({_id})
// user[withd].status="approved"
 

// // find the object with the given ID and update its status property
//   // const objIndex = data.findIndex(obj => obj._id === _id);
//   // data[objIndex].status = 'approved';

//   // send updated data as response

//   if (!userId) {
//     res.status(404).json({
//       success: false,
//       status: 404,
//       message: "User not found",
//     });

//     return;
//   }

//   res.send({ message: 'Status updated successfully', data });
// });

router.put("/:_id/withdrawals/:transactionId/confirm", async (req, res) => {
  
  const { _id } = req.params;
  const { transactionId } = req.params;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    const withdrawalsArray = user.withdrawals;
    const withdrawalTx = withdrawalsArray.filter(
      (tx) => tx._id === transactionId
    );

    withdrawalTx[0].status = "Approved";
    // console.log(withdrawalTx);

    // const cummulativeWithdrawalTx = Object.assign({}, ...user.withdrawals, withdrawalTx[0])
    // console.log("cummulativeWithdrawalTx", cummulativeWithdrawalTx);

    await user.updateOne({
      withdrawals: [
        ...user.withdrawals
        //cummulativeWithdrawalTx
      ],
    });

    res.status(200).json({
      message: "Transaction approved",
    });

    return;
  } catch (error) {
    res.status(302).json({
      message: "Opps! an error occured",
    });
  }
});




router.put("/:_id/withdrawals/:transactionId/decline", async (req, res) => {
  
  const { _id } = req.params;
  const { transactionId } = req.params;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    const withdrawalsArray = user.withdrawals;
    const withdrawalTx = withdrawalsArray.filter(
      (tx) => tx._id === transactionId
    );

    withdrawalTx[0].status = "Declined";
    // console.log(withdrawalTx);

    // const cummulativeWithdrawalTx = Object.assign({}, ...user.withdrawals, withdrawalTx[0])
    // console.log("cummulativeWithdrawalTx", cummulativeWithdrawalTx);

    await user.updateOne({
      withdrawals: [
        ...user.withdrawals
        //cummulativeWithdrawalTx
      ],
    });

    res.status(200).json({
      message: "Transaction Declined",
    });

    return;
  } catch (error) {
    res.status(302).json({
      message: "Opps! an error occured",
    });
  }
});


router.get("/:_id/withdrawals/history", async (req, res) => {
  console.log("Withdrawal request from: ", req.ip);

  const { _id } = req.params;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    res.status(200).json({
      success: true,
      status: 200,
      data: [...user.withdrawals],
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
