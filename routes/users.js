import conn from '../db.js';
import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fetchuser from '../middleware/fetchuser.js';
import nodemailer from 'nodemailer';
const router = express.Router();
import dotenv from 'dotenv';
dotenv.config()

// Route 1 : Show all users for staff/admin
router.get('/displayallusers', async (req, res) => {
    try {

        // selecting all users
        conn.query('select * from Customer', (error, rows) => {
            if (error) {
                res.status(500).json({ error })
            }
            else if (rows.length <= 0) {
                res.status(200).send('there are no customers registered')
            }
            else {
                res.status(200).json({ rows })
            }
        })
    } catch (error) {
        res.status(500).json({ error })
    }
})

// Route 2 : User signup (No login required) 
router.post('/signup', [

    // validation before posting in db
    body('cnic', 'the minimum length for cnic is letters').isLength({ min: 13 }),
    body('firstName', 'the minimum length for name is 1 letters').isLength({ min: 1 }),
    body('lastName', 'the minimum length for name is 3 letters').isLength({ min: 3 }),
    body('email',).isEmail(),
    body('password', 'the minimum length for password is 8 letters').isLength({ min: 8 }),
    body('country', 'the minimum length for name is 3 letters'),
    body('city', 'the minimum length for name is 3 letters'),
    body('street', 'the minimum length for name is 3 letters'),
    body('postalCode', 'the minimum length for name is 3 letters').isLength({ min: 5 }),
    body('phoneNumber1', 'the minimum length for name is 10 letters').isLength({ min: 10 }),
    body('phoneNumber2', 'the minimum length for name is 10 letters')

], async (req, res) => {
    const ValErrors = validationResult(req)
    var success = false;
    if (!ValErrors.isEmpty()) {

        return res.status(400).json({ ValErrors: ValErrors.array(), success })
    }
    try {

        // checking if email is already registered
        conn.query('select email from customer where email = ?', req.body.email, async (err, rows) => {
            if (err) {
                return res.status(500).json({ err, success })
            }
            else if (rows.length > 0) {
                return res.status(400).json({ message: "Email is already registered", success })
            }
            else {

                // encrypting password for security
                var salt = await bcrypt.genSalt(10);
                const hashedpassword = await bcrypt.hash(req.body.password, salt)

                const SignupUserData = {
                    cnic: req.body.cnic,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: hashedpassword,
                    country: req.body.country,
                    city: req.body.city,
                    street: req.body.street,
                    postalCode: req.body.postalCode,
                    phoneNumber1: req.body.phoneNumber1,
                    phoneNumber2: req.body.phoneNumber2
                }

                // inserting the data into the db 
                conn.query('INSERT INTO customer SET ?', SignupUserData, (errors) => {


                    if (errors) {

                        // checking if cnic is already registered
                        if (errors.errno === 1062) {
                            res.status(400).json({ messsage: "cnic is already registered", success })
                        }
                        else {
                            res.json({ errors, success })
                        }
                    }
                    else {
                        try {
                            // fetching customer cnic for authtoken
                            conn.query("select cnic FROM customer where email = ?", req.body.email, (err, rows) => {
                                if (err) {
                                    return res.json({ err })
                                }
                                else {
                                    const data = {
                                        customer: {
                                            cnic: rows[0].cnic
                                        }
                                    }
                                    //  making authToken
                                    var authToken = jwt.sign(data, process.env.SECRET)
                                    success = true
                                    res.json({ authToken, success })
                                }
                            }
                            )
                        } catch (error) {
                            res.json({ error })
                        }
                    }
                })
            }
        })
    } catch (errors) {
        res.send(errors)
    }
}
)

// Route 3 : User Login (No login required) 

router.post('/login', [
    body('cnic'),
    body('email').isEmail(),
    body('password')
], async (req, res) => {
    var success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(200).json({ errors, success })
    }
    try {
        conn.query('SELECT cnic,password from customer where email = ?', req.body.email, async (error, rows) => {
            if (error) {
                return res.status(500).json({ error, message: "db hoosst kroo" })
            }
            else {
                // checking if email is registered
                if (await rows.length <= 0) {
                    res.status(400).json({ message: 'please login using correct credentials', success })
                }
                else {
                    // destructuring from rows
                    const { cnic, password } = rows[0];

                    // comparing with the hashed password
                    const passCompare = await bcrypt.compare(req.body.password, password)


                    if (!passCompare) {
                        res.status(400).json({ message: 'please login using correct credentials', success })
                    }
                    else if (req.body.cnic != cnic) {
                        res.status(400).json({ message: 'please login using correct credentials', success })
                    }
                    else {
                        const data = {
                            customer: {
                                cnic: cnic
                            }
                        }
                        const authToken = jwt.sign(data, process.env.SECRET);
                        success = true;
                        res.json({ authToken, success })
                    }
                }
            }
        })
    } catch (error) {
        res.status(500).send('internal server error')
    }
})

