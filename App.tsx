
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { getAiResponse, initializeChat } from './services/geminiService';
import type { ChatMessage as ChatMessageType } from './types';
import { MicrophoneButton } from './components/MicrophoneButton';
import { ChatMessage } from './components/ChatMessage';
import { LogoIcon } from './components/icons/LogoIcon';
import { GithubIcon } from './components/icons/GithubIcon';

// Fix: Add types for the browser's SpeechRecognition API which is not standard
interface SpeechRecognitionResult {
  isFinal: boolean;
  [key: number]: {
    transcript: string;
  };
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [key: number]: SpeechRecognitionResult;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}


const App: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const chatRef = useRef<Chat | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatHistory.length === 0) {
        setChatHistory([{ role: 'model', text: 'Hello! How can I assist you today? Click the microphone to speak.' }]);
    }
  }, [chatHistory.length]);

  const sendToGemini = useCallback(async (prompt: string) => {
    if (!prompt) return;

    setIsProcessing(true);
    setChatHistory(prev => [...prev, { role: 'user', text: prompt }]);
    setError(null);
    setInterimTranscript('');

    try {
        if (!chatRef.current) {
            chatRef.current = initializeChat();
        }
        
        const aiResponse = await getAiResponse(chatRef.current, prompt);
        setChatHistory(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (err) {
        console.error('Error fetching AI response:', err);
        setError('Sorry, I encountered an error. Please try again.');
        setChatHistory(prev => [...prev, { role: 'model', text: 'I seem to have hit a snag. Could you repeat that?' }]);
    } finally {
        setIsProcessing(false);
    }
  }, []);

  const setupSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please try Chrome or Safari.");
      return;
    }
    
    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      // The bug was here: `finalTranscript = '';` was resetting the transcript on every result event.
      // By removing it, `finalTranscript` now correctly accumulates across events within a single session.
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        sendToGemini(finalTranscript.trim());
      }
      finalTranscript = '';
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
             setError("I didn't hear anything. Please try again.");
        } else if (event.error === 'not-allowed') {
            setError("Microphone access was denied. Please enable it in your browser settings.");
        } else {
            setError(`An error occurred: ${event.error}`);
        }
        setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [sendToGemini]);

  const handleMicClick = () => {
    if (isProcessing) return;

    if (!recognitionRef.current) {
        setupSpeechRecognition();
    }

    const recognition = recognitionRef.current;
    if (recognition) {
        if (isListening) {
            recognition.stop();
        } else {
            setInterimTranscript('');
            setError(null);
            recognition.start();
            setIsListening(true);
        }
    }
  };
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, interimTranscript]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans antialiased">
      <header className="flex items-center justify-between p-4 border-b border-gray-700/50 shadow-lg bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
              <LogoIcon className="h-8 w-8 text-cyan-400" />
              <h1 className="text-xl font-bold tracking-tight text-gray-200">Voice Assistant AI</h1>
          </div>
          <a href="https://github.com/google/genai-js" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition-colors">
              <GithubIcon className="h-6 w-6" />
          </a>
      </header>

      <main className="flex-1 flex flex-col p-4 overflow-hidden">
        <div ref={chatContainerRef} className="flex-1 space-y-6 overflow-y-auto pr-2">
          {chatHistory.map((msg, index) => (
            <ChatMessage key={index} role={msg.role} text={msg.text} />
          ))}
          {isListening && (
            <ChatMessage role="user" text={interimTranscript || 'Listening...'} isInterim />
          )}
        </div>
      </main>

      <footer className="flex flex-col items-center justify-center p-6 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700/50">
        <div className="w-full max-w-2xl text-center h-12 flex items-center justify-center">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {!error && isProcessing && <p className="text-cyan-400 text-sm animate-pulse">Thinking...</p>}
          {!error && !isProcessing && !isListening && <p className="text-gray-400 text-sm min-h-[20px]">Click the microphone to start speaking</p>}
          {!error && !isProcessing && isListening && <p className="text-gray-400 text-sm min-h-[20px]">Listening... Click the mic to finish.</p>}
        </div>
        <div className="mt-4">
          <MicrophoneButton 
            isListening={isListening} 
            isProcessing={isProcessing} 
            onClick={handleMicClick} 
          />
        </div>
      </footer>
    </div>
  );
};

export default App;
