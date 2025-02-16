const express=require('express');
const cors=require('cors');
const bodyparser=require('body-parser');
const mysql=require('mysql2');

const app=express();
const port=3000;

app.use(express.json()); // Must be at the top before routes

app.use(cors());

const db2=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'Anushk@2911',
    database:'todoapp'
});

db2.connect((err)=>{
    if(err)
    {
        console.log('error occur while connecting to database',err.stack);
    }
    return console.log('Connected to database');
});

app.get('/',(req,res)=>{
 res.send('hello from node.js backend with index2');
});


app.post('/api/todo',(req,res)=>{
    console.log(req.body);
 const {title,description,date,time}=req.body;
 const query='INSERT INTO todo(title,description,ischecked,date,time) VALUES(?,?,1,?,?)';
 db2.query(query,[title,description,date,time],(err,results)=>{
    if(err)
    {
       return res.status(500).json({error:'error occur while adding record'});
    }
    else{
        return res.json({userid:results.insertId});
    }
 });
});

app.get('/api/todo',(req,res)=>{
    db2.query('SELECT * FROM todo',(err,results)=>{
        if(err)
        {
            return res.status(500).json({error:'error occur while fetching records'});
        }
        return res.json(results);
    });
});

app.post('/api/updateRecord', (req, res) => {
    console.log('API hit: /api/updateRecord');
    // try {
      const { title, description,ischecked,date,time} = req.body;
      console.log(req.body);
      if (!title || !description) {
        return res.status(400).json({ error: 'Missing fields' });
      }
      console.log('Received:', title, description,ischecked,date,time);
  
      db2.query(
        'INSERT INTO completedtodo(title,description,ischecked,date,time) VALUES (?,?,?,?,?)',
        [title, description,ischecked,date,time],
        (err, results) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          console.log('Insertion successful:', results.insertId);
        updatependingtodo(title,description,res,results);
        }
      );
      //   return res.json({ userid: results.insertId });
    // } catch (err) {
    //   console.error('Unhandled error:', err);
    //   res.status(500).json({ error: 'Internal server error' });
    // }
  });
  

function updatependingtodo(title,description,res,results){

    console.log('in try block');
    console.log('title=>',title);
 console.log('description=>',description);
 db2.query(' DELETE  FROM todo WHERE title=? AND description=?',[title,description],(error,result)=>{
    if(error)
    {
       return res.status(500).json({error:'error occur while deleting record from todo '});
    }
    else{
        return res.json(results);
    }
 })
};

app.post('/api/completedtodo',(req,res)=>{
    
    
   try
   {
    const{title,description,ischecked,date,time}=req.body;
    // {  console.log('try block',req.body);
    console.log('compleetd todo',req.body);
    db2.query('INSERT INTO todo(title,description,ischecked,date,time) VALUES(?,?,?,?,?)',[title,description,ischecked,date,time],(err,results)=>{
        if(err)
        {
            return res.status(500).json({error:'error occur while inserting into todo'});
        }
        console.log('inserted successfully',results.insertId);
        updateCompletedtodo(results,res,title,description);
        // return res.status(201).json({message:'inserted successfully',userid:results.insertId});

    })}
    catch(err)
    {
        console.log('in catch block of updatedtodo');
    }
})

function updateCompletedtodo(results,res,title,description){
    db2.query('DELETE FROM completedtodo WHERE title=? AND description=?',[title,description],(error,result)=>{
        if(error)
        {
            return res.status(500).json({error:'Error occur while updated completed todo'});
        }
        return res.status(201).json({message:'updated successfully',userid:results.insertId})
    })
}
app.get('/api/fetchCompletedtodo',(req,res)=>{
    db2.query('SELECT * FROM completedtodo',(err,results)=>{
        if(err){
            return res.status(500).json({error:'Error occur while getting response'});
        }
        else{
            return res.json(results);
        }
    });
});

app.delete('/api/deletePendingTodo',(req,res)=>{
   const{title,description}= req.body;
   console.log(title);
   console.log(description);

   db2.query('DELETE FROM todo WHERE title=? AND description=?',[title,description],(err,results)=>{
    if(err){
        return res.status(500).json({error:'Error occur while delete record from todo'});
    }
    return res.status(201).json({message:'successfully deleted from todo',userid:results.insertId});
   })
})

app.delete('/api/deleteCompletedTodo',(req,res)=>{
    const{title,description}= req.body;
    console.log(title);
    console.log(description);
 
    db2.query('DELETE FROM completedtodo WHERE title=? AND description=?',[title,description],(err,results)=>{
     if(err){
         return res.status(500).json({error:'Error occur while delete record from todo'});
     }
     return res.status(201).json({message:'successfully deleted from todo',userid:results.insertId});
    })
 })
//start server
app.listen(port,()=>{
    console.log('Server running on http://localhost:${port}');
});

