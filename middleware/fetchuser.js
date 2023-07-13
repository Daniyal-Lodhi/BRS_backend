import jwt from 'jsonwebtoken'
import  dotenv  from 'dotenv';
dotenv.config()

const fetchuser = (req,res,next)=>{
    const token = req.header("authToken")
    if(!token){
        res.status(401).send({'error': "token not found"})
    } 
    try{
        const data = jwt.verify(token,"It has been a tough ride") ;
        req.customer = data.customer ;
        next()
    }catch(error){
        res.status(401).send({error: "please authenticate using a valid token"})
    }
}

export default fetchuser