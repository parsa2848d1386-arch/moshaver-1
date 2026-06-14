import GeminiChat from '@/components/gemini-ui/GeminiChat';

export const metadata = {
  title: 'Gemini Premium UI',
  description: 'High-fidelity React component of Gemini Android UI',
};

export default function GeminiDemoPage() {
  return (
    <main className="w-full h-screen bg-black overflow-hidden">
      <GeminiChat />
    </main>
  );
}
