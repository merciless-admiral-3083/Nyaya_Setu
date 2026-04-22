"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageWrap, SiteFooter, SiteHeader } from "../components/SiteShell";
import { saveAnalysis } from "../lib/analysis-storage";

const SAMPLE_DOCUMENT = `This rent agreement is valid for 11 months. If the tenant leaves before 11 months, the full security deposit will be forfeited. The landlord may increase rent at any time with 7 days notice. Any dispute will be decided only by arbitration selected by the landlord.`;

export default function AppPage() {
  const [mode, setMode] = useState("paste");
  const [language, setLanguage] = useState("bilingual");
  const [voiceLanguage, setVoiceLanguage] = useState("english");
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrNote, setOcrNote] = useState("");
  const [error, setError] = useState("");
  const [isSpeechReady, setIsSpeechReady] = useState(false);
  const recognitionRef = useRef(null);
  const processedResultIndexRef = useRef(0);
  const router = useRouter();

  const charCount = useMemo(() => text.trim().length, [text]);

  useEffect(() => {
    const Recognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
    const canUseMic = typeof window !== "undefined" && Boolean(navigator?.mediaDevices?.getUserMedia);
    setIsSpeechReady(Boolean(Recognition) || canUseMic);
  }, []);

  async function startVoiceInput() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Voice input is not supported in this browser. Use latest Chrome or Edge on HTTPS/localhost.");
      return;
    }

    setError("");
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      setError("Microphone permission is blocked. Please allow mic access in browser settings and try again.");
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new Recognition();
    recognition.lang = voiceLanguage === "hindi" ? "hi-IN" : "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    processedResultIndexRef.current = 0;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      processedResultIndexRef.current = 0;
    };
    recognition.onerror = () => {
      setError("Microphone access failed. Please allow mic permissions and try again.");
      setIsListening(false);
      processedResultIndexRef.current = 0;
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      const startIndex = Math.max(event.resultIndex, processedResultIndexRef.current);
      for (let i = startIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result?.isFinal) {
          continue;
        }

        finalTranscript += result[0]?.transcript || "";
        processedResultIndexRef.current = i + 1;
      }

      if (finalTranscript.trim()) {
        setText((prev) => `${prev} ${finalTranscript}`.trim());
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError("Could not start voice input. Please retry once after allowing microphone access.");
      setIsListening(false);
    }
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

    const preprocessImageForOcr = async (imageFile) => {
      const objectUrl = URL.createObjectURL(imageFile);
      try {
        let image;

        if (window.createImageBitmap) {
          image = await window.createImageBitmap(imageFile);
        } else {
          image = await new Promise((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Could not read image for OCR."));
            img.src = objectUrl;
          });
        }

        const maxWidth = 2200;
        const scale = image.width > maxWidth ? maxWidth / image.width : 1;
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          throw new Error("Could not prepare image canvas for OCR.");
        }

        context.drawImage(image, 0, 0, width, height);
        const imgData = context.getImageData(0, 0, width, height);
        const pixels = imgData.data;

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const contrastBoost = gray > 165 ? 255 : gray < 105 ? 0 : gray;

          pixels[i] = contrastBoost;
          pixels[i + 1] = contrastBoost;
          pixels[i + 2] = contrastBoost;
        }

        context.putImageData(imgData, 0, 0);

        const cropStartY = Math.floor(height * 0.42);
        const bodyHeight = Math.max(1, height - cropStartY);
        const bodyCanvas = document.createElement("canvas");
        bodyCanvas.width = width;
        bodyCanvas.height = bodyHeight;

        const bodyContext = bodyCanvas.getContext("2d", { willReadFrequently: true });
        if (!bodyContext) {
          throw new Error("Could not prepare body image canvas for OCR.");
        }

        bodyContext.drawImage(canvas, 0, cropStartY, width, bodyHeight, 0, 0, width, bodyHeight);

        return { fullCanvas: canvas, bodyCanvas };
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    const cleanExtractedText = (data) => {
      const normalize = (line) =>
        line
          .replace(/[“”]/g, '"')
          .replace(/[’`]/g, "'")
          .replace(/[|¦]/g, "I")
          .replace(/[~_=]{2,}/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const isLikelyNoise = (line) => {
        const compact = line.replace(/\s+/g, "");
        if (compact.length < 4) {
          return true;
        }

        const alphaNumCount = (compact.match(/[a-zA-Z0-9\u0900-\u097F]/g) || []).length;
        const ratio = alphaNumCount / compact.length;
        if (ratio < 0.55) {
          return true;
        }

        const symbolCount = (compact.match(/[^a-zA-Z0-9\u0900-\u097F]/g) || []).length;
        if (symbolCount / compact.length > 0.2) {
          return true;
        }

        if (/^[A-Z]{2,6}$/.test(compact)) {
          return true;
        }

        return /(.)\1{5,}/.test(compact);
      };

      const lines = Array.isArray(data?.lines)
        ? data.lines
            .map((line) => ({
              text: normalize((line?.text || "").trim()),
              confidence: Number(line?.confidence ?? 0),
            }))
            .filter((line) => line.text.length >= 3)
            .filter((line) => line.confidence >= 35)
            .filter((line) => !isLikelyNoise(line.text))
            .map((line) => line.text)
        : [];

      const anchorTerms = [
        "residential rental agreement",
        "this agreement",
        "whereas",
        "lessor",
        "lessee",
        "lease property",
      ];

      let anchoredLines = lines;
      const anchorIndex = lines.findIndex((line) =>
        anchorTerms.some((term) => line.toLowerCase().includes(term))
      );
      if (anchorIndex > 0) {
        anchoredLines = lines.slice(anchorIndex);
      }

      const lineText = anchoredLines.join("\n");

      const words = Array.isArray(data?.words) ? data.words : [];
      const textByConfidence =
        words.length > 0
          ? words
              .filter((word) => {
                const value = (word?.text || "").trim();
                return value && (word?.confidence ?? 0) >= 30;
              })
              .map((word) => word.text)
              .join(" ")
          : "";

      const baseText = (lineText || textByConfidence || data?.text || "").replace(/\r/g, "");
      return baseText
        .split("\n")
        .map((line) => normalize(line))
        .filter((line) => line.length >= 3)
        .filter((line) => /[a-zA-Z0-9\u0900-\u097F]/.test(line))
        .filter((line) => !/^(india non judicial|twenty rupees|rs\.?\s*20|tamil nadu)$/i.test(line))
        .join("\n");
    };

    const scoreExtractedText = (value) => {
      if (!value) {
        return 0;
      }

      const textLower = value.toLowerCase();
      const keyHits = ["agreement", "lessor", "lessee", "whereas", "tenant", "landlord"].reduce(
        (count, key) => (textLower.includes(key) ? count + 1 : count),
        0
      );

      const usefulChars = (value.match(/[a-zA-Z0-9\u0900-\u097F]/g) || []).length;
      const totalChars = Math.max(1, value.length);
      const quality = usefulChars / totalChars;
      return keyHits * 30 + value.length * 0.02 + quality * 100;
    };

    const tryExtractWithLanguage = async (tesseractModule, lang, canvases) => {
      const candidates = [];
      for (const source of [canvases.bodyCanvas, canvases.fullCanvas]) {
        const { data } = await tesseractModule.recognize(source, lang);
        const cleaned = cleanExtractedText(data);
        candidates.push(cleaned);
      }

      return candidates
        .sort((a, b) => scoreExtractedText(b) - scoreExtractedText(a))
        .find(Boolean);
    };

    try {
      setError("");
      setOcrNote("Reading image... this can take a few seconds.");
      setIsExtracting(true);

      const tesseractModule = await import("tesseract.js");
      const preprocessedCanvases = await preprocessImageForOcr(file);
      const languageAttempts = language === "bilingual" ? ["eng", "eng+hin", "hin"] : language === "english" ? ["eng", "eng+hin"] : ["hin", "eng+hin", "eng"];
      let extracted = "";

      for (const attemptLanguage of languageAttempts) {
        try {
          setOcrNote(`Reading image... trying ${attemptLanguage.toUpperCase()}.`);
          extracted = await tryExtractWithLanguage(tesseractModule, attemptLanguage, preprocessedCanvases);
          if (extracted.length >= 20) {
            break;
          }
        } catch {
          extracted = "";
        }
      }

      if (!extracted) {
        throw new Error("No text found in image. Try a clearer image with better lighting.");
      }

      setText((prev) => `${prev}\n${extracted}`.trim());
      setOcrNote(`Extracted text from ${file.name}.`);
    } catch (ocrError) {
      const message = ocrError instanceof Error ? ocrError.message : "Could not extract text from image.";
      setError(message);
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
          preferredOutputLanguage:
            mode === "voice"
              ? voiceLanguage
              : language === "english"
                ? "english"
                : undefined,
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
                  <>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setVoiceLanguage("english")}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          voiceLanguage === "english" ? "bg-[color:var(--navy)] text-white" : "bg-white text-[color:var(--navy)]"
                        }`}
                      >
                        Voice: English
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoiceLanguage("hindi")}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          voiceLanguage === "hindi" ? "bg-[color:var(--navy)] text-white" : "bg-white text-[color:var(--navy)]"
                        }`}
                      >
                        Voice: Hindi
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={isListening ? stopVoiceInput : startVoiceInput}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                        isListening ? "bg-red-600" : "bg-[color:var(--saffron)]"
                      }`}
                    >
                      {isListening ? "Stop Mic" : "Start Mic"}
                    </button>
                  </>
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
            </div>

            {ocrNote ? <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-800">{ocrNote}</p> : null}

            {!isSpeechReady && mode === "voice" ? (
              <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-800">
                Voice input works best on latest Chrome/Edge on HTTPS or localhost with microphone permission enabled.
              </p>
            ) : null}

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
