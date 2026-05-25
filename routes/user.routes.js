import e from "express";
import { getUsers, getOneUser, createUser, updateUser, deleteUser, searchUsers } from "../controllers/user.controllers.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { verficarRoles, verificarMismoUsuarioOadmin } from "../middlewares/verificarRoles.js";
import { validarSchema } from "../middlewares/validator.handler.js";
import { createUserSchema, updateUserSchema, idParamSchema } from "../schemas/user.schema.js";
import { PERMISOS } from "../config/roles.js";


const router = e.Router();

router.get('/',
    verificarToken, 
    verficarRoles(PERMISOS.LEER_USUARIOS), 
    getUsers);

router.get('/search', verificarToken, verficarRoles('ADMIN'), searchUsers);

router.get('/:id',
    verificarToken,
    verificarMismoUsuarioOadmin,
    validarSchema(idParamSchema, 'params'),
    getOneUser);
router.post('/', 
    //verificarToken,
    //verficarRoles(PERMISOS.ESCRIBIR_USUARIOS),
    validarSchema(createUserSchema, 'body'),
    createUser);
router.patch('/:id', 
    verificarToken,
    verificarMismoUsuarioOadmin,
    validarSchema(idParamSchema, 'params'),
    validarSchema(updateUserSchema, 'body'),
    updateUser);
router.delete('/:id', 
    verificarToken,
    verficarRoles(PERMISOS.ELIMINAR_USUARIOS),
    validarSchema(idParamSchema, 'params'),
    deleteUser);

export default router; // aquí exporto con la arquitectura de express, mini-ruta