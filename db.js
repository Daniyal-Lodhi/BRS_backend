import mysql from 'mysql2' ;
import dotenv from 'dotenv';
dotenv.config() 
 


var connection = mysql.createConnection({   
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE ,
    port: process.env.PORT, 
    ssl: {
        rejectUnauthorized: false, // This line allows self-signed certificates, remove it if you have a valid SSL certificate
      },

})   
 
var checkconn = ()=>{
    connection.connect((err)=>{
        if(err){
            console.log({err})
        }
        else{
            console.log("connected to database successfully")
        }
    })
}
export default connection;
export {checkconn};