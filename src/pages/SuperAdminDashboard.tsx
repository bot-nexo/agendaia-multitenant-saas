import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Negocio, TransaccionCredito, SolicitudRecarga } from '../types';
import {
  Building2,
  Users,
  Coins,
  Calendar,
  MessageSquare,
  TrendingUp,
  Plus,
  Edit,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Sparkles,
  Clock,
  Eye,
  CreditCard,
  FileText,
  X,
  ExternalLink,
  BarChart3
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [transacciones, setTransacciones] = useState<TransaccionCredito[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudRecarga[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'negocios' | 'solicitudes' | 'transacciones' | 'analitica'>('negocios');
  const [selectedComprobanteUrl, setSelectedComprobanteUrl] = useState<string | null>(null);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [selectedNegocio, setSelectedNegocio] = useState<Negocio | null>(null);

  // Form States
  const [newNegocio, setNewNegocio] = useState({
    nombre_comercial: '',
    telefono_whatsapp: '',
    tipo_plan: 'basico',
    correo_admin: '',
    nombre_admin: '',
    saldo_inicial: 100,
    prompt_personalidad: '',
  });

  const [creditForm, setCreditForm] = useState({
    monto: 100,
    tipo: 'RECARGA_MANUAL',
    descripcion: 'Recarga de créditos asignada por SuperAdmin',
  });

  const [subForm, setSubForm] = useState({
    estado_suscripcion: 'ACTIVO',
    tipo_plan: 'basico',
  });

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [negociosData, transaccionesData, analyticsData, solicitudesData] = await Promise.all([
        api.admin.getNegocios(),
        api.admin.getTransacciones(),
        api.admin.getAnalytics(),
        api.admin.getSolicitudesRecarga(),
      ]);
      setNegocios(negociosData);
      setTransacciones(transaccionesData);
      setAnalytics(analyticsData);
      setSolicitudes(solicitudesData);
    } catch (err: any) {
      setError(err.message || 'Error cargando datos del Panel SuperAdmin');
    } finally {
      setLoading(false);
    }
  };

  const handleAprobarSolicitud = async (id_solicitud: string) => {
    try {
      await api.admin.aprobarSolicitudRecarga(id_solicitud);
      alert('Recarga aprobada y créditos asignados exitosamente.');
      await loadAdminData();
    } catch (err: any) {
      alert('Error al aprobar recarga: ' + err.message);
    }
  };

  const handleRechazarSolicitud = async (id_solicitud: string) => {
    const notas = prompt('Motivo o nota de rechazo:', 'Comprobante de pago no válido o no verificado.');
    if (notas === null) return;
    try {
      await api.admin.rechazarSolicitudRecarga(id_solicitud, notas);
      alert('Solicitud rechazada.');
      await loadAdminData();
    } catch (err: any) {
      alert('Error al rechazar recarga: ' + err.message);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateNegocio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createNegocio(newNegocio);
      setCreateModalOpen(false);
      setNewNegocio({
        nombre_comercial: '',
        telefono_whatsapp: '',
        tipo_plan: 'basico',
        correo_admin: '',
        nombre_admin: '',
        saldo_inicial: 100,
        prompt_personalidad: '',
      });
      await loadAdminData();
    } catch (err: any) {
      alert('Error creando negocio: ' + err.message);
    }
  };

  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNegocio) return;
    try {
      await api.admin.adjustCreditos(
        selectedNegocio.id_negocio,
        creditForm.monto,
        creditForm.tipo,
        creditForm.descripcion
      );
      setCreditModalOpen(false);
      setSelectedNegocio(null);
      await loadAdminData();
    } catch (err: any) {
      alert('Error ajustando créditos: ' + err.message);
    }
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNegocio) return;
    try {
      await api.admin.updateSuscripcion(
        selectedNegocio.id_negocio,
        subForm.estado_suscripcion,
        subForm.tipo_plan
      );
      setSubModalOpen(false);
      setSelectedNegocio(null);
      await loadAdminData();
    } catch (err: any) {
      alert('Error actualizando suscripción: ' + err.message);
    }
  };

  const filteredNegocios = negocios.filter(
    (n) =>
      n.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.telefono_whatsapp.includes(searchTerm) ||
      (n.admin_correo && n.admin_correo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel de Control SuperAdmin</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestión centralizada de inquilinos (Tenants), asignación de créditos y analíticas globales.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-xs transition text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Negocio</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Inquilinos</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-900">{analytics.totalNegocios}</span>
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">{analytics.negociosActivos} Activos</p>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">MRR Estimado</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-emerald-600">${analytics.mrrEstimado}</span>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-500">Ingresos recurrentes</p>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Créditos Totales</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-amber-600">{analytics.totalCreditosCirculacion}</span>
              <Coins className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-[11px] text-slate-500">En saldo activo</p>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Citas</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-indigo-900">{analytics.totalCitasAgendadas}</span>
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-[11px] text-slate-500">Plataforma global</p>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Chats</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-cyan-700">{analytics.totalChatsBot}</span>
              <MessageSquare className="w-5 h-5 text-cyan-600" />
            </div>
            <p className="text-[11px] text-slate-500">Conversaciones WhatsApp</p>
          </div>

          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Respuestas Bot</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-purple-700">{analytics.totalMensajesBot}</span>
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-[11px] text-slate-500">IA ejecutadas</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('negocios')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'negocios'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Directorio de Negocios</span>
        </button>
        <button
          onClick={() => setActiveTab('solicitudes')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'solicitudes'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Solicitudes de Recarga</span>
          {solicitudes.filter((s) => s.estado === 'PENDIENTE').length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {solicitudes.filter((s) => s.estado === 'PENDIENTE').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('transacciones')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'transacciones'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Créditos</span>
        </button>
        <button
          onClick={() => setActiveTab('analitica')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'analitica'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Ingresos & Analítica Plataforma</span>
        </button>
      </div>

      {/* Tab Content: Directores de Negocios */}
      {activeTab === 'negocios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por negocio, WhatsApp o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white text-slate-800 pl-9 pr-4 py-2 rounded-lg text-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Mostrando {filteredNegocios.length} de {negocios.length} negocios
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Negocio</th>
                    <th className="px-6 py-4">Administrador</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Créditos</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-center">Métricas</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNegocios.map((n) => (
                    <tr key={n.id_negocio} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={n.logo_url || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=150'}
                            alt={n.nombre_comercial}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">{n.nombre_comercial}</p>
                            <p className="text-xs text-slate-500">{n.telefono_whatsapp}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-800 font-medium">{n.admin_nombre}</p>
                        <p className="text-xs text-slate-500">{n.admin_correo}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="uppercase text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {n.tipo_plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-amber-700">
                        {n.saldo_creditos} crd
                      </td>
                      <td className="px-6 py-4">
                        {n.estado_suscripcion === 'ACTIVO' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                          </span>
                        )}
                        {n.estado_suscripcion === 'VENCIDO_GRACIA' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <AlertTriangle className="w-3.5 h-3.5" /> Gracia
                          </span>
                        )}
                        {n.estado_suscripcion === 'SUSPENDIDO' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                            <XCircle className="w-3.5 h-3.5" /> Suspendido
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-slate-500">
                        <div>{n.total_citas} Citas</div>
                        <div>{n.total_chats} Chats</div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedNegocio(n);
                            setCreditModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold transition border border-amber-200/60"
                        >
                          + Créditos
                        </button>
                        <button
                          onClick={() => {
                            setSelectedNegocio(n);
                            setSubForm({
                              estado_suscripcion: n.estado_suscripcion,
                              tipo_plan: n.tipo_plan,
                            });
                            setSubModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition border border-slate-200"
                        >
                          Suscripción
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Solicitudes de Recarga (Approval Panel) */}
      {activeTab === 'solicitudes' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Solicitudes de Recarga con Comprobante</h3>
              <p className="text-xs text-slate-500">
                Verifica los comprobantes adjuntos y aprueba la asignación de créditos a los negocios
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                {solicitudes.filter((s) => s.estado === 'PENDIENTE').length} Pendientes
              </span>
            </div>
          </div>

          {solicitudes.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No hay solicitudes de recarga enviadas</p>
              <p className="text-xs text-slate-400">
                Cuando los clientes envíen sus comprobantes de pago desde su panel, aparecerán listados aquí.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {solicitudes.map((sol) => (
                <div
                  key={sol.id_solicitud}
                  className={`bg-white rounded-xl border p-5 shadow-xs space-y-4 transition ${
                    sol.estado === 'PENDIENTE'
                      ? 'border-amber-300 ring-1 ring-amber-200/60'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                        {sol.negocio_nombre?.charAt(0) || 'N'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{sol.negocio_nombre}</h4>
                        <p className="text-xs text-slate-500">
                          Solicitado por: <span className="font-medium text-slate-700">{sol.nombre_solicitante || sol.correo_solicitante}</span> ({sol.correo_solicitante})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1 ${
                          sol.estado === 'APROBADO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sol.estado === 'RECHAZADO'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sol.estado === 'APROBADO' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {sol.estado === 'RECHAZADO' && <XCircle className="w-3.5 h-3.5" />}
                        {sol.estado === 'PENDIENTE' && <Clock className="w-3.5 h-3.5" />}
                        <span>{sol.estado}</span>
                      </span>

                      <span className="text-xs text-slate-400">
                        {new Date(sol.created_at).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>

                  {/* Detalle del Pago y Comprobante */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-indigo-600">
                        Paquete Solicitado
                      </p>
                      <p className="text-base font-extrabold text-slate-900">
                        +{sol.paquete_creditos} Créditos IA
                      </p>
                      <p className="font-semibold text-slate-600">{sol.monto_cop_usd}</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-indigo-600">
                        Información del Pago
                      </p>
                      <p><span className="font-semibold text-slate-700">Método:</span> {sol.metodo_pago}</p>
                      <p><span className="font-semibold text-slate-700">Ref / Transacción:</span> {sol.numero_referencia || 'No especificada'}</p>
                      {sol.notas_negocio && (
                        <p className="text-slate-500 italic mt-1">"{sol.notas_negocio}"</p>
                      )}
                    </div>

                    {/* Visualización del Comprobante */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-indigo-600 mb-1">
                          Comprobante de Pago
                        </p>
                        <button
                          onClick={() => setSelectedComprobanteUrl(sol.comprobante_url)}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs font-semibold hover:bg-slate-100 transition flex items-center space-x-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Ver Comprobante Full</span>
                        </button>
                      </div>

                      {sol.comprobante_url && (
                        <img
                          src={sol.comprobante_url}
                          alt="Comprobante thumbnail"
                          onClick={() => setSelectedComprobanteUrl(sol.comprobante_url)}
                          className="w-16 h-16 object-cover rounded-lg border border-slate-300 shadow-2xs cursor-pointer hover:scale-105 transition"
                        />
                      )}
                    </div>
                  </div>

                  {/* Acciones de Aprobación */}
                  {sol.estado === 'PENDIENTE' && (
                    <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-3">
                      <button
                        onClick={() => handleRechazarSolicitud(sol.id_solicitud)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg transition"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleAprobarSolicitud(sol.id_solicitud)}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aprobar y Asignar +{sol.paquete_creditos} Créditos</span>
                      </button>
                    </div>
                  )}

                  {sol.notas_admin && (
                    <div className="p-2.5 bg-slate-100 rounded-lg text-xs text-slate-600">
                      <span className="font-bold text-slate-800">Observación SuperAdmin:</span> {sol.notas_admin}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Transacciones de Crédito */}
      {activeTab === 'transacciones' && (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Historial Auditado de Movimiento de Créditos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Negocio Inquilino</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transacciones.map((t) => (
                  <tr key={t.id_transaccion} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(t.created_at).toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{t.nombre_negocio}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {t.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">{t.descripcion}</td>
                    <td className={`px-6 py-4 text-right font-bold ${t.monto > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.monto > 0 ? `+${t.monto}` : t.monto} crd
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Analítica e Ingresos de la Plataforma */}
      {activeTab === 'analitica' && (() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        const parseMonto = (sol: SolicitudRecarga) => {
          if (!sol.monto_cop_usd) return 0;
          const num = parseInt(sol.monto_cop_usd.replace(/[^0-9]/g, ''));
          return isNaN(num) ? 0 : num;
        };

        const aprobadas = solicitudes.filter((s) => s.estado === 'APROBADO');

        const recargasHoy = aprobadas
          .filter((s) => new Date(s.created_at).getTime() >= startOfToday)
          .reduce((sum, s) => sum + parseMonto(s), 0);

        const recargasSemana = aprobadas
          .filter((s) => new Date(s.created_at).getTime() >= startOfWeek)
          .reduce((sum, s) => sum + parseMonto(s), 0);

        const recargasMes = aprobadas
          .filter((s) => new Date(s.created_at).getTime() >= startOfMonth)
          .reduce((sum, s) => sum + parseMonto(s), 0);

        const recargasHistorico = aprobadas.reduce((sum, s) => sum + parseMonto(s), 0);

        // Subscriptions MRR estimation
        const planPricesUSD: Record<string, number> = { basico: 29, pro: 79, enterprise: 199 };
        const mrrUSD = negocios.reduce((sum, n) => sum + (planPricesUSD[n.tipo_plan] || 29), 0);
        const mrrCOP = mrrUSD * 4000; // Aprox COP conversion

        return (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <span>Reporte de Ingresos de la Plataforma AgendaIA</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visión consolidada de ventas por recargas de créditos y recurrentes por suscripciones
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  MRR Est. Suscripciones: ${mrrUSD} USD / mes (${mrrCOP.toLocaleString()} COP)
                </span>
              </div>
            </div>

            {/* Income breakdown Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ventas de Hoy</p>
                <p className="text-2xl font-extrabold text-emerald-600">${recargasHoy.toLocaleString()} COP</p>
                <p className="text-[11px] text-slate-400">Recargas de créditos hoy</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Esta Semana</p>
                <p className="text-2xl font-extrabold text-indigo-900">${recargasSemana.toLocaleString()} COP</p>
                <p className="text-[11px] text-slate-400">Últimos 7 días</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Este Mes (Recargas)</p>
                <p className="text-2xl font-extrabold text-indigo-600">${recargasMes.toLocaleString()} COP</p>
                <p className="text-[11px] text-slate-400">Recargas aprobadas mes actual</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Histórico</p>
                <p className="text-2xl font-extrabold text-amber-600">${recargasHistorico.toLocaleString()} COP</p>
                <p className="text-[11px] text-slate-400">Total ventas de recargas</p>
              </div>
            </div>

            {/* Breakdown per Tenant Business */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-bold text-base text-slate-900">Ingresos por Negocio Inquilino (Tenant)</h4>
                <p className="text-xs text-slate-500">Aporte de cada negocio por concepto de plan de suscripción y recargas de créditos</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Negocio</th>
                      <th className="px-4 py-3">Plan Activo</th>
                      <th className="px-4 py-3">Valor Plan / mes</th>
                      <th className="px-4 py-3">Recargas Aprobadas</th>
                      <th className="px-4 py-3">Créditos Actuales</th>
                      <th className="px-4 py-3 text-right">Aporte Total Recargas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {negocios.map((neg) => {
                      const negSolicitudes = aprobadas.filter((s) => s.id_negocio === neg.id_negocio);
                      const totalAportado = negSolicitudes.reduce((sum, s) => sum + parseMonto(s), 0);
                      const usdVal = planPricesUSD[neg.tipo_plan] || 29;

                      return (
                        <tr key={neg.id_negocio} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 font-bold text-slate-900 flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-indigo-600" />
                            <span>{neg.nombre_comercial}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {neg.tipo_plan}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700">${usdVal} USD</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{negSolicitudes.length} recargas</td>
                          <td className="px-4 py-3 font-bold text-amber-600">{neg.saldo_creditos} crd</td>
                          <td className="px-4 py-3 font-extrabold text-emerald-600 text-right">
                            ${totalAportado.toLocaleString()} COP
                          </td>
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

      {/* Modal 1: Crear Nuevo Negocio */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Registrar Nuevo Negocio Inquilino</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNegocio} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Comercial del Negocio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Barbería Deluxe VIP"
                  value={newNegocio.nombre_comercial}
                  onChange={(e) => setNewNegocio({ ...newNegocio, nombre_comercial: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp de Atención</label>
                  <input
                    type="text"
                    required
                    placeholder="+573001234567"
                    value={newNegocio.telefono_whatsapp}
                    onChange={(e) => setNewNegocio({ ...newNegocio, telefono_whatsapp: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Plan</label>
                  <select
                    value={newNegocio.tipo_plan}
                    onChange={(e) => setNewNegocio({ ...newNegocio, tipo_plan: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="basico">Básico ($29/mes)</option>
                    <option value="pro">Pro ($79/mes)</option>
                    <option value="enterprise">Enterprise ($199/mes)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Admin Negocio</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@negocio.com"
                    value={newNegocio.correo_admin}
                    onChange={(e) => setNewNegocio({ ...newNegocio, correo_admin: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo Admin</label>
                  <input
                    type="text"
                    required
                    placeholder="Mateo Morales"
                    value={newNegocio.nombre_admin}
                    onChange={(e) => setNewNegocio({ ...newNegocio, nombre_admin: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Créditos Iniciales</label>
                <input
                  type="number"
                  required
                  value={newNegocio.saldo_inicial}
                  onChange={(e) => setNewNegocio({ ...newNegocio, saldo_inicial: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-xs"
                >
                  Crear Inquilino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Ajustar Créditos */}
      {creditModalOpen && selectedNegocio && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <span>Asignar Créditos: {selectedNegocio.nombre_comercial}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Saldo actual: <span className="text-amber-700 font-bold">{selectedNegocio.saldo_creditos} créditos</span>.
            </p>

            <form onSubmit={handleAdjustCredits} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monto de Créditos (+ o -)</label>
                <input
                  type="number"
                  required
                  value={creditForm.monto}
                  onChange={(e) => setCreditForm({ ...creditForm, monto: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Transacción</label>
                <select
                  value={creditForm.tipo}
                  onChange={(e) => setCreditForm({ ...creditForm, tipo: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="RECARGA_MANUAL">Recarga Manual</option>
                  <option value="PROMO">Promoción Especial</option>
                  <option value="SUSCRIPCION">Abono por Suscripción</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción / Nota</label>
                <input
                  type="text"
                  required
                  value={creditForm.descripcion}
                  onChange={(e) => setCreditForm({ ...creditForm, descripcion: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCreditModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 shadow-xs"
                >
                  Guardar Transacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Estado de Suscripción */}
      {subModalOpen && selectedNegocio && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Gestionar Suscripción de Inquilino</h3>
            <p className="text-xs text-slate-500">{selectedNegocio.nombre_comercial}</p>

            <form onSubmit={handleUpdateSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de la Suscripción</label>
                <select
                  value={subForm.estado_suscripcion}
                  onChange={(e) => setSubForm({ ...subForm, estado_suscripcion: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="ACTIVO">ACTIVO (Acceso Total)</option>
                  <option value="VENCIDO_GRACIA">VENCIDO_GRACIA (Alerta activa)</option>
                  <option value="SUSPENDIDO">SUSPENDIDO (Bloqueo de servicios)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nivel de Plan</label>
                <select
                  value={subForm.tipo_plan}
                  onChange={(e) => setSubForm({ ...subForm, tipo_plan: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="basico">Básico ($29/mes)</option>
                  <option value="pro">Pro ($79/mes)</option>
                  <option value="enterprise">Enterprise ($199/mes)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSubModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-xs"
                >
                  Actualizar Suscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Inspection Lightbox for Comprobante de Pago */}
      {selectedComprobanteUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Inspección de Comprobante de Pago</span>
              </h3>
              <button
                onClick={() => setSelectedComprobanteUrl(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={selectedComprobanteUrl}
                alt="Comprobante Full"
                className="max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-3 bg-slate-900 border-t border-slate-800 text-center">
              <a
                href={selectedComprobanteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 font-semibold hover:underline inline-flex items-center space-x-1"
              >
                <span>Abrir imagen en nueva pestaña</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
