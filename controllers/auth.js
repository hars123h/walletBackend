const User = require("../model/User")
const referralCodeGenerator = require('referral-code-generator');
const axios = require('axios');
const Plan = require("../model/plan");
const Bank = require('../model/bank');

exports.login = async (req, res, next) => {
  const { mobno, pwd } = req.body
  if (!mobno || !pwd) {
    res.status(400).json({
      message: "Username or Password not present",
    })
  } else {
    try {
      const data = await User.findOne({ mobno: mobno, pwd: pwd }).then(response => { return response; });
      res.status(200).json({
        message: 'Logged In Successfully',
        user_details: data,
      })
    } catch (error) {
      res.status(400).json({
        message: 'Something went wrong',
        error: error
      });
    }
  }
}

exports.register = async (req, res, next) => {
  const { mobno, pwd, wpwd, invt } = req.body;
  if (pwd.length < 6) {
    return res.status(400).json({ message: "Password less than 6 characters" })
  }
  try {
    await User.create({
      mobno,
      pwd,
      wpwd,
      time: new Date(),
      balance: 0,
      recharge_amount: 0,
      earning: 0,
      user_invite: referralCodeGenerator.alpha('lowercase', 6),
      parent_invt: invt,
      grand_parent_invt: '',
      directRecharge: 0,
      indirectRecharge: 0,
      directMember: [],
      indirectMember: [],
      boughtLong: 0,
      showShort: 0,
      boughtShort: 0,
      lastWithdrawal: new Date()
    }).then(async (user) => {

      const parent_data = await User.findOne({ user_invite: user.parent_invt }).then((res) => res);
      return { user, parent_data };

    }).then(async ({ user, parent_data }) => {

      const grand_parent_data = await User.findOne({ user_invite: parent_data.parent_invt }).then((res) => res)
      return { user, parent_data, grand_parent_data };

    }).then(async ({ user, parent_data, grand_parent_data }) => {

      const great_grand_parent_data = await User.findOne({ user_invite: grand_parent_data.parent_invt }).then((res) => res)
      return { user, parent_data, grand_parent_data, great_grand_parent_data };

    }).then(async ({ user, parent_data, grand_parent_data, great_grand_parent_data }) => {

      const newUser = await User.updateOne({ _id: user._id }, {
        $set: {
          parent_id: parent_data._id,
          grand_parent_id: grand_parent_data._id,
          great_grand_parent_id: great_grand_parent_data._id
        }
      });

      await User.updateOne({ _id: parent_data._id },
        { $push: { directMember: user._id } }
      );

      await User.updateOne({ _id: grand_parent_data._id },
        { $push: { indirectMember: user._id } }
      );

      await User.updateOne({ _id: great_grand_parent_data._id },
        { $push: { indirectMember: user._id } }
      );

      return newUser;
    })
      .then(newUser =>
        res.status(200).json({
          message: "User successfully created"
        })
      )
  } catch (err) {
    console.log(err);
    res.status(401).json({
      message: "User not successful created",
      error: err,
    })
  }
}

exports.forgotPassword = async (req, res, next) => {
  const { mobno } = req.body;
  try {
    const data = await User.findOne({ mobno: mobno }).
    then(async (response) => {
      await axios.get(`http://www.fast2sms.com/dev/bulkV2?authorization=27b58V4YOqBDMgWvNjapz1k9IHlrJfynC6w0hceRAZGoLimK3PuJC7OoiV4N2B6DjfwWKzb0lhgEetPH&route=q&message=Your Password is ${response.pwd}. Please Reset Immediately&language=english&flash=0&numbers=${mobno}`)
      .then((response) => {
        //console.log(response);
        res.status(200).json({ message: 'Check Message Inbox for password' });
      })
      .catch(error=>console.log(error));
    });
  } catch (error) {
    //console.log(error);
    res.status(400).json({
      message: 'Something went wrong!',
      error: error
    })
  }
}

exports.purchase = async (req, res, next) => {
  const {balance, boughtLong, boughtShort, plans_purchased, user_id} = req.body;
  const newPlan = new Plan(plans_purchased)

  try {
    await User.updateOne({_id:user_id},
      { 
        $set: {  
                balance: balance
              },
        $inc: {
                boughtLong: boughtLong, 
                boughtShort:boughtShort
              },
        $push: {
                plans_purchased: newPlan
        }
      }
    )
    res.status(200).json({
      message:'Plan Purchased Successfully!'
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message:'Something went wrong'
    });
  }

}

exports.reset_login_password = async (req, res, next) => {
  const{ user_id, new_pwd} = req.body;
  try {
    await User.updateOne({_id: user_id}, {
      $set: {
        pwd: new_pwd
      }
    });
    res.status(200).json({
      message: 'Password Successfully Changed'
    })
  } catch (error) {
    res.status(400).json({
      message: 'Something went wrong'
    })
  }
}

exports.reset_withdrawal_password = async (req, res, next) => {
  const{ user_id, new_wpwd} = req.body;
  try {
    await User.updateOne({_id: user_id}, {
      $set: {
        wpwd: new_wpwd
      }
    });
    res.status(200).json({
      message: 'Withdrawal Password Successfully Changed'
    })
  } catch (error) {
    res.status(400).json({
      message: 'Something went wrong'
    })
  }
}

exports.bank_details = async (req, res, next) => {
  const{ user_id, bank_details} = req.body;
  try {
    await User.updateOne({_id: user_id}, {
      $set: {
        bank_details: new Bank(bank_details)
      }
    });
    res.status(200).json({
      message: 'Bank Details Successfully updated'
    })
  } catch (error) {
    res.status(400).json({
      message: 'Something went wrong'
    })
  }
}




