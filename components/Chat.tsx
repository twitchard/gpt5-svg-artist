"use client";

import { VoiceProvider, ToolCallHandler } from "@humeai/voice-react";
import Messages from "./Messages";
import Controls from "./Controls";
import StartCall from "./StartCall";
import { ComponentRef, useRef, useState } from "react";

export default function ClientComponent({
  accessToken,
}: {
  accessToken: string;
}) {
  const [svg, setSvg] = useState("<pre>No image yet</pre>");
  const [showChat, setShowChat] = useState(false);
  const timeout = useRef<number | null>(null);
  const ref = useRef<ComponentRef<typeof Messages> | null>(null);

  const handleToolCall: ToolCallHandler = async (message, send) => {
    if (message.name !== 'render_svg') {
      throw new Error(`Unrecognized tool ${message.name}`);
    }
    try {
      const parsed = JSON.parse(message.parameters);
      setSvg(parsed.svg || "<pre>No image yet</pre>");
      return send.success("SVG rendered successfully");
    } catch (e){ 
      console.error("Error rendering SVG:", e);
      return send.error({
        error: "SVG rendering error",
        code: "svg_rendering_error",
        level: "error",
        content: "There was an error rendering the SVG",
      });
    }
  };

  return (
    <div
      className={
        "relative grow flex flex-col mx-auto w-full overflow-hidden h-[0px]"
      }
    >
      <VoiceProvider
        onToolCall={handleToolCall}
        onMessage={() => {
          if (showChat && timeout.current) {
            window.clearTimeout(timeout.current);
          }

          if (showChat) {
            timeout.current = window.setTimeout(() => {
              if (ref.current) {
                const scrollHeight = ref.current.scrollHeight;

                ref.current.scrollTo({
                  top: scrollHeight,
                  behavior: "smooth",
                });
              }
            }, 200);
          }
        }}
      >
        <div className="text-center mt-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">GPT-5 SVG Artist</h1>
        </div>

        <div 
          dangerouslySetInnerHTML={{ __html: svg }} 
          className={`mt-4 mx-auto flex items-center justify-center border border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden ${
            showChat ? "w-[600px] h-[450px]" : "w-[800px] h-[600px]"
          }`}
        />
        
        <div className="flex justify-center mt-4 mb-4">
          <button
            onClick={() => setShowChat(!showChat)}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            {showChat ? "hide transcript" : "show transcript"}
          </button>
        </div>
        
        {showChat && <Messages ref={ref} />}
        
        <Controls />
        <StartCall accessToken={accessToken} />
      </VoiceProvider>
    </div>
  );
}
