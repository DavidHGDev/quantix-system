// js/utils/auth.js

export const verificarAutenticacion = () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html'; // Redirige al login
        return null;
    }
    return token;
};

export const cerrarSesion = () => {
    sessionStorage.removeItem('token');
    window.location.href = '/index.html';
};