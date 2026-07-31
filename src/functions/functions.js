
export function normalizarWhatsApp(numeroInput) {
    if (!numeroInput) {
        return { valido: false, mensaje: "El número está vacío." };
    }

    // 1. Eliminar espacios, guiones, paréntesis y cualquier caracter que no sea un número o el signo '+'
    let limpio = numeroInput.toString().trim().replace(/[^\d+]/g, '');

    // 2. Si no empieza con '+', asumimos que es un número local de Colombia y le agregamos '+57'
    if (!limpio.startsWith('+')) {
        // Si el usuario ingresó '573113693226' sin el '+', lo corregimos
        if (limpio.startsWith('57') && limpio.length === 12) {
            limpio = '+' + limpio;
        } else {
            limpio = '+57' + limpio;
        }
    }

    // 3. Validación de longitud para WhatsApp en Colombia
    // El formato internacional para Colombia es +57 (código país) + 10 dígitos (ej: 3113693226)
    // Total de caracteres con el '+' incluido: 13 caracteres ('+' + '57' + 10 dígitos)
    const regexColombia = /^\+573\d{9}$/;

    if (regexColombia.test(limpio)) {
        return {
            valido: true,
            numeroNormalizado: limpio,
            mensaje: "Número válido."
        };
    } else {
        return {
            valido: false,
            numeroNormalizado: limpio,
            mensaje: "El número no es un celular de WhatsApp válido para Colombia (debe tener 10 dígitos después del +57 y empezar por 3)."
        };
    }
}

export function validarPassword(password) {
    if (password.length < 6) {
        return { valido: false, mensaje: "La contraseña debe tener al menos 6 caracteres." };
    }
    return { valido: true, passNormal: password, mensaje: "Contraseña válida." };
}
