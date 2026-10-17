import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut, Moon, Sparkles, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import GoProModal from "@/components/GoProModal";
import { useTheme } from "@/hooks/use-theme";
import { cleanUsername, displayName, USERNAME_MAX } from "@/lib/display-name";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AccountDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileRow {
  is_pro: boolean;
  pro_expires_at: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "You must be signed in",
  account_required: "Code redemption requires a registered account",
  invalid_code: "Invalid code",
  already_redeemed: "This code has already been used",
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

const AccountDashboard = ({ open, onOpenChange }: AccountDashboardProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const userId = user?.id ?? null;

  const [goProOpen, setGoProOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const currentName = displayName(user);
  const nameDraft = username ?? currentName;

  const saveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanUsername(nameDraft);
    if (!clean) {
      setNameError("Use at least 2 characters.");
      return;
    }
    setNameSaving(true);
    setNameError(null);
    const { error } = await supabase.auth.updateUser({ data: { username: clean } });
    setNameSaving(false);
    if (error) {
      setNameError("Couldn't save your username. Please try again.");
      return;
    }
    setUsername(null);
    toast({ title: "Username saved" });
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ title: "Sign out failed", description: "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: "Signed out" });
    onOpenChange(false);
    navigate("/dashboard");
  };

  const [code, setCode] = useState("");
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId && open,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_pro, pro_expires_at")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const profile = profileQuery.data ?? null;
  const isPro =
    profile?.is_pro === true &&
    (profile.pro_expires_at === null ||
      new Date(profile.pro_expires_at) > new Date());

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError(null);
    setRedeemLoading(true);
    try {
      const { data, error } = await supabase.rpc("redeem_pro_code", {
        code_input: code,
      });
      if (error) {
        setRedeemError("Couldn't check that code. Please try again.");
        return;
      }
      const result = data as {
        success: boolean;
        error?: string;
        expires_at?: string;
      } | null;
      if (!result || !result.success) {
        setRedeemError(
          ERROR_MESSAGES[result?.error ?? ""] ?? "Failed to redeem code"
        );
        return;
      }
      toast({
        title: result.expires_at
          ? `Pro activated until ${formatDate(result.expires_at)}`
          : "Pro activated",
      });
      setCode("");
      await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Your name, plan and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <form onSubmit={saveUsername} className="space-y-2">
            <Label htmlFor="settings-username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Username
            </Label>
            <div className="flex gap-2">
              <Input
                id="settings-username"
                value={nameDraft}
                maxLength={USERNAME_MAX}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setNameError(null);
                }}
                disabled={nameSaving}
              />
              <Button type="submit" variant="outline" disabled={nameSaving || nameDraft.trim() === currentName}>
                {nameSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
            {nameError ? (
              <p className="text-sm text-destructive">{nameError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Shown in the app. Only you can see it.</p>
            )}
          </form>

          <div className="space-y-1">
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--fg-muted)",
              marginBottom: 4,
            }}>
              Email
            </p>
            <p className="text-sm font-medium text-foreground truncate">
              {user?.email ?? "—"}
            </p>
          </div>

          <div className="space-y-1">
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--fg-muted)",
              marginBottom: 4,
            }}>
              Plan
            </p>
            {profileQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : isPro ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--accent)",
                  background: "var(--accent-soft)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  color: "var(--accent)",
                }}>
                  Pro
                </span>
                {profile?.pro_expires_at && (
                  <span style={{ fontSize: 13, color: "var(--fg-muted)" }}>
                    expires {formatDate(profile.pro_expires_at)}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span style={{ fontSize: 13, color: "var(--fg)" }}>Free plan</span>
                <Button type="button" size="sm" onClick={() => setGoProOpen(true)} className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Go Pro
                </Button>
              </div>
            )}
          </div>

          <form onSubmit={handleRedeem} className="space-y-2 pt-2 border-t border-border/50">
            <Label
              htmlFor="redeem-code"
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--fg-muted)",
                marginBottom: 4,
              }}
            >
              Pro access code
            </Label>
            <p className="text-xs text-muted-foreground">
              Have a Pro access code from StudyBuddy? Enter it here to unlock Pro on this account.
            </p>
            <div className="flex gap-2">
              <Input
                id="redeem-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setRedeemError(null);
                }}
                placeholder="Enter code"
                disabled={redeemLoading}
                style={{
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
              <Button type="submit" disabled={redeemLoading || !code.trim()}>
                {redeemLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redeeming…
                  </>
                ) : (
                  "Redeem"
                )}
              </Button>
            </div>
            {redeemError && (
              <p className="text-sm text-destructive">{redeemError}</p>
            )}
          </form>

          <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-4">
            <Label htmlFor="settings-theme" className="flex items-center gap-2 text-sm font-medium">
              {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Dark theme
            </Label>
            <Switch id="settings-theme" checked={isDark} onCheckedChange={toggleTheme} />
          </div>

          <Button type="button" variant="outline" onClick={handleSignOut} className="w-full gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
        <GoProModal open={goProOpen} onOpenChange={setGoProOpen} />
      </DialogContent>
    </Dialog>
  );
};

export default AccountDashboard;
