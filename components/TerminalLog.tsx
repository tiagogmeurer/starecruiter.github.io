import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalLogProps {
  logs: LogEntry[];
  className?: string;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs, className = "" }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className={`bg-gray-950 rounded-xl p-4 font-mono text-xs md:text-sm overflow-y-auto shadow-2xl border border-gray-800 ${className}`}>
      <div className="flex flex-col space-y-1.5">
        {logs.length === 0 && (
            <div className="text-gray-600 italic">Aguardando inicialização do sistema...</div>
        )}
        {logs.map((log, index) => (
          <div key={index} className="flex items-start space-x-3 animate-fade-in leading-relaxed">
            <span className="text-gray-600 shrink-0 select-none">[{log.timestamp}]</span>
            <span className={`break-all ${
              log.type === 'error' ? 'text-red-400 font-bold' :
              log.type === 'success' ? 'text-green-400 font-semibold' :
              log.type === 'warning' ? 'text-yellow-400' :
              'text-gray-300'
            }`}>
              {log.type === 'info' && '> '}
              {log.type === 'success' && '✔ '}
              {log.type === 'error' && '✖ '}
              {log.type === 'warning' && '⚠ '}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};