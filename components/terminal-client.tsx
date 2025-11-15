import dynamic from 'next/dynamic';
import { TerminalProps } from './terminal';

// Importar dinámicamente para evitar SSR
const Terminal = dynamic(() => import('./terminal'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black text-green-400 p-4 font-mono text-sm flex items-center justify-center">
      <div className="animate-pulse">⚡ Loading terminal...</div>
    </div>
  )
});

export { Terminal };
export type { TerminalProps };