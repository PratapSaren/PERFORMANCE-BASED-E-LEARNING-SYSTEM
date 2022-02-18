const mongoose = require('mongoose');

const userschema = new mongoose.Schema({
    coursename : {
        type : String
    },

    coursenumber: {
        type : Number
    },

    level: {
        type: String
    },
    username: {
        type: String,
        required : true
    },
    lastname: {
        type: String,
        required : true
    },
    email: {
        type: String,
        required : true
    },
    q1_response: {
        type: String
    },
    q2_response: {
        type: String
    },
    q3_response: {
        type: String
    },
    q4_response: {
        type: String
    },
    q5_response: {
        type: String
    },
    q6_response: {
        type: String
    },
    q7_response: {
        type: String
    },
    q8_response: {
        type: String
    },
    q9_response: {
        type: String
    },
    q10_response: {
        type: String
    },
    q11_response: {
        type: String
    },
    q12_response: {
        type: String
    },
    q13_response: {
        type: String
    },
    q14_response: {
        type: String
    },
    q15_response: {
        type: String
    },

    marks_obtained : {
        type : Number
    }
});

module.exports = new mongoose.model('user_response', userschema);
