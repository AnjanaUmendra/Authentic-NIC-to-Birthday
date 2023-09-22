
const pool = require("../database/dbConnection")
const jwt = require('jwt-simple');
const md5 = require('md5');

const userController = {

    // Controller method for user login
    login: async (req, res) => {          

        try {

            const { email, password } = req.body;

            if (email && password) {

                const [user] = await pool.query("SELECT id, name, nic, email, status FROM users WHERE status=1 AND email = ? AND password = ?", [email, md5(password)]);

                if (user.length > 0) {

                    const date = new Date();
                    const expireDate = date.setDate(date.getDate() + 1);

                    const token = jwt.encode({
                        exp: expireDate,
                        userId: user[0].id
                    }, process.env.AUTH_SECRET);

                    // Add the generated token to the user object
                    user[0].token = token;

                    return res.json({
                        success: true,
                        message: "Login successful",
                        user: user[0],
                    });

                } else {

                    return res.status(401).json({
                        success: false,
                        message: "Invalid email or password",
                    });
                }
            }
        } catch (error) {
            console.error("Error during login:", error);
            return res.status(500).json({
                error: "Internal server error",

            });
        }
    },

    // Controller method for user registration
    register: async (req, res) => {
        try {
            const { nic, name, email, password } = req.body;

            // Check if required fields are provided
            if (!nic || !name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "ID Number ,Name, email, and password are required fields."
                });
            }

            // Check if a user with the provided email already exists
            const [alreadyExitEmailUser] = await pool.query("SELECT * FROM users WHERE status=1 AND email = ?", [email]);
            if (alreadyExitEmailUser.length > 0) {
                return res.status(401).json({
                    success: false,
                    message: "Already exit user",
                });
            }

            // Check if a user with the provided NIC number already exists
            const [alreadyExitNicUser] = await pool.query("SELECT nic FROM users WHERE status=1 AND nic = ?", [nic]);
            if (alreadyExitNicUser.length > 0) {
                return res.status(401).json({
                    success: false,
                    message: "Already exit user",
                });
            }

            const sql = "INSERT INTO users (nic, name, email, password) VALUES (?, ?, ?, ?)";
            const [user] = await pool.query(sql, [nic, name, email, md5(password)]);

            return res.json({
                success: true,
                message: "User has registered successfully.",
                data: user
            });
        } catch (error) {
            console.error("Error during registration:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error."
            });
        }
    },


    // Controller method for generating birthday and gender information based on NIC number
    genAndBirthday: async (req, res) => {

        try {

            const { nicNumber } = req.body;
            const userId = req.userId;

            const [user] = await pool.query("SELECT nic FROM users WHERE status=1 AND id = ? ", [userId]);
            console.log(user[0].nic)

            if (user.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid user",
                });
            }

            if (user[0].nic !== nicNumber) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid nic number",
                });
            }

            if (user[0].nic.length > 0 || user[0].nic.length < 11) {

                const convertedBirthDay = await birthdayAndGenderConvert(user[0].nic);

                return res.json({
                    success: true,
                    message: "NIC number has converted successfully.",
                    data: convertedBirthDay,
                    
                });
            } else {

                return res.status(401).json({
                    success: false,
                    message: "Invalid user",
                });
            }
        } catch (error) {

            console.error("Error during Converting:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error."

            });
        }

    }

}

module.exports = userController;

// Function to convert NIC number to birthday and gender
async function birthdayAndGenderConvert(NICNo) {

    // Clear Existing Details
    let error = "";
    let gender = "";
    let dob = "";
    let age = "";

    var dayText = 0;
    var year = "";
    var month = "";
    var day = "";

    if (NICNo.length != 10 && NICNo.length != 12) {
        error = "Invalid NIC NO";
    } else if (NICNo.length == 10 && !/^\d+$/.test(NICNo.substr(0, 9))) {
        error = "Invalid NIC NO";
    } else {
        // Year
        if (NICNo.length == 10) {
            year = "19" + NICNo.substr(0, 2);
            dayText = parseInt(NICNo.substr(2, 3));
        } else {
            year = NICNo.substr(0, 4);
            dayText = parseInt(NICNo.substr(4, 3));
        }

        // Gender
        if (dayText > 500) {
            gender = "Female";
            dayText = dayText - 500;
        } else {
            gender = "Male";
        }

        // Day Digit Validation
        if (dayText < 1 || dayText > 366) {
            error = "Invalid NIC NO";
        } else {
            // Month
            var monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            if (dayText > 335) {
                day = dayText - 335;
                month = "December";
            } else {
                for (var i = 0; i < 12; i++) {
                    if (dayText <= (i + 1) * 31) {
                        month = monthNames[i];
                        day = dayText - (i * 31);
                        break;
                    }
                }
            }

            dob = year + "-" + month + "-" + day;

            // Age
            var today = new Date();
            var birthday = new Date(dob);
            var ageInMilliseconds = today - birthday;
            var ageInYears = ageInMilliseconds / (365 * 24 * 3600 * 1000);
            age = "You are " + Math.floor(ageInYears) + " years old.";
        }
    }

    console.log("Error: " + error);
    console.log("Gender: " + gender);
    console.log("Date of Birth: " + dob);
    console.log("Age: " + age);

    // Return an object containing the details
    return {
        error,
        gender,
        dob,
        age
    };
}