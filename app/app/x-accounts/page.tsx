"use client";

// ============================================
// MULTI-X ACCOUNTS PAGE (temporary feature)
// ============================================
// Manage several X (Twitter) accounts at once. Delete this file + the sidebar
// entry to remove the UI.
// ============================================

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components-beta/Button";
import { Card } from "@/components/ui/card";
import multiX, { XAccount } from "@/lib/multi-x";
import {
  CheckCircleIcon,
  PlusIcon,
  PaperPlaneTiltIcon,
  StarIcon,
  TrashIcon,
  ArrowClockwiseIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

const StatusPill = ({ status }: { status: XAccount["status"] }) => {
  const tone =
    status === "connected"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : status === "expired"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : "bg-red-500/15 text-red-600 dark:text-red-400";
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${tone}`}>{status}</span>;
};

export default function XAccountsPage() {
  const [accounts, setAccounts] = useState<XAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const [composerText, setComposerText] = useState("");
  const [composerTarget, setComposerTarget] = useState<string>("all");
  const [posting, setPosting] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [importToken, setImportToken] = useState("");
  const [importRefresh, setImportRefresh] = useState("");
  const [importLabel, setImportLabel] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await multiX.list();
      setAccounts(data.accounts || []);
    } catch (error: any) {
      setNotice({ tone: "err", text: error?.message || "Could not load X accounts" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Surface the OAuth redirect result (?x_connected=1 / ?x_error=...)
    const params = new URLSearchParams(window.location.search);
    if (params.get("x_connected") === "1") {
      setNotice({ tone: "ok", text: `Connected @${params.get("x_username") || "account"}` });
      window.history.replaceState({}, "", window.location.pathname);
      load();
    } else if (params.get("x_error")) {
      setNotice({ tone: "err", text: `Connect failed: ${params.get("x_error")}` });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [load]);

  const run = async (key: string, fn: () => Promise<any>, okText?: string) => {
    setBusy(key);
    setNotice(null);
    try {
      const result = await fn();
      if (okText) setNotice({ tone: "ok", text: okText });
      await load();
      return result;
    } catch (error: any) {
      setNotice({ tone: "err", text: error?.message || "Something went wrong" });
    } finally {
      setBusy(null);
    }
  };

  const handleConnect = () =>
    run("connect", async () => {
      const { authUrl } = await multiX.connectUrl();
      window.location.href = authUrl;
    });

  const handleImport = () =>
    run(
      "import",
      async () => {
        await multiX.importTokens({
          accessToken: importToken.trim(),
          refreshToken: importRefresh.trim() || undefined,
          label: importLabel.trim() || undefined,
        });
        setImportToken("");
        setImportRefresh("");
        setImportLabel("");
        setShowImport(false);
      },
      "Account added"
    );

  const handlePost = () =>
    run(
      "post",
      async () => {
        if (composerTarget === "all") {
          const result = await multiX.postAll(composerText);
          setNotice({
            tone: result.succeeded === result.total ? "ok" : "err",
            text: `Posted to ${result.succeeded}/${result.total} accounts`,
          });
        } else {
          await multiX.post(composerTarget, composerText);
          setNotice({ tone: "ok", text: "Posted" });
        }
        setComposerText("");
      }
    );

  useEffect(() => {
    if (busy === "post") setPosting(true);
    else setPosting(false);
  }, [busy]);

  if (loading) {
    return (
      <div className="p-7 pt-20 flex justify-center">
        <div className="loader-light" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7 pt-20 relative overflow-y-auto h-full mx-auto space-y-8 max-w-5xl">
      <div className="flex text-center flex-col">
        <div className="mx-auto mb-3 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
          Beta · temporary feature
        </div>
        <h3 className="text-[28px] font-semibold bg-clip-text bg-linear-to-b from-dark/50 to-dark dark:from-white dark:to-white/50 text-transparent">
          X Accounts
        </h3>
        <p className="text-[15px] font-medium text-dark/50 dark:text-white/50">
          Connect several X accounts and manage them all at once.
        </p>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
            notice.tone === "ok"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 text-red-600 dark:text-red-400"
          }`}
        >
          {notice.tone === "ok" ? (
            <CheckCircleIcon className="size-4 shrink-0" />
          ) : (
            <WarningCircleIcon className="size-4 shrink-0" />
          )}
          <span className="break-all">{notice.text}</span>
        </div>
      )}

      {/* Connect */}
      <div className="flex flex-wrap items-center gap-3 justify-center">
        <Button onClick={handleConnect} loading={busy === "connect"} icon={<PlusIcon />}>
          Connect an X account
        </Button>
        <Button
          variant="ghost"
          onClick={() => setShowImport((v) => !v)}
          className="rounded-full px-4 py-2 text-xs"
        >
          Add with access token
        </Button>
      </div>

      {showImport && (
        <Card className="p-4 space-y-3 bg-dark/5 dark:bg-linear-to-b from-white/3 to-white/1 border border-dark/5 dark:border-white/5 rounded-2xl">
          <p className="text-xs text-dark/50 dark:text-white/50">
            Paste tokens from an X app you already have access to. No developer-portal change
            needed.
          </p>
          <input
            value={importToken}
            onChange={(e) => setImportToken(e.target.value)}
            placeholder="Access token (required)"
            className="w-full text-xs p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-dark/5 dark:border-white/10 outline-none"
          />
          <input
            value={importRefresh}
            onChange={(e) => setImportRefresh(e.target.value)}
            placeholder="Refresh token (optional — enables auto-renew)"
            className="w-full text-xs p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-dark/5 dark:border-white/10 outline-none"
          />
          <input
            value={importLabel}
            onChange={(e) => setImportLabel(e.target.value)}
            placeholder="Label (optional, e.g. Brand)"
            className="w-full text-xs p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-dark/5 dark:border-white/10 outline-none"
          />
          <Button
            onClick={handleImport}
            loading={busy === "import"}
            disabled={!importToken.trim()}
            className="rounded-full px-4 py-2 text-xs"
          >
            Add account
          </Button>
        </Card>
      )}

      {/* Accounts */}
      <div className="space-y-3">
        {accounts.length === 0 && (
          <p className="text-center text-xs text-dark/40 dark:text-white/40">
            No X accounts connected yet.
          </p>
        )}
        {accounts.map((account) => (
          <Card
            key={account.id}
            className="p-3 flex items-center justify-between gap-4 bg-dark/5 dark:bg-linear-to-b from-white/3 to-white/1 border border-dark/3 dark:border-white/3 rounded-[20px]"
          >
            <div className="flex items-center gap-3 min-w-0">
              {account.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={account.avatarUrl}
                  alt={account.username}
                  className="size-9 rounded-full object-cover"
                />
              ) : (
                <div className="size-9 rounded-full bg-dark/10 dark:bg-white/10 grid place-items-center text-xs font-semibold">
                  {account.username.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold truncate">@{account.username}</h4>
                  {account.isDefault && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent dark:text-accent-dark flex items-center gap-1">
                      <StarIcon className="size-2.5" weight="fill" /> default
                    </span>
                  )}
                  <StatusPill status={account.status} />
                </div>
                <p className="text-[11px] text-dark/40 dark:text-white/40 truncate">
                  {account.label ? `${account.label} · ` : ""}
                  {account.displayName || account.username} · {account.source}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                title="Verify"
                onClick={() =>
                  run(account.id + ":verify", () => multiX.verify(account.id), "Token is valid")
                }
                className="p-2 rounded-full hover:bg-dark/5 dark:hover:bg-white/10"
              >
                <ArrowClockwiseIcon className="size-4" />
              </button>
              {!account.isDefault && (
                <button
                  title="Make default"
                  onClick={() =>
                    run(account.id + ":default", () => multiX.setDefault(account.id), "Default updated")
                  }
                  className="p-2 rounded-full hover:bg-dark/5 dark:hover:bg-white/10"
                >
                  <StarIcon className="size-4" />
                </button>
              )}
              <button
                title="Disconnect"
                onClick={() =>
                  run(account.id + ":remove", () => multiX.remove(account.id), "Account removed")
                }
                className="p-2 rounded-full hover:bg-red-500/10 text-red-500"
              >
                <TrashIcon className="size-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Composer */}
      {accounts.length > 0 && (
        <Card className="p-4 space-y-3 bg-dark/5 dark:bg-linear-to-b from-white/3 to-white/1 border border-dark/5 dark:border-white/5 rounded-2xl">
          <h4 className="text-sm font-semibold">Post</h4>
          <textarea
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="What do you want to post?"
            className="w-full text-xs p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-dark/5 dark:border-white/10 outline-none resize-none"
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <select
              value={composerTarget}
              onChange={(e) => setComposerTarget(e.target.value)}
              className="text-xs p-2 rounded-xl bg-white/60 dark:bg-white/5 border border-dark/5 dark:border-white/10 outline-none"
            >
              <option value="all">All accounts ({accounts.length})</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  @{account.username}
                  {account.label ? ` (${account.label})` : ""}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-dark/40 dark:text-white/40">
                {composerText.length}/280
              </span>
              <Button
                onClick={handlePost}
                loading={posting}
                disabled={!composerText.trim()}
                icon={<PaperPlaneTiltIcon />}
                className="rounded-full px-4 py-2 text-xs"
              >
                Post
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
