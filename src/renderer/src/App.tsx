// React
import { createHashRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { useEffect } from "react";

// Components & Pages
import NavBar from "./components/navbar";
import Agenda from "./pages/agenda";
import Dashboard from "./pages/dashboard";
import Expenses from "./pages/expenses";
import Notes from "./pages/notes";
import Revenue from "./pages/revenue";
import Settings from "./pages/settings";
import { updateRecurring } from "./components/support";

// Auth
import { createClient } from "@supabase/supabase-js";

// External
import "./global.css";
import "./layouts.css";
import * as Sentry from "@sentry/electron/renderer";

Sentry.init({
  dsn: "https://1c08a05bf43a9d508cdf18e2d9ff25e5@o4507732393525248.ingest.de.sentry.io/4507787898847312",
});

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
declare const bootstrap: any;

// Supabase create client from oauth
export const supabase = createClient(supabaseUrl, supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      flowType: "pkce"
    }
  }
)

async function finish_load() {
  try {
    // Enable boostrap tooltip
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].forEach(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));


    // Update all recurring receipts
    await updateRecurring("revenue");
    await updateRecurring("expense");
    // Update Login Session
    window.onUpdateSession(async (value: string) => {
      // Get session using code
      const { data, error } = await supabase.auth.exchangeCodeForSession(value);

      if (error) {
        window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v002`);
        console.error(error)
        return;
      }

      // store local the email and username for fast acess
      localStorage.setItem("user:email", data.user.email ?? '')
      localStorage.setItem("user:name", data.user.user_metadata.full_name)
      window.location.reload();
    });

  } catch (error) {
    window.api.showError(`Something has gone wrong. Please report the error.\nError code: 1.0v001`);
    console.error(error);
  }
};

const router = createHashRouter(
  createRoutesFromElements(
    <Route path="/" element={<NavBar />}>
      <Route index element={<Dashboard />} />
      <Route path="revenue" element={<Revenue />} />
      <Route path="expenses" element={<Expenses />} />
      <Route path="agenda" element={<Agenda />} />
      <Route path="notes" element={<Notes />} />
      <Route path="settings" element={<Settings />} />
    </Route>
  )
);

export default function App() {
  useEffect(() => {
    finish_load();
  }, []);

  return (
    <div className="grid-container" style={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}>
      <RouterProvider router={router} />
    </div>
  );
}