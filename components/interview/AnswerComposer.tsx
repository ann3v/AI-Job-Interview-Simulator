"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { SectionCard } from "@/components/interview/SectionCard";
import { MAX_ANSWER_LENGTH } from "@/lib/interview";

type SpeechSupportState = "checking" | "supported" | "unsupported";

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type AnswerComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error: string | null;
  loading: boolean;
};

function getSpeechSupportSnapshot(): SpeechSupportState {
  if (typeof window === "undefined") {
    return "checking";
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition
    ? "supported"
    : "unsupported";
}

function subscribeToSpeechSupport() {
  return () => {};
}

export function AnswerComposer({
  value,
  onChange,
  onSubmit,
  error,
  loading,
}: AnswerComposerProps) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const committedTranscriptRef = useRef("");
  const latestValueRef = useRef(value);
  const speechSupport = useSyncExternalStore(
    subscribeToSpeechSupport,
    getSpeechSupportSnapshot,
    () => "checking"
  );
  const [isListening, setIsListening] = useState(false);
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);
  const trimmedLength = value.trim().length;
  const isSubmitDisabled = loading || trimmedLength === 0;
  const isSpeechSupported = speechSupport === "supported";
  const isSpeechDisabled = loading || !isSpeechSupported;

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
  }, []);

  useEffect(() => {
    if (loading && isListening) {
      recognitionRef.current?.stop();
    }
  }, [isListening, loading]);

  function appendTranscript(transcript: string) {
    const cleanTranscript = transcript.replace(/\s+/g, " ").trim();

    if (!cleanTranscript) {
      return;
    }

    const latestValue = latestValueRef.current;
    const nextValue = latestValue.trim()
      ? `${latestValue.trimEnd()} ${cleanTranscript}`
      : cleanTranscript;

    onChange(nextValue.slice(0, MAX_ANSWER_LENGTH));
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechMessage("Voice input is not supported in this browser.");
      return;
    }

    try {
      recognitionRef.current?.abort();

      const recognition = new SpeechRecognition();
      committedTranscriptRef.current = "";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result[0]?.transcript ?? "";

          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript.trim()) {
          committedTranscriptRef.current += ` ${finalTranscript.trim()}`;
          appendTranscript(committedTranscriptRef.current);
          committedTranscriptRef.current = "";
        }

        setSpeechMessage(
          interimTranscript.trim()
            ? `Listening: ${interimTranscript.trim()}`
            : "Listening..."
        );
      };

      recognition.onerror = (event) => {
        const message =
          event.error === "not-allowed"
            ? "Microphone permission was blocked. Allow microphone access and try again."
            : "Voice input stopped. You can try the microphone again.";

        setSpeechMessage(message);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechMessage((currentMessage) =>
          currentMessage?.startsWith("Listening") ? "Voice input stopped." : currentMessage
        );
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setSpeechMessage("Listening...");
    } catch {
      setIsListening(false);
      setSpeechMessage("Voice input could not start. Please try again.");
    }
  }

  function handleMicrophoneClick() {
    if (isListening) {
      stopListening();
      return;
    }

    startListening();
  }

  return (
    <SectionCard
      title="Your Answer"
      subtitle="Keep your answer concise, explain your reasoning, and include practical tradeoffs when relevant."
    >
      <form className="space-y-3" onSubmit={onSubmit} aria-busy={loading}>
        <div className="space-y-1.5">
          <label
            htmlFor="answer-input"
            className="text-sm font-medium text-zinc-700"
          >
            Answer the current interview question
          </label>
          <div className="relative">
            <textarea
              id="answer-input"
              name="answer-input"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              maxLength={MAX_ANSWER_LENGTH}
              placeholder="Write or speak the answer you would give in a real interview..."
              className="min-h-40 w-full rounded-3xl border border-zinc-300 bg-zinc-50 px-5 py-3.5 pr-16 text-base leading-7 text-zinc-900 outline-none transition focus:border-sky-500 focus:bg-white sm:min-h-44"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleMicrophoneClick}
              disabled={isSpeechDisabled}
              className={`absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm transition ${
                isListening
                  ? "border-red-300 bg-red-50 text-red-700 hover:border-red-400"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
              } disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400`}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              title={
                speechSupport === "unsupported"
                  ? "Voice input is not supported in this browser"
                  : isListening
                    ? "Stop voice input"
                    : "Start voice input"
              }
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              >
                <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <path d="M12 19v2" />
              </svg>
            </button>
          </div>
        </div>

        {error ? (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm leading-6 text-zinc-500">
            <p>
              Type your answer or use the microphone, then review the text
              before submitting.
            </p>
            <p>
              {trimmedLength === 0
                ? "Write or speak at least a short answer to enable submission."
                : `${value.length}/${MAX_ANSWER_LENGTH} characters`}
            </p>
            {speechMessage ? (
              <p className={isListening ? "text-sky-700" : undefined}>
                {speechMessage}
              </p>
            ) : null}
            {speechSupport === "unsupported" ? (
              <p>
                Voice input works only in browsers that support speech
                recognition.
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex min-w-40 items-center justify-center gap-3 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                Reviewing answer...
              </>
            ) : (
              "Submit Answer"
            )}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
