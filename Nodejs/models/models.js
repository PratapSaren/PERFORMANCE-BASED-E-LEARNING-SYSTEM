const mongoose = require('mongoose');

const userschema = new mongoose.Schema({
    username : {
        type : String,
        required : true,
    },
    lastname : {
        type : String,
        required : true,
    },
    email : {
        type : String,
        required : true,
    },
    gender : {
        type : String,
        required : true,
    },

    birthday : {
        type : Date,
        required : true,
    },

    city : {
        type : String,
        required : true,
    },
    country : {
        type : String,
        required : true,
    },
    password : {
        type : String,
        required : true,
    },

    role : {
        type : Boolean,
        default : false,
    }
});

module.exports = new mongoose.model('user', userschema);