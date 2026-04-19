import React from 'react';
import { useTranslation } from 'react-i18next';
import { getLanguageMeta } from '../i18n/languages';

const getSpeechRecognition = () => window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeech = () => {
  const { t, i18n } = useTranslation();
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef(null);

  const speechLang = getLanguageMeta(i18n.resolvedLanguage || i18n.language).speech;

  const startListening = React.useCallback(({ onResult, onError } = {}) => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      onError?.(t('voice.voiceUnsupported'));
      return false;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      onError?.(t('voice.voiceUnsupported'));
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) onResult?.(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
    return true;
  }, [speechLang, t]);

  const stopListening = React.useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const speak = React.useCallback((text) => {
    if (!window.speechSynthesis) return false;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    window.speechSynthesis.speak(utterance);
    return true;
  }, [speechLang]);

  return {
    listening,
    speechLang,
    startListening,
    stopListening,
    speak,
    voiceSupported: Boolean(getSpeechRecognition()),
    speechSupported: Boolean(window.speechSynthesis)
  };
};

export default useSpeech;
