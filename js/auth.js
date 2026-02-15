const SUPER_ADMIN = {
    user: 'laura.sandino',
    pass: 'laura123',
    nombre: 'Ing. Laura Sandino',
    rol: 'super',
    cargo: 'Directora Académica',
    redirect: 'super-admin.html'
};

function inicializarSuperAdmin() {
    const admins = JSON.parse(localStorage.getItem('administradores') || '[]');
    if (!admins.some(a => a.rol === 'super')) {
        admins.push({
            id: 1,
            nombre: SUPER_ADMIN.nombre,
            usuario: SUPER_ADMIN.user,
            password: SUPER_ADMIN.pass,
            rol: 'super',
            cargo: SUPER_ADMIN.cargo,
            activo: true,
            fechaRegistro: new Date().toISOString()
        });
        localStorage.setItem('administradores', JSON.stringify(admins));
    }
}
inicializarSuperAdmin();

function verificarSesion(roles = []) {
    const sesion = sessionStorage.getItem('usuario_activo');
    if (!sesion) { window.location.href = 'index.html'; return null; }
    const usuario = JSON.parse(sesion);
    if (roles.length && !roles.includes(usuario.rol)) { window.location.href = 'index.html'; return null; }
    return usuario;
}

function cerrarSesion(intervalos = []) {
    intervalos.forEach(i => i && clearInterval(i));
    sessionStorage.removeItem('usuario_activo');
    window.location.href = 'index.html';
}

function mostrarNotificacion(containerId, titulo, mensaje, tipo) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const id = Date.now();
    const notif = document.createElement('div');
    notif.className = `notificacion notificacion-${tipo}`;
    notif.id = `notif-${id}`;
    notif.innerHTML = `
        <div style="flex:1;"><strong>${titulo}</strong><p style="margin:4px 0 0; font-size:13px;">${mensaje}</p><small>${new Date().toLocaleTimeString()}</small></div>
        <button onclick="document.getElementById('notif-${id}').remove()" style="background:none; border:none; cursor:pointer;">✕</button>
    `;
    container.appendChild(notif);
    setTimeout(() => document.getElementById(`notif-${id}`)?.remove(), 5000);
}

function loginUsuario(username, password) {
    if (username === SUPER_ADMIN.user && password === SUPER_ADMIN.pass) {
        sessionStorage.setItem('usuario_activo', JSON.stringify({
            id: 1, nombre: SUPER_ADMIN.nombre, usuario: SUPER_ADMIN.user,
            rol: 'super', cargo: SUPER_ADMIN.cargo, fechaAcceso: new Date().toISOString()
        }));
        window.location.href = SUPER_ADMIN.redirect;
        return true;
    }
    
    const admins = JSON.parse(localStorage.getItem('administradores') || '[]');
    const admin = admins.find(a => a.usuario === username && a.password === password && a.activo);
    if (admin) {
        sessionStorage.setItem('usuario_activo', JSON.stringify({
            id: admin.id, nombre: admin.nombre, usuario: admin.usuario,
            rol: admin.rol, cargo: admin.cargo || 'Administrador', fechaAcceso: new Date().toISOString()
        }));
        admin.ultimoAcceso = new Date().toISOString();
        localStorage.setItem('administradores', JSON.stringify(admins));
        window.location.href = 'admin.html';
        return true;
    }
    
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const usuario = usuarios.find(u => u.usuario === username && u.password === password && u.activo);
    if (usuario) {
        sessionStorage.setItem('usuario_activo', JSON.stringify({
            id: usuario.id, nombre: usuario.nombre, usuario: usuario.usuario,
            rol: 'usuario', cargo: usuario.cargo || 'Usuario', fechaAcceso: new Date().toISOString()
        }));
        usuario.ultimoAcceso = new Date().toISOString();
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        window.location.href = 'usuario.html';
        return true;
    }
    
    return false;
}

function obtenerAdminsActivos() {
    return JSON.parse(localStorage.getItem('administradores') || '[]').filter(a => a.activo && a.rol === 'admin');
}

function obtenerTodosEnvios() {
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const admins = JSON.parse(localStorage.getItem('administradores') || '[]');
    let todos = [];
    usuarios.forEach(u => todos.push(...JSON.parse(localStorage.getItem(`envios_${u.usuario}`) || '[]')));
    admins.forEach(a => todos.push(...JSON.parse(localStorage.getItem(`envios_${a.usuario}`) || '[]')));
    todos.push(...JSON.parse(localStorage.getItem('envios_super') || '[]'));
    return todos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}