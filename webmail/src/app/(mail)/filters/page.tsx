"use client";

import { useCallback, useEffect, useState } from "react";
import {
  labels as labelsApi,
  mail,
  rules as rulesApi,
  type Folder,
  type LabelWithCount,
  type Rule,
  type RuleActions,
} from "@/lib/api";
import { Button, Input, Spinner } from "@/components/ui";
import { SEARCH_HELP } from "@/lib/search-tokens";
import { cn } from "@/lib/cn";

/**
 * Filters.
 *
 * The editor is the search box, because a rule *is* a search: the same
 * grammar, the same operators, the same code deciding what matches. So the
 * page teaches one thing rather than two, and the live match count is the
 * actual search running — a preview that cannot flatter the rule it describes.
 */

const BLANK: Draft = { name: "", query: "", actions: {} };

interface Draft {
  name: string;
  query: string;
  actions: RuleActions;
}

/** A one-line English reading of what a rule does, for the list. */
function describe(actions: RuleActions, labels: LabelWithCount[], folders: Folder[]): string {
  const parts: string[] = [];
  const named = (actions.addLabelIds ?? [])
    .map((id) => labels.find((l) => l.id === id)?.name)
    .filter(Boolean);
  if (named.length) parts.push(`label ${named.map((n) => `“${n}”`).join(", ")}`);
  if (actions.markRead) parts.push("mark read");
  if (actions.star) parts.push("star");
  if (actions.trash) parts.push("move to Trash");
  else if (actions.moveToFolderId) {
    const folder = folders.find((f) => f.id === actions.moveToFolderId);
    parts.push(`move to ${folder?.name ?? "a folder"}`);
  }
  if (actions.stop) parts.push("and stop");
  return parts.length ? parts.join(", ") : "do nothing";
}

