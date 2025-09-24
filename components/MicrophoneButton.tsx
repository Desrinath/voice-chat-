
import React from 'react';
import { MicIcon } from './icons/MicIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface MicrophoneButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ isListening, isProcessing, onClick }) => {
  const getButtonClasses = () => {
    let baseClasses = "rounded-full p-5 flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed";
    if (isProcessing) {
      return `${baseClasses} bg-gray-600 cursor-not-allowed shadow-none`;
    }
    if (isListening) {
      return `${baseClasses} bg-red-600 hover:bg-red-700 focus:ring-red-400 shadow-red-500/50 animate-pulse`;
    }
    return `${baseClasses} bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-300 shadow-cyan-500/50`;
  };

  return (
    <button
      onClick={onClick}
      disabled={isProcessing}
      className={getButtonClasses()}
      aria-label={isListening ? 'Stop listening' : 'Start listening'}
    >
      {isProcessing ? (
        <SpinnerIcon className="w-8 h-8 text-gray-200" />
      ) : (
        <MicIcon className="w-8 h-8 text-white" />
      )}
    </button>
  );
};
