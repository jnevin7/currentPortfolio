import { useState, useEffect } from "react";
import { api } from "../api";
import ConsentModal from "../components/ConsentModal";
import PatientDashboard from "../components/PatientDashboard";
import CaseResult from "../components/CaseResult";
import CreateCaseCard from "../sections/CreateCaseCard";
import MyCasesCard from "../sections/MyCasesCard";
import BookAppointmentCard from "../sections/BookAppointmentCard";
import MyAppointmentsCard from "../sections/MyAppointmentsCard";

const TABS = [
  { id: "dashboard", label: "🏠 Dashboard"   },
  { id: "cases",     label: "📋 My Reports"  },
  { id: "book",      label: "📅 Book Visit"  },
  { id: "appts",     label: "🗓 Visits"      },
];

export default function PatientPage({ user, consented, onConsent }) {
  const [tab,      setTab]      = useState("dashboard");
  const [cases,    setCases]    = useState([]);
  const [doctors,  setDoctors]  = useState([]);
  const [appts,    setAppts]    = useState([]);
  const [selected, setSelected] = useState(null);

  async function loadAll() {
    try {
      const [c, d, a] = await Promise.all([api.myCases(), api.doctors(), api.myAppts()]);
      setCases(c); setDoctors(d); setAppts(a);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { loadAll(); }, []);

  return (
    <>
      {!consented && (
        <ConsentModal onAccept={async () => { await api.consent(); onConsent(); }} />
      )}

      <div className="page-tabs">
        {TABS.map(t => (
          <button key={t.id}
            className={`page-tab ${tab === t.id ? "page-tab-active" : ""}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <PatientDashboard
          user={user} cases={cases} appts={appts}
          onSubmitCase={() => setTab("cases")}
          onOpenCase={(c) => setSelected(c)}
        />
      )}
      {tab === "cases" && (
        <>
          <CreateCaseCard consented={consented} onCreated={loadAll} />
          <MyCasesCard cases={cases} />
        </>
      )}
      {tab === "book" && (
        <BookAppointmentCard doctors={doctors} cases={cases}
          onBooked={() => { loadAll(); setTab("appts"); }} />
      )}
      {tab === "appts" && <MyAppointmentsCard appts={appts} />}

      {selected && (
        <CaseResult c={selected} onClose={() => setSelected(null)} onUpdated={loadAll} />
      )}
    </>
  );
}
