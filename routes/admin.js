import conn from '../db.js' ;
import express from 'express';
import { body ,validationResult } from 'express-validator';
import bcrypt from 'bcryptjs' ;
import jwt from 'jsonwebtoken' ;
import fetchuser from '../middleware/fetchuser.js'
const router = express.Router();
import  dotenv  from 'dotenv';
dotenv.config()

// Route 1 : admin Login (No login required) 

router.post('/adminlogin',(req,res)=>{
    var success = false ;
    var id;
    try{
        conn.query('SELECT id,password from admin where email = ?',req.body.email,(error,rows)=>{
            if(error){
                return res.status(500).json({ error })
            }
            else{
            // checking if email is registered
            if (rows.length <= 0) {
                res.status(400).json({ message: 'please login using correct credentials', success })
            }
            else{
                 // destructuring from rows
                 const { id, password } = rows[0];
                 if(req.body.password !== password){
                    res.status(400).json({ message: 'please login using correct credentials', success })
                 }
                 else{
                    success = true ;
                    res.json({ id, success })
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
            rentalprice : req.body.rentalprice,
            availability : "yes",
            image1 : req.body.image1,
            image2 : req.body.image2,
            image3 : req.body.image3, 
        }
        if(req.header("id")==='222'){
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

            else if(req.header("id")!=='222'){
                res.status(401).json({success,message:"Unauthorized request"})
            }
            else{
                success = true ;
                res.status(200).json({success,rows})

            }
        })
    }catch(error){
        res.status(500).json({error})
    }
})










export default router ;