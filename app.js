import e from "express";
import mainRouter from './routes/index.js'
import { manejadorDeErrores } from "./middlewares/error.Handler.js";
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from "url";


// const corsOption = {
//     origin: 'http://localhost:5500/',
//     optionsSuccesStatus: 200
// }

const __dirfile = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirfile);
const ruta = path.join(__dirname, 'public'); // ruta lista absoluna 

const app = e();
const PORT = 3007;

app.use(e.static(ruta)); //Servimos la ruta public

app.use(e.json());
app.use(cors())

app.use('/api', mainRouter); //aquí en app.js, se llama a la ruta principal- 

app.use(manejadorDeErrores);

app.listen(PORT, ()=> {
    console.log(`localhost:${PORT}`)
})