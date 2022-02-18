const express = require('express');
const routes = express.Router();
const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');
const user = require('./models/models.js');
const course = require('./models/course')
const savedcourse = require('./models/saved_courses');
const ans = require('./objects/ansobject');
const answer = require('./models/answer');
const user_response = require('./models/user_response');


const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');


routes.use(express.urlencoded({ extended: true }));


routes.use(cookieParser('secret'));
routes.use(session({ secret: 'secret', maxAge: 3600000, resave: true, saveUninitialized: true }));

routes.use(passport.initialize());
routes.use(passport.session());

routes.use(flash());

// Global Variable
routes.use(function (req, res, next) {
    res.locals.success_message = req.flash('success_message');
    res.locals.error_message = req.flash('error_message');
    res.locals.error = req.flash('error');


    next();
});

const checkAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        return next();
    } else {
        res.redirect('/login');
    }
}


mongoose.connect('mongodb://localhost/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Database connected"));



routes.get('/home',(req,res) =>{
    res.render('home');
});

routes.get('/about',(req,res) =>{
    res.render('about');
});

routes.get('/contact',(req,res) =>{
    res.render('contact');
});

routes.get('/webdevelopment',(req,res) =>{
    res.render('webdevelopment');
});

routes.get('/python',(req,res) =>{
    res.render('python');
});


routes.get("/register", (req, res) => {
    res.render("register");
});


routes.post("/register", (req, res) => {
    var {
        username,
        lastname,
        email,
        gender,
        birthday,
        city,
        country,
        password,
        confirmpassword
    } = req.body;

    var err;


    if (!email || !username || !password || !confirmpassword) {
        err = "Please Fill All The Fields....";
        res.render('register', { 'err': err });
    }

    if (password != confirmpassword) {
        err = "Passwords Don't Match....";
        res.render('register', {
            'err': err,
            'username': username,
            'lastname': lastname,
            'email': email,
            
            
            'city': city,
            'country': country
        });
    }

    if (typeof err == 'undefined') {
        user.findOne({
            email: email
        }, function (err, data) {
            if (err)
                throw err;

            if (data) {
                console.log("User Exists");
                err = "User Already Exists With This Email....";
                res.render('register', {
                    'err': err,
                    'username': username,
                    'lastname': lastname,
                    'email': email,
                    
                    
                    'city': city,
                    'country': country
                });
            } else {
                bcrypt.genSalt(10, (err, salt) => {
                    if (err)
                        throw err;

                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err)
                            throw err;

                        password = hash;
                        user({
                            username,
                            lastname,
                            email,
                            gender,
                            birthday,
                            city,
                            country,
                            password
                        }).save((err, data) => {
                            if (err)
                                throw err;

                            req.flash('success_message', "Registered Successfully...Login To Continue...");
                            res.redirect('/login');
                        })
                    });
                });
            }

        });
    }
});


// Authentication Strategy

var localStrategy = require('passport-local').Strategy;
passport.use(new localStrategy({
    usernameField: 'email'
}, (email, password, done) => {
    user.findOne({
        email: email
    }, (err, data) => { // Data is a collection which is an object
        if (err)
            throw err;

        if (!data) {
            return done(null, false, { message: "User Doesn't Exists..." });
        }
        bcrypt.compare(password, data.password, (err, match) => {
            if (err) {
                return done(null, false);
            }
            if (!match) {
                return done(null, false, { message: "Password Doesn't Match..." });
            }
            if (match) {
                return done(null, data);
            }
        });
    });
}));


passport.serializeUser(function (user, cb) { // Here done is replaced with cb keyword
    cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
    user.findById(id, function (err, user) {
        cb(err, user)
    });
});

// End of Authentication Strategy

routes.get('/login', (req, res) => {
    res.render('login');
});


routes.post('/login', (req, res, next) => {
    var email = req.body.email;
    user.findOne({
        email: email
    }, (err, data) => {
        if (err)
            throw err;
        else if (data != null) {
            if (data.role) {
                passport.authenticate('local', {
                    failureRedirect: '/login',
                    successRedirect: '/admin/admin-dashboard',
                    failureFlash: true
                })(req, res, next);
            } else {
                passport.authenticate('local', {
                    failureRedirect: '/login',
                    successRedirect: '/student/student-dashboard',
                    failureFlash: true
                })(req, res, next);
            }

        } else {
            passport.authenticate('local', {
                failureRedirect: '/login',
                successRedirect: '/student/student-dashboard',
                failureFlash: true
            })(req, res, next);

        }

    });

});


routes.get('/profile', (req, res) => {
    var user = req.user;
    res.render('profile', { 'user': user }); 
});

routes.get('/adminprofile', (req, res) => {
    var user = req.user;
    res.render('adminprofile', { 'user': user }); 
});


routes.get('/admin/admin-dashboard', checkAuthenticated, (req, res) => {
    user.countDocuments({role : false}, (err,data) => {
        if(err) throw err;
        var count = data;
       course.countDocuments({}, (err,data) =>{
        if(err) throw err;
        var cnum = data;
      
        res.render('admin-dashboard', { 'user': req.user, 'count' : count, 'cnum' : cnum});
    });
  }); 
});


routes.get('/admin/create-course', (req, res) => {
    req.flash('top',"Please Put Appropriate Data In Their Respective Fields")
    res.render('create-course', { 'user': req.user,'top':req.flash('top') });
});

routes.post('/admin/create-course', (req, res) => {
    console.log(req.body);
    const coursedata = new course(req.body);
    coursedata.save((err, data) => {
        if (err)
            throw err;


            req.flash('bottom',"Course Created Successfully");
            res.render('create-course', { 'user': req.user,'top':req.flash('bottom') });
    })
});




routes.get('/student/student-dashboard', (req, res) => {

    var email = req.user.email;
    course.count({}, (err, data) => {
        if (err)
            throw err;

        var head = data;
        console.log(head);
        savedcourse.count({
            email: email
        }, (err, data) => {
            if (err)
                throw err;

            var nos = data;

            res.render('student-dashboard', {
                'user': req.user,
                'head': head,
                'nos': nos
            });
        });
    });
});


routes.get('/student/my-course-empty', (req, res) => {
    res.render('my-course-empty');
});


routes.get('/student/course-list', (req, res,) => {

    course.find({
        coursenumber: 200
    }, (err, data) => {
        if (err)
            throw err;
        
            var obj1 = data;

            course.find({coursenumber : 201},(err,data) =>{
                if(err) throw err;

                var obj2 = data;
                res.render('course-list', {
                'user': req.user,
                'obj1': obj1,
                'obj2' : obj2
            });
        
    });
});

});

routes.post('/student/course-list', (req, res) => {


    var email = req.user.email;

    var val = req.body.item;

    var opt = req.body;


    if (opt.option == 'one') {
//////////////Second Course//////////////////////
        course.find({
            coursenumber: val
        }, (err, data) => {
            if (err)
                throw err;

            var obj = data;
            console.log(obj);


            req.flash('head', "You Are In The Module - 1 Phase Of This Course")
            res.render('module-4', {
                'user': req.user,
                'obj': obj,
                pass: req.flash('head')
            });


////////////////////Saving The Data from course model to savedcourse model/////////////////////
            course.find({
                coursenumber: val
            }, (err, data) => {
                if (err)
                    throw err;

                var obj = data;
                obj.forEach(element => {
                    var {
                        coursename,
                        coursenumber,
                        courselevel,
                        language,
                        module_one_name,
                        description_one,
                        pdf_one,
                        video_one,
                        module_two_name,
                        description_two,
                        pdf_two,
                        video_two,
                        module_three_name,
                        description_three,
                        pdf_three,
                        video_three
                    } = element;
                    savedcourse({
                        email,
                        coursename,
                        coursenumber,
                        courselevel,
                        language,
                        module_one_name,
                        description_one,
                        pdf_one,
                        video_one,
                        module_two_name,
                        description_two,
                        pdf_two,
                        video_two,
                        module_three_name,
                        description_three,
                        pdf_three,
                        video_three
                    }).save((err, data) => {
                        if (err)
                            throw err;

                        console.log("saved into database!!!!!!!");
                    });

                });
            });

        });

        /////End Second Course//////
    } else if (opt.option == 'two') {
//////////////////First Course///////////////////////
        course.find({
            coursenumber: val
        }, (err, data) => {
            if (err)
                throw err;

            var obj = data;
            console.log(obj);


            req.flash('head', "You Are In The Module - 1 Phase Of This Course")
            res.render('module-1', {
                'user': req.user,
                'obj': obj,
                pass: req.flash('head')
            });


////////////////////Saving The Data from course model to savedcourse model/////////////////////
            course.find({
                coursenumber: val
            }, (err, data) => {
                if (err)
                    throw err;

                var obj = data;
                obj.forEach(element => {
                    var {
                        coursename,
                        coursenumber,
                        courselevel,
                        language,
                        module_one_name,
                        description_one,
                        pdf_one,
                        video_one,
                        module_two_name,
                        description_two,
                        pdf_two,
                        video_two,
                        module_three_name,
                        description_three,
                        pdf_three,
                        video_three
                    } = element;
                    savedcourse({
                        email,
                        coursename,
                        coursenumber,
                        courselevel,
                        language,
                        module_one_name,
                        description_one,
                        pdf_one,
                        video_one,
                        module_two_name,
                        description_two,
                        pdf_two,
                        video_two,
                        module_three_name,
                        description_three,
                        pdf_three,
                        video_three
                    }).save((err, data) => {
                        if (err)
                            throw err;

                        console.log("saved into database!!!!!!!");
                    });

                });
            });

        });

    }
////////////////End of First Course///////////////////////

});


