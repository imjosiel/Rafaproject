"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import Spline from "@splinetool/react-spline";
import Groq from "groq-sdk";

export default function Chat() {
  const [messages, setMessages] = useState([
    { text: "Olá, como posso te ajudar hoje?", isUser: false },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const groqClient = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const handleSend = async () => {
    if (input.trim() !== "") {
      setMessages((prev) => [...prev, { text: input, isUser: true }]);
      const userMessage = input;
      setInput("");
      setIsLoading(true);

      try {
        const response = await groqClient.chat.completions.create({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: userMessage }],
        });

        if (!response?.choices || response.choices.length === 0) {
          throw new Error("Resposta vazia do servidor");
        }

        const botReply = response.choices[0]?.message?.content || "Desculpe, não consegui entender.";
        setMessages((prev) => [...prev, { text: botReply, isUser: false }]);
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
        ) {
          const err = error as { message: string };
          console.error("Erro ao obter resposta do chatbot:", err.message);
          const errorMessage = err.message.includes("Resposta vazia")
            ? "Não foi possível obter uma resposta válida no momento."
            : "Erro ao se comunicar com o servidor.";
          setMessages((prev) => [...prev, { text: errorMessage, isUser: false }]);
        } else {
          console.error("Erro ao obter resposta do chatbot:", error);
          setMessages((prev) => [...prev, { text: "Erro desconhecido ao se comunicar com o servidor.", isUser: false }]);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-b from-sky-400 to-white p-4">
      <div className="absolute inset-0">
        <Spline scene="https://draft.spline.design/Q5HKJmgagrhlrEgl/scene.splinecode" />
      </div>

      {/* Área de mensagens */}
      <div
        ref={chatRef}
        className="relative z-10 flex-1 flex flex-col overflow-y-auto space-y-4 backdrop-blur-[2px] mask-gradient"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <div className="flex-1"></div> {/* Spacer to push messages to the bottom */}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`max-w-[85%] p-4 ${
                message.isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
              }`}
            >
              <CardContent>
                <p className="text-[11px]">{message.text}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Área de entrada de mensagens */}
      <div className="relative z-10 flex items-center gap-2 p-2 bg-white shadow-lg rounded-xl">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading}>
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
