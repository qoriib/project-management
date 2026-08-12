import { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AppShell, SideNav, SideNavSection, SideNavItem, SideNavHeading, Icon,
  Text, VStack,
} from "@astryxdesign/core";
import { getDB } from "./db";
import { useAppStore } from "./store/useAppStore";

function ProjectMarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 19h16M6 19V7.5L12 4l6 3.5V19M9 19v-5h6v5M10.5 7.25h3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Pages
import Dashboard from "./pages/Dashboard";
import ProjectsPage from "./pages/master/Projects";
import CatalogPage from "./pages/master/Catalog";
import POListPage from "./pages/po/POList";
import POFormPage from "./pages/po/POForm";
import PODetailPage from "./pages/po/PODetail";
import DeliveryFormPage from "./pages/delivery/DeliveryForm";
import DeliveryHistoryPage from "./pages/delivery/DeliveryHistory";
import EquipmentLogPage from "./pages/equipment/EquipmentLog";
import InvoiceEntryPage from "./pages/billing/InvoiceEntry";
import DebtSummaryPage from "./pages/billing/DebtSummary";
import CostReportPage from "./pages/reports/CostReport";
import ExportBackupPage from "./pages/reports/ExportBackup";

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { dbReady, setDbReady, setGlobalError, sideNavCollapsed, setSideNavCollapsed } = useAppStore();

  const path = location.pathname;

  useEffect(() => {
    getDB()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error("DB init failed:", err);
        setGlobalError("Gagal membuka database. Pastikan aplikasi berjalan melalui Tauri.");
        setDbReady(true); // allow UI to render in dev mode
      });
  }, [setDbReady, setGlobalError]);

  if (!dbReady) {
    return (
      <VStack gap={2} align="center" justify="center" style={{ height: "100dvh" }}>
        <Text color="secondary">Memuat database…</Text>
      </VStack>
    );
  }

  return (
    <AppShell
      height="fill"
      variant="elevated"
      sideNav={
        <SideNav
          collapsible={{ hasButton: true, isCollapsed: sideNavCollapsed, onCollapsedChange: setSideNavCollapsed }}
          resizable={{ defaultWidth: 240, minWidth: 200, maxWidth: 320, autoSaveId: "sidenav-width" }}
          header={
            <SideNavHeading
              icon={<Icon icon={ProjectMarkIcon} size="lg" color="accent" />}
              heading="Manajemen Proyek"
            />
          }
        >
          <SideNavItem
            label="Dashboard"
            icon="dashboard"
            isSelected={path === "/" || path === "/dashboard"}
            onClick={() => navigate("/dashboard")}
          />

          <SideNavSection title="Master Data">
            <SideNavItem
              label="Proyek & Vendor"
              icon="folder"
              isSelected={path.startsWith("/master/projects")}
              onClick={() => navigate("/master/projects")}
            />
            <SideNavItem
              label="Katalog Material"
              icon="package"
              isSelected={path.startsWith("/master/catalog")}
              onClick={() => navigate("/master/catalog")}
            />
          </SideNavSection>

          <SideNavSection title="Pemesanan (PO)">
            <SideNavItem
              label="Daftar PO"
              icon="list"
              isSelected={path === "/po" || path.startsWith("/po/")}
              onClick={() => navigate("/po")}
            />
            <SideNavItem
              label="Buat PO Baru"
              icon="plus"
              isSelected={path === "/po/new"}
              onClick={() => navigate("/po/new")}
            />
          </SideNavSection>

          <SideNavSection title="Lapangan">
            <SideNavItem
              label="Input Pengiriman"
              icon="truck"
              isSelected={path === "/delivery/new"}
              onClick={() => navigate("/delivery/new")}
            />
            <SideNavItem
              label="Rekap Pengiriman"
              icon="archive"
              isSelected={path === "/delivery/history"}
              onClick={() => navigate("/delivery/history")}
            />
            <SideNavItem
              label="Log Alat Berat & Solar"
              icon="settings"
              isSelected={path.startsWith("/equipment")}
              onClick={() => navigate("/equipment")}
            />
          </SideNavSection>

          <SideNavSection title="Keuangan">
            <SideNavItem
              label="Input Tagihan"
              icon="file-text"
              isSelected={path.startsWith("/billing/invoice")}
              onClick={() => navigate("/billing/invoice")}
            />
            <SideNavItem
              label="Manajemen Utang"
              icon="credit-card"
              isSelected={path.startsWith("/billing/debt")}
              onClick={() => navigate("/billing/debt")}
            />
          </SideNavSection>

          <SideNavSection title="Laporan">
            <SideNavItem
              label="Laporan Biaya"
              icon="bar-chart"
              isSelected={path.startsWith("/reports/cost")}
              onClick={() => navigate("/reports/cost")}
            />
            <SideNavItem
              label="Export & Backup"
              icon="download"
              isSelected={path.startsWith("/reports/export")}
              onClick={() => navigate("/reports/export")}
            />
          </SideNavSection>
        </SideNav>
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/master/projects" element={<ProjectsPage />} />
        <Route path="/master/catalog" element={<CatalogPage />} />

        <Route path="/po" element={<POListPage />} />
        <Route path="/po/new" element={<POFormPage />} />
        <Route path="/po/:id" element={<PODetailPage />} />
        <Route path="/po/:id/edit" element={<POFormPage />} />

        <Route path="/delivery/new" element={<DeliveryFormPage />} />
        <Route path="/delivery/history" element={<DeliveryHistoryPage />} />

        <Route path="/equipment" element={<EquipmentLogPage />} />

        <Route path="/billing/invoice" element={<InvoiceEntryPage />} />
        <Route path="/billing/debt" element={<DebtSummaryPage />} />

        <Route path="/reports/cost" element={<CostReportPage />} />
        <Route path="/reports/export" element={<ExportBackupPage />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  );
}