routes.get('/student/my-course', (req, res) => {

    var email = req.user.email;
    savedcourse.find({
        email: email,coursenumber : 200
    }, (err, data) => {
        if (err)
            throw err;
            var obj1 = data;
            savedcourse.find({email: email,coursenumber : 201},(err,data) =>{
                if(err) throw err

                else{
                    var obj2 = data;
                    if(obj1[0] != null && obj2[0] == null)
                    {
                        console.log("FIRST COURSE IS WORKING")
                        res.render('my-course', {
                        'user': req.user,
                        'obj1': obj1
                        });
                    }
                    else if(obj1[0] == null && obj2[0] != null)
                    {
                        console.log("SECOND COURSE IS WORKING")
                        res.render('my-course-2', {
                            'user': req.user,
                            'obj2': obj2
                            });
                    }
                    else if(obj1[0] != null && obj2[0] != null)
                    {
                        console.log("THIRD COURSE IS WORKING")
                        //////NEW PAGE FOR BOTH COURSES//////
                        res.render('my-course-both', {
                            'user': req.user,
                            'obj1' : obj1,
                            'obj2': obj2
                            });

                    }

                    else{
                        res.render('my-course-empty', { 'user': req.user });
                    }
                    
            
        }

    });
 });
});

///////////////////////////Course - Webdevelopment/////////////////////////

routes.get('/courses/webdevelopment/module-1', (req, res) => {


    var email = req.user.email;
    console.log(req.user);
    savedcourse.find({
        email: email,coursenumber : 200
    }, (err, data) => {
        if (err)
            throw err;

        var obj = data;
        console.log(obj);

        req.flash('head', "You Are In The Module - 1 Phase Of This Course")
        res.render('module-1', {
            'user': req.user,
            'obj': obj,
            pass: req.flash('head')
        });

    });
});


///////////////////Module-1 Beginner///////////////////

routes.get('/test/beg', (req, res) => {
    res.render('beg');

    console.log("HELLO THERE!!!!!!!");
    /////////////////Here We use to Save answer to the mongodb////////////////
    const answ = new answer(ans.beg)

});

routes.post('/test/beg', (req, res) => {


    var { coursename,
        coursenumber,
        level,
        username,
        lastname,
        email,
        q1_response,
        q2_response,
        q3_response,
        q4_response,
        q5_response,
        q6_response,
        q7_response,
        q8_response,
        q9_response,
        q10_response,
        q11_response,
        q12_response,
        q13_response,
        q14_response,
        q15_response
    } = req.body;


    answer.find({
        coursenumber : 200,
        level: "beginner-1"
    }, (err, data) => {
        if (err)
            throw err;
        else {
            var count = 0;
            if (data[0].q1_ans == q1_response) {
                count = count + 1;
                console.log("tiamat 1 : ", count);
            }

            if (data[0].q2_ans == q2_response) {
                count = count + 1;
                console.log("tiamat 2 : ", count);
            }

            if (data[0].q3_ans == q3_response) {
                count = count + 1;
                console.log("tiamat 3 : ", count);
            }

            if (data[0].q4_ans == q4_response) {
                count = count + 1;
                console.log("tiamat 4 : ", count);
            }

            if (data[0].q5_ans == q5_response) {
                count = count + 1;
                console.log("tiamat 5 : ", count);
            }


            if (data[0].q6_ans == q6_response) {
                count = count + 1;
                console.log("tiamat 6 : ", count);
            }

            if (data[0].q7_ans == q7_response) {
                count = count + 1;
                console.log("tiamat 7 : ", count);
            }

            if (data[0].q8_ans == q8_response) {
                count = count + 1;
                console.log("tiamat 8 : ", count);
            }

            if (data[0].q9_ans == q9_response) {
                count = count + 1;
                console.log("tiamat 9 : ", count);
            }

            if (data[0].q10_ans == q10_response) {
                count = count + 1;
                console.log("tiamat 10 : ", count);
            }

            if (data[0].q11_ans == q11_response) {
                count = count + 1;
                console.log("tiamat 11 : ", count);
            }

            if (data[0].q12_ans == q12_response) {
                count = count + 1;
                console.log("tiamat 12 : ", count);
            }

            if (data[0].q13_ans == q13_response) {
                count = count + 1;
                console.log("tiamat 13 : ", count);
            }

            if (data[0].q14_ans == q14_response) {
                count = count + 1;
                console.log("tiamat 14 : ", count);
            }

            if (data[0].q15_ans == q15_response) {
                count = count + 1;
                console.log("tiamat 15 : ", count);
            }

            console.log("Marks obtained = ", count);
            var marks_obtained = count;
        } 

        user_response.find({email : email,coursenumber : 200, level : 'beginner-1'},  (err,data) =>{
            if(err) throw err;
            else if(data[0] == null){
                user_response({
                    coursename,
                    coursenumber,
                    level,
                    username,
                    lastname,
                    email,
                    q1_response,
                    q2_response,
                    q3_response,
                    q4_response,
                    q5_response,
                    q6_response,
                    q7_response,
                    q8_response,
                    q9_response,
                    q10_response,
                    q11_response,
                    q12_response,
                    q13_response,
                    q14_response,
                    q15_response,
                    marks_obtained
                }).save((err, data) => {
                    if (err)
                        throw err;
        
                    console.log("Data Saved Successfully.....");
                });
            }
            else if(data[0] != null){
                user_response.findOneAndUpdate({email : email,coursenumber : 200,level : "beginner-1"}, {q1_response : q1_response,
                    q2_response : q2_response,
                    q3_response : q3_response,
                    q4_response : q4_response,
                    q5_response : q5_response,
                    q6_response : q6_response,
                    q7_response : q7_response,
                    q8_response : q8_response,
                    q9_response : q9_response,
                    q10_response : q10_response,
                    q11_response : q11_response,
                    q12_response : q12_response,
                    q13_response : q13_response,
                    q14_response : q14_response,
                    q15_response : q15_response,
                    marks_obtained : marks_obtained},null,function (err,data)  {
                        if(err) throw err;
                    });

            }
        });


        if (marks_obtained <= 10) {
            course.find({coursenumber : 200}, (err,data) =>{
                if (err) throw err;
            var m1begs1 = data[0].m1begs1;
            var m1begs2 = data[0].m1begs2;
            var link = '/courses/webdevelopment/module-1'
            req.flash('fail', 'You Have Scored Less Than 70% In Your Evaluation Test Please Use Our Additional Resource For Improvement');
            res.render('additional', {
                'user': req.user,
                'obj1' : m1begs1,
                'obj2' : m1begs2,
                'link' : link,
                fail: req.flash('fail')
            });
        });
        } else {
            savedcourse.find({
                email: email,coursenumber : 200
            }, (err, data) => {
                if (err)
                    throw err;

                var obj = data;
                console.log(obj);
                req.flash('pass', 'You Have Scored More Than 70% In Your Evaluation Test Please Proceed For Next Evaluation Test');
                res.render('module-1', {
                    'user': req.user,
                    'obj': obj,
                    pass: req.flash('pass')
                });

            });
        }


    });
});


///////////////////Module-1 Advanced///////////////////////

routes.get('/test/adv', (req, res) => {
    res.render('adv');

    console.log("HELLO THERE!!!!!!!");

});


