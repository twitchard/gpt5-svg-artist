import { ConnectOptions, useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";
import HumeLogo from "./logos/Hume";
import { Phone } from "lucide-react";
import { useMemo, useState } from "react";
import voicesData from "@/voices.json";

export default function StartCall({ accessToken }: { accessToken: string }) {
  const { status, connect } = useVoice();

  type Voice = { id: string; name: string; provider: string };
  const voices: Voice[] = useMemo(
    () => (voicesData as any).voices_page as Voice[],
    [],
  );

  const findVoiceByPreferredName = (preferredName: string): Voice | undefined => {
    const exact = voices.find((v) => v.name === preferredName);
    if (exact) return exact;
    const lowered = preferredName.toLowerCase();
    return voices.find((v) => v.name.toLowerCase().includes(lowered));
  };

  const curatedPreferredNames = [
    "English Children's Book Narrator",
    "TikTok Fashion Influencer",
    "Soft Male Conversationalist",
  ];

  const curatedVoices: Voice[] = useMemo(() => {
    const found: Voice[] = [];
    for (const name of curatedPreferredNames) {
      const voice = findVoiceByPreferredName(name);
      if (voice && !found.some((f) => f.id === voice.id)) {
        found.push(voice);
      }
    }
    return found;
  }, [voices]);

  const englishNarrator = findVoiceByPreferredName(
    "English Children's Book Narrator",
  );
  const defaultVoiceId = englishNarrator?.id ?? curatedVoices[0]?.id ?? voices[0]?.id ?? "";

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(defaultVoiceId);
  const [isOther, setIsOther] = useState<boolean>(false);
  const [otherInput, setOtherInput] = useState<string>("");

  const otherVoices: Voice[] = useMemo(() => {
    const curatedIds = new Set(curatedVoices.map((v) => v.id));
    return voices.filter((v) => !curatedIds.has(v.id));
  }, [voices, curatedVoices]);

  const filteredOtherVoices: Voice[] = useMemo(() => {
    const lower = otherInput.toLowerCase();
    const base = lower
      ? otherVoices.filter((v) => v.name.toLowerCase().includes(lower))
      : otherVoices;
    return base.slice(0, 4);
  }, [otherInput, otherVoices]);

  const resolveOtherVoiceId = (input: string): string => {
    if (!input) return "";
    const exact = otherVoices.find((v) => v.name === input);
    if (exact) return exact.id;
    const lowered = input.toLowerCase();
    const partial = otherVoices.find((v) => v.name.toLowerCase().includes(lowered));
    return partial?.id ?? "";
  };

  return (
    <AnimatePresence>
      {status.value !== "connected" ? (
        <motion.div
          className={
            "fixed inset-0 p-4 flex items-center justify-center bg-background"
          }
          initial="initial"
          animate="enter"
          exit="exit"
          variants={{
            initial: { opacity: 0 },
            enter: { opacity: 1 },
            exit: { opacity: 0 },
          }}
        >
          <AnimatePresence>
            <div className="w-full max-w-md mx-auto flex flex-col items-center">
              <div className="mb-2 w-full flex items-center justify-center gap-0.5 text-xs text-muted-foreground">
                <span className="uppercase tracking-wide">Powered by</span>
                <HumeLogo height={12} />
              </div>
              <motion.div
                className="w-full bg-card border border-border rounded-md p-6 shadow-sm"
                variants={{
                  initial: { scale: 0.5 },
                  enter: { scale: 1 },
                  exit: { scale: 0.5 },
                }}
              >
              <Button
                className={"z-50 w-full flex items-center justify-center gap-1.5"}
                onClick={() => {
                  const voiceIdToUse = isOther
                    ? resolveOtherVoiceId(otherInput)
                    : selectedVoiceId;

                  const options: ConnectOptions = {
                    auth: { type: "accessToken", value: accessToken },
                    configId: process.env.NEXT_PUBLIC_HUME_CONFIG_ID,
                    queryParams: { voice_id: voiceIdToUse },
                  };

                  connect(options)
                    .then(() => {})
                    .catch(() => {})
                    .finally(() => {});
                }}
              >
                <span>
                  <Phone
                    className={"size-4 opacity-50"}
                    strokeWidth={2}
                    stroke={"currentColor"}
                  />
                </span>
                <span>Chat with GPT-5</span>
              </Button>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Voice</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  value={isOther ? "__other__" : selectedVoiceId}
                  onChange={(e) => {
                    if (e.target.value === "__other__") {
                      setIsOther(true);
                    } else {
                      setIsOther(false);
                      setSelectedVoiceId(e.target.value);
                    }
                  }}
                >
                  {curatedVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                  <option value="__other__">Other…</option>
                </select>

                {isOther && (
                  <div className="mt-2">
                    <input
                      list="voice-list"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      placeholder="Type to search other voices"
                      value={otherInput}
                      onChange={(e) => setOtherInput(e.target.value)}
                    />
                    <datalist id="voice-list">
                      {filteredOtherVoices.map((v) => (
                        <option key={v.id} value={v.name} />
                      ))}
                    </datalist>
                  </div>
                )}
              </div>
              </motion.div>
            </div>
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
