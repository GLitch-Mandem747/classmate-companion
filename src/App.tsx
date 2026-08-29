import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import AccessDenied from "./pages/AccessDenied";
import EmailVerified from "./pages/EmailVerified";
import ProtectedRoute from "./pages/ProtectedRoute";
import NotFound from "./pages/NotFound";

import { AuthProvider } from "./hooks/useAuth";
import { UpdateNotifier } from "./components/UpdateNotifier";


const queryClient = new QueryClient();



const App = () => (

  <QueryClientProvider client={queryClient}>

    <TooltipProvider>

      <HashRouter>

        <AuthProvider>

          <Toaster />

          <Sonner />

          <UpdateNotifier />

          <Routes>


            <Route
              path="/auth"
              element={<Auth />}
            />



            <Route
              path="/email-verified"
              element={<EmailVerified />}
            />



            <Route
              path="/access-denied"
              element={<AccessDenied />}
            />



            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute requireAdmin />
              }
            >

              <Route
                index
                element={<AdminDashboard />}
              />

            </Route>




            <Route
              path="/"
              element={<ProtectedRoute />}
            >

              <Route
                index
                element={<Index />}
              />

            </Route>




            <Route
              path="*"
              element={<NotFound />}
            />


          </Routes>


        </AuthProvider>


      </HashRouter>


    </TooltipProvider>


  </QueryClientProvider>

);


export default App;