routes.post('/test/adv', (req, res) => {


    var { coursename,
        coursenumber,
        level,
        username,
        lastname,
        email,
        q1_response,
        q2_response,
        q3_response,
        q4_response,
        q5_response,
        q6_response,
        q7_response,
        q8_response,
        q9_response,
        q10_response,
        q11_response,
        q12_response,
        q13_response,
        q14_response,
        q15_response
    } = req.body;


    answer.find({coursenumber : 200,
        level: "advanced-1"
    }, (err, data) => {
        if (err)
            throw err;
        else {
            var count = 0;
            if (data[0].q1_ans == q1_response) {
                count = count + 1;
                console.log("tiamat 1 : ", count);
            }

            if (data[0].q2_ans == q2_response) {
                count = count + 1;
                console.log("tiamat 2 : ", count);
            }

            if (data[0].q3_ans == q3_response) {
                count = count + 1;
                console.log("tiamat 3 : ", count);
            }

            if (data[0].q4_ans == q4_response) {
                count = count + 1;
                console.log("tiamat 4 : ", count);
            }

            if (data[0].q5_ans == q5_response) {
                count = count + 1;
                console.log("tiamat 5 : ", count);
            }


            if (data[0].q6_ans == q6_response) {
                count = count + 1;
                console.log("tiamat 6 : ", count);
            }

            if (data[0].q7_ans == q7_response) {
                count = count + 1;
                console.log("tiamat 7 : ", count);
            }

            if (data[0].q8_ans == q8_response) {
                count = count + 1;
                console.log("tiamat 8 : ", count);
            }

            if (data[0].q9_ans == q9_response) {
                count = count + 1;
                console.log("tiamat 9 : ", count);
            }

            if (data[0].q10_ans == q10_response) {
                count = count + 1;
                console.log("tiamat 10 : ", count);
            }

            if (data[0].q11_ans == q11_response) {
                count = count + 1;
                console.log("tiamat 11 : ", count);
            }

            if (data[0].q12_ans == q12_response) {
                count = count + 1;
                console.log("tiamat 12 : ", count);
            }

            if (data[0].q13_ans == q13_response) {
                count = count + 1;
                console.log("tiamat 13 : ", count);
            }

            if (data[0].q14_ans == q14_response) {
                count = count + 1;
                console.log("tiamat 14 : ", count);
            }

            if (data[0].q15_ans == q15_response) {
                count = count + 1;
                console.log("tiamat 15 : ", count);
            }

            console.log("Marks obtained = ", count);
            var marks_obtained = count;
        } 
        
        
        user_response.find({email : email,coursenumber : 200,level : 'advanced-1'},  (err,data) =>{
            if(err) throw err;
            else if(data[0] == null){
                user_response({
                    coursename,
                    coursenumber,
                    level,
                    username,
                    lastname,
                    email,
                    q1_response,
                    q2_response,
                    q3_response,
                    q4_response,
                    q5_response,
                    q6_response,
                    q7_response,
                    q8_response,
                    q9_response,
                    q10_response,
                    q11_response,
                    q12_response,
                    q13_response,
                    q14_response,
                    q15_response,
                    marks_obtained
                }).save((err, data) => {
                    if (err)
                        throw err;
        
                    console.log("Data Saved Successfully.....");
                });
            }
            else if(data[0] != null){
                user_response.findOneAndUpdate({email : email,coursenumber : 200,level : "advanced-1"}, {q1_response : q1_response,
                    q2_response : q2_response,
                    q3_response : q3_response,
                    q4_response : q4_response,
                    q5_response : q5_response,
                    q6_response : q6_response,
                    q7_response : q7_response,
                    q8_response : q8_response,
                    q9_response : q9_response,
                    q10_response : q10_response,
                    q11_response : q11_response,
                    q12_response : q12_response,
                    q13_response : q13_response,
                    q14_response : q14_response,
                    q15_response : q15_response,
                    marks_obtained : marks_obtained},null,function (err,data)  {
                        if(err) throw err;
                    });

            }
        });
        
        
        

        if (marks_obtained <= 10) {
            course.find({coursenumber : 200}, (err,data) =>{
                if (err) throw err;
            var m1advs1 = data[0].m1advs1;
            var m1advs2 = data[0].m1advs2;
            var link = '/courses/webdevelopment/module-1'

            req.flash('fail', 'You Have Scored Less Than 70% In Your Evaluation Test Please Use Our Additional Resource For Improvement');
            res.render('additional', {
                'user': req.user,
                'obj1' : m1advs1,
                'obj2' : m1advs2,
                'link' : link,
                fail: req.flash('fail')
            });
        });
        } else {
            savedcourse.find({
                email: email,coursenumber : 200
            }, (err, data) => {
                if (err)
                    throw err;

                var obj = data;
                console.log(obj);
                req.flash('advance', 'You Have Scored More Than 70% In Your Evaluation Test Please Proceed To Next Module');
                res.render('module-1', {
                    'user': req.user,
                    'obj': obj,
                    pass: req.flash('advance')
                });

            });
        }


    });
});






routes.get('/courses/webdevelopment/module-2', (req, res) => {
    var email = req.user.email;
    user_response.find({
        email: email, coursenumber : 200,level : "advanced-1"}, (err, data) => {
        if (err)
            throw err;
        else {


            if (data[0] == null) {
                savedcourse.find({
                    email: email,coursenumber : 200,
                }, (err, data) => {
                    if (err)
                        throw err;

                    var obj = data;
                    console.log(obj);
                    req.flash('one', 'Please First Give The Advanced Evaluation Test');
                    res.render('module-1', {
                        'user': req.user,
                        'obj': obj,
                        pass: req.flash('one')
                    });

                });

            } else if (data[0].marks_obtained <= 10) {
                savedcourse.find({ email: email,coursenumber : 200 }, (err, data) => {
                    if (err)
                        throw err;

                    var obj = data;
                    console.log(obj);
                    req.flash('two', 'Please First Qualify For The Advanced Evaluation Test');
                    res.render('module-1', {
                        'user': req.user,
                        'obj': obj,
                        pass: req.flash('two')
                    });

                })

            } else if (data[0].marks_obtained > 10) {
                savedcourse.find({
                    email: email,coursenumber : 200
                }, (err, data) => {
                    if (err)
                        throw err;

                    var obj = data;
                    console.log(obj);
                    req.flash('second', "You Are In The Module - 2 Phase Of This Course")
                    res.render('module-2', {
                        'user': req.user,
                        'obj': obj,
                        pass : req.flash('second')
                        
                    });

                });
            }
        }
    });
});



///////////////////Module-2 Beginner///////////////////

routes.get('/test/backbeg', (req, res) => {
    res.render('backbeg');

    console.log("HELLO THERE!!!!!!!");

});

routes.post('/test/backbeg', (req, res) => {


    var { coursename,
        coursenumber,
        level,
        username,
        lastname,
        email,
        q1_response,
        q2_response,
        q3_response,
        q4_response,
        q5_response,
        q6_response,
        q7_response,
        q8_response,
        q9_response,
        q10_response,
        q11_response,
        q12_response,
        q13_response,
        q14_response,
        q15_response
    } = req.body;


    answer.find({
        coursenumber : 200,
        level: "beginner-2"
    }, (err, data) => {
        if (err)
            throw err;
        else {
            var count = 0;
            if (data[0].q1_ans == q1_response) {
                count = count + 1;
                console.log("tiamat 1 : ", count);
            }

            if (data[0].q2_ans == q2_response) {
                count = count + 1;
                console.log("tiamat 2 : ", count);
            }

            if (data[0].q3_ans == q3_response) {
                count = count + 1;
                console.log("tiamat 3 : ", count);
            }

            if (data[0].q4_ans == q4_response) {
                count = count + 1;
                console.log("tiamat 4 : ", count);
            }

            if (data[0].q5_ans == q5_response) {
                count = count + 1;
                console.log("tiamat 5 : ", count);
            }


            if (data[0].q6_ans == q6_response) {
                count = count + 1;
                console.log("tiamat 6 : ", count);
            }

            if (data[0].q7_ans == q7_response) {
                count = count + 1;
                console.log("tiamat 7 : ", count);
            }

            if (data[0].q8_ans == q8_response) {
                count = count + 1;
                console.log("tiamat 8 : ", count);
            }

            if (data[0].q9_ans == q9_response) {
                count = count + 1;
                console.log("tiamat 9 : ", count);
            }

            if (data[0].q10_ans == q10_response) {
                count = count + 1;
                console.log("tiamat 10 : ", count);
            }

            if (data[0].q11_ans == q11_response) {
                count = count + 1;
                console.log("tiamat 11 : ", count);
            }

            if (data[0].q12_ans == q12_response) {
                count = count + 1;
                console.log("tiamat 12 : ", count);
            }

            if (data[0].q13_ans == q13_response) {
                count = count + 1;
                console.log("tiamat 13 : ", count);
            }

            if (data[0].q14_ans == q14_response) {
                count = count + 1;
                console.log("tiamat 14 : ", count);
            }

            if (data[0].q15_ans == q15_response) {
                count = count + 1;
                console.log("tiamat 15 : ", count);
            }

            console.log("Marks obtained = ", count);
            var marks_obtained = count;
        } 
        

        user_response.find({email : email,coursenumber : 200,level : 'beginner-2'},  (err,data) =>{
            if(err) throw err;
            else if(data[0] == null){
                user_response({
                    coursename,
                    coursenumber,
                    level,
                    username,
                    lastname,
                    email,
                    q1_response,
                    q2_response,
                    q3_response,
                    q4_response,
                    q5_response,
                    q6_response,
                    q7_response,
                    q8_response,
                    q9_response,
                    q10_response,
                    q11_response,
                    q12_response,
                    q13_response,
                    q14_response,
                    q15_response,
                    marks_obtained
                }).save((err, data) => {
                    if (err)
                        throw err;
        
                    console.log("Data Saved Successfully.....");
                });
            }
            else if(data[0] != null){
                user_response.findOneAndUpdate({email : email,coursenumber : 200,level : "beginner-2"}, {q1_response : q1_response,
                    q2_response : q2_response,
                    q3_response : q3_response,
                    q4_response : q4_response,
                    q5_response : q5_response,
                    q6_response : q6_response,
                    q7_response : q7_response,
                    q8_response : q8_response,
                    q9_response : q9_response,
                    q10_response : q10_response,
                    q11_response : q11_response,
                    q12_response : q12_response,
                    q13_response : q13_response,
                    q14_response : q14_response,
                    q15_response : q15_response,
                    marks_obtained : marks_obtained},null,function (err,data)  {
                        if(err) throw err;
                    });

            }
        });
        
       

        if (marks_obtained <= 10) {
            course.find({coursenumber : 200}, (err,data) =>{
                if (err) throw err;
            var m2begs1 = data[0].m2begs1;
            var m2begs2 = data[0].m2begs2;
            var link = '/courses/webdevelopment/module-2'

            req.flash('fail', 'You Have Scored Less Than 70% In Your Evaluation Test Please Use Our Additional Resource For Improvement');
            res.render('additional', {
                'user': req.user,
                'obj1' : m2begs1,
                'obj2' : m2begs2,
                'link' : link,
                fail: req.flash('fail')
            });
        });
        } else {
            savedcourse.find({
                email: email,coursenumber : 200
            }, (err, data) => {
                if (err)
                    throw err;

                var obj = data;
                console.log(obj);
                req.flash('pass', 'You Have Scored More Than 70% In Your Evaluation Test Please Proceed For Next Evaluation Test');
                res.render('module-2', {
                    'user': req.user,
                    'obj': obj,
                    pass: req.flash('pass')
                });

            });
        }


    });
});


