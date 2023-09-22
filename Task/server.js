const express = require("express")
const app = express()

require('dotenv').config()

const validation = require('./middlewares/validate');
const userRouter = require('./routes/user')


app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.all('/api/*', [validation]);

app.use("/api/v1", userRouter)

const PORT = process.env.PORT || 3002

app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}....`)
})