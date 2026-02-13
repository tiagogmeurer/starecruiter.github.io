import React from 'react';
import { TerminalLog } from './TerminalLog';
import { LogEntry } from '../types';

interface LoadingScreenProps {
  isVisible: boolean;
  logs: LogEntry[];
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible, logs }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/40 glass-blur backdrop-blur-xl transition-all duration-300">
      <div className="relative flex flex-col items-center w-full max-w-2xl px-6">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-6 shadow-sm"></div>
        
        <h3 className="text-lg font-bold text-gray-800 mb-4 tracking-wide">
            EXECUTANDO BUSCA EM TEMPO REAL
        </h3>

        {/* Real-time Log Container */}
        <div className="w-full h-64 md:h-80 relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900 to-black rounded-xl transform rotate-1 opacity-20 group-hover:rotate-0 transition-transform duration-500"></div>
            <TerminalLog logs={logs} className="w-full h-full relative z-10 shadow-2xl" />
        </div>
        
        {/* Decor */}
        <div className="mt-6 text-xs text-gray-500 font-mono flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Conectado ao StarMKT AI Intelligence Node
        </div>
      </div>
    </div>
  );
};