///////////////////Module-2 Advanced///////////////////////

routes.get('/test/backadv', (req, res) => {
    res.render('backadv');

    console.log("HELLO THERE!!!!!!!");

});


routes.post('/test/backadv', (req, res) => {


    var { coursename,
        coursenumber,
        level,
        username,
        lastname,
        email,
        q1_response,
        q2_response,
        q3_response,
        q4_response,
        q5_response,
        q6_response,
        q7_response,
        q8_response,
        q9_response,
        q10_response,
        q11_response,
        q12_response,
        q13_response,
        q14_response,
        q15_response
    } = req.body;


    answer.find({coursenumber : 200,
        level: "advanced-2"
    }, (err, data) => {
        if (err)
            throw err;
        else {
            var count = 0;
            if (data[0].q1_ans == q1_response) {
                count = count + 1;
                console.log("tiamat 1 : ", count);
            }

            if (data[0].q2_ans == q2_response) {
                count = count + 1;
                console.log("tiamat 2 : ", count);
            }

            if (data[0].q3_ans == q3_response) {
                count = count + 1;
                console.log("tiamat 3 : ", count);
            }

            if (data[0].q4_ans == q4_response) {
                count = count + 1;
                console.log("tiamat 4 : ", count);
            }

            if (data[0].q5_ans == q5_response) {
                count = count + 1;
                console.log("tiamat 5 : ", count);
            }


            if (data[0].q6_ans == q6_response) {
                count = count + 1;
                console.log("tiamat 6 : ", count);
            }

            if (data[0].q7_ans == q7_response) {
                count = count + 1;
                console.log("tiamat 7 : ", count);
            }

            if (data[0].q8_ans == q8_response) {
                count = count + 1;
                console.log("tiamat 8 : ", count);
            }

            if (data[0].q9_ans == q9_response) {
                count = count + 1;
                console.log("tiamat 9 : ", count);
            }

            if (data[0].q10_ans == q10_response) {
                count = count + 1;
                console.log("tiamat 10 : ", count);
            }

            if (data[0].q11_ans == q11_response) {
                count = count + 1;
                console.log("tiamat 11 : ", count);
            }

            if (data[0].q12_ans == q12_response) {
                count = count + 1;
                console.log("tiamat 12 : ", count);
            }

            if (data[0].q13_ans == q13_response) {
                count = count + 1;
                console.log("tiamat 13 : ", count);
            }

            if (data[0].q14_ans == q14_response) {
                count = count + 1;
                console.log("tiamat 14 : ", count);
            }

            if (data[0].q15_ans == q15_response) {
                count = count + 1;
                console.log("tiamat 15 : ", count);
            }

            console.log("Marks obtained = ", count);
            var marks_obtained = count;
        } 
        
        
        
        
        user_response.find({email : email,coursenumber : 200,level : 'advanced-2'},  (err,data) =>{
            if(err) throw err;
            else if(data[0] == null){
                user_response({
                    coursename,
                    coursenumber,
                    level,
                    username,
                    lastname,
                    email,
                    q1_response,
                    q2_response,
                    q3_response,
                    q4_response,
                    q5_response,
                    q6_response,
                    q7_response,
                    q8_response,
                    q9_response,
                    q10_response,
                    q11_response,
                    q12_response,
                    q13_response,
                    q14_response,
                    q15_response,
                    marks_obtained
                }).save((err, data) => {
                    if (err)
                        throw err;
        
                    console.log("Data Saved Successfully.....");
                });
            }
            else if(data[0] != null){
                user_response.findOneAndUpdate({email : email,coursenumber : 200,level : "advanced-1"}, {q1_response : q1_response,
                    q2_response : q2_response,
                    q3_response : q3_response,
                    q4_response : q4_response,
                    q5_response : q5_response,
                    q6_response : q6_response,
                    q7_response : q7_response,
                    q8_response : q8_response,
                    q9_response : q9_response,
                    q10_response : q10_response,
                    q11_response : q11_response,
                    q12_response : q12_response,
                    q13_response : q13_response,
                    q14_response : q14_response,
                    q15_response : q15_response,
                    marks_obtained : marks_obtained},null,function (err,data)  {
                        if(err) throw err;
                    });

            }
        });
        
        

        if (marks_obtained <= 10) {
            course.find({coursenumber : 200}, (err,data) =>{
                if (err) throw err;
            var m2advs1 = data[0].m2advs1;
            var m2advs2 = data[0].m2advs2;
            var link = '/courses/webdevelopment/module-2'

            req.flash('fail', 'You Have Scored Less Than 70% In Your Evaluation Test Please Use Our Additional Resource For Improvement');
            res.render('additional', {
                'user': req.user,
                'obj1' : m2advs1,
                'obj2' : m2advs2,
                'link' : link,
                fail: req.flash('fail')
            });
        });
        } else {
            savedcourse.find({coursenumber : 200,
                email: email
            }, (err, data) => {
                if (err)
                    throw err;

                var obj = data;
                console.log(obj);
                req.flash('advance', 'You Have Scored More Than 70% In Your Evaluation Test Please Proceed To Next Module');
                res.render('module-2', {
                    'user': req.user,
                    'obj': obj,
                    pass: req.flash('advance')
                });

            });
        }


    });
});



routes.get('/courses/webdevelopment/module-3', (req, res) => {
    var email = req.user.email;
    user_response.find({
        email: email, coursenumber : 200,level : "advanced-2"
    }, (err, data) => {
        if (err)
            throw err;
        else {
            


            if (data[0] == null) {
                savedcourse.find({
                    email: email,coursenumber : 200
                }, (err, data) => {
                    if (err)
                        throw err;

                    var obj = data;
                    console.log(obj);
                    req.flash('one', 'Please First Give The Advanced Evaluation Test');
                    res.render('module-2', {
                        'user': req.user,
                        'obj': obj,
                        pass: req.flash('one')
                    });

                });

            } else if (data[0].marks_obtained <= 10) {
                savedcourse.find({ email: email,coursenumber : 200, }, (err, data) => {
                    if (err)
                        throw err;

                    var obj = data;
                    console.log(obj);
                    req.flash('two', 'Please First Qualify For The Advanced Evaluation Test');
                    res.render('module-2', {
                        'user': req.user,
                        'obj': obj,
                        pass: req.flash('two')
                    });

                })

            } else if (data[0].marks_obtained > 10) {
                savedcourse.find({
                    email: email,coursenumber : 200
                }, (err, data) => {
                    if (err)
                        throw err;

                    var obj = data;
                    console.log(obj);
                    req.flash('third', "You Are In The Module - 3 Phase Of This Course")
                    res.render('module-3', {
                        'user': req.user,
                        'obj': obj,
                        pass : req.flash('third')
                    });

                });
            }
        }
    });
});






