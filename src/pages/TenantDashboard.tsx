import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RecargaModal } from '../components/RecargaModal';
import {
  Cita,
  Servicio,
  Empleado,
  Cliente,
  Chat,
  Mensaje,
  ListaBlancaBot,
  Negocio
} from '../types';
import {
  Calendar as CalendarIcon,
  Users,
  Scissors,
  MessageSquare,
  Settings,
  Coins,
  Bot,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Send,
  Sparkles,
  Phone,
  Trash2,
  UserPlus,
  Zap,
  ShieldCheck,
  Building2,
  Check,
  UserCheck,
  Filter,
  DollarSign,
  TrendingUp,
  BarChart3,
  Lock,
  Eye,
  ShieldAlert,
  User
} from 'lucide-react';

export const TenantDashboard: React.FC = () => {
  const { user, negocio, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'citas' | 'servicios' | 'finanzas' | 'clientes' | 'chat' | 'config'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [summary, setSummary] = useState<any>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  // FUTURA IMPLEMENTACIÓN (v2) - Estado de empleados/profesionales, desactivado en v1.
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  // En v1 no hay filtro por empleado; siempre se muestra el consolidado del negocio.
  const [selectedEmpleadoFilter, setSelectedEmpleadoFilter] = useState<string>('todos');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [listaBlanca, setListaBlanca] = useState<ListaBlancaBot[]>([]);
  const [config, setConfig] = useState<Negocio | null>(null);

  // Form & Interaction States
  const [citaFilter, setCitaFilter] = useState<string>('todos');
  const [agentInput, setAgentInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [searchClientTerm, setSearchClientTerm] = useState('');
  const [subTabService, setSubTabService] = useState<'servicios' | 'empleados'>('servicios');

  // Modals
  const [showCitaModal, setShowCitaModal] = useState(false);
  const [showServicioModal, setShowServicioModal] = useState(false);
  const [showEmpleadoModal, setShowEmpleadoModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showListaBlancaModal, setShowListaBlancaModal] = useState(false);
  const [showRecargaModal, setShowRecargaModal] = useState(false);

  // Form Fields
  const [newCita, setNewCita] = useState({
    id_cliente: '',
    id_servicio: '',
    id_empleado: '',
    fecha_hora_inicio: new Date().toISOString().slice(0, 16),
  });

  const [newServicio, setNewServicio] = useState({
    nombre: '',
    duracion_minutos: 30,
    precio: 20,
    id_empleado: '',
  });

  const [newEmpleado, setNewEmpleado] = useState({
    nombre: '',
    activo: true,
  });

  const [newCliente, setNewCliente] = useState({
    nombre: '',
    telefono: '',
  });

  const [newListaBlanca, setNewListaBlanca] = useState({
    nombre: '',
    telefono: '',
  });

  const [promptInput, setPromptInput] = useState('');
  const [testBotOutput, setTestBotOutput] = useState('');
  const [testingAi, setTestingAi] = useState(false);

  const loadTenantData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, citasData, srvData, empData, cliData, chatsData, configData] = await Promise.all([
        api.tenant.getDashboardSummary(),
        api.tenant.getCitas(),
        api.tenant.getServicios(),
        api.tenant.getEmpleados(),
        api.tenant.getClientes(),
        api.tenant.getChats(),
        api.tenant.getConfiguracion(),
      ]);

      setSummary(sumData);
      setCitas(citasData);
      setServicios(srvData);
      setEmpleados(empData); // empData será siempre [] en v1

      // FUTURA IMPLEMENTACIÓN (v2) - Asignación automática de filtro para colaboradores (rol: personal).
      // En v1 no hay colaboradores, cada negocio es operado por su único usuario propietario.
      // if (user?.rol === 'personal' && empData.length > 0) {
      //   const matched = empData.find((e: Empleado) =>
      //     e.nombre.toLowerCase().includes(user.nombre_completo.toLowerCase()) ||
      //     user.nombre_completo.toLowerCase().includes(e.nombre.toLowerCase())
      //   ) || empData[0];
      //   if (matched) { setSelectedEmpleadoFilter(matched.id_empleado); }
      // }

      setClientes(cliData);
      setChats(chatsData);
      if (chatsData.length > 0 && !activeChatId) {
        setActiveChatId(chatsData[0].id_chat);
      }
      setConfig(configData.negocio);
      setPromptInput(configData.negocio.prompt_personalidad);
      setListaBlanca(configData.listaBlanca);
    } catch (err: any) {
      setError(err.message || 'Error cargando datos del negocio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenantData();
  }, [negocio?.id_negocio]);

  // Load chat messages when activeChatId changes
  useEffect(() => {
    if (activeChatId) {
      api.tenant.getMensajes(activeChatId).then((data) => {
        setMensajes(data);
      }).catch(console.error);
    }
  }, [activeChatId]);

  const handleCreateCita = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.tenant.createCita(newCita);
      setShowCitaModal(false);
      setNewCita({
        id_cliente: '',
        id_servicio: '',
        id_empleado: '',
        fecha_hora_inicio: new Date().toISOString().slice(0, 16),
      });
      await loadTenantData();
    } catch (err: any) {
      alert('Error creando cita: ' + err.message);
    }
  };

  const handleUpdateCitaStatus = async (id_cita: string, estado: string) => {
    try {
      await api.tenant.updateEstadoCita(id_cita, estado);
      await loadTenantData();
    } catch (err: any) {
      alert('Error cambiando estado: ' + err.message);
    }
  };

  const handleCreateServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.tenant.createServicio(newServicio);
      setShowServicioModal(false);
      setNewServicio({ nombre: '', duracion_minutos: 30, precio: 20, id_empleado: '' });
      await loadTenantData();
    } catch (err: any) {
      alert('Error creando servicio: ' + err.message);
    }
  };

  const handleDeleteServicio = async (id_servicio: string) => {
    if (!confirm('¿Desea eliminar este servicio?')) return;
    try {
      await api.tenant.deleteServicio(id_servicio);
      await loadTenantData();
    } catch (err: any) {
      alert('Error eliminando servicio: ' + err.message);
    }
  };

  const handleCreateEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.tenant.createEmpleado(newEmpleado);
      setShowEmpleadoModal(false);
      setNewEmpleado({ nombre: '', activo: true });
      await loadTenantData();
    } catch (err: any) {
      alert('Error creando empleado: ' + err.message);
    }
  };

  const handleDeleteEmpleado = async (id_empleado: string) => {
    if (!confirm('¿Desea eliminar este empleado?')) return;
    try {
      await api.tenant.deleteEmpleado(id_empleado);
      await loadTenantData();
    } catch (err: any) {
      alert('Error eliminando empleado: ' + err.message);
    }
  };

  const handleCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.tenant.createCliente(newCliente);
      setShowClienteModal(false);
      setNewCliente({ nombre: '', telefono: '' });
      await loadTenantData();
    } catch (err: any) {
      alert('Error agregando cliente: ' + err.message);
    }
  };

  const handleToggleBot = async (id_chat: string, currentBotState: boolean) => {
    try {
      await api.tenant.toggleBot(id_chat, !currentBotState);
      await loadTenantData();
    } catch (err: any) {
      alert('Error alterando estado del bot: ' + err.message);
    }
  };

  const handleSendAgentMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || !agentInput.trim()) return;
    try {
      const msg = await api.tenant.sendMensajeAgent(activeChatId, agentInput);
      setMensajes((prev) => [...prev, msg]);
      setAgentInput('');
      await loadTenantData();
    } catch (err: any) {
      alert('Error enviando mensaje: ' + err.message);
    }
  };

  const handleTriggerAiBot = async () => {
    if (!activeChatId) return;
    setAiLoading(true);
    try {
      const res = await api.tenant.triggerAiBotReply(activeChatId);
      setMensajes((prev) => [...prev, res.mensaje]);
      await refreshUser();
      await loadTenantData();
    } catch (err: any) {
      alert('Error en Bot de IA: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.tenant.updateConfiguracion({
        prompt_personalidad: promptInput,
        telefono_whatsapp: config?.telefono_whatsapp,
        nombre_comercial: config?.nombre_comercial,
      });
      alert('¡Configuración de personalidad del Bot actualizada!');
      await refreshUser();
      await loadTenantData();
    } catch (err: any) {
      alert('Error guardando configuración: ' + err.message);
    }
  };

  const handleAddListaBlanca = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.tenant.createListaBlancaItem(newListaBlanca.nombre, newListaBlanca.telefono);
      setShowListaBlancaModal(false);
      setNewListaBlanca({ nombre: '', telefono: '' });
      await loadTenantData();
    } catch (err: any) {
      alert('Error agregando a lista blanca: ' + err.message);
    }
  };

  const handleDeleteListaBlanca = async (id: string) => {
    try {
      await api.tenant.deleteListaBlancaItem(id);
      await loadTenantData();
    } catch (err: any) {
      alert('Error eliminando de lista blanca: ' + err.message);
    }
  };

  // FUTURA IMPLEMENTACIÓN (v2) - En v1 no existe el rol 'personal'.
  // Cada negocio tiene un único usuario (el dueño) con rol 'admin'.
  // isStaffUser siempre es false en v1.
  const isStaffUser = false; // user?.rol === 'personal';

  // FUTURA IMPLEMENTACIÓN (v2) - Selección de empleado activo para filtros.
  const activeEmpObj = empleados.find((e) => e.id_empleado === selectedEmpleadoFilter);
  const currentEmpName = activeEmpObj?.nombre || 'Consolidado General';

  // 1. Effective Citas - En v1 siempre se muestran todas las citas del negocio.
  const effectiveCitas = citas;
  // FUTURA IMPLEMENTACIÓN (v2) - Filtro por empleado:
  // const effectiveCitas = (selectedEmpleadoFilter === 'todos')
  //   ? citas
  //   : citas.filter((c) => c.id_empleado === selectedEmpleadoFilter);

  const filteredCitas = effectiveCitas.filter((c) => {
    if (citaFilter === 'todos') return true;
    return c.estado === citaFilter;
  });

  // 2. Effective Clients - En v1 siempre se muestran todos los clientes del negocio.
  const effectiveClientesBase = clientes;
  // FUTURA IMPLEMENTACIÓN (v2) - Filtro por empleado:
  // const effectiveClientesBase = (selectedEmpleadoFilter === 'todos')
  //   ? clientes
  //   : clientes.filter((cl) => effectiveCitas.some((c) => c.id_cliente === cl.id_cliente));

  const filteredClientes = effectiveClientesBase.filter(
    (cl) =>
      cl.nombre.toLowerCase().includes(searchClientTerm.toLowerCase()) ||
      cl.telefono.includes(searchClientTerm)
  );

  // 3. Effective Chats - En v1 siempre se muestran todos los chats del negocio.
  const effectiveChats = chats;
  // FUTURA IMPLEMENTACIÓN (v2) - Filtro por empleado:
  // const effectiveChats = (selectedEmpleadoFilter === 'todos')
  //   ? chats
  //   : chats.filter((ch) => effectiveCitas.some((c) => c.id_cliente === ch.id_cliente));

  const activeChat = effectiveChats.find((ch) => ch.id_chat === activeChatId) || (effectiveChats.length > 0 ? effectiveChats[0] : null);

  // 4. Effective Overview Metrics
  const nowCalc = new Date();
  const startOfToday = new Date(nowCalc.getFullYear(), nowCalc.getMonth(), nowCalc.getDate()).getTime();
  const endOfToday = startOfToday + 86400000;

  const effectiveCitasHoyList = effectiveCitas.filter((c) => {
    const t = new Date(c.fecha_hora_inicio).getTime();
    return t >= startOfToday && t < endOfToday;
  });

  const effectiveCitasPendientesCount = effectiveCitas.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmado').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 space-y-6 flex-shrink-0">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center space-x-3">
            <img
              src={negocio?.logo_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150'}
              alt="Logo"
              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-slate-900 truncate">{negocio?.nombre_comercial}</p>
              <span className="text-[11px] text-amber-700 font-semibold flex items-center space-x-1">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>{negocio?.saldo_creditos} Créditos</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowRecargaModal(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition shadow-2xs flex items-center justify-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Recargar Créditos</span>
          </button>
        </div>

        <nav className="flex md:flex-col space-x-1 md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0 text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Resumen General</span>
          </button>

          <button
            onClick={() => setActiveTab('citas')}
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'citas' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Gestión de Citas</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'chat' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Bandeja WhatsApp / AI</span>
          </button>

          <button
            onClick={() => setActiveTab('servicios')}
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'servicios' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Catálogo de Servicios</span>
          </button>

          <button
            onClick={() => setActiveTab('finanzas')}
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'finanzas' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Rendimiento & Finanzas</span>
          </button>

          <button
            onClick={() => setActiveTab('clientes')}
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'clientes' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Directorio Clientes</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'config' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Config Bot & WhatsApp</span>
          </button>
        </nav>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* User Profile Header - V1: Solo Administrador por negocio */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200 text-base">
              {user?.nombre_completo?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-sm">{user?.nombre_completo}</span>
                {/* V1: Solo existe el rol de Administrador por negocio */}
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border border-indigo-200">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Administrador Negocio</span>
                </span>
                {/* FUTURA IMPLEMENTACIÓN (v2) - Badge para Colaboradores con rol 'personal':
                {isStaffUser ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border border-emerald-200">
                    <User className="w-3 h-3" />
                    <span>Empleado / Colaborador</span>
                  </span>
                ) : (
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border border-indigo-200">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Administrador Negocio</span>
                  </span>
                )} */}
              </div>
              <p className="text-xs text-slate-500">{user?.correo} • {negocio?.nombre_comercial}</p>
            </div>
          </div>

          {/* FUTURA IMPLEMENTACIÓN (v2) - Selector de Filtro de Agenda por Empleado/Colaborador.
          En v1 no hay múltiples profesionales, se muestra el consolidado completo del negocio.
          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-600 font-semibold px-1.5 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Filtro de Agenda:</span>
            </span>
            <select
              value={selectedEmpleadoFilter}
              onChange={(e) => setSelectedEmpleadoFilter(e.target.value)}
              disabled={isStaffUser}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {!isStaffUser && <option value="todos">🏢 Consolidado Negocio (Todos)</option>}
              {empleados.map((emp) => (
                <option key={emp.id_empleado} value={emp.id_empleado}>
                  👤 Colaborador: {emp.nombre}
                </option>
              ))}
            </select>
          </div> */}
        </div>

        {/* Alerts & Warnings */}
        {negocio?.estado_suscripcion === 'VENCIDO_GRACIA' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-amber-800 text-sm shadow-xs">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <span>
                <strong>Atención:</strong> Su suscripción se encuentra en período de gracia. Por favor regularice su pago para evitar suspensión.
              </span>
            </div>
          </div>
        )}

        {negocio?.saldo_creditos !== undefined && negocio.saldo_creditos < 20 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-rose-800 text-sm shadow-xs gap-3">
            <div className="flex items-center space-x-3">
              <Coins className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>
                <strong>Alerta de Créditos Bajos:</strong> Le quedan solo {negocio.saldo_creditos} créditos. El bot de WhatsApp dejará de responder al llegar a 0.
              </span>
            </div>
            <button
              onClick={() => setShowRecargaModal(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-2xs whitespace-nowrap transition"
            >
              Recargar Ahora
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Panel Principal del Negocio</h2>
                <p className="text-sm text-slate-500">
                  {selectedEmpleadoFilter === 'todos'
                    ? `Resumen operativo consolidado para ${negocio?.nombre_comercial}`
                    : `Vista individual de la agenda para: ${currentEmpName}`}
                </p>
              </div>
              <button
                onClick={() => {
                  if (isStaffUser && selectedEmpleadoFilter) {
                    setNewCita((prev) => ({ ...prev, id_empleado: selectedEmpleadoFilter }));
                  }
                  setShowCitaModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center space-x-2 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Agendar Cita</span>
              </button>
            </div>

            {/* Employee Filter Context Banner */}
            {selectedEmpleadoFilter !== 'todos' && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between text-indigo-900 text-xs">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>
                    Mostrando indicadores e información exclusiva de: <strong>{currentEmpName}</strong>
                  </span>
                </div>
                {!isStaffUser && (
                  <button
                    onClick={() => setSelectedEmpleadoFilter('todos')}
                    className="font-bold text-indigo-700 hover:underline"
                  >
                    Ver Todo el Negocio →
                  </button>
                )}
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-slate-500">Citas para Hoy</span>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold text-slate-900">{effectiveCitasHoyList.length}</span>
                  <CalendarIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-[11px] text-slate-500">Programadas para hoy</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-slate-500">Citas Pendientes</span>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold text-amber-600">{effectiveCitasPendientesCount}</span>
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-[11px] text-slate-500">Por confirmar o atención</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Saldo de Créditos</span>
                  {!isStaffUser && (
                    <button
                      onClick={() => setShowRecargaModal(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      + Recargar
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold text-emerald-600">{negocio?.saldo_creditos}</span>
                  <Coins className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-500">Respuestas de Bot WhatsApp</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-slate-500">Clientes Asignados</span>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold text-cyan-600">{effectiveClientesBase.length}</span>
                  <Users className="w-6 h-6 text-cyan-500" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {selectedEmpleadoFilter === 'todos' ? 'En todo el negocio' : `En agenda de ${currentEmpName}`}
                </p>
              </div>
            </div>

            {/* Today's Appointments Section */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <span>
                  Citas Programadas para Hoy
                  {selectedEmpleadoFilter !== 'todos' ? ` (${currentEmpName})` : ''}
                </span>
              </h3>

              {effectiveCitasHoyList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No hay citas agendadas para el día de hoy con los filtros seleccionados.
                </div>
              ) : (
                <div className="grid gap-3">
                  {effectiveCitasHoyList.map((c: any) => (
                    <div
                      key={c.id_cita}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-base">{c.cliente_nombre}</span>
                          <span className="text-xs text-slate-500">({c.cliente_telefono})</span>
                        </div>
                        <p className="text-xs text-indigo-700 font-medium">
                          {c.servicio_nombre} • Atendido por: {c.empleado_nombre}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(c.fecha_hora_inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-emerald-700 mr-2">${c.precio}</span>
                        <select
                          value={c.estado}
                          onChange={(e) => handleUpdateCitaStatus(c.id_cita, e.target.value)}
                          className="bg-white text-slate-800 border border-slate-300 text-xs rounded-lg p-2 font-semibold"
                        >
                          <option value="confirmado">Confirmado</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="en_proceso">En Proceso</option>
                          <option value="completado">Completado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CITAS MANAGEMENT */}
        {activeTab === 'citas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Gestión de Citas y Agenda</h2>
                <p className="text-sm text-slate-500">Filtrado por estado y programación de servicios</p>
              </div>
              <button
                onClick={() => setShowCitaModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center space-x-2 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Cita</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold px-2 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Estado:</span>
              </span>
              {['todos', 'confirmado', 'pendiente', 'en_proceso', 'completado', 'cancelado'].map((st) => (
                <button
                  key={st}
                  onClick={() => setCitaFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition ${
                    citaFilter === st ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Citas List */}
            <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Fecha & Hora</th>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Servicio</th>
                      <th className="px-6 py-4">Empleado</th>
                      <th className="px-6 py-4">Origen</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCitas.map((c) => (
                      <tr key={c.id_cita} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          <div>{new Date(c.fecha_hora_inicio).toLocaleDateString('es-CO')}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(c.fecha_hora_inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{c.cliente_nombre}</p>
                          <p className="text-xs text-slate-500">{c.cliente_telefono}</p>
                        </td>
                        <td className="px-6 py-4 text-indigo-700 font-medium">{c.servicio_nombre}</td>
                        <td className="px-6 py-4 text-slate-700">{c.empleado_nombre}</td>
                        <td className="px-6 py-4">
                          <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {c.origen}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={c.estado}
                            onChange={(e) => handleUpdateCitaStatus(c.id_cita, e.target.value)}
                            className="bg-white text-slate-800 border border-slate-300 text-xs rounded-lg p-1.5 font-semibold"
                          >
                            <option value="confirmado">Confirmado</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="completado">Completado</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-700">
                          ${c.precio}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BANDEJA LIVE CHAT / WHATSAPP BOT */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                  <MessageSquare className="w-6 h-6 text-emerald-600" />
                  <span>Bandeja de Entradas WhatsApp & IA</span>
                </h2>
                <p className="text-sm text-slate-500">
                  Intervención en tiempo real y respuestas automatizadas con Gemini API
                </p>
              </div>
            </div>

            {/* Dual Pane Layout */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-3 h-[600px]">
              {/* Left Pane: Chat Threads */}
              <div className="border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
                <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversaciones Recientes</h3>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                    {effectiveChats.length} Chats
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {effectiveChats.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No hay conversaciones de WhatsApp asociadas a los clientes de las citas de este colaborador.
                    </div>
                  ) : (
                    effectiveChats.map((ch) => (
                      <button
                        key={ch.id_chat}
                        onClick={() => setActiveChatId(ch.id_chat)}
                        className={`w-full text-left p-3.5 transition flex items-start space-x-3 ${
                          activeChatId === ch.id_chat ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                          {ch.cliente_nombre?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm text-slate-900 truncate">{ch.cliente_nombre}</p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ch.bot_activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                              {ch.bot_activo ? 'Bot ON' : 'Bot OFF'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{ch.ultimo_mensaje || 'Sin mensajes'}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right Pane: Active Chat Conversation */}
              <div className="col-span-2 flex flex-col h-full bg-white">
                {activeChat ? (
                  <>
                    {/* Active Chat Header */}
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{activeChat.cliente_nombre}</h4>
                        <p className="text-xs text-slate-500">{activeChat.cliente_telefono}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleToggleBot(activeChat.id_chat, activeChat.bot_activo)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                            activeChat.bot_activo
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Bot className="w-4 h-4" />
                          <span>{activeChat.bot_activo ? 'Bot de IA Activo' : 'Bot Pausado'}</span>
                        </button>
                        <button
                          onClick={handleTriggerAiBot}
                          disabled={aiLoading}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-xs disabled:opacity-50 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{aiLoading ? 'Generando IA...' : 'Forzar Respuesta IA (1 crd)'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
                      {mensajes.map((m) => (
                        <div
                          key={m.id_mensaje}
                          className={`flex flex-col ${
                            m.tipo_remitente === 'cliente'
                              ? 'items-start'
                              : m.tipo_remitente === 'bot'
                              ? 'items-end'
                              : 'items-end'
                          }`}
                        >
                          <div
                            className={`max-w-md p-3 rounded-2xl text-xs sm:text-sm shadow-xs ${
                              m.tipo_remitente === 'cliente'
                                ? 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                                : m.tipo_remitente === 'bot'
                                ? 'bg-purple-50 text-purple-950 border border-purple-200/70 rounded-br-none'
                                : 'bg-indigo-600 text-white rounded-br-none'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] opacity-75 mb-1 space-x-2">
                              <span className="font-bold uppercase tracking-wider">{m.tipo_remitente}</span>
                              <span>{new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">{m.contenido}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Send Message Bar */}
                    <form onSubmit={handleSendAgentMessage} className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Escribe una respuesta como agente humano..."
                        value={agentInput}
                        onChange={(e) => setAgentInput(e.target.value)}
                        className="flex-1 bg-white text-slate-900 text-sm px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition shadow-xs"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                    Selecciona un chat para ver la conversación.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SERVICIOS Y EMPLEADOS */}
        {activeTab === 'servicios' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Catálogo de Servicios</h2>
                <p className="text-sm text-slate-500">Gestión de precios, duración y catálogo del negocio</p>
              </div>
              {/* V1: Solo el dueño del negocio gestiona los servicios */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowServicioModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Servicio</span>
                </button>
                {/* FUTURA IMPLEMENTACIÓN (v2) - Botón para agregar colaboradores/empleados:
                <button
                  onClick={() => setShowEmpleadoModal(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 border border-slate-300 shadow-xs transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Nuevo Empleado</span>
                </button> */}
              </div>
            </div>

            {/* FUTURA IMPLEMENTACIÓN (v2) - Sub-tabs de Servicios y Empleados/Profesionales.
            En v1, solo existe la sección de Servicios. Los colaboradores son parte de la v2.
            <div className="flex space-x-4 border-b border-slate-200 text-sm font-medium">
              <button onClick={() => setSubTabService('servicios')} ... >
                Servicios ({servicios.length})
              </button>
              <button onClick={() => setSubTabService('empleados')} ... >
                Empleados / Personal ({empleados.length})
              </button>
            </div> */}

            {/* V1: Solo se muestra el catálogo de servicios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicios.map((s) => (
                <div key={s.id_servicio} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3 relative group">
                  <button
                    onClick={() => handleDeleteServicio(s.id_servicio)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <h3 className="font-bold text-slate-900 text-base pr-8">{s.nombre}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Duración: {s.duracion_minutos} minutos</span>
                    <span className="text-base font-extrabold text-emerald-700">${s.precio}</span>
                  </div>
                  {/* FUTURA IMPLEMENTACIÓN (v2) - Profesional asignado al servicio:
                  <p className="text-xs text-indigo-700 font-medium">Personal: {s.empleado_nombre}</p> */}
                </div>
              ))}
            </div>

            {/* FUTURA IMPLEMENTACIÓN (v2) - Grid de empleados/colaboradores y sus perfiles:
            {subTabService === 'empleados' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {empleados.map((e) => (
                  <div key={e.id_empleado} ...>
                    ...
                  </div>
                ))}
              </div>
            )} */}
          </div>
        )}

        {/* TAB 5: RENDIMIENTO Y FINANZAS POR EMPLEADO Y SERVICIO CON CONTROL DE PRIVACIDAD */}
        {activeTab === 'finanzas' && (() => {
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

          // V1: Sin filtro por empleado; se muestran todas las citas del negocio.
          // FUTURA IMPLEMENTACIÓN (v2) - Filtro de citas por empleado seleccionado:
          // const activeCitas = (selectedEmpleadoFilter === 'todos' && !isStaffUser)
          //   ? citas
          //   : citas.filter((c) => c.id_empleado === selectedEmpleadoFilter);
          const activeCitas = citas;

          const getCitaPrecio = (c: Cita) => {
            const serv = servicios.find((s) => s.id_servicio === c.id_servicio);
            return serv ? serv.precio : 0;
          };

          const totalGananciasHoy = activeCitas
            .filter((c) => new Date(c.fecha_hora_inicio).getTime() >= startOfToday)
            .reduce((sum, c) => sum + getCitaPrecio(c), 0);

          const totalGananciasSemana = activeCitas
            .filter((c) => new Date(c.fecha_hora_inicio).getTime() >= startOfWeek)
            .reduce((sum, c) => sum + getCitaPrecio(c), 0);

          const totalGananciasMes = activeCitas
            .filter((c) => new Date(c.fecha_hora_inicio).getTime() >= startOfMonth)
            .reduce((sum, c) => sum + getCitaPrecio(c), 0);

          const totalGananciasHistorico = activeCitas.reduce((sum, c) => sum + getCitaPrecio(c), 0);

          // FUTURA IMPLEMENTACIÓN (v2) - Desglose por empleado en finanzas.
          // const displayedEmpleados = (selectedEmpleadoFilter === 'todos') ? empleados : empleados.filter((e) => e.id_empleado === selectedEmpleadoFilter);
          // const currentEmpName = empleados.find((e) => e.id_empleado === selectedEmpleadoFilter)?.nombre || 'Empleado';

          return (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                    <BarChart3 className="w-6 h-6 text-indigo-600" />
                    <span>Rendimiento Financiero del Negocio</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Control de ganancias por día, semana y mes del negocio.
                  </p>
                </div>

                {/* FUTURA IMPLEMENTACIÓN (v2) - Selector de Filtro por Empleado en Finanzas + Vista Protegida por Privacidad.
                En v1 no hay empleados, siempre se muestra el consolidado general del negocio.
                <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  ...(selector de empleado y badge de privacidad)
                </div> */}

                <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center space-x-1 self-start md:self-center">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Vista Propietario</span>
                </span>
              </div>

              {/* FUTURA IMPLEMENTACIÓN (v2) - Banners de privacidad para colaboradores y filtros individuales por empleado. */}

              {/* Financial KPI Cards (Dynamically filtered by employee or overall) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <span>Ganancias de Hoy</span>
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-600">${totalGananciasHoy.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400">
                    {selectedEmpleadoFilter === 'todos' ? 'Ingresos totales de hoy' : `Ingresados hoy por ${currentEmpName}`}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <span>Esta Semana</span>
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-indigo-900">${totalGananciasSemana.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400">Últimos 7 días activos</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <span>Este Mes</span>
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">${totalGananciasMes.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400">Mes en curso</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <span>Total Histórico</span>
                    <Coins className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-extrabold text-amber-600">${totalGananciasHistorico.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-400">Acumulado ({activeCitas.length} citas)</p>
                </div>
              </div>

              {/* FUTURA IMPLEMENTACIÓN (v2) - Desglose de ingresos por Empleado/Colaborador.
              En v1 no hay empleados/profesionales, cada negocio es operado por su único propietario.
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <h3 ...>Desglose por Empleado</h3>
                {displayedEmpleados.map((emp) => (
                  <div key={emp.id_empleado}>...KPIs por empleado...</div>
                ))}
              </div> */}

              {/* Section 2: Breakdown by Services */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <Scissors className="w-5 h-5 text-indigo-600" />
                      <span>Ingresos por Servicio ({servicios.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500">Ganancias consolidadas por tipo de servicio del negocio</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Servicio</th>
                        <th className="px-4 py-3">Precio Unitario</th>
                        <th className="px-4 py-3">Duración</th>
                        <th className="px-4 py-3">Agendamientos</th>
                        <th className="px-4 py-3">Hoy</th>
                        <th className="px-4 py-3">Semana</th>
                        <th className="px-4 py-3">Mes</th>
                        <th className="px-4 py-3 text-right">Total Generado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {servicios.map((s) => {
                        const sCitas = activeCitas.filter((c) => c.id_servicio === s.id_servicio);
                        const sHoy = sCitas
                          .filter((c) => new Date(c.fecha_hora_inicio).getTime() >= startOfToday)
                          .length * s.precio;
                        const sSemana = sCitas
                          .filter((c) => new Date(c.fecha_hora_inicio).getTime() >= startOfWeek)
                          .length * s.precio;
                        const sMes = sCitas
                          .filter((c) => new Date(c.fecha_hora_inicio).getTime() >= startOfMonth)
                          .length * s.precio;
                        const sTotal = sCitas.length * s.precio;

                        return (
                          <tr key={s.id_servicio} className="hover:bg-slate-50/80 transition">
                            <td className="px-4 py-3 font-bold text-slate-900">{s.nombre}</td>
                            <td className="px-4 py-3 font-semibold text-emerald-600">${s.precio} USD</td>
                            <td className="px-4 py-3 text-slate-500">{s.duracion_minutos} min</td>
                            <td className="px-4 py-3 font-semibold text-indigo-600">{sCitas.length} citas</td>
                            <td className="px-4 py-3 font-semibold text-slate-700">${sHoy}</td>
                            <td className="px-4 py-3 font-semibold text-slate-700">${sSemana}</td>
                            <td className="px-4 py-3 font-semibold text-slate-700">${sMes}</td>
                            <td className="px-4 py-3 font-extrabold text-slate-900 text-right">${sTotal}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 5: DIRECTORIO DE CLIENTES */}
        {activeTab === 'clientes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Directorio de Clientes</h2>
                <p className="text-sm text-slate-500">Historial de visitas y contacto recurrente</p>
              </div>
              <button
                onClick={() => setShowClienteModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center space-x-2 shadow-xs transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrar Cliente</span>
              </button>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center max-w-md">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre o teléfono..."
                value={searchClientTerm}
                onChange={(e) => setSearchClientTerm(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 focus:outline-none"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Nombre Completo</th>
                    <th className="px-6 py-4">Teléfono WhatsApp</th>
                    <th className="px-6 py-4">Total Visitas</th>
                    <th className="px-6 py-4">Última Visita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClientes.map((cl) => (
                    <tr key={cl.id_cliente} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">{cl.nombre}</td>
                      <td className="px-6 py-4 text-slate-600">{cl.telefono}</td>
                      <td className="px-6 py-4 font-semibold text-indigo-700">{cl.total_visitas} visitas</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {cl.ultima_visita || 'Sin visitas registradas'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: CONFIGURACIÓN Y LISTA BLANCA */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Configuración del Bot & Lista Blanca</h2>
              <p className="text-sm text-slate-500">Personaliza las respuestas del asistente de IA de WhatsApp</p>
            </div>

            {isStaffUser && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex items-center space-x-3 text-amber-900 text-xs">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <span className="font-bold">Acceso de Lectura:</span> Como colaborador del negocio, puedes consultar el prompt y la lista blanca del bot, pero los cambios en la configuración están reservados exclusivamente para el Administrador del negocio.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personality Prompt Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4 shadow-xs">
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-indigo-600" />
                  <span>Prompt de Personalidad del Bot</span>
                </h3>

                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Instrucciones de Personalidad (prompt_personalidad)
                    </label>
                    <textarea
                      rows={5}
                      disabled={isStaffUser}
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  {!isStaffUser && (
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-xs transition"
                    >
                      Guardar Prompt de Personalidad
                    </button>
                  )}
                </form>
              </div>

              {/* Lista Blanca (Bot Whitelist) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Lista Blanca (Bot Whitelist)</span>
                  </h3>
                  {!isStaffUser && (
                    <button
                      onClick={() => setShowListaBlancaModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Contacto</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {listaBlanca.map((lb) => (
                    <div key={lb.id_lista_blanca} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{lb.nombre}</p>
                        <p className="text-xs text-slate-500">{lb.telefono}</p>
                      </div>
                      {!isStaffUser && (
                        <button onClick={() => handleDeleteListaBlanca(lb.id_lista_blanca)} className="text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Agendar Cita */}
      {showCitaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Agendar Nueva Cita</h3>
            <form onSubmit={handleCreateCita} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente</label>
                <select
                  required
                  value={newCita.id_cliente}
                  onChange={(e) => setNewCita({ ...newCita, id_cliente: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((cl) => (
                    <option key={cl.id_cliente} value={cl.id_cliente}>
                      {cl.nombre} ({cl.telefono})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Servicio</label>
                <select
                  required
                  value={newCita.id_servicio}
                  onChange={(e) => setNewCita({ ...newCita, id_servicio: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Seleccionar servicio...</option>
                  {servicios.map((s) => (
                    <option key={s.id_servicio} value={s.id_servicio}>
                      {s.nombre} - ${s.precio} ({s.duracion_minutos} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* FUTURA IMPLEMENTACIÓN (v2) - Selector de Empleado/Profesional en formulario de cita.
              En v1 cada negocio tiene un solo propietario; el id_empleado no se usa.
              <div>
                <label>Empleado / Personal</label>
                <select value={newCita.id_empleado} onChange={...}>
                  <option value="">Cualquier empleado disponible</option>
                  {empleados.map((e) => <option key={e.id_empleado} value={e.id_empleado}>{e.nombre}</option>)}
                </select>
              </div> */}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha y Hora de Inicio</label>
                <input
                  type="datetime-local"
                  required
                  value={newCita.fecha_hora_inicio}
                  onChange={(e) => setNewCita({ ...newCita, fecha_hora_inicio: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCitaModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 shadow-xs">
                  Agendar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Servicio */}
      {showServicioModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Crear Nuevo Servicio</h3>
            <form onSubmit={handleCreateServicio} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Servicio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Corte Barbería Premium"
                  value={newServicio.nombre}
                  onChange={(e) => setNewServicio({ ...newServicio, nombre: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duración (minutos)</label>
                  <input
                    type="number"
                    required
                    value={newServicio.duracion_minutos}
                    onChange={(e) => setNewServicio({ ...newServicio, duracion_minutos: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={newServicio.precio}
                    onChange={(e) => setNewServicio({ ...newServicio, precio: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowServicioModal(false)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs border border-slate-200">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 shadow-xs">
                  Crear Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FUTURA IMPLEMENTACIÓN (v2) - Modal para registrar nuevos Empleados/Colaboradores.
      En v1 no existe la gestión de empleados; cada negocio tiene un único dueño.
      {showEmpleadoModal && (
        <div className="fixed inset-0 z-50 ...">
          <form onSubmit={handleCreateEmpleado}>
            ... (campos de nombre del empleado) ...
          </form>
        </div>
      )} */}

      {/* Modal: Nuevo Cliente */}
      {showClienteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Registrar Cliente</h3>
            <form onSubmit={handleCreateCliente} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Andrés Castro"
                  value={newCliente.nombre}
                  onChange={(e) => setNewCliente({ ...newCliente, nombre: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono WhatsApp</label>
                <input
                  type="text"
                  required
                  placeholder="+573019998877"
                  value={newCliente.telefono}
                  onChange={(e) => setNewCliente({ ...newCliente, telefono: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowClienteModal(false)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs border border-slate-200">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 shadow-xs">
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agregar a Lista Blanca */}
      {showListaBlancaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Agregar a Lista Blanca</h3>
            <form onSubmit={handleAddListaBlanca} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre / Etiqueta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cliente VIP Andrés"
                  value={newListaBlanca.nombre}
                  onChange={(e) => setNewListaBlanca({ ...newListaBlanca, nombre: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Número de Teléfono</label>
                <input
                  type="text"
                  required
                  placeholder="+573019998877"
                  value={newListaBlanca.telefono}
                  onChange={(e) => setNewListaBlanca({ ...newListaBlanca, telefono: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowListaBlancaModal(false)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs border border-slate-200">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 shadow-xs">
                  Agregar a Lista Blanca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Recargar Créditos Bot */}
      <RecargaModal
        isOpen={showRecargaModal}
        onClose={() => setShowRecargaModal(false)}
        onSuccess={loadTenantData}
      />
    </div>
  );
};