export default function FiltersPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [labels, setLabels] = useState<LabelWithCount[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [matches, setMatches] = useState<number | null>(null);
  const [unknown, setUnknown] = useState<string[]>([]);
  const [applyToExisting, setApplyToExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const [r, l, f] = await Promise.all([
      rulesApi.list(),
      labelsApi.list().catch(() => ({ labels: [] as LabelWithCount[] })),
      mail.folders().catch(() => ({ folders: [] as Folder[] })),
    ]);
    setRules(r.rules);
    setLabels(l.labels);
    setFolders(f.folders);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * The live match count. Debounced because it is a real search over the whole
   * mailbox, and typing `from:` a character at a time should not run five.
   */
  useEffect(() => {
    const q = draft.query.trim();
    if (!q) {
      setMatches(null);
      setUnknown([]);
      return;
    }
    const timer = setTimeout(() => {
      rulesApi
        .preview(q)
        .then((res) => {
          setMatches(res.matches);
          setUnknown(res.unknownOperators);
        })
        .catch(() => setMatches(null));
    }, 350);
    return () => clearTimeout(timer);
  }, [draft.query]);

  function toggleLabel(id: string) {
    setDraft((d) => {
      const on = d.actions.addLabelIds ?? [];
      return {
        ...d,
        actions: {
          ...d.actions,
          addLabelIds: on.includes(id) ? on.filter((x) => x !== id) : [...on, id],
        },
      };
    });
  }

  function setAction<K extends keyof RuleActions>(key: K, value: RuleActions[K]) {
    setDraft((d) => ({ ...d, actions: { ...d.actions, [key]: value } }));
  }

  const doesNothing =
    (draft.actions.addLabelIds?.length ?? 0) === 0 &&
    !draft.actions.moveToFolderId &&
    !draft.actions.markRead &&
    !draft.actions.star &&
    !draft.actions.trash;

  async function save() {
    setError(null);
    setNotice(null);
    if (!draft.name.trim()) return setError("Give the filter a name.");
    if (!draft.query.trim()) return setError("A filter needs something to match.");
    if (doesNothing) return setError("A filter has to do something.");

    setSaving(true);
    try {
      if (editingId) {
        await rulesApi.update(editingId, draft);
        setNotice("Filter saved.");
      } else {
        const made = await rulesApi.create({ ...draft, applyToExisting });
        setNotice(
          applyToExisting
            ? `Filter saved and applied to ${made.applied} message${made.applied === 1 ? "" : "s"}.`
            : "Filter saved.",
        );
      }
      setDraft(BLANK);
      setEditingId(null);
      setApplyToExisting(false);
      await refresh();
    } catch {
      setError("Couldn't save that filter.");
    } finally {
      setSaving(false);
    }
  }

  function edit(rule: Rule) {
    setDraft({ name: rule.name, query: rule.query, actions: rule.actions ?? {} });
    setEditingId(rule.id);
    setError(null);
    setNotice(null);
  }

  async function run(rule: Rule) {
    const res = await rulesApi.run(rule.id);
    setNotice(
      `Applied to ${res.applied} message${res.applied === 1 ? "" : "s"}${
        res.limited ? " (the first 500 — run it again for more)" : ""
      }.`,
    );
    await refresh();
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-ink-faint">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  const movableFolders = folders.filter((f) => f.systemType !== "outbox" && f.systemType !== "snoozed");

  return (
    <div className="fade-in h-full overflow-y-auto px-6 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl text-ink">Filters</h1>
        <p className="mt-1 mb-6 text-sm text-ink-soft">
          A filter is a search plus what to do with what it finds. Anything you can type in the
          search box works here.
        </p>

        {/* --- the editor ------------------------------------------------- */}
        <div className="mb-8 rounded-sm border border-hairline bg-paper-raised p-6">
          <h2 className="mb-4 font-display text-lg text-ink">
            {editingId ? "Edit filter" : "New filter"}
          </h2>

          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Name
          </label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Roof job mail"
            maxLength={80}
          />

          <label className="mt-4 mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            When a message matches
          </label>
          <Input
            value={draft.query}
            onChange={(e) => setDraft((d) => ({ ...d, query: e.target.value }))}
            placeholder="from:roofer@example.com has:attachment"
            maxLength={500}
          />

          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11px]">
            {matches !== null && (
              <span className="text-ink-faint" data-testid="match-count">
                Matches {matches} message{matches === 1 ? "" : "s"} in your mailbox right now
                {matches === 500 ? " (at least)" : ""}.
              </span>
            )}
            {unknown.length > 0 && (
              <span className="text-danger">
                Not an operator: {unknown.join(", ")} — searched as plain text.
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {SEARCH_HELP.filter((h) => h.insert !== false).map((h) => (
              <button
                key={h.token}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    query: d.query.trim() ? `${d.query.trim()} ${h.token}` : h.token,
                  }))
                }
                title={`Add ${h.token}`}
                className="flex items-baseline gap-1 rounded-sm border border-hairline px-1.5 py-0.5 text-[11px] hover:border-hairline-strong"
              >
                <code className="font-mono text-ink">{h.token}</code>
                <span className="text-ink-faint">{h.label}</span>
              </button>
            ))}
          </div>

          <label className="mt-5 mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Do this
          </label>

          {labels.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-[11px] text-ink-faint">Add labels</p>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l) => {
                  const on = (draft.actions.addLabelIds ?? []).includes(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => toggleLabel(l.id)}
                      aria-pressed={on}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                        on
                          ? "border-accent bg-accent-soft text-accent-strong"
                          : "border-hairline text-ink-soft hover:border-hairline-strong",
                      )}
                    >
                      {l.color && (
                        <span style={{ background: l.color }} className="h-2 w-2 rounded-full" />
                      )}
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={draft.actions.markRead ?? false}
                onChange={(e) => setAction("markRead", e.target.checked)}
                className="h-3.5 w-3.5 accent-accent"
              />
              Mark as read
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={draft.actions.star ?? false}
                onChange={(e) => setAction("star", e.target.checked)}
                className="h-3.5 w-3.5 accent-accent"
              />
              Star it
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={draft.actions.trash ?? false}
                onChange={(e) => setAction("trash", e.target.checked)}
                className="h-3.5 w-3.5 accent-accent"
              />
              Move to Trash
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={draft.actions.stop ?? false}
                onChange={(e) => setAction("stop", e.target.checked)}
                className="h-3.5 w-3.5 accent-accent"
              />
              Stop after this one
            </label>
          </div>

          {!draft.actions.trash && movableFolders.length > 0 && (
            <div className="mt-3">
              <label className="mb-1 block text-[11px] text-ink-faint">Move to a folder</label>
              <select
                value={draft.actions.moveToFolderId ?? ""}
                onChange={(e) => setAction("moveToFolderId", e.target.value || undefined)}
                className="rounded-sm border border-hairline bg-paper px-2 py-1.5 text-xs text-ink"
              >
                <option value="">Leave where it is</option>
                {movableFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!editingId && (
            <label className="mt-4 flex items-center gap-1.5 text-xs text-ink-soft">
              <input
                type="checkbox"
                checked={applyToExisting}
                onChange={(e) => setApplyToExisting(e.target.checked)}
                className="h-3.5 w-3.5 accent-accent"
              />
              Also apply it to mail already here
            </label>
          )}

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          {notice && <p className="mt-3 text-sm text-accent-strong">{notice}</p>}

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <Spinner />}
              {editingId ? "Save changes" : "Create filter"}
            </Button>
            {editingId && (
              <button
                onClick={() => {
                  setDraft(BLANK);
                  setEditingId(null);
                }}
                className="text-xs font-medium text-ink-faint hover:text-ink"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* --- what already exists ---------------------------------------- */}
        <h2 className="mb-2 font-display text-lg text-ink">
          {rules.length} filter{rules.length === 1 ? "" : "s"}
        </h2>
        <p className="mb-3 text-xs text-ink-faint">
          They run in this order on every message that arrives.
        </p>

        {rules.length === 0 && (
          <p className="rounded-sm border border-hairline bg-paper-raised px-4 py-6 text-center text-sm text-ink-faint">
            None yet. Mail arrives exactly as sent.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "rounded-sm border border-hairline bg-paper-raised px-4 py-3",
                !rule.enabled && "opacity-60",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-ink">{rule.name}</span>
                <div className="flex shrink-0 items-center gap-3 text-[11px] font-medium">
                  <button onClick={() => edit(rule)} className="text-accent hover:underline">
                    Edit
                  </button>
                  <button onClick={() => void run(rule)} className="text-accent hover:underline">
                    Run now
                  </button>
                  <button
                    onClick={async () => {
                      await rulesApi.update(rule.id, { enabled: !rule.enabled });
                      await refresh();
                    }}
                    className="text-ink-faint hover:text-ink"
                  >
                    {rule.enabled ? "Turn off" : "Turn on"}
                  </button>
                  <button
                    onClick={async () => {
                      await rulesApi.remove(rule.id);
                      await refresh();
                    }}
                    className="text-danger hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-1 font-mono text-xs text-ink-soft">{rule.query}</p>
              <p className="mt-0.5 text-xs text-ink-faint">
                → {describe(rule.actions ?? {}, labels, folders)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
