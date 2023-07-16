import conn from '../db.js' ;
import express from 'express';
import { body ,validationResult } from 'express-validator';
const router = express.Router();
import  dotenv  from 'dotenv';
dotenv.config()

// Route 1 : admin Login (No login required) 

router.post('/adminlogin',(req,res)=>{
    var success = false ;
    var cnic;
    try{
        conn.query('SELECT cnic,password from admin where email = ?',req.body.email,(error,rows)=>{
            if(error){
                return res.status(500).json({ error })
            }
            else{
            // checking if email is registered
            if (rows.length <= 0) {
                res.status(400).json({success, message: 'please login using correct credentials'})
            }
            else{
                 // destructuring from rows
                 const {cnic, password } = rows[0];
                 if(req.body.password !== password){
                    res.status(400).json({success, message: 'please login using correct credentials' })
                 }
                 else{
                    success = true ;
                    res.json({cnic, success })
                 }
            }
        }
        })
        
    }catch(error){
        res.json({error}) 
    }
    
})


// Route 2 : admin add bikes Login (login required) 
router.post('/addbike',(req,res)=>{
    try{
        const bikedata = {
            bikeNo : req.body.bikeNo,
            bikeName : req.body.bikeName,
            biketype : req.body.biketype,
            condition : req.body.condition,
            rentalprice : 200,
            availability : "yes",
            image1 : req.body.image1,
            
        }
        if(req.header("cnic")==='222'){
        conn.query("insert into bikes set ? ",bikedata,(error)=>{
            if (error){
            return res.status(500).json({error})
            }
            else{
                return res.status(200).json({message:"vehicle added successfully",bikedata})
                
            }
        })}
        else{
            res.status(401).json({message:"Unauthorized request"})
        }
    
    }catch(error){
        res.status(500).json({error})
    }
})

// Route 3 : fetch all payments(login required)

router.get('/getpayments',(req,res)=>{
    try{
        var success = false ;
        conn.query('select * from payment',(error,rows)=>{
            if(error){
                return res.status(500).json({success,error})
            }

            else if(req.header("cnic")!=='222'){
                res.status(401).json({success,message:"Unauthorized request"})
            }
            else{
                success = true ;
                res.status(200).json({success,rows})

            }
        })
    }catch(error){
        success = false
        res.status(500).json({success,error})
    }
})

// Route 4: admin maintanence on bikes 
router.post('/updatemaintenance',async(req,res)=>{
    var success = false ;
    try{
        var maintenancedata = {
            admincnic : 222,
            bikeNo : req.body.bikeno,
            description : req.body.description
        }
        conn.query("insert into maintenance set ?",maintenancedata,(error,rows)=>{
            if(error){
                res.status(500).json({success,error})
            }
            else if (req.header("cnic")!=='222'){
                res.status(401).json({success,message:"Unauthorized request"})
            }
            else{
                const bikenumber = maintenancedata.bikeNo
                const currentdatetime = new Date() ;
                conn.query("update bikes set lastmaintenance = ? where bikeno = ?",[currentdatetime,bikenumber],(error)=>{
                    if (error){
                        res.status(500).json({success,error})
                    }
                    else{
                        success = true ;
                        res.status(200).json({success,message:"maintenance entry successfull",currentdatetime})
                    }
                })
            }
        })
    }catch(error){
        res.status(500).json({error})
    }
})








export default router ;