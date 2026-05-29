import { env } from "./env.js"
const data = {
        name: "David", 
        lastName: 'Hernandez',
        email: 'quantix3@gmail.com',
        password: `${env.PASSWORD}`,
        role: 'ADMIN'
    }

const url = 'http://localhost:3007/api/users'
async function crearAdmin() {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' //header para indicar que envió un json
        }, 
        body: JSON.stringify(data) // convierte el objeto a un json
    })

    if(!response.ok){
        throw new Error('Error al crear el usuario')
    }

    const resultado = await response.json();
    console.log(`User creado con éxito ${JSON.stringify(resultado, null, 2)}`)
}

crearAdmin()