/////////////////////////Module - 3 Final/////////////////////

routes.get('/test/final', (req, res) => {
    res.render('final');

    console.log("HELLO THERE!!!!!!!");

});

routes.post('/test/final', (req, res) => {


    var { coursename,
        coursenumber,
        level,
        username,
        lastname,
        email,
        q1_response,
        q2_response,
        q3_response,
        q4_response,
        q5_response,
        q6_response,
        q7_response,
        q8_response,
        q9_response,
        q10_response,
        q11_response,
        q12_response,
        q13_response,
        q14_response,
        q15_response
    } = req.body;


    answer.find({
        level: "final",coursenumber : 200
    }, (err, data) => {
        if (err)
            throw err;
        else {
            var count = 0;
            if (data[0].q1_ans == q1_response) {
                count = count + 1;
                console.log("tiamat 1 : ", count);
            }

            if (data[0].q2_ans == q2_response) {
                count = count + 1;
                console.log("tiamat 2 : ", count);
            }

            if (data[0].q3_ans == q3_response) {
                count = count + 1;
                console.log("tiamat 3 : ", count);
            }

            if (data[0].q4_ans == q4_response) {
                count = count + 1;
                console.log("tiamat 4 : ", count);
            }

            if (data[0].q5_ans == q5_response) {
                count = count + 1;
                console.log("tiamat 5 : ", count);
            }


            if (data[0].q6_ans == q6_response) {
                count = count + 1;
                console.log("tiamat 6 : ", count);
            }

            if (data[0].q7_ans == q7_response) {
                count = count + 1;
                console.log("tiamat 7 : ", count);
            }

            if (data[0].q8_ans == q8_response) {
                count = count + 1;
                console.log("tiamat 8 : ", count);
            }

            if (data[0].q9_ans == q9_response) {
                count = count + 1;
                console.log("tiamat 9 : ", count);
            }

            if (data[0].q10_ans == q10_response) {
                count = count + 1;
                console.log("tiamat 10 : ", count);
            }

            if (data[0].q11_ans == q11_response) {
                count = count + 1;
                console.log("tiamat 11 : ", count);
            }

            if (data[0].q12_ans == q12_response) {
                count = count + 1;
                console.log("tiamat 12 : ", count);
            }

            if (data[0].q13_ans == q13_response) {
                count = count + 1;
                console.log("tiamat 13 : ", count);
            }

            if (data[0].q14_ans == q14_response) {
                count = count + 1;
                console.log("tiamat 14 : ", count);
            }

            if (data[0].q15_ans == q15_response) {
                count = count + 1;
                console.log("tiamat 15 : ", count);
            }

            console.log("Marks obtained = ", count);
            var marks_obtained = count;
        } 
        
        
        user_response.find({email : email,level : 'final'},  (err,data) =>{
            if(err) throw err;
            else if(data[0] == null){
                user_response({
                    coursename,
                    coursenumber,
                    level,
                    username,
                    lastname,
                    email,
                    q1_response,
                    q2_response,
                    q3_response,
                    q4_response,
                    q5_response,
                    q6_response,
                    q7_response,
                    q8_response,
                    q9_response,
                    q10_response,
                    q11_response,
                    q12_response,
                    q13_response,
                    q14_response,
                    q15_response,
                    marks_obtained
                }).save((err, data) => {
                    if (err)
                        throw err;
        
                    console.log("Data Saved Successfully.....");
                });
            }
            else if(data[0] != null){
                user_response.findOneAndUpdate({email : email,level : "final"}, {q1_response : q1_response,
                    q2_response : q2_response,
                    q3_response : q3_response,
                    q4_response : q4_response,
                    q5_response : q5_response,
                    q6_response : q6_response,
                    q7_response : q7_response,
                    q8_response : q8_response,
                    q9_response : q9_response,
                    q10_response : q10_response,
                    q11_response : q11_response,
                    q12_response : q12_response,
                    q13_response : q13_response,
                    q14_response : q14_response,
                    q15_response : q15_response,
                    marks_obtained : marks_obtained},null,function (err,data)  {
                        if(err) throw err;
                    });

            }
        });
        
        
        user_response.find({email: email, coursenumber : 200,level : "final"}, (err,data) =>{
            if(err) throw err;
            else{

        if (data[0].marks_obtained <= 10) {
            course.find({coursenumber : 200}, (err,data) =>{
                if (err) throw err;
            var m3finals1 = data[0].m3finals1;
            var m3finals2 = data[0].m3finals2;
            var link = '/courses/webdevelopment/module-3'


            req.flash('fail', 'You Have Scored Less Than 70% In Your Evaluation Test Please Use Our Additional Resource For Improvement');
            res.render('additional', {
                'user': req.user,
                'obj1' : m3finals1,
                'obj2' : m3finals2,
                'link' : link,
                fail: req.flash('fail')
            });
        });
        } else if(data[0].marks_obtained > 10) {
            savedcourse.find({
                email: email,coursenumber : 200
            }, (err, data) => {
                if (err)
                    throw err;

                var obj = data;
                console.log(obj);
                req.flash('last', 'You Have Completed This Course Thank You For Your Participation In This Course');
                res.render('module-3-complete', {
                    'user': req.user,
                    'obj': obj,
                    pass: req.flash('last')
                });

            });
        }

    }

})

        //////
    });
});



/////////////////////////Course - Programming Using Python///////////////////////

routes.get('/courses/python/module-4', (req, res) => {


    var email = req.user.email;
    console.log(req.user);
    savedcourse.find({
        email: email,coursenumber : 201
    }, (err, data) => {
        if (err)
            throw err;

        var obj = data;
        console.log(obj);

        req.flash('head', "You Are In The Module - 1 Phase Of This Course")
        res.render('module-4', {
            'user': req.user,
            'obj': obj,
            pass: req.flash('head')
        });

    });
});


routes.get('/test2/beg', (req, res) => {
    res.render('beg1');

    console.log("HELLO THERE!!!!!!!");
    /////////////////Here We use to Save answer to the mongodb////////////////
    

});

routes.post('/test2/beg', (req, res) => {


    var { coursename,
        coursenumber,
        level,
        username,
        lastname,
        email,
        q1_response,
        q2_response,
        q3_response,
        q4_response,
        q5_response,
        q6_response,
        q7_response,
        q8_response,
        q9_response,
        q10_response,
        q11_response,
        q12_response,
        q13_response,
        q14_response,
        q15_response
    } = req.body;


    answer.find({
        coursenumber : 201,
        level: "beginner-1"
    }, (err, data) => {
        if (err)
            throw err;
        else {
            var count = 0;
            if (data[0].q1_ans == q1_response) {
                count = count + 1;
                console.log("tiamat 1 : ", count);
            }

            if (data[0].q2_ans == q2_response) {
                count = count + 1;
                console.log("tiamat 2 : ", count);
            }

            if (data[0].q3_ans == q3_response) {
                count = count + 1;
                console.log("tiamat 3 : ", count);
            }

            if (data[0].q4_ans == q4_response) {
                count = count + 1;
                console.log("tiamat 4 : ", count);
            }

            if (data[0].q5_ans == q5_response) {
                count = count + 1;
                console.log("tiamat 5 : ", count);
            }


            if (data[0].q6_ans == q6_response) {
                count = count + 1;
                console.log("tiamat 6 : ", count);
            }

            if (data[0].q7_ans == q7_response) {
                count = count + 1;
                console.log("tiamat 7 : ", count);
            }

            if (data[0].q8_ans == q8_response) {
                count = count + 1;
                console.log("tiamat 8 : ", count);
            }

            if (data[0].q9_ans == q9_response) {
                count = count + 1;
                console.log("tiamat 9 : ", count);
            }

            if (data[0].q10_ans == q10_response) {
                count = count + 1;
                console.log("tiamat 10 : ", count);
            }

            if (data[0].q11_ans == q11_response) {
                count = count + 1;
                console.log("tiamat 11 : ", count);
            }

            if (data[0].q12_ans == q12_response) {
                count = count + 1;
                console.log("tiamat 12 : ", count);
            }

            if (data[0].q13_ans == q13_response) {
                count = count + 1;
                console.log("tiamat 13 : ", count);
            }

            if (data[0].q14_ans == q14_response) {
                count = count + 1;
                console.log("tiamat 14 : ", count);
            }

            if (data[0].q15_ans == q15_response) {
                count = count + 1;
                console.log("tiamat 15 : ", count);
            }

            console.log("Marks obtained = ", count);
            var marks_obtained = count;
        } 

        user_response.find({email : email,coursenumber : 201, level : 'beginner-1'},  (err,data) =>{
            if(err) throw err;
            else if(data[0] == null){
                user_response({
                    coursename,
                    coursenumber,
                    level,
                    username,
                    lastname,
                    email,
                    q1_response,
                    q2_response,
                    q3_response,
                    q4_response,
                    q5_response,
                    q6_response,
                    q7_response,
                    q8_response,
                    q9_response,
                    q10_response,
                    q11_response,
                    q12_response,
                    q13_response,
                    q14_response,
                    q15_response,
                    marks_obtained
                }).save((err, data) => {
                    if (err)
                        throw err;
        
                    console.log("Data Saved Successfully.....");
                });
            }
            else if(data[0] != null){
                user_response.findOneAndUpdate({email : email,coursenumber : 201,level : "beginner-1"}, {q1_response : q1_response,
                    q2_response : q2_response,
                    q3_response : q3_response,
                    q4_response : q4_response,
                    q5_response : q5_response,
                    q6_response : q6_response,
                    q7_response : q7_response,
                    q8_response : q8_response,
                    q9_response : q9_response,
                    q10_response : q10_response,
                    q11_response : q11_response,
                    q12_response : q12_response,
                    q13_response : q13_response,
                    q14_response : q14_response,
                    q15_response : q15_response,
                    marks_obtained : marks_obtained},null,function (err,data)  {
                        if(err) throw err;
                    });

            }
        });


        if (marks_obtained <= 10) {
            course.find({coursenumber : 201}, (err,data) =>{
                if (err) throw err;
            var m1begs1 = data[0].m1begs1;
            var m1begs2 = data[0].m1begs2;
            var link = '/courses/python/module-4'
            req.flash('fail', 'You Have Scored Less Than 70% In Your Evaluation Test Please Use Our Additional Resource For Improvement');
            res.render('additional', {
                'user': req.user,
                'obj1' : m1begs1,
                'obj2' : m1begs2,
                'link' : link,
                fail: req.flash('fail')
            });
        });
        } else {
            savedcourse.find({
                email: email,coursenumber : 201
            }, (err, data) => {
                if (err)
                    throw err;

                var obj = data;
                console.log(obj);
                req.flash('pass', 'You Have Scored More Than 70% In Your Evaluation Test Please Proceed For Next Evaluation Test');
                res.render('module-4', {
                    'user': req.user,
                    'obj': obj,
                    pass: req.flash('pass')
                });

            });
        }


    });
});


