import mysql from 'mysql2' ;
import dotenv from 'dotenv';
dotenv.config() 
 

 
var connection = mysql.createConnection({   
    host: "brs-bikerentalsystem.aivencloud.com",
    user: "avnadmin",
    password: 'AVNS_Dx7Y59huxYYUyJD4ipH',
    database: 'brs' ,
    port: '23552', 
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