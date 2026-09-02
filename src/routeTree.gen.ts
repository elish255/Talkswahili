/* eslint-disable */
// @ts-nocheck
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as RegisterRouteImport } from './routes/register'
import { Route as PaymentRouteImport } from './routes/payment'
import { Route as DashboardRouteImport } from './routes/dashboard'
import { Route as ChatRouteImport } from './routes/chat'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const RegisterRoute = RegisterRouteImport.update({ id: '/register', path: '/register', getParentRoute: () => rootRouteImport } as any)
const PaymentRoute = PaymentRouteImport.update({ id: '/payment', path: '/payment', getParentRoute: () => rootRouteImport } as any)
const DashboardRoute = DashboardRouteImport.update({ id: '/dashboard', path: '/dashboard', getParentRoute: () => rootRouteImport } as any)
const ChatRoute = ChatRouteImport.update({ id: '/chat', path: '/chat', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath { '/': typeof IndexRoute; '/register': typeof RegisterRoute; '/payment': typeof PaymentRoute; '/dashboard': typeof DashboardRoute; '/chat': typeof ChatRoute }
export interface FileRoutesByTo { '/': typeof IndexRoute; '/register': typeof RegisterRoute; '/payment': typeof PaymentRoute; '/dashboard': typeof DashboardRoute; '/chat': typeof ChatRoute }
export interface FileRoutesById { __root__: typeof rootRouteImport; '/': typeof IndexRoute; '/register': typeof RegisterRoute; '/payment': typeof PaymentRoute; '/dashboard': typeof DashboardRoute; '/chat': typeof ChatRoute }
export interface FileRouteTypes { fileRoutesByFullPath: FileRoutesByFullPath; fullPaths: '/' | '/register' | '/payment' | '/dashboard' | '/chat'; fileRoutesByTo: FileRoutesByTo; to: '/' | '/register' | '/payment' | '/dashboard' | '/chat'; id: '__root__' | '/' | '/register' | '/payment' | '/dashboard' | '/chat'; fileRoutesById: FileRoutesById }
export interface RootRouteChildren { IndexRoute: typeof IndexRoute; RegisterRoute: typeof RegisterRoute; PaymentRoute: typeof PaymentRoute; DashboardRoute: typeof DashboardRoute; ChatRoute: typeof ChatRoute }

declare module '@tanstack/react-router' { interface FileRoutesByPath {
  '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
  '/register': { id: '/register'; path: '/register'; fullPath: '/register'; preLoaderRoute: typeof RegisterRouteImport; parentRoute: typeof rootRouteImport }
  '/payment': { id: '/payment'; path: '/payment'; fullPath: '/payment'; preLoaderRoute: typeof PaymentRouteImport; parentRoute: typeof rootRouteImport }
  '/dashboard': { id: '/dashboard'; path: '/dashboard'; fullPath: '/dashboard'; preLoaderRoute: typeof DashboardRouteImport; parentRoute: typeof rootRouteImport }
  '/chat': { id: '/chat'; path: '/chat'; fullPath: '/chat'; preLoaderRoute: typeof ChatRouteImport; parentRoute: typeof rootRouteImport }
}}
const rootRouteChildren: RootRouteChildren = { IndexRoute, RegisterRoute, PaymentRoute, DashboardRoute, ChatRoute }
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()
import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' { interface Register { ssr: true; router: Awaited<ReturnType<typeof getRouter>>; config: Awaited<ReturnType<typeof startInstance.getOptions>> } }
