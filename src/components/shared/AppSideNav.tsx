import { useNavigate } from "@tanstack/react-router";
import { Heading, SideNav, SideNavHeading, SideNavItem, SideNavSection, Text, VStack } from "@astryxdesign/core";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { APP, getUserRole } from "@/configs/app.config";

export function AppSideNav() {
  const navigate = useNavigate();
  const userRole = getUserRole();

  const { activeNav, setActiveNav, selectedProjectId } = useAppStore(
    useShallow((s) => ({
      activeNav: s.activeNav,
      selectedProjectId: s.selectedProjectId,
      setActiveNav: s.setActiveNav,
    })),
  );

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
        <VStack paddingInline={2}>
          <Text weight="normal" color="secondary">
            {userRole}
          </Text>
          <Heading level={3}>{APP.companyName}</Heading>
        </VStack>
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
