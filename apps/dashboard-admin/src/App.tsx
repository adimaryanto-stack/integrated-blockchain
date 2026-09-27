import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AdminStoreProvider } from "./store/adminStore";

export default function App() {
  return (
    <AdminStoreProvider>
      <RouterProvider router={router} />
    </AdminStoreProvider>
  );
}
