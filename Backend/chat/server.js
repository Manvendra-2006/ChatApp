import 'dotenv/config'
import { connectDB } from './config/db.js';
import { server } from './config/socketIo.js';
import './app.js'
//server.js sirf socketIo.js se server import karta hai. 
// app.js ka code (cors, express.json(), routes) kabhi run hi nahi hota, 
// isliye Express app pe koi middleware ya route register nahi hua. Browser ka OPTIONS preflight request bina CORS headers ke 404 le leta hai, aur wahi preflight error hai.
connectDB()

server.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`)
})

// https://chatapp-r4tk.onrender.com => chat service
// https://chatapp-1-jo8j.onrender.com => mail service
// https://chatapp-2-xyrf.onrender.com = > user service 
// https://chatapp-3-s1ah.onrender.com => utilis service 