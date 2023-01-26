const User = require("../model/User");
const referralCodeGenerator = require('referral-code-generator');
const axios = require('axios');
const Plan = require("../model/plan");
const Bank = require('../model/bank');
const Recharge = require('../model/recharge');
const Feedback = require('../model/feedback');
const Withdrawal = require('../model/withdrawal');

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
          .catch(error => console.log(error));
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
  const { balance, boughtLong, boughtShort, plans_purchased, user_id } = req.body;
  const newPlan = new Plan(plans_purchased)

  try {
    await User.updateOne({ _id: user_id },
      {
        $set: {
          balance: balance
        },
        $inc: {
          boughtLong: boughtLong,
          boughtShort: boughtShort
        },
        $push: {
          plans_purchased: newPlan
        }
      }
    )
    res.status(200).json({
      message: 'Plan Purchased Successfully!'
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: 'Something went wrong'
    });
  }

}

exports.reset_login_password = async (req, res, next) => {
  const { user_id, new_pwd } = req.body;
  try {
    await User.updateOne({ _id: user_id }, {
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
  const { user_id, new_wpwd } = req.body;
  try {
    await User.updateOne({ _id: user_id }, {
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
  const { user_id, bank_details } = req.body;
  try {
    await User.updateOne({ _id: user_id }, {
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

exports.place_recharge = async (req, res, next) => {

  const data = req.body;

  try {
    await Recharge.create(data)
      .then(async (recharge_data) => {
        await User.updateOne({ _id: data.user_id }, {
          $push: {
            placed_recharges: {
              recharge_id: recharge_data._id,
              time: new Date(data.time)
            }
          }
        })
      });
      res.status(200).json({
        message:'Recharge Placed Successfully'
      });
  } catch (error) {
    res.status(400).json({
      message: 'Something went wrong'
    });
  }

}

exports.feedback = async(req, res, next) => {
  const data = req.body;
  try {
    await Feedback.create(data)
    .then((data)=>{
      res.status(200).json({
        message:'Feedback Submitted Successfully',
        feedback: data
      });
    })
  } catch (error) {
    res.status(400)
    .json({
      message:'Something went wrong!'
    });
  }
}

exports.update_recharge = async(req, res, next) => {
  
  const data = req.body;
  // Add recharge bonus on line 271, sent amountDetails along with req.body
  try {
    await Recharge.updateOne({_id:data.recharge_id}, {
      $set: { status:data.new_status }
    }).then(async() => {

        if(data.new_status==='confirmed'){
            await User.updateOne({_id:data.user_id}, {
              $inc: { 
                recharge_amount:data.recharge_value,
                balance: data.recharge_value
              },
            });
            // Level 1 recharge commission
            await User.updateOne({_id:data.parent_id},{
              $inc: {
                balance: Number((10/100)*(Number(data.recharge_value))),
                directRecharge: Number(data.recharge_value)
              },
              $addToSet: {
                directMember: data.user_id
              }
            });
            // Level 2 recharge commission
            await User.updateOne({_id:data.grand_parent_id},{
              $inc: {
                balance: Number((5/100)*(Number(data.recharge_value))),
                indirectRecharge: Number(data.recharge_value)
              },
              $addToSet: {
                indirectMember: data.user_id
              }
            });
            // Level 3 recharge commission
            await User.updateOne({_id:data.great_grand_parent_id},{
              $inc: {
                balance: Number((2/100)*(Number(data.recharge_value))),
                indirectRecharge: Number(data.recharge_value)
              },
              $addToSet: {
                indirectMember: data.user_id
              }
            });
         }
    });

    res.status(200).json({
      message:'Status updated Successfully'
    });
  } catch (error) {
    res.status(400).json({
      message:'Something went wrong!'
    })
  }

}

exports.place_withdrawal = async(req, res, next) => {

  const data = req.body;

  try {
    Withdrawal.create(data)
    .then(async(response)=>{
      await User.updateOne({_id:data.user_id}, {
        $push: {
          withdrawals: {
            withdrawals_id:response._id,
            time:response.time
          }
        },
        $set: {
          balance: data.balance,
          lastWithdrawal: data.time
        }
      })
    });
    res.status(200).json({
      message:'Withdrawal Requeste Placed Successfully',
      data
    })    
  } catch (error) {
    res.status(400).json({
      message: 'Something went wrong!',
      error:error.message
    });
  }
  
}

exports.update_withdrawal = async(req, res, next) => {

  const data = req.body;

  try {
    await Withdrawal.updateOne({_id: data.withdrawal_id}, {
      $set : {
        status: data.new_status
      }
    }).then(async()=>{
      if(data.new_status==='declined') {
        await User.updateOne({_id:data.user_id}, {
          $inc: {
            balance: Number(data.withdrawal_value)
          }
        })
      }
    });  
    const new_Data = await Withdrawal.find({});
    res.status(200).json({
      messaage:'Status Updated Successfully',
      new_Data
    });
  } catch (error) {
    res.status(400).json({
      message:'Something went wrong!',
      error: error.message
    });
  }


}

exports.get_all_recharges = async(req, res, next) => {
  try {
    const response = await Recharge.find({});
    res.status(200).json({
      data : response
    })
  } catch (error) {
    res.status(400).json({
      message:'Something went wrong!'
    });
  }
}

exports.get_all_withdrawals = async(req, res, next) => {
  try {
    const response = await Withdrawal.find({});
    res.status(200).json({
      data : response
    })
  } catch (error) {
    res.status(400).json({
      message:'Something went wrong!'
    });
  }
}

exports.get_user_count = async(req, res, next) => {
  try {
    const query = await User.find().count();
    res.status(200).json({
      user_count: query
    });
  } catch (error) {
    res.status(400).json({
      message: 'Something went wrong!'
    });
  }
}

exports.get_all_users = async(req, res, next) => {
  try {
    const response = await User.find();
    res.status(200).json({
      data: response
    });
  } catch (error) {
    res.status(400).json({
      message:'Something went wrong!'
    });
  }
}

exports.update_earning = async(req, res, next) => {
  const data = req.body;

  try {
    await User.updateOne({_id: data.user_id}, {
      $set: {
        balance: data.earn,
        earning: data.earn,
        plans_purchased: data.temp
      },
    });
    res.status(200).json({
      message:'Reward Successfully Updated!'
    });
  } catch (error) {
    res.status(400).json({
      message:'Something went wrong!'
    });
  }
}


