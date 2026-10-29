"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Check, Copy, Link2, RotateCcw } from "lucide-react";
import { SALES_UTM_PARAMS } from "@/config/utm";
import { generateTrackingUrl } from "@/lib/tracking-url";

type CopyStatus = "idle" | "copied" | "failed";

const COPY_FEEDBACK_MS = 3000;

/**
 * Copies text using the async Clipboard API, falling back to the legacy
 * selection-based copy (e.g. when the app is opened over plain HTTP on a
 * local network, where navigator.clipboard is unavailable).
 */
async function copyText(text: string, fallbackField: HTMLTextAreaElement | null) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy method.
  }
  if (!fallbackField) return false;
  try {
    fallbackField.focus();
    fallbackField.select();
    return document.execCommand("copy");
  } catch {
    return false;
  }
}

export function LinkGenerator() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    originalUrl: string;
    trackingUrl: string;
  } | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const outputId = useId();

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  function resetCopyStatus() {
    if (copyTimer.current) clearTimeout(copyTimer.current);
    setCopyStatus("idle");
  }

  function handleInputChange(value: string) {
    setInput(value);
    // Any edit invalidates the previous result so a stale link isn't shared.
    setError(null);
    setResult(null);
    resetCopyStatus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetCopyStatus();
    const generated = generateTrackingUrl(input);
    if (generated.ok) {
      setError(null);
      setResult({
        originalUrl: generated.originalUrl,
        trackingUrl: generated.trackingUrl,
      });
    } else {
      setResult(null);
      setError(generated.error);
      inputRef.current?.focus();
    }
  }

  async function handleCopy() {
    if (!result) return;
    const copied = await copyText(result.trackingUrl, outputRef.current);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    setCopyStatus(copied ? "copied" : "failed");
    if (copied) {
      copyTimer.current = setTimeout(() => setCopyStatus("idle"), COPY_FEEDBACK_MS);
    }
  }

  function handleReset() {
    setInput("");
    setError(null);
    setResult(null);
    resetCopyStatus();
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-6">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-900">
          NewJaisa website URL
        </label>
        <p id={hintId} className="mt-1 text-sm text-slate-600">
          Paste a product, collection, page, or blog link from newjaisa.com.
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={input}
          onChange={(event) => handleInputChange(event.target.value)}
          placeholder="https://newjaisa.com/products/refurbished-dell-latitude"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          className={`mt-3 block w-full rounded-lg border bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
            error
              ? "border-red-500 focus-visible:ring-red-500"
              : "border-slate-300 focus-visible:border-brand focus-visible:ring-brand"
          }`}
        />

        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-2 flex items-start gap-1.5 text-sm font-medium text-red-700"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-base font-semibold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <Link2 className="size-5" aria-hidden="true" />
            Generate Tracking Link
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset
          </button>
        </div>
      </form>

      {result && (
        <section
          aria-labelledby={`${outputId}-heading`}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2
            id={`${outputId}-heading`}
            className="text-lg font-semibold text-slate-900"
          >
            Your tracking link is ready
          </h2>

          <label
            htmlFor={outputId}
            className="mt-4 block text-sm font-semibold text-slate-900"
          >
            Tracking link (share this with the customer)
          </label>
          <textarea
            ref={outputRef}
            id={outputId}
            readOnly
            rows={3}
            value={result.trackingUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 block w-full resize-none rounded-lg border border-brand/40 bg-brand-light px-4 py-3 font-mono text-sm break-all text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-base font-semibold text-white hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              {copyStatus === "copied" ? (
                <Check className="size-5" aria-hidden="true" />
              ) : (
                <Copy className="size-5" aria-hidden="true" />
              )}
              {copyStatus === "copied" ? "Copied" : "Copy Link"}
            </button>
            <p aria-live="polite" className="text-sm font-medium">
              {copyStatus === "copied" && (
                <span className="text-green-700">Link copied successfully!</span>
              )}
              {copyStatus === "failed" && (
                <span className="text-red-700">
                  Couldn&apos;t copy automatically. Please select the link above and
                  copy it manually.
                </span>
              )}
            </p>
          </div>

          <dl className="mt-6 space-y-4 border-t border-slate-200 pt-5 text-sm">
            <div>
              <dt className="font-semibold text-slate-700">Original URL</dt>
              <dd className="mt-1 font-mono break-all text-slate-600">
                {result.originalUrl}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-700">Tracking parameters added</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {Object.entries(SALES_UTM_PARAMS).map(([key, value]) => (
                  <code
                    key={key}
                    className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700"
                  >
                    {key}={value}
                  </code>
                ))}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
