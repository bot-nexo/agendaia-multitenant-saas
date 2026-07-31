export const paquetes = [
    { creditos: 100, monto: '$10 USD / $40,000 COP', nombre: 'Básico (100 Créditos)' },
    { creditos: 300, monto: '$25 USD / $100,000 COP', nombre: 'Pro (300 Créditos)' },
    { creditos: 1000, monto: '$70 USD / $280,000 COP', nombre: 'Enterprise (1,000 Créditos)' },
];

export const payment_methods = [
    { id: 'nequi', name: 'Nequi / Daviplata', icon: '📱' },
    { id: 'bancolombia', name: 'Bancolombia Ahorros', icon: '🏦' },
];



export const credits_data = {
    basic: 100,
    pro: 300,
    enterprise: 1000,
};

export const prices_data = {
    basic: 10,
    pro: 25,
    enterprise: 70,
};

export const planes_data = [
    { id: 'demo', name: 'Demo', price: 0, credits: 5, description: 'Plan de prueba por 7 dias con 5 créditos, 1 negocio' },
    { id: 'basic', name: 'Básico', price: 10, credits: 100, description: 'Plan básico para 1 negocio' },
    { id: 'pro', name: 'Pro', price: 25, credits: 300, description: 'Plan profesional para 3 negocios' },
    { id: 'enterprise', name: 'Enterprise', price: 70, credits: 1000, description: 'Plan empresarial para 10 negocios' },
];
