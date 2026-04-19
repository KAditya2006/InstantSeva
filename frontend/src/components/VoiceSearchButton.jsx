import React from 'react';
import { Mic, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import useSpeech from '../hooks/useSpeech';

const VoiceSearchButton = ({ onTranscript, speakText, className = '' }) => {
  const { t } = useTranslation();
  const { listening, startListening, speak, voiceSupported, speechSupported } = useSpeech();

  const handleVoice = () => {
    if (!voiceSupported) {
      toast.error(t('voice.voiceUnsupported'));
      return;
    }

    startListening({
      onResult: (text) => {
        toast.success(t('voice.heard', { text }));
        onTranscript?.(text);
      },
      onError: (message) => toast.error(message)
    });
  };

  const handleSpeak = () => {
    if (!speechSupported) {
      toast.error(t('voice.speechUnsupported'));
      return;
    }

    speak(speakText || t('voice.voiceSearch'));
  };

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleVoice}
        className={`grid h-10 w-10 place-items-center rounded-xl border font-bold transition ${
          listening
            ? 'border-rose-200 bg-rose-50 text-rose-600'
            : 'border-slate-200 bg-white text-slate-600 hover:text-primary-600'
        }`}
        title={listening ? t('voice.listening') : t('voice.voiceSearch')}
        aria-label={listening ? t('voice.listening') : t('voice.voiceSearch')}
      >
        <Mic size={17} />
      </button>
      <button
        type="button"
        onClick={handleSpeak}
        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:text-primary-600"
        title={t('voice.speak')}
        aria-label={t('voice.speak')}
      >
        <Volume2 size={17} />
      </button>
    </span>
  );
};

export default VoiceSearchButton;
