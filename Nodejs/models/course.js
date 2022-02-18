const mongoose = require('mongoose');

require('mongoose-type-url');

const courseSchema = new mongoose.Schema({
    coursename : {
        type : String,
        required : true
    },

    coursenumber : {
        type : Number,
        required : true
    },

    courselevel : {
        type : String,
        required : true
    },

    language : {
        type : String,
        required : true
    },


   

    module_one_name : {
        type : String,
        required : true
    },


    description_one : {
        type : String,
        required : true
    },


    pdf_one : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },

    video_one : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },




    

    module_two_name : {
        type : String,
        required : true
    },


    description_two : {
        type : String,
        required : true
    },


    pdf_two : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },

    video_two : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },




    

    module_three_name : {
        type : String,
        required : true
    },


    description_three : {
        type : String,
        required : true
    },

    pdf_three : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },

    video_three : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },

    m1begs1 : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },

    m1begs2 : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },

    m1advs1 : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },

    m1advs2 : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },

    m2begs1 : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },

    m2begs2 : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },


    m2advs1 : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },

    m2advs2 : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },

    m3finals1 : {
        type : mongoose.SchemaTypes.Url,
        required : true
    },

    m3finals2 : {
        type : mongoose.SchemaTypes.Url,
        required : true
    }

      
});

module.exports = new mongoose.model('course', courseSchema );