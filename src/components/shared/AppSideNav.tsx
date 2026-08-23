import { useNavigate } from "@tanstack/react-router";
import { HStack, SideNav, SideNavHeading, SideNavItem, SideNavSection, Text, VStack } from "@astryxdesign/core";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { APP, getUserRole } from "@/configs/app.config";
import sbrLight from "@/assets/branding/sbr-logo-lighttheme.png";
import sbrDark from "@/assets/branding/sbr-logo-darktheme.png";

export function AppSideNav() {
  const navigate = useNavigate();
  const userRole = getUserRole();

  const { activeNav, setActiveNav, selectedProjectId, resolvedMode } = useAppStore(
    useShallow((s) => ({
      activeNav: s.activeNav,
      selectedProjectId: s.selectedProjectId,
      setActiveNav: s.setActiveNav,
      resolvedMode: s.resolvedMode,
    })),
  );

  const sbrLogo = resolvedMode === "dark" ? sbrDark : sbrLight;

  const projects = useMasterStore((state) => state.projects);
  const activeProject = projects.find((p) => p.project_id === selectedProjectId);

  return (
    <SideNav
      header={
        <SideNavHeading
          heading={activeProject ? activeProject.project_name : APP.title}
          subheading={
            activeProject
              ? `${activeProject.company_name} - ${activeProject.fiscal_year}`
              : "Pilih Proyek di Master Data"
          }
        />
      }
      footer={
        <HStack gap={1} align="center">
          <img
            src={sbrLogo}
            alt="SBR Logo"
            height={46}
            style={{ height: 46, width: "auto", objectFit: "contain", flexShrink: 0 }}
          />
          <VStack gap={0}>
            <Text size="base" weight="semibold">
              {APP.companyName}
            </Text>
            <Text size="base" weight="normal" color="secondary">
              {userRole}
            </Text>
          </VStack>
        </HStack>
      }
    >
      <SideNavSection title="Menu Utama" isHeaderHidden>
        {APP.sidenav.map((sidenavItem) => {
          if (sidenavItem.subitems) {
            return (
              <SideNavItem
                key={sidenavItem.label}
                label={sidenavItem.label}
                icon={sidenavItem.icon}
                collapsible={{ defaultIsCollapsed: true }}
              >
                {sidenavItem.subitems.map((sub) => (
                  <SideNavItem
                    key={sub.href}
                    label={sub.label}
                    isSelected={checkIsNavSelected(activeNav, sub.href)}
                    onClick={() => {
                      setActiveNav(sub.href);
                      navigate({ to: sub.href });
                    }}
                  />
                ))}
              </SideNavItem>
            );
          }

          return (
            <SideNavItem
              key={sidenavItem.href}
              label={sidenavItem.label}
              icon={sidenavItem.icon}
              isSelected={checkIsNavSelected(activeNav, sidenavItem.href)}
              onClick={() => {
                setActiveNav(sidenavItem.href!);
                navigate({ to: sidenavItem.href! });
              }}
            />
          );
        })}
      </SideNavSection>
    </SideNav>
  );
}

const checkIsNavSelected = (activeNav: string, href?: string) => {
  if (!href) return false;
  if (href === "/") return activeNav === "/";
  return activeNav === href || activeNav.startsWith(`${href}/`);
};
