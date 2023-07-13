import { checkconn } from "./db.js";
import express from "express";
import cors from 'cors';
import userRouter from './routes/users.js'
import adminRouter from './routes/admin.js'


const app = express();
app.use(express.json());
app.use(cors());
checkconn();
const port = 5000 ;

app.use('/user',userRouter)
app.use('/admin',adminRouter)
app.use('/', (req,res)=>{
    res.send("hello")
  });
  

app.listen(port,()=>{
    console.log(`app is listening on ${port}`)
})