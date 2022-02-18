const express = require('express');
const app = express(); 
const routes = require('./routes.js');
const path = require('path');



app.use('/public',express.static('public'));

app.set('view engine','ejs');
app.set('views',[path.join(__dirname,'views'),path.join(__dirname,'views/admin'),path.join(__dirname,'views/student'),path.join(__dirname,'views/courses'),path.join(__dirname,'views/test'),path.join(__dirname,'views/test2')]);


app.get('/home', routes);
app.get('/about', routes);
app.get('/contact', routes);
app.get('/webdevelopment', routes);
app.get('/python', routes);



app.get("/register",routes);
app.post("/register", routes);
app.get("/login", routes);
app.post("/login", routes);

app.get('/profile', routes);

app.get('/adminprofile', routes);

app.get("/admin/admin-dashboard", routes);

app.get('/admin/create-course',routes);

app.post('/admin/create-course',routes);



app.get('/student/student-dashboard', routes);

app.get('/student/student-dashboard', routes);


app.get('/student/my-course-empty', routes);


app.get('/student/course-list', routes);


app.post('/student/course-list', routes);


app.get('/student/course-list-updated', routes);


app.get('/student/my-course', routes);

app.get('/courses/webdevelopment/module-1', routes);

app.get('/test/beg', routes);

app.post('/test/beg', routes);

app.get('/test/adv', routes);

app.post('/test/adv', routes);

app.get('/courses/webdevelopment/module-2', routes);

app.get('/test/backbeg', routes);

app.post('/test/backbeg', routes);

app.get('/test/backadv', routes);

app.post('/test/backadv', routes);

app.get('/courses/webdevelopment/module-3', routes);


app.get('/test/final', routes);

app.post('/test/final', routes);

app.get('/courses/python/module-4',routes);

app.get('/test2/beg', routes);

app.post('/test2/beg', routes);

app.get('/test2/adv', routes);

app.post('/test2/adv', routes);

app.get('/courses/python/module-5', routes);

app.get('/test2/backbeg', routes);

app.post('/test2/backbeg', routes);

app.get('/test2/backadv', routes);

app.post('/test2/backadv', routes);

app.get('/courses/python/module-6', routes);

app.get('/test2/final', routes);

app.post('/test2/final', routes);

app.get('/logout',routes);

const PORT =process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server started at port",PORT));