///////////////////Module-1 Advanced///////////////////////

routes.get('/test2/adv', (req, res) => {
    res.render('adv1');

    console.log("HELLO THERE!!!!!!!");

});


routes.post('/test2/adv', (req, res) => {


    var { coursename,
        coursenumber,
        level,
        username,
        lastname,
        email,
        q1_response,
        q2_response,
        q3_response,
        q4_response,
        q5_response,
        q6_response,
        q7_response,
        q8_response,
        q9_response,
        q10_response,
        q11_response,
        q12_response,
        q13_response,
        q14_response,
        q15_response
    } = req.body;


    answer.find({coursenumber : 201,
        level: "advanced-1"
    }, (err, data) => {
        if (err)
            throw err;
        else {
            var count = 0;
            if (data[0].q1_ans == q1_response) {
                count = count + 1;
                console.log("tiamat 1 : ", count);
            }

            if (data[0].q2_ans == q2_response) {
                count = count + 1;
                console.log("tiamat 2 : ", count);
            }

            if (data[0].q3_ans == q3_response) {
                count = count + 1;
                console.log("tiamat 3 : ", count);
            }

            if (data[0].q4_ans == q4_response) {
                count = count + 1;
                console.log("tiamat 4 : ", count);
            }

            if (data[0].q5_ans == q5_response) {
                count = count + 1;
                console.log("tiamat 5 : ", count);
            }


            if (data[0].q6_ans == q6_response) {
                count = count + 1;
                console.log("tiamat 6 : ", count);
            }

            if (data[0].q7_ans == q7_response) {
                count = count + 1;
                console.log("tiamat 7 : ", count);
            }

            if (data[0].q8_ans == q8_response) {
                count = count + 1;
                console.log("tiamat 8 : ", count);
            }

            if (data[0].q9_ans == q9_response) {
                count = count + 1;
                console.log("tiamat 9 : ", count);
            }

            if (data[0].q10_ans == q10_response) {
                count = count + 1;
                console.log("tiamat 10 : ", count);
            }

            if (data[0].q11_ans == q11_response) {
                count = count + 1;
                console.log("tiamat 11 : ", count);
            }

            if (data[0].q12_ans == q12_response) {
                count = count + 1;
                console.log("tiamat 12 : ", count);
            }

            if (data[0].q13_ans == q13_response) {
                count = count + 1;
                console.log("tiamat 13 : ", count);
            }

            if (data[0].q14_ans == q14_response) {
                count = count + 1;
                console.log("tiamat 14 : ", count);
            }

            if (data[0].q15_ans == q15_response) {
                count = count + 1;
                console.log("tiamat 15 : ", count);
            }

            console.log("Marks obtained = ", count);
            var marks_obtained = count;
        } 
        
        
        user_response.find({email : email,coursenumber : 201,level : 'advanced-1'},  (err,data) =>{
            if(err) throw err;
            else if(data[0] == null){
                user_response({
                    coursename,
                    coursenumber,
                    level,
                    username,
                    lastname,
                    email,
                    q1_response,
                    q2_response,
                    q3_response,
                    q4_response,
                    q5_response,
                    q6_response,
                    q7_response,
                    q8_response,
                    q9_response,
                    q10_response,
                    q11_response,
                    q12_response,
                    q13_response,
                    q14_response,
                    q15_response,
                    marks_obtained
                }).save((err, data) => {
                    if (err)
                        throw err;
        
                    console.log("Data Saved Successfully.....");
                });
            }
            else if(data[0] != null){
                user_response.findOneAndUpdate({email : email,coursenumber : 201,level : "advanced-1"}, {q1_response : q1_response,
                    q2_response : q2_response,
                    q3_response : q3_response,
                    q4_response : q4_response,
                    q5_response : q5_response,
                    q6_response : q6_response,
                    q7_response : q7_response,
                    q8_response : q8_response,
                    q9_response : q9_response,
                    q10_response : q10_response,
                    q11_response : q11_response,
                    q12_response : q12_response,
                    q13_response : q13_response,
                    q14_response : q14_response,
                    q15_response : q15_response,
                    marks_obtained : marks_obtained},null,function (err,data)  {
                        if(err) throw err;
                    });

            }
        });
        
        
        

        if (marks_obtained <= 10) {
            course.find({coursenumber : 201}, (err,data) =>{
                if (err) throw err;
            var m1advs1 = data[0].m1advs1;
            var m1advs2 = data[0].m1advs2;
            var link = '/courses/python/module-4'

            req.flash('fail', 'You Have Scored Less Than 70% In Your Evaluation Test Please Use Our Additional Resource For Improvement');
            res.render('additional', {
                'user': req.user,
                'obj1' : m1advs1,
                'obj2' : m1advs2,
                'link' : link,
                fail: req.flash('fail')
            });
        });
        } else {
            savedcourse.find({
                email: email,coursenumber : 201
            }, (err, data) => {
                if (err)
                    throw err;

                var obj = data;
                console.log(obj);
                req.flash('advance', 'You Have Scored More Than 70% In Your Evaluation Test Please Proceed To Next Module');
                res.render('module-4', {
                    'user': req.user,
                    'obj': obj,
                    pass: req.flash('advance')
                });

            });
        }


    });
});


routes.get('/courses/python/module-5', (req, res) => {
    var email = req.user.email;
    user_response.find({
        email: email, coursenumber : 201,level : "advanced-1"}, (err, data) => {
        if (err)
            throw err;
        else {


            if (data[0] == null) {
                savedcourse.find({
                    email: email,coursenumber : 201,
                }, (err, data) => {
                    if (err)
                        throw err;

                    var obj = data;
                    console.log(obj);
                    req.flash('one', 'Please First Give The Advanced Evaluation Test');
                    res.render('module-4', {
                        'user': req.user,
                        'obj': obj,
                        pass: req.flash('one')
                    });

                });

            } else if (data[0].marks_obtained <= 10) {
                savedcourse.find({ email: email,coursenumber : 201 }, (err, data) => {
                    if (err)
                        throw err;

                    var obj = data;
                    console.log(obj);
                    req.flash('two', 'Please First Qualify For The Advanced Evaluation Test');
                    res.render('module-4', {
                        'user': req.user,
                        'obj': obj,
                        pass: req.flash('two')
                    });

                })

            } else if (data[0].marks_obtained > 10) {
                savedcourse.find({
                    email: email,coursenumber : 201
                }, (err, data) => {
                    if (err)
                        throw err;

                    var obj = data;
                    console.log(obj);
                    req.flash('second', "You Are In The Module - 2 Phase Of This Course")
                    res.render('module-5', {
                        'user': req.user,
                        'obj': obj,
                        pass : req.flash('second')
                        
                    });

                });
            }
        }
    });
});



