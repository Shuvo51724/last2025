import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomization } from "@/contexts/CustomizationContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Shield, UserCog } from "lucide-react";

export default function DashboardHeader() {
  const [location, setLocation] = useLocation();
  const { logout, user, userRole } = useAuth();
  const { customization } = useCustomization();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const getFeatureToggles = () => {
    const stored = localStorage.getItem("dob_feature_toggles");
    if (stored) {
      return JSON.parse(stored);
    }
    return { 
      voiceArtistEnabled: true, 
      attendanceEnabled: true,
      workFlowEnabled: true,
      videoUploadTimeEnabled: true,
      assignmentEnabled: true
    };
  };

  const featureToggles = getFeatureToggles();

  const allTabs = [
    { path: "/", label: "Dashboard", requiredRole: null, feature: null },
    { path: "/chat-box", label: "Chat Box", requiredRole: null, feature: null },
    { path: "/assignment", label: "Assignment", requiredRole: null, feature: "assignment" },
    { path: "/voice-artist", label: "Voice Artist", requiredRole: null, feature: "voiceArtist" },
    { path: "/attendance", label: "Attendance", requiredRole: null, feature: "attendance" },
    { path: "/work-flow", label: "Work Flow", requiredRole: null, feature: "workFlow" },
    { path: "/video-upload-time", label: "Video Upload", requiredRole: null, feature: "videoUploadTime" },
    { path: "/complaint-box", label: "Complaint Box", requiredRole: null, feature: null },
    { path: "/requisition-sheet", label: "Requisition", requiredRole: "admin", feature: null },
    { path: "/expense-sheet", label: "Expense", requiredRole: "admin", feature: null },
    { path: "/employee-data", label: "Employee Data", requiredRole: "admin", feature: null },
    { path: "/jela-reporter-data", label: "Jela Reporter", requiredRole: "admin", feature: null },
    { path: "/rankings", label: "Rankings", requiredRole: "admin", feature: null },
    { path: "/admin", label: "Admin", requiredRole: "admin", feature: null },
  ];

  const tabs = allTabs.filter((tab) => {
    if (tab.requiredRole && userRole !== tab.requiredRole) return false;
    if (tab.feature === "voiceArtist" && !featureToggles.voiceArtistEnabled) return false;
    if (tab.feature === "attendance" && !featureToggles.attendanceEnabled) return false;
    if (tab.feature === "workFlow" && !featureToggles.workFlowEnabled) return false;
    if (tab.feature === "videoUploadTime" && !featureToggles.videoUploadTimeEnabled) return false;
    if (tab.feature === "assignment" && !featureToggles.assignmentEnabled) return false;
    return true;
  });

  const getRoleBadge = () => {
    if (userRole === "admin") {
      return (
        <Badge variant="default" className="gap-1 bg-yellow-500 hover:bg-yellow-600">
          <Shield className="w-3 h-3" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <UserCog className="w-3 h-3" />
        Employee
      </Badge>
    );
  };

  return (
    <header className="border-b bg-card">
      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {customization.logoUrl && (
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={customization.logoUrl} alt={`${customization.appName} Logo`} className="w-full h-full object-contain" />
              </div>
            )}
            <div>
              <h1 className="font-semibold text-base">{customization.appName}</h1>
              <p className="text-xs text-muted-foreground">Performance Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Logged in as:</span>
                {getRoleBadge()}
              </div>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-2"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.path}
              onClick={() => setLocation(tab.path)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                location === tab.path
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
              data-testid={`tab-${tab.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
