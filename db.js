import mysql from 'mysql2' ;
var connection = mysql.createConnection({
    host:'daniyalazure1.mysql.database.azure.com',
    user:'daniyallodhi',
    password:'SE-21041',
    database: 'brs' ,
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