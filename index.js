const express= require('express');    // express is framework to build web apps and API         
const bodyParser=require('body-parser'); //middleware  parse(break into smaller piecing or analysis) incoming JSON request  bodies to javascript object 
const cors=require('cors');     //cors handle backend request from different domains (ports:3000,protocol:http:// or https://) 
const mysql=require('mysql2');  //a library which connect with mysql  database and with queries
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');   //bcrypt is used to  convert simple password to hash password ,because whenever database is leaked hacker can't access original password  
require('dotenv').config();    //used these dotenv to load the secret key  in jwt_secret file to secure the secret key 
// these  are imports

const app=express(); //instance(copy of express) of express framework 
const port=3000;  //port on which server listen the request

//Middleware ( handle request-response cycle )
app.use(bodyParser.json());
app.use(cors());

//e.g. JWT_SECRET=mysupersecretkey123( first create .env file )
const SECRET_KEY=process.env.JWT_SECRET || 'your-secret-key';   //store the secret key in  env file (environmental variable)  if env file is missing they show the message 'your secret key',scret key is  private key used to assign jwt token to user in encrypted form  ,and also secure from unauthorized users
// create a Mysql connection
const db=mysql.createConnection({  //pass parameters
    host:'localhost',               //change if using a remote database 
    user:'root',                    //your MYSQL username
    password:'Anushk@2911',                      //your MYSQL password
    database:'booking'        //your database name
});

//check MYSQL connection 
db.connect((err)=>{
    if(err)
    {
        console.error('Error connecting to the database:', err.stack); //stack method in javascript provide detailed from where the error occur ,file,line number
        return;
    }
    console.log('Connected to MYSQL database');
});
//routes
app.get('/',(req,res)=>{    // / reffer http://localhost:3000/
    res.send('hello from the Node.js backend!');
});

//login 
app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?';

    db.query(query, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

         const user = results[0];

        // Compare entered password with hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log('hash password:',user.password);
        console.log('password:',password);
        console.log(passwordMatch);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.usersid, email: user.email },  //playload(user data)
             SECRET_KEY,                                          //sekret key for encryption  
              { expiresIn: '2d' });                     //token expiry time(optional 7d-days,30m-minutes,1h-hours,60*60-3600 seconds)

        res.json({ message: 'Login successful', token });
    });
});










//token verification before any retrievale ,editing,inserting or deleting api work with its end points 
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(403).json({ error: 'authenicated but no permission or access denied .' });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], SECRET_KEY); // Extract token after "Bearer"
        req.user= decoded; // Attach decoded user info to the request
        next
        (); // Continue to the next middleware/route handler
    } catch (error) {
        res.status(401).json({ error: 'user is not authenicated or expired token' });
    }
};


const authenticateUsersToken=(req, res, next)=>{
    const userLoginToken=req.header('Authorization');
    if(!userLoginToken)
    {
        return res.status(403).json({ error: 'Access denied. No token provided.' });
    }
    try{
        const decoded = jwt.verify(userLoginToken.split(" ")[1], SECRET_KEY);
        req.user = decoded;
        // console.log('userreq',req.user);
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'unauthorized user  or expired token' });
    }
};
const authenticateEditableScreenToken=(req, res, next)=>{
    const editableScreenToken=req.header('Authorization');
    if(!editableScreenToken)
    {
        return res.status(403).json({ error: 'Access denied. No token provided.' });
    }
    try{
        const decoded = jwt.verify(editableScreenToken.split(" ")[1], SECRET_KEY);
        req.user = decoded;
        // console.log('editable screen req.user',req.user.userId);
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'unauthorized user  or expired token' });
    }
};


//PUT /api/users/:id -Update user data
app.put('/api/users/:usersid',authenticateEditableScreenToken,async(req,res)=>{
    const usersid=req.user.userId;
    // console.log('userid of editable screen',usersid);
    const{email,first_name,password}=req.body; //adjust fields as necessary
//    console.log('request body',req.body);
   try
   {
    // console.log('in try block');
    const hashPassword= await bcrypt.hash(password,10); 
        const updateQuery='UPDATE users SET email=?,password=?,first_name=? WHERE usersid=?';
    db.query(updateQuery,[email,hashPassword,first_name,usersid],(err,results)=>{
        if(err)
        {
            console.log('error',err);
            return res.status(500).json({error:'Error updating user'});
        }
        if(results.affectedRows===0)
        {
            return res.status(404).json({error:'User not found'});
        }
         return res.json(results);
         
    });}
    catch(err)
    {
        console.log('in catch',err);
    }

});

//Get user records(userid,email from users table )
app.get('/api/userLoginScreen',authenticateUsersToken,(req,res)=>{
    const userid=req.user.userId;
    // console.log('user id',userid);
    db.query('SELECT * FROM users where usersid=?',[userid],(err,results)=>{
        if(err)
        {
           return res.json({error:'error occur while getting record from users  table'});
        }
        else{
           return res.json(results);
        }
    });
});

//GET/api/hotelrecords .Fetch all hotelrecords
app.get('/api/hotelrecords',authenticateToken, (req,res)=>{   //we have to use api  keyword in url to create endpoints that differentiate between other routes and api routes 
    db.query('SELECT * FROM hotelrecords  ',(err,results)=>{
        if(err)
        {return res.status(500).json({error:'Error fetching users'});
       }
       res.json(results);
    });
});


