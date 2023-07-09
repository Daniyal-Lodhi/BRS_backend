import { checkconn } from "./db.js";
import express from "express";
import cors from 'cors';
import userRouter from './routes/users.js'


const app = express();
app.use(express.json());
app.use(cors());
checkconn();
const port = 5000 ;

app.use('/user',userRouter)

app.listen(port,()=>{
    console.log(`app is listening on ${port}`)
})