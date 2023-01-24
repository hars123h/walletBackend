const Mongoose = require('mongoose');

const BankSchema = Mongoose.Schema({
    
    fullName: {
        type:String,
        required: true
    },
    phoneNo: {
        type: String,
        required: true
    },
    bankAccount: {
        type: String,
        required: true
    },
    bankName: {
        type: String,
        required: true
    },
    ifs: {
        type: String,
        required: true
    }
});

const Bank = Mongoose.model('bank', BankSchema);
module.exports = Bank;