/////////////////////Module-2 python////////////////////////

routes.get('/test2/backbeg', (req, res) => {
    res.render('backbeg1');

    console.log("HELLO THERE!!!!!!!");

});

routes.post('/test2/backbeg', (req, res) => {


    var { coursename,
        coursenumber,
        level,
        username,
        lastname,
        email,
        q1_response,
        q2_response,
        q3_response,
        q4_response,
        q5_response,
        q6_response,
        q7_response,
        q8_response,
        q9_response,
        q10_response,
        q11_response,
        q12_response,
        q13_response,
        q14_response,
        q15_response
    } = req.body;


    answer.find({
        coursenumber : 201,
        level: "beginner-2"
    }, (err, data) => {
        if (err)
            throw err;
        else {
            var count = 0;
            if (data[0].q1_ans == q1_response) {
                count = count + 1;
                console.log("tiamat 1 : ", count);
            }

            if (data[0].q2_ans == q2_response) {
                count = count + 1;
                console.log("tiamat 2 : ", count);
            }

            if (data[0].q3_ans == q3_response) {
                count = count + 1;
                console.log("tiamat 3 : ", count);
            }

            if (data[0].q4_ans == q4_response) {
                count = count + 1;
                console.log("tiamat 4 : ", count);
            }

            if (data[0].q5_ans == q5_response) {
                count = count + 1;
                console.log("tiamat 5 : ", count);
            }


            if (data[0].q6_ans == q6_response) {
                count = count + 1;
                console.log("tiamat 6 : ", count);
            }

            if (data[0].q7_ans == q7_response) {
                count = count + 1;
                console.log("tiamat 7 : ", count);
            }

            if (data[0].q8_ans == q8_response) {
                count = count + 1;
                console.log("tiamat 8 : ", count);
            }

            if (data[0].q9_ans == q9_response) {
                count = count + 1;
                console.log("tiamat 9 : ", count);
            }

            if (data[0].q10_ans == q10_response) {
                count = count + 1;
                console.log("tiamat 10 : ", count);
            }

            if (data[0].q11_ans == q11_response) {
                count = count + 1;
                console.log("tiamat 11 : ", count);
            }

            if (data[0].q12_ans == q12_response) {
                count = count + 1;
                console.log("tiamat 12 : ", count);
            }

            if (data[0].q13_ans == q13_response) {
                count = count + 1;
                console.log("tiamat 13 : ", count);
            }

            if (data[0].q14_ans == q14_response) {
                count = count + 1;
                console.log("tiamat 14 : ", count);
            }

            if (data[0].q15_ans == q15_response) {
                count = count + 1;
                console.log("tiamat 15 : ", count);
            }

            console.log("Marks obtained = ", count);
            var marks_obtained = count;
        } 
        

        user_response.find({email : email,coursenumber : 201,level : 'beginner-2'},  (err,data) =>{
            if(err) throw err;
            else if(data[0] == null){
                user_response({
                    coursename,
                    coursenumber,
                    level,
                    username,
                    lastname,
                    email,
                    q1_response,
                    q2_response,
                    q3_response,
                    q4_response,
                    q5_response,
                    q6_response,
                    q7_response,
                    q8_response,
                    q9_response,
                    q10_response,
                    q11_response,
                    q12_response,
                    q13_response,
                    q14_response,
                    q15_response,
                    marks_obtained
                }).save((err, data) => {
                    if (err)
                        throw err;
        
                    console.log("Data Saved Successfully.....");
                });
            }
            else if(data[0] != null){
                user_response.findOneAndUpdate({email : email,coursenumber : 201,level : "beginner-2"}, {q1_response : q1_response,
                    q2_response : q2_response,
                    q3_response : q3_response,
                    q4_response : q4_response,
                    q5_response : q5_response,
                    q6_response : q6_response,
                    q7_response : q7_response,
                    q8_response : q8_response,
                    q9_response : q9_response,
                    q10_response : q10_response,
                    q11_response : q11_response,
                    q12_response : q12_response,
                    q13_response : q13_response,
                    q14_response : q14_response,
                    q15_response : q15_response,
                    marks_obtained : marks_obtained},null,function (err,data)  {
                        if(err) throw err;
                    });

            }
        });
        
       

        if (marks_obtained <= 10) {
            course.find({coursenumber : 201}, (err,data) =>{
                if (err) throw err;
            var m2begs1 = data[0].m2begs1;
            var m2begs2 = data[0].m2begs2;
            var link = '/courses/python/module-5'

            req.flash('fail', 'You Have Scored Less Than 70% In Your Evaluation Test Please Use Our Additional Resource For Improvement');
            res.render('additional', {
                'user': req.user,
                'obj1' : m2begs1,
                'obj2' : m2begs2,
                'link' : link,
                fail: req.flash('fail')
            });
        });
        } else {
            savedcourse.find({
                email: email,coursenumber : 201
            }, (err, data) => {
                if (err)
                    throw err;

                var obj = data;
                console.log(obj);
                req.flash('pass', 'You Have Scored More Than 70% In Your Evaluation Test Please Proceed For Next Evaluation Test');
                res.render('module-5', {
                    'user': req.user,
                    'obj': obj,
                    pass: req.flash('pass')
                });

            });
        }


    });
});


///////////////////Module-2 Advanced///////////////////////

routes.get('/test2/backadv', (req, res) => {
    res.render('backadv1');

    console.log("HELLO THERE!!!!!!!");

});


routes.post('/test2/backadv', (req, res) => {


    var { coursename,
        coursenumber,
        level,
        username,
        lastname,
        email,
        q1_response,
        q2_response,
        q3_response,
        q4_response,
        q5_response,
        q6_response,
        q7_response,
        q8_response,
        q9_response,
        q10_response,
        q11_response,
        q12_response,
        q13_response,
        q14_response,
        q15_response
    } = req.body;


    answer.find({coursenumber : 201,
        level: "advanced-2"
    }, (err, data) => {
        if (err)
            throw err;
        else {
            var count = 0;
            if (data[0].q1_ans == q1_response) {
                count = count + 1;
                console.log("tiamat 1 : ", count);
            }

            if (data[0].q2_ans == q2_response) {
                count = count + 1;
                console.log("tiamat 2 : ", count);
            }

            if (data[0].q3_ans == q3_response) {
                count = count + 1;
                console.log("tiamat 3 : ", count);
            }

            if (data[0].q4_ans == q4_response) {
                count = count + 1;
                console.log("tiamat 4 : ", count);
            }

            if (data[0].q5_ans == q5_response) {
                count = count + 1;
                console.log("tiamat 5 : ", count);
            }


            if (data[0].q6_ans == q6_response) {
                count = count + 1;
                console.log("tiamat 6 : ", count);
            }

            if (data[0].q7_ans == q7_response) {
                count = count + 1;
                console.log("tiamat 7 : ", count);
            }

            if (data[0].q8_ans == q8_response) {
                count = count + 1;
                console.log("tiamat 8 : ", count);
            }

            if (data[0].q9_ans == q9_response) {
                count = count + 1;
                console.log("tiamat 9 : ", count);
            }

            if (data[0].q10_ans == q10_response) {
                count = count + 1;
                console.log("tiamat 10 : ", count);
            }

            if (data[0].q11_ans == q11_response) {
                count = count + 1;
                console.log("tiamat 11 : ", count);
            }

            if (data[0].q12_ans == q12_response) {
                count = count + 1;
                console.log("tiamat 12 : ", count);
            }

            if (data[0].q13_ans == q13_response) {
                count = count + 1;
                console.log("tiamat 13 : ", count);
            }

            if (data[0].q14_ans == q14_response) {
                count = count + 1;
                console.log("tiamat 14 : ", count);
            }

            if (data[0].q15_ans == q15_response) {
                count = count + 1;
                console.log("tiamat 15 : ", count);
            }

            console.log("Marks obtained = ", count);
            var marks_obtained = count;
        } 
        
        
        
        
        user_response.find({email : email,coursenumber : 201,level : 'advanced-2'},  (err,data) =>{
            if(err) throw err;
            else if(data[0] == null){
                user_response({
                    coursename,
                    coursenumber,
                    level,
                    username,
                    lastname,
                    email,
                    q1_response,
                    q2_response,
                    q3_response,
                    q4_response,
                    q5_response,
                    q6_response,
                    q7_response,
                    q8_response,
                    q9_response,
                    q10_response,
                    q11_response,
                    q12_response,
                    q13_response,
                    q14_response,
                    q15_response,
                    marks_obtained
                }).save((err, data) => {
                    if (err)
                        throw err;
        
                    console.log("Data Saved Successfully.....");
                });
            }
            else if(data[0] != null){
                user_response.findOneAndUpdate({email : email,coursenumber : 201,level : "advanced-1"}, {q1_response : q1_response,
                    q2_response : q2_response,
                    q3_response : q3_response,
                    q4_response : q4_response,
                    q5_response : q5_response,
                    q6_response : q6_response,
                    q7_response : q7_response,
                    q8_response : q8_response,
                    q9_response : q9_response,
                    q10_response : q10_response,
                    q11_response : q11_response,
                    q12_response : q12_response,
                    q13_response : q13_response,
                    q14_response : q14_response,
                    q15_response : q15_response,
                    marks_obtained : marks_obtained},null,function (err,data)  {
                        if(err) throw err;
                    });

            }
        });
        
        

        if (marks_obtained <= 10) {
            course.find({coursenumber : 201}, (err,data) =>{
                if (err) throw err;
            var m2advs1 = data[0].m2advs1;
            var m2advs2 = data[0].m2advs2;
            var link = '/courses/python/module-5'

            req.flash('fail', 'You Have Scored Less Than 70% In Your Evaluation Test Please Use Our Additional Resource For Improvement');
            res.render('additional', {
                'user': req.user,
                'obj1' : m2advs1,
                'obj2' : m2advs2,
                'link' : link,
                fail: req.flash('fail')
            });
        });
        } else {
            savedcourse.find({coursenumber : 201,
                email: email
            }, (err, data) => {
                if (err)
                    throw err;

                var obj = data;
                console.log(obj);
                req.flash('advance', 'You Have Scored More Than 70% In Your Evaluation Test Please Proceed To Next Module');
                res.render('module-5', {
                    'user': req.user,
                    'obj': obj,
                    pass: req.flash('advance')
                });

            });
        }


    });
});



