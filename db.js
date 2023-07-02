import mysql from 'mysql2' ;
var connection = mysql.createConnection({
    host:'localhost',
    user:'Daniyal Lodhi',
    password:'daniyal123',
    database: 'brs'
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