// Route 4 : Fetch user detail  ( !! login required) 
router.get('/userinfo', fetchuser, async (req, res) => {
    var success = false;
    const cnic = req.customer.cnic;

    // fetching all except for password
    conn.query('SELECT *, NULL AS password FROM customer WHERE cnic = ?', cnic, async (error, rows) => {
        if (error) {
            return res.status(500).json({ error, success })
        }
        try {
            success = true;
            res.status(200).json({ rows: rows[0], success })
        } catch (error) {
            success = false;
            res.status(500).json({ error, success })
        }
    })
})



// Route 5: Rent vehicle (!! login required)
router.post('/rentvehicle', fetchuser, [
    body("bikeName").isString(),
    body("rentalenddate"),
    body("cardnumber", "invalid cardnumber length").isLength(12),
    body("pin", "invalid cardnumber length").isLength(4)
], async (req, res) => {
    var success = false;
    const valerrors = validationResult(req);
    if (!valerrors.isEmpty()) {
        return res.status(400).json({ valerrors, success })
    }
    try {

        // User id
        const { cnic } = req.customer

        // fetching  bikeNo,rentalprice of vehicle to be rented by user w.r.t name
        conn.query('select bikeNo,rentalPrice,availability from bikes where bikeName = ?', req.body.bikeName, (error, rows) => {
            if (error) {
                return res.status(500).json({ error, success })
            }
            var BikeId = rows[0].bikeNo;
            var Bikerentperhr = rows[0].rentalPrice;
            var Bikeavailability = rows[0].availability;


            // checking if the user has a current rental if yes then deny rental req
            conn.query('select customerCnic from rental where customerCnic = ?', cnic, (error, rows) => {
                if (error) {
                    return res.status(500).json({ error, success })
                }
                else if (Bikeavailability === "no") {
                    res.status(400).json({ success, message: "This bike is currently not available" })
                }

                else if (rows.length > 0) {
                    res.status(400).json({ success, message: "You have already rented a vehicle, Can not rent more than one vehcile" })
                }
                else if (rows.length <= 0) {
                    var enddatetime = new Date(req.body.rentalenddate);
                    var startdatetime = new Date();
                    var rentalperiod = enddatetime - startdatetime;
                    var rentalPeriodInHr = (rentalperiod / 3600000)
                    var rentprice = rentalPeriodInHr * Bikerentperhr;


                    const rentaldata = {
                        customercnic: req.customer.cnic,
                        bikeNo: BikeId,
                        rentEndDate: req.body.rentalenddate,
                        totalprice: rentprice
                    }

                    //    adding the person cnic to rental who requested for rent in user table
                    conn.query('INSERT INTO rental set ?', rentaldata, (error) => {
                        if (error) {
                            return res.status(500).json({ success, error })
                        }
                        else {
                            // adding the payments in db
                            var paymentInfo = {
                                customercnic: req.customer.cnic,
                                totalamount: rentaldata.totalprice,
                            }
                            conn.query('INSERT into payment set ?', paymentInfo, (error) => {
                                if (error) {
                                    return res.status(500).json({ error, success })
                                }
                                else {
                                    conn.query("update bikes set availability = 'no' where bikeno = ?", BikeId, (error) => {
                                        if (error) {
                                            return res.status(500).json({ success, error })
                                        }
                                        else {
                                            success = true;
                                            res.status(200).json({ success, message: "Vehicle rented successfully", rentaldata, paymentInfo, rentalPeriodInHr })
                                        }
                                    })
                                }
                            })
                        }
                    })



                }
            })
        })


    } catch (error) {
        res.status(500).json({ error })
    }
})

// Route 6: cancel Rent (!! login required)