routes.get('/courses/python/module-6', (req, res) => {
    var email = req.user.email;
    user_response.find({
        email: email, coursenumber : 201,level : "advanced-2"
    }, (err, data) => {
        if (err)
            throw err;
        else {


            if (data[0] == null) {
                savedcourse.find({
                    email: email,coursenumber : 201
                }, (err, data) => {
                    if (err)
                        throw err;

                    var obj = data;
                    console.log(obj);
                    req.flash('one', 'Please First Give The Advanced Evaluation Test');
                    res.render('module-5', {
                        'user': req.user,
                        'obj': obj,
                        pass: req.flash('one')
                    });

                });

            } else if (data[0].marks_obtained <= 10) {
                savedcourse.find({ email: email,coursenumber : 201, }, (err, data) => {
                    if (err)
                        throw err;

                    var obj = data;
                    console.log(obj);
                    req.flash('two', 'Please First Qualify For The Advanced Evaluation Test');
                    res.render('module-5', {
                        'user': req.user,
                        'obj': obj,
                        pass: req.flash('two')
                    });

                })

            } else if (data[0].marks_obtained > 10) {
                savedcourse.find({
                    email: email,coursenumber : 201
                }, (err, data) => {
                    if (err)
                        throw err;

                    var obj = data;
                    console.log(obj);
                    req.flash('third', "You Are In The Module - 3 Phase Of This Course")
                    res.render('module-6', {
                        'user': req.user,
                        'obj': obj,
                        pass : req.flash('third')
                    });

                });
            }
        }
    });
});



///////////////////////Module-3 python/////////////////////////////////


routes.get('/test2/final', (req, res) => {
    res.render('final1');

    console.log("HELLO THERE!!!!!!!");

});

routes.post('/test2/final', (req, res) => {


    var { coursename,
        coursenumber,
        level,
        username,
        lastname,
        email,
        q1_response,
        q2_response,
        q3_response,
        q4_response,
        q5_response,
        q6_response,
        q7_response,
        q8_response,
        q9_response,
        q10_response,
        q11_response,
        q12_response,
        q13_response,
        q14_response,
        q15_response
    } = req.body;


    answer.find({coursenumber : 201,
        level: "final"
    }, (err, data) => {
        if (err)
            throw err;
        else {
            var count = 0;
            if (data[0].q1_ans == q1_response) {
                count = count + 1;
                console.log("tiamat 1 : ", count);
            }

            if (data[0].q2_ans == q2_response) {
                count = count + 1;
                console.log("tiamat 2 : ", count);
            }

            if (data[0].q3_ans == q3_response) {
                count = count + 1;
                console.log("tiamat 3 : ", count);
            }

            if (data[0].q4_ans == q4_response) {
                count = count + 1;
                console.log("tiamat 4 : ", count);
            }

            if (data[0].q5_ans == q5_response) {
                count = count + 1;
                console.log("tiamat 5 : ", count);
            }


            if (data[0].q6_ans == q6_response) {
                count = count + 1;
                console.log("tiamat 6 : ", count);
            }

            if (data[0].q7_ans == q7_response) {
                count = count + 1;
                console.log("tiamat 7 : ", count);
            }

            if (data[0].q8_ans == q8_response) {
                count = count + 1;
                console.log("tiamat 8 : ", count);
            }

            if (data[0].q9_ans == q9_response) {
                count = count + 1;
                console.log("tiamat 9 : ", count);
            }

            if (data[0].q10_ans == q10_response) {
                count = count + 1;
                console.log("tiamat 10 : ", count);
            }

            if (data[0].q11_ans == q11_response) {
                count = count + 1;
                console.log("tiamat 11 : ", count);
            }

            if (data[0].q12_ans == q12_response) {
                count = count + 1;
                console.log("tiamat 12 : ", count);
            }

            if (data[0].q13_ans == q13_response) {
                count = count + 1;
                console.log("tiamat 13 : ", count);
            }

            if (data[0].q14_ans == q14_response) {
                count = count + 1;
                console.log("tiamat 14 : ", count);
            }

            if (data[0].q15_ans == q15_response) {
                count = count + 1;
                console.log("tiamat 15 : ", count);
            }

            console.log("Marks obtained = ", count);
            var marks_obtained = count;
        } 
        
        
        user_response.find({email : email,coursenumber : 201,level : 'final'},  (err,data) =>{
            if(err) throw err;
            else if(data[0] == null){
                user_response({
                    coursename,
                    coursenumber,
                    level,
                    username,
                    lastname,
                    email,
                    q1_response,
                    q2_response,
                    q3_response,
                    q4_response,
                    q5_response,
                    q6_response,
                    q7_response,
                    q8_response,
                    q9_response,
                    q10_response,
                    q11_response,
                    q12_response,
                    q13_response,
                    q14_response,
                    q15_response,
                    marks_obtained
                }).save((err, data) => {
                    if (err)
                        throw err;
        
                    console.log("Data Saved Successfully.....");
                });
            }
            else if(data[0] != null){
                user_response.findOneAndUpdate({email : email,coursenumber : 201,level : "final"}, {q1_response : q1_response,
                    q2_response : q2_response,
                    q3_response : q3_response,
                    q4_response : q4_response,
                    q5_response : q5_response,
                    q6_response : q6_response,
                    q7_response : q7_response,
                    q8_response : q8_response,
                    q9_response : q9_response,
                    q10_response : q10_response,
                    q11_response : q11_response,
                    q12_response : q12_response,
                    q13_response : q13_response,
                    q14_response : q14_response,
                    q15_response : q15_response,
                    marks_obtained : marks_obtained},null,function (err,data)  {
                        if(err) throw err;
                    });

            }
        });
        
        
        
        user_response.find({email: email, coursenumber : 201,level : "final"}, (err,data) =>{
            if(err) throw err;
            else{

        if (data[0].marks_obtained <= 10) {
            course.find({coursenumber : 201}, (err,data) =>{
                if (err) throw err;
            var m3finals1 = data[0].m3finals1;
            var m3finals2 = data[0].m3finals2;
            var link = '/courses/python/module-6'


            req.flash('fail', 'You Have Scored Less Than 70% In Your Evaluation Test Please Use Our Additional Resource For Improvement');
            res.render('additional', {
                'user': req.user,
                'obj1' : m3finals1,
                'obj2' : m3finals2,
                'link' : link,
                fail: req.flash('fail')
            });
        });
        } else if(data[0].marks_obtained > 10){
            savedcourse.find({
                email: email,coursenumber : 201,
            }, (err, data) => {
                if (err)
                    throw err;

                var obj = data;
                console.log(obj);
                req.flash('last', 'You Have Completed This Course Thank You For Your Participation In This Course');
                res.render('module-6-complete', {
                    'user': req.user,
                    'obj': obj,
                    pass: req.flash('last')
                });

            });
        }
    }

})

    });
});



routes.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
}); module.exports = routes;
