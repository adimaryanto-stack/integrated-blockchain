import { createBrowserRouter } from "react-router-dom";
import { Login } from "@/pages/Login";
import { DashboardHome } from "@/pages/DashboardHome";
import { UserManagement } from "@/pages/UserManagement";
import { AuditLog } from "@/pages/AuditLog";
import { DataSourceMonitor } from "@/pages/DataSourceMonitor";
import { AiFaaConsole } from "@/pages/AiFaaConsole";
import { BankMutations } from "@/pages/BankMutations";
import { Broadcast } from "@/pages/Broadcast";
import { MasterDataWilayah } from "@/pages/MasterDataWilayah";
import { AccessControlMatrix } from "@/pages/AccessControlMatrix";
import { AiSettings } from "@/pages/AiSettings";
import { PolsekSettings } from "@/pages/PolsekSettings";
import { SchoolsSettings } from "@/pages/SchoolsSettings";
import { BankSettings } from "@/pages/BankSettings";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/", element: <DashboardHome /> },
  { path: "/users", element: <UserManagement /> },
  { path: "/audit-log", element: <AuditLog /> },
  { path: "/data-sources", element: <DataSourceMonitor /> },
  { path: "/ai-faa", element: <AiFaaConsole /> },
  { path: "/ai-settings", element: <AiSettings /> },
  { path: "/polsek-settings", element: <PolsekSettings /> },
  { path: "/schools-settings", element: <SchoolsSettings /> },
  { path: "/bank-settings", element: <BankSettings /> },
  { path: "/bank-mutations", element: <BankMutations /> },
  { path: "/broadcast", element: <Broadcast /> },
  { path: "/wilayah", element: <MasterDataWilayah /> },
  { path: "/access-control", element: <AccessControlMatrix /> },
]);
