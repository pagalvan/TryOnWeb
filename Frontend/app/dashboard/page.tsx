import { Package, Eye, AlertCircle, Box, ArrowRight, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <Navbar />

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-sans">Hola, Administrador!</h1>
          <p className="text-gray-600 font-sans">Aquí están los detalles analíticos de TryOnWeb</p>
        </div>

        {/* KPI Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-sans">Total Productos</p>
                  <p className="text-3xl font-bold text-gray-900 font-sans">1,284</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600 font-sans">+20.1%</span>
                  <span className="text-xs text-gray-500 font-sans">+123 hoy</span>
                </div>
              </div>
              <button className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 font-sans">
                Ver Reporte
                <ArrowRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-sans">Pruebas Virtuales</p>
                  <p className="text-3xl font-bold text-gray-900 font-sans">3,847</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600 font-sans">+10.6%</span>
                  <span className="text-xs text-gray-500 font-sans">+1,285 hoy</span>
                </div>
              </div>
              <button className="mt-4 text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 font-sans">
                Ver Reporte
                <ArrowRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-sans">Visitas</p>
                  <p className="text-3xl font-bold text-gray-900 font-sans">1,062</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600 font-sans">-10%</span>
                  <span className="text-xs text-gray-500 font-sans">-426 hoy</span>
                </div>
              </div>
              <button className="mt-4 text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 font-sans">
                Ver Reporte
                <ArrowRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-sans">Tasa de Conversión</p>
                  <p className="text-3xl font-bold text-gray-900 font-sans">90%</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Box className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600 font-sans">+12%</span>
                  <span className="text-xs text-gray-500 font-sans">+42 hoy</span>
                </div>
              </div>
              <button className="mt-4 text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1 font-sans">
                Ver Reporte
                <ArrowRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Chart and Stats Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-sans">Ingresos</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                      <span className="text-sm text-gray-600 font-sans">Ganancias</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                      <span className="text-sm text-gray-600 font-sans">Pérdidas</span>
                    </div>
                  </div>
                </div>
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 font-sans">
                  <option>Mes</option>
                  <option>Semana</option>
                  <option>Año</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <div className="relative h-64">
                <div className="absolute inset-0 flex items-end justify-between gap-2 px-4">
                  {/* January */}
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-t-lg" style={{ height: "35%" }}></div>
                    <div className="w-full bg-blue-600 rounded-t-lg" style={{ height: "45%" }}></div>
                  </div>
                  {/* February */}
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-t-lg" style={{ height: "25%" }}></div>
                    <div className="w-full bg-blue-600 rounded-t-lg" style={{ height: "65%" }}></div>
                  </div>
                  {/* March */}
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-t-lg" style={{ height: "20%" }}></div>
                    <div className="w-full bg-blue-600 rounded-t-lg" style={{ height: "70%" }}></div>
                  </div>
                  {/* April */}
                  <div className="flex-1 flex flex-col items-center gap-2 relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap font-sans">
                      03 Mar 2024 • $18,832
                    </div>
                    <div className="w-full bg-gray-200 rounded-t-lg" style={{ height: "15%" }}></div>
                    <div className="w-full bg-blue-600 rounded-t-lg" style={{ height: "85%" }}></div>
                  </div>
                  {/* May */}
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-t-lg" style={{ height: "30%" }}></div>
                    <div className="w-full bg-blue-600 rounded-t-lg" style={{ height: "55%" }}></div>
                  </div>
                  {/* June */}
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-t-lg" style={{ height: "20%" }}></div>
                    <div className="w-full bg-blue-600 rounded-t-lg" style={{ height: "75%" }}></div>
                  </div>
                </div>
              </div>

              {/* X-axis labels */}
              <div className="flex justify-between mt-4 px-4 text-xs text-gray-500 font-sans">
                <span>ENE</span>
                <span>FEB</span>
                <span>MAR</span>
                <span>ABR</span>
                <span>MAY</span>
                <span>JUN</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 font-sans">Canal de Tráfico</h3>
                <select className="text-xs border border-gray-200 rounded px-2 py-1 font-sans">
                  <option>Todo el tiempo</option>
                  <option>Esta semana</option>
                  <option>Este mes</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Donut Chart */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="20" />
                    {/* Direct - 55% (blue) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="20"
                      strokeDasharray="138 251"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    {/* Organic - 25% (purple) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="20"
                      strokeDasharray="63 251"
                      strokeDashoffset="-138"
                      strokeLinecap="round"
                    />
                    {/* Referral - 20% (orange) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="20"
                      strokeDasharray="50 251"
                      strokeDashoffset="-201"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 font-sans">55%</p>
                      <p className="text-xs text-gray-500 font-sans">Directo</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                    <span className="text-sm text-gray-700 font-sans">Directo</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 font-sans">55%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-gray-700 font-sans">Orgánico</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 font-sans">25%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-700 font-sans">Referidos</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 font-sans">20%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Table */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <button className="text-sm font-semibold text-gray-900 pb-3 border-b-2 border-blue-600 font-sans">
                  Actividad Reciente
                </button>
                <button className="text-sm font-medium text-gray-500 pb-3 hover:text-gray-900 font-sans">
                  Campaña
                </button>
                <button className="text-sm font-medium text-gray-500 pb-3 hover:text-gray-900 font-sans">
                  Mis Reservas
                </button>
              </div>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 font-sans">
                <option>Últimas 24h</option>
                <option>Esta semana</option>
                <option>Este mes</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-600 px-6 py-3 font-sans">Cliente</th>
                    <th className="text-left text-xs font-semibold text-gray-600 px-6 py-3 font-sans">Estado</th>
                    <th className="text-left text-xs font-semibold text-gray-600 px-6 py-3 font-sans">ID Cliente</th>
                    <th className="text-left text-xs font-semibold text-gray-600 px-6 py-3 font-sans">Retenido</th>
                    <th className="text-left text-xs font-semibold text-gray-600 px-6 py-3 font-sans">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm font-sans">
                          JA
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 font-sans">Joseph Arimathea</p>
                          <p className="text-xs text-gray-500 font-sans">joseph.arimathea@email.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 font-sans">
                        Miembro
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-sans">#74568320</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-sans">Hace 5 min</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 font-sans">$12,408.02</td>
                  </tr>
                  <tr className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm font-sans">
                          CK
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 font-sans">Clark Kent</p>
                          <p className="text-xs text-gray-500 font-sans">clark.kent@email.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 font-sans">
                        Registrado
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-sans">#15648399</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-sans">Hace 10 min</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 font-sans">$201.50</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm font-sans">
                          AG
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 font-sans">Allie Grater</p>
                          <p className="text-xs text-gray-500 font-sans">Grater.a@email.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 font-sans">
                        Nuevo Cliente
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-sans">#15897913</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-sans">Hace 15 min</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 font-sans">$2,856.03</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