router.post('/cancelrent', fetchuser, (req, res) => {
    try {
        var success = false;
        // checking if customer has ongoing rental
        conn.query('SELECT customercnic from rental where customercnic = ?', req.customer.cnic, (error, rows) => {

            if (error) {
                res.status(500).json({ error, success })
            }
            else {
                // customer has not any ongoing rental
                if (rows.length <= 0) {
                    res.status(400).json({ success, message: 'you do not have any ongoing rental' })
                }
                else {
                    // rent cancelation
                    conn.query('delete from rental where customercnic = ?', req.customer.cnic, (error) => {
                        if (error) {
                            res.status(500).json({ error, success })
                        }
                        else {
                            conn.query("update bikes set availability = 'yes' where bikeno = 125 ;", (error) => {
                                if (error) {
                                    return res.status(500).json({ success, error })
                                }
                                else {
                                    success = true;
                                    res.status(200).json({ success, message: "Rental cancel successfully" })
                                }
                            })
                        }
                    })
                }
            }
        })


    } catch (error) {
        res.status(500).json({ error })

    }
})
// Route 7: Add review (!! login required)

router.post('/addreview', fetchuser, (req, res) => {
    var success = false;
    try {
        conn.query('select firstname,lastname from customer where cnic = ?', req.customer.cnic, (error, rows) => {
            if (error) {
                return res.status(500).json({ success, error })
            }
            else {
                const { firstname, lastname } = rows[0]
                // setting review data
                const reviewInfo = {
                    customercnic: req.customer.cnic,
                    customerName: firstname + lastname,
                    description: req.body.description
                }

                conn.query('insert into reviews set ?', reviewInfo, (error) => {
                    if (error) {
                        return res.status(500).json({ success, error })
                    }
                    else {
                        success = true;
                        res.status(200).json({ success, message: "review added successfully" })
                    }
                })
            }
        })

    } catch (error) {
        res.status(500).json({ error })
    }
})
// Route 8 fetch all avaliable bikes
router.get('/fetchavailablebikes', (req, res) => {
    var success = false;
    try {
        conn.query("select * from bikes where availability = 'yes'", (error, rows) => {
            if (error) {
                res.status(500).json({ error })
            }
            else {
                success = true;
                res.status(200).json({ success, rows })
            }
        })
    } catch (error) {
        success = false;
        res.status(500).json({ success, error })
    }
})

// Route 9 search bike by bike number 
router.get('/getbike/:bikeref', async (req, res) => {
    var success = false;
    const bikeref = req.params.bikeref;
    try {
        conn.query("SELECT * from bikes where bikeNo = ? or bikeName = ?", [bikeref, bikeref], async (error, rows) => {
            if (error) {
                res.status(500).json({ success, error })
            }
            else if (rows.length <= 0) {
                res.status(200).json({ messsage: "No bike to display" })
            }
            else {
                success = true;
                res.status(200).json({ rows })
            }
        })
    } catch (error) {
        success = false;
        res.status(500).json({ success, error })
    }
})

// Route 10 Email us 
router.post('/emailus', async (req, res) => {
    var success = true;
    const { name, emailaddress, subject, description } = req.body;
    const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL, 
            pass: process.env.PASS
        }
    });

    const mailOptions = {
        from: {
            name: name || null,
            address: emailaddress,
        },
        to: "daniyal22904@gmail.com",
        subject: "hey",
        text: description,
    };
    const sendEmail = async (transporter, mailOptions) => {
        try {
            await transporter.sendMail(mailOptions);
            res.status(200).json({ success, message: "email has been sent" })
        } catch (error) {
            success = false;
            res.status(500).json({ success, error })
        }
    }
 
    sendEmail(transporter, mailOptions)

})
// Route 11 get rental data
router.get('/getrental',fetchuser, async (req, res) => {
    try {
        var success = false;
        conn.query("select * from rental where customerCnic = ?", req.customer.cnic, (error, rows) => {
            if (error) {
                res.status(500).json({ success, error:"hello1"})
            }

            else if (rows.length <= 0) {
                success = true;
                res.status(200).json({ success, message: "you dont have any ongoing rental" })

            }
            else {
                success = true;
                res.status(200).json({ success, rows})
            }
        })
    } catch (error) {
        success = false;
        res.status(500).json({ success, error :"hej"})
    }
})






export default router;