//GET/api/users .Fetch all offerdetails
app.get('/api/offerdetails', authenticateToken,(req,res)=>{
    db.query('SELECT * FROM offerdetails  ',(err,results)=>{
        if(err)
        {return res.status(500).json({error:'Error fetching users'});
       }
       res.json(results);
    });
});

//GET /api/users/:id .Fetch a user by ID
app.get('/api/users/:id',(req,res)=>{
    const {id}=req.params;
    db.query('Select * from users WHERE id=?',[id],(err,results)=>{
        if(err)
        {
            return res.status(500).json({ error:'Error fetching user'});
        }
        if(results.length===0)
        {
            return res.status(404).json({ error:'user request resource is not exist '});
        }
        res.json(results[0]);
    });
});


//fetching records from hoteldetails
app.get('/api/hoteldetails',(req,res)=>{
    // console.log(req.query);
    const{data}=req.query;
  db.query('SELECT * FROM hoteldetails WHERE name=?',[data],(err,results)=>{
    if(err)
    {
         return res.json('error occur while fetching hoteldetails');
    }
    // console.log(results);
      return res.status(201).json(results);
    
  });
});

app.get('/api/wishlistrecords/:wishlist',authenticateToken, (req, res) => {
    let query = 'SELECT hotelid FROM wishlistrecords';
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error occurred while fetching wishlist records' });
        }
        
        // Extract hotel IDs from results
        let hotelIds = results.map(row => row.hotelid);

        if (hotelIds.length === 0) {
            return res.json([]); // If no hotels are wishlisted, return an empty array
        }

        getHotels(res, hotelIds);
    });
});

function getHotels(res, hotelIds) {
    let secQuery = 'SELECT * FROM hotelrecords WHERE hotelid IN (?)';

    db.query(secQuery, [hotelIds], (errors, result) => {
        if (errors) {
            return res.status(500).json({ error: 'Error occurred while fetching hotel records' });
        } else {
            return res.json(result);
        }
    });
}

//POST /api/users -Add a new user (Signup /register )
app.post('/api/users',async(req,res)=>{
    const {email,password,first_name,last_name,phone_no}=req.body; //Adjust fields according to your users
    const query='INSERT INTO users(email,password,first_name,last_name,phone_no)VALUES (?,?,?,?,?)';
    const hashpassword=await bcrypt.hash(password,10);       //here the convertion occur when user signup at that time original password is converted to hash password with 10 time(range under 5 to 15+) hashing is done more hashing ,slow down login but more time used more secure to prevent through hackers 
    db.query(query,[email,hashpassword,first_name,last_name,phone_no],(err,results)=>{  //bcrypt or hash password is irreverable string of characters
        if(err){
            return res.status(500).json({error:'Error adding user'});
        }
        res.status(201).json({message:'User added successfully',userId:results.insertId});
    });
});
app.post('/api/wishlistrecords/:hotelid',authenticateToken,(req,res)=>{
    const {hotelid}=req.body;
    let query='DELETE FROM wishlistrecords WHERE hotelid = ?';
    db.query(query,[hotelid],(err,results)=>{
        if(err)
        {
            return res.status(500).json({error:'Error while updating records in wishlist'});
        }
       else{
        updateHotelrecordsField(hotelid,res,results.insertId);}
    });
});

function updateHotelrecordsField(hotelid,res,insertId){
    let updateWishlist='UPDATE hotelrecords SET wishlist = 0 WHERE hotelid=?';

        db.query(updateWishlist, [hotelid], (error, updateResults) => {
            if (error) {
                return res.status(500).json({ error: 'Error updating wishlist field' });
            }
            
            // Respond after updating hotelrecords
           return res.status(201).json({ message: 'User record update  successfully', userId:insertId });

    });
};

//post  /api/wishlistrecords -add a new user
app.post('/api/wishlistrecords', authenticateToken,(req, res) => {
    const { hotelid } = req.body; // Get hotelid from the request body

    const query = 'INSERT INTO wishlistrecords(hotelid) VALUES(?)';

    // Insert into wishlistrecords
    db.query(query, [hotelid], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error adding to wishlist' });
        } else {
            // Call the function to update the wishlist field in hotelrecords
            updatehotelrecords(hotelid, res, results.insertId);
        }
    });
});

// Function to update hotelrecords wishlist field
function updatehotelrecords(hotelid, res, insertId) {
    const updateQuery = 'UPDATE hotelrecords SET wishlist = 1 WHERE hotelid = ?';

    db.query(updateQuery, [hotelid], (error, updateResults) => {
        if (error) {
            return res.status(500).json({ error: 'Error updating wishlist field' });
        }
        
        // Respond after updating hotelrecords
       return res.status(201).json({ message: 'User added successfully', userId:insertId });
            

    });
};
 



//DELETE /api/users/:id-Delete a user
app.delete('/api/users/:id',(req,res)=>{
    const {id}=req.params;
    db.query('DELETE FROM users WHERE id=?',[id],(err,results)=>{
        if(err)
        {
            return res.status(500).json({error:'Error deleting user'});
        }
        if(results.affectedRows===0)
        {
            return res.status(404).json({error:'User not found'});
        }
        res.json({message:'User deleted successfully'});
    });
});



//start server
app.listen(port,()=>{
    console.log('Server running on http://localhost:${port}');
});