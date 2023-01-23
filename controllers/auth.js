const User = require("../model/User")
const referralCodeGenerator = require('referral-code-generator');

exports.login = async (req, res, next) => {
  const { mobno, pwd } = req.body
  if (!mobno || !pwd) {
    res.status(400).json({
      message: "Username or Password not present",
    })
  }else {
    try {
      const data = await User.findOne({mobno: mobno, pwd:pwd}).then(response=>{return response;});
      res.status(200).json({
        message:'Logged In Successfully',
        user_details: data,
      })
    } catch (error) {
        res.status(400).json({
          message:'Something went wrong',
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
    }).then(async (user)=>{

      const parent_data = await User.findOne({user_invite: user.parent_invt}).then((res)=> res);
      return {user, parent_data};

    }).then(async ({ user, parent_data }) => {

      const grand_parent_data = await User.findOne({user_invite:parent_data.parent_invt}).then((res)=> res)
      return {user, parent_data, grand_parent_data};

    }).then(async({user, parent_data, grand_parent_data})=>{
      
      const great_grand_parent_data = await User.findOne({user_invite:grand_parent_data.parent_invt}).then((res)=> res)
      return { user, parent_data, grand_parent_data, great_grand_parent_data };

    }).then(async({ user, parent_data, grand_parent_data, great_grand_parent_data })=>{

      const newUser = await User.updateOne({_id: user._id}, {$set:{
        parent_id:parent_data._id,
        grand_parent_id:grand_parent_data._id,
        great_grand_parent_id:great_grand_parent_data._id
      }});

      await User.updateOne({_id:parent_data._id}, 
        {$push: {directMember:user._id}}
      );

      await User.updateOne({_id:grand_parent_data._id},
        {$push: {indirectMember:user._id}}
      );

      await User.updateOne({_id:great_grand_parent_data._id},
        {$push: {indirectMember:user._id}}
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


