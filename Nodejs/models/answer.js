const mongoose = require('mongoose');

const ansschema = new mongoose.Schema({
    coursename  : {
        type : String
    },

    coursenumber  : {
        type : Number
    },


    level : {
        type : String
    },


   q1_ans : {
       type : String
   },

   q2_ans : {
    type : String
   },

   q3_ans : {
    type : String
    },

    q4_ans : {
        type : String
    },
    
    q5_ans : {
        type : String
    },

    q6_ans : {
        type : String
    },
 
    q7_ans : {
     type : String
    },
 
    q8_ans : {
     type : String
     },
 
     q9_ans : {
         type : String
     },
     
     q10_ans : {
         type : String
     },

     q11_ans : {
        type : String
    },
 
    q12_ans : {
     type : String
    },
 
    q13_ans : {
     type : String
     },
 
     q14_ans : {
         type : String
     },
     
     q15_ans : {
         type : String
     }
    
});

module.exports  = new mongoose.model('answer',ansschema);