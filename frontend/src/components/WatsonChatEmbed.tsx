import { useEffect } from "react";

type Props = {
  rootElementID?: string; // where the widget should render
};

export default function WatsonChatEmbed({ rootElementID = "wxo-chat-root" }: Props) {
  useEffect(() => {
    // Avoid re-injecting if already loaded
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-wxo-loader="true"]'
    );
    if (existing) return;

    // Config from your agent_chatbot.py snippet
    (window as any).wxOConfiguration = {
      orchestrationID:
        "20260227-0352-4110-909f-3ff27511395b_20260227-0352-4788-2043-49cd45ae3997",
      hostURL: "https://dl.watson-orchestrate.ibm.com",
      rootElementID,
      chatOptions: {
        agentId: "37784f02-4177-44f4-bcba-6787bc243fee",
        agentEnvironmentId: "a0f497c7-c69b-4715-9e6e-8b827ae2125d",
      },
    };

    const script = document.createElement("script");
    script.setAttribute("data-wxo-loader", "true");
    script.src = `${(window as any).wxOConfiguration.hostURL}/wxochat/wxoLoader.js?embed=true`;
    script.async = true;

    script.addEventListener("load", () => {
      // wxoLoader is attached globally by the loaded script
      (window as any).wxoLoader?.init?.();
    });

    document.head.appendChild(script);

    return () => {
      // Optional cleanup: if you want it fully removed on unmount
      // (Often you can skip cleanup so it stays cached.)
      // script.remove();
      // delete (window as any).wxOConfiguration;
    };
  }, [rootElementID]);

  // This is the mount point the loader will render into.
  return <div id={rootElementID} style={{ height: "100%", width: "100%" }} />;
}