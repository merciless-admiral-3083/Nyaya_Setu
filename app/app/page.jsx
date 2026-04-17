"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageWrap, SiteFooter, SiteHeader } from "../../components/SiteShell";
import { saveAnalysis } from "../../lib/analysis-storage";

const SAMPLE_DOCUMENT = `This rent agreement is valid for 11 months. If the tenant leaves before 11 months, the full security deposit will be forfeited. The landlord may increase rent at any time with 7 days notice. Any dispute will be decided only by arbitration selected by the landlord.`;

export default function AppPage() {
  const [mode, setMode] = useState("paste");
  const [language, setLanguage] = useState("bilingual");
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrNote, setOcrNote] = useState("");
  const [error, setError] = useState("");
  const [isSpeechReady, setIsSpeechReady] = useState(false);
  const recognitionRef = useRef(null);
  const router = useRouter();

  const charCount = useMemo(() => text.trim().length, [text]);

  useEffect(() => {
    const Recognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
    setIsSpeechReady(Boolean(Recognition));
  }, []);

  function startVoiceInput() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Voice input is not supported in this browser. Try Chrome on Android/Desktop.");
      return;
    }

    setError("");
    const recognition = new Recognition();
    recognition.lang = language === "english" ? "en-IN" : "hi-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setError("Microphone access failed. Please allow mic permissions and try again.");
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setText((prev) => `${prev} ${transcript}`.trim());
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  async function extractTextFromImage(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setError("");
      setOcrNote("Reading image... this can take a few seconds.");
      setIsExtracting(true);

      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng+hin");
      const { data } = await worker.recognize(file);
      await worker.terminate();

      const extracted = (data?.text || "").trim();
      if (!extracted) {
        throw new Error("No text found in image. Try a clearer image with better lighting.");
      }

      setText((prev) => `${prev}\n${extracted}`.trim());
      setOcrNote(`Extracted text from ${file.name}.`);
    } catch (ocrError) {
      setError(ocrError.message || "Could not extract text from image.");
      setOcrNote("");
    } finally {
      setIsExtracting(false);
      event.target.value = "";
    }
  }

  async function runAnalysis() {
    if (!text.trim()) {
      setError("Please add document text before analysis.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setError("");

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText: text,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not analyze document right now.");
      }

      const payload = await response.json();
      saveAnalysis(payload);
      router.push("/results");
    } catch (requestError) {
      setError(requestError.message || "Unexpected error while analyzing document.");
    } finally {
      setIsAnalyzing(false);
      stopVoiceInput();
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader compact />
      <main className="flex-1 py-10 md:py-14">
        <PageWrap>
          <div className="mb-8 reveal">
            <p className="kicker">Document Lab</p>
            <h1 className="font-title mt-2 text-4xl text-[color:var(--navy)] md:text-5xl">Upload once. Understand fully.</h1>
            <p className="mt-3 max-w-3xl text-[color:var(--ink)]/80">
              Paste your legal text or use Hindi voice input. NyayaSetu sends your document to Vakil,
              Aam Aadmi, and Nyayaadheesh in parallel and returns a structured verdict.
            </p>
          </div>

          <section className="panel rounded-3xl p-5 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setMode("paste")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  mode === "paste"
                    ? "bg-[color:var(--saffron)] text-white"
                    : "border border-[color:var(--navy)]/25 bg-white text-[color:var(--navy)]"
                }`}
              >
                Paste Text
              </button>
              <button
                type="button"
                onClick={() => setMode("voice")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  mode === "voice"
                    ? "bg-[color:var(--saffron)] text-white"
                    : "border border-[color:var(--navy)]/25 bg-white text-[color:var(--navy)]"
                }`}
              >
                Voice Input
              </button>

              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage("bilingual")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    language === "bilingual" ? "bg-[color:var(--navy)] text-white" : "bg-white text-[color:var(--navy)]"
                  }`}
                >
                  Hindi + English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("english")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    language === "english" ? "bg-[color:var(--navy)] text-white" : "bg-white text-[color:var(--navy)]"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Paste legal text here. Example: rent agreement, internship bond, offer letter, RTI notice..."
                className="min-h-[280px] w-full rounded-2xl border border-[color:var(--navy)]/20 bg-white px-4 py-3 text-sm leading-relaxed text-[color:var(--ink)] outline-none ring-[color:var(--saffron)] transition focus:ring"
              />
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setText(SAMPLE_DOCUMENT)}
                  className="rounded-xl border border-[color:var(--navy)]/25 bg-white px-4 py-2 text-sm text-[color:var(--navy)]"
                >
                  Use Sample
                </button>
                <label className="rounded-xl border border-[color:var(--navy)]/25 bg-white px-4 py-2 text-center text-sm text-[color:var(--navy)] hover:cursor-pointer">
                  {isExtracting ? "Extracting Text..." : "Upload Image (OCR)"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={extractTextFromImage}
                    disabled={isExtracting}
                    className="hidden"
                  />
                </label>
                {mode === "voice" ? (
                  <button
                    type="button"
                    onClick={isListening ? stopVoiceInput : startVoiceInput}
                    disabled={!isSpeechReady}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                      isListening ? "bg-red-600" : "bg-[color:var(--saffron)]"
                    } disabled:opacity-50`}
                  >
                    {isListening ? "Stop Mic" : "Start Mic"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="rounded-xl bg-[color:var(--navy)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  {isAnalyzing ? "Analysing..." : "Run AI Sabha"}
                </button>
                <Link
                  href="/results"
                  className="rounded-xl border border-[color:var(--navy)]/25 bg-white px-4 py-2 text-center text-sm text-[color:var(--navy)]"
                >
                  View Last Result
                </Link>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-[color:var(--ink)]/65">
              <p>{charCount} characters</p>
              <p className="font-hindi">कोई लॉगिन नहीं, कोई डेटा स्टोरेज नहीं</p>
            </div>

            {ocrNote ? <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-800">{ocrNote}</p> : null}

            {error ? (
              <p className="mt-3 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}
          </section>
        </PageWrap>
      </main>
      <SiteFooter />
    </div>